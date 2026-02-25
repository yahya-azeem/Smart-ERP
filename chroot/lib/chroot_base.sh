#!/bin/ksh
# =============================================================================
# Unix Chroot Container — Shared Library Functions
# =============================================================================
# Provides reusable functions for creating and managing chroot environments.
# Sourced by container scripts and the master deploy script.
#
# This is the chroot equivalent of Docker's image layer system.
# =============================================================================

set -e

# ---- Configuration ----
CHROOT_BASE="/var/chroot"
SETS_CACHE="/var/cache/openbsd-sets"
OBSD_VERSION=$(uname -r)
OBSD_ARCH=$(uname -m)
OBSD_MIRROR="${OBSD_MIRROR:-https://cdn.openbsd.org/pub/OpenBSD}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# ---- Logging ----
log_info()  { echo "${CYAN}[CONTAINER]${NC} ${GREEN}$1${NC}"; }
log_warn()  { echo "${CYAN}[CONTAINER]${NC} ${YELLOW}WARNING: $1${NC}"; }
log_error() { echo "${CYAN}[CONTAINER]${NC} ${RED}ERROR: $1${NC}" >&2; }
log_step()  { echo "\n${BLUE}>>> [$1] $2${NC}"; }

# ---- Preflight Checks ----
require_root() {
    if [ "$(id -u)" -ne 0 ]; then
        log_error "This script must be run as root (use doas)."
        exit 1
    fi
}

require_openbsd() {
    if [ "$(uname -s)" != "OpenBSD" ]; then
        log_error "This script must be run on OpenBSD."
        exit 1
    fi
}

# ---- Set Download ----
# Download OpenBSD distribution sets (base.tgz, comp.tgz, etc.)
# This is the equivalent of pulling a Docker base image.
download_sets() {
    local sets="base${OBSD_VERSION/./}.tgz comp${OBSD_VERSION/./}.tgz"
    local url_base="${OBSD_MIRROR}/${OBSD_VERSION}/${OBSD_ARCH}"

    install -d -o root -g wheel "${SETS_CACHE}"

    for s in $sets; do
        if [ ! -f "${SETS_CACHE}/${s}" ]; then
            log_info "Downloading ${s} from ${url_base}..."
            ftp -o "${SETS_CACHE}/${s}" "${url_base}/${s}"
        else
            log_info "Using cached ${s}"
        fi
    done
}

# ---- Chroot Creation ----
# Create a new chroot filesystem from base sets.
# Equivalent to: FROM openbsd:latest in a Dockerfile
create_chroot() {
    local name="$1"
    local chroot_dir="${CHROOT_BASE}/${name}"

    if [ -d "${chroot_dir}/bin" ]; then
        log_warn "Chroot ${name} already exists at ${chroot_dir}, skipping extraction."
        return 0
    fi

    log_info "Creating chroot: ${name} at ${chroot_dir}"
    install -d -o root -g wheel "${chroot_dir}"

    # Extract base system
    log_info "  Extracting base set..."
    cd "${chroot_dir}"
    tar xzphf "${SETS_CACHE}/base${OBSD_VERSION/./}.tgz"

    # Extract compiler/dev tools
    log_info "  Extracting compiler set..."
    tar xzphf "${SETS_CACHE}/comp${OBSD_VERSION/./}.tgz"

    # Setup essential chroot mounts and configs
    _setup_chroot_env "${chroot_dir}"

    log_info "Chroot ${name} created successfully."
}

# ---- Chroot Environment Setup ----
# Configure DNS, devices, and basic environment inside the chroot
_setup_chroot_env() {
    local chroot_dir="$1"

    # Copy DNS resolution config
    install -d "${chroot_dir}/etc"
    cp /etc/resolv.conf "${chroot_dir}/etc/resolv.conf"

    # Create /dev essentials
    install -d "${chroot_dir}/dev"
    if [ ! -c "${chroot_dir}/dev/null" ]; then
        cd "${chroot_dir}/dev"
        /dev/MAKEDEV std
    fi

    # Create tmp with proper permissions
    install -d -m 1777 "${chroot_dir}/tmp"

    # Create /var/run for pid files
    install -d "${chroot_dir}/var/run"

    # Setup pkg_add mirror for installing packages inside chroot
    echo "${OBSD_MIRROR}/${OBSD_VERSION}/packages/${OBSD_ARCH}/" \
        > "${chroot_dir}/etc/installurl"
}

# ---- Package Installation ----
# Install packages inside a chroot. 
# Equivalent to: RUN pkg_add <package> in a Dockerfile
chroot_pkg_add() {
    local name="$1"
    shift
    local chroot_dir="${CHROOT_BASE}/${name}"
    local packages="$@"

    log_info "Installing packages in ${name}: ${packages}"

    # Mount /dev if not already mounted
    _ensure_devfs "${chroot_dir}"

    # Set PKG_PATH inside chroot and install
    chroot "${chroot_dir}" /bin/ksh -c "
        export PKG_PATH=${OBSD_MIRROR}/${OBSD_VERSION}/packages/${OBSD_ARCH}/
        pkg_add -I ${packages}
    "
}

# ---- File Operations ----
# Copy a file into a chroot.
# Equivalent to: COPY <src> <dst> in a Dockerfile
chroot_copy() {
    local name="$1"
    local src="$2"
    local dst="$3"
    local chroot_dir="${CHROOT_BASE}/${name}"

    install -d "$(dirname ${chroot_dir}${dst})"
    cp -R "${src}" "${chroot_dir}${dst}"
}

# Run a command inside a chroot.
# Equivalent to: RUN <cmd> in a Dockerfile
chroot_run() {
    local name="$1"
    shift
    local chroot_dir="${CHROOT_BASE}/${name}"

    _ensure_devfs "${chroot_dir}"
    chroot "${chroot_dir}" /bin/ksh -c "$@"
}

# ---- User Management ----
# Create a service user inside a chroot.
# Equivalent to: RUN adduser ... && USER <user> in a Dockerfile
chroot_adduser() {
    local name="$1"
    local username="$2"
    local homedir="${3:-/nonexistent}"
    local chroot_dir="${CHROOT_BASE}/${name}"

    if chroot "${chroot_dir}" id "${username}" >/dev/null 2>&1; then
        log_info "User ${username} already exists in ${name}"
        return 0
    fi

    log_info "Creating user ${username} in chroot ${name}"
    chroot "${chroot_dir}" useradd \
        -d "${homedir}" \
        -s /sbin/nologin \
        -c "Smart ERP Service" \
        "${username}"
}

# ---- Network Helpers ----
# Wait for a TCP port to become available (health check equivalent)
wait_for_port() {
    local host="$1"
    local port="$2"
    local timeout="${3:-30}"
    local elapsed=0

    log_info "Waiting for ${host}:${port} (timeout: ${timeout}s)..."
    while [ $elapsed -lt $timeout ]; do
        if echo "" | nc -w 1 "${host}" "${port}" >/dev/null 2>&1; then
            log_info "  Port ${host}:${port} is ready."
            return 0
        fi
        sleep 1
        elapsed=$((elapsed + 1))
    done

    log_error "Timed out waiting for ${host}:${port}"
    return 1
}

# ---- Mount Management ----
_ensure_devfs() {
    local chroot_dir="$1"
    if [ ! -c "${chroot_dir}/dev/null" ]; then
        cd "${chroot_dir}/dev"
        /dev/MAKEDEV std 2>/dev/null || true
    fi
}

# ---- Cleanup ----
# Remove a chroot container entirely.
# Equivalent to: docker rm -f <container>
destroy_chroot() {
    local name="$1"
    local chroot_dir="${CHROOT_BASE}/${name}"

    if [ ! -d "${chroot_dir}" ]; then
        log_warn "Chroot ${name} does not exist."
        return 0
    fi

    log_warn "Destroying chroot: ${name}"

    # Kill any processes running inside this chroot
    _kill_chroot_procs "${chroot_dir}"

    # Remove the filesystem
    rm -rf "${chroot_dir}"
    log_info "Chroot ${name} destroyed."
}

# Kill all processes with root dirs inside a chroot
_kill_chroot_procs() {
    local chroot_dir="$1"
    # Find PIDs whose root is inside the chroot
    for pid in $(ps aux | awk '{print $2}'); do
        local proot=$(readlink "/proc/${pid}/root" 2>/dev/null || true)
        if [ "${proot}" = "${chroot_dir}" ]; then
            kill -9 "${pid}" 2>/dev/null || true
        fi
    done
}

# ---- Status ----
# Check if a chroot container exists
chroot_exists() {
    local name="$1"
    [ -d "${CHROOT_BASE}/${name}/bin" ]
}

# Get the chroot path for a container
chroot_path() {
    local name="$1"
    echo "${CHROOT_BASE}/${name}"
}
