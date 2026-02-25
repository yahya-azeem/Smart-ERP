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

# ---- Exclusion Profiles ----
# Daemons and services excluded from ALL chroots (not needed for Smart ERP)
# This is the equivalent of using a minimal Docker base image (alpine vs full debian)
CHROOT_EXCLUDE_COMMON="
    ./usr/sbin/httpd
    ./usr/sbin/relayd
    ./usr/sbin/smtpd
    ./usr/sbin/sndiod
    ./usr/sbin/ftpd
    ./usr/sbin/tftpd
    ./usr/sbin/nsd
    ./usr/sbin/unbound
    ./usr/sbin/ldapd
    ./usr/sbin/iked
    ./usr/sbin/iscsid
    ./usr/sbin/radiusd
    ./usr/sbin/bgpd
    ./usr/sbin/ospfd
    ./usr/sbin/ospf6d
    ./usr/sbin/ripd
    ./usr/sbin/dvmrpd
    ./usr/sbin/eigrpd
    ./usr/sbin/ldpd
    ./usr/sbin/npppd
    ./usr/sbin/vmd
    ./usr/sbin/vmctl
    ./usr/sbin/switchd
    ./usr/sbin/dhcpd
    ./usr/sbin/rarpd
    ./usr/sbin/slaacd
    ./usr/sbin/rad
    ./usr/sbin/amd
    ./usr/sbin/ypserv
    ./usr/sbin/ypbind
    ./usr/libexec/smtpd
    ./usr/libexec/httpd
    ./usr/share/man/man8/httpd*
    ./usr/share/man/man8/relayd*
    ./usr/share/man/man8/smtpd*
    ./usr/share/man/man5/httpd*
    ./usr/games
    ./usr/share/games
    ./var/games
"

# ---- Chroot Creation ----
# Create a new chroot filesystem from base sets with selective extraction.
# Equivalent to: FROM openbsd:latest in a Dockerfile (but slimmer)
#
# Usage: create_chroot <name> [exclude_file_list...]
#   - Always excludes CHROOT_EXCLUDE_COMMON (httpd, relayd, smtpd, etc.)
#   - Additional excludes can be passed per-container
#   - Pass "nocomp" as second arg to skip comp.tgz (for runtime-only chroots)
create_chroot() {
    local name="$1"
    local skip_comp="${2:-}"
    local chroot_dir="${CHROOT_BASE}/${name}"

    if [ -d "${chroot_dir}/bin" ]; then
        log_warn "Chroot ${name} already exists at ${chroot_dir}, skipping extraction."
        return 0
    fi

    log_info "Creating chroot: ${name} at ${chroot_dir}"
    install -d -o root -g wheel "${chroot_dir}"

    # Build tar exclude args from common list
    local exclude_args=""
    for pattern in ${CHROOT_EXCLUDE_COMMON}; do
        exclude_args="${exclude_args} --exclude=${pattern}"
    done

    # Extract base system (with exclusions)
    log_info "  Extracting base set (excluding httpd, relayd, smtpd, sndiod, games, etc.)..."
    cd "${chroot_dir}"
    eval tar xzphf "${SETS_CACHE}/base${OBSD_VERSION/./}.tgz" ${exclude_args}

    # Extract compiler/dev tools (only if needed)
    if [ "${skip_comp}" = "nocomp" ]; then
        log_info "  Skipping compiler set (runtime-only container)."
    else
        log_info "  Extracting compiler set..."
        tar xzphf "${SETS_CACHE}/comp${OBSD_VERSION/./}.tgz"
    fi

    # Setup essential chroot mounts and configs
    _setup_chroot_env "${chroot_dir}"

    log_info "Chroot ${name} created successfully (slim profile — no unnecessary daemons)."
}

# ---- Post-Extraction Cleanup ----
# Remove additional unnecessary files from a chroot after package installation.
# Call this after chroot_pkg_add to strip unneeded man pages, docs, etc.
# Equivalent to: RUN rm -rf /var/cache/... in Dockerfile
strip_chroot_bloat() {
    local name="$1"
    local chroot_dir="${CHROOT_BASE}/${name}"

    log_info "Stripping unnecessary files from ${name}..."

    # Remove man pages (save ~30MB)
    rm -rf "${chroot_dir}/usr/share/man" 2>/dev/null || true

    # Remove info pages
    rm -rf "${chroot_dir}/usr/share/info" 2>/dev/null || true

    # Remove locale data we don't need
    rm -rf "${chroot_dir}/usr/share/locale" 2>/dev/null || true

    # Remove example configs (packages leave these behind)
    rm -rf "${chroot_dir}/usr/local/share/examples" 2>/dev/null || true
    rm -rf "${chroot_dir}/usr/local/share/doc" 2>/dev/null || true

    # Remove package cache
    rm -rf "${chroot_dir}/var/cache/pkg" 2>/dev/null || true
    rm -rf "${chroot_dir}/tmp/"* 2>/dev/null || true

    log_info "  Bloat stripped from ${name}."
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
