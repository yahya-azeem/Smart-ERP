# Unix Chroot Container — OpenBSD Deployment Guide

Deploy Smart ERP as isolated chroot "containers" on OpenBSD — a 1:1 equivalent of the Docker deployment, using OpenBSD's native security primitives.

## Quick Start (One Command)

```sh
# Copy the repository to your OpenBSD machine, then:
chmod +x chroot_deploy.sh
doas ./chroot_deploy.sh
```

That's it. The script downloads OpenBSD sets, creates 3 isolated chroots, builds everything, installs rc.d services, and starts the stack.

## Architecture: Docker → Chroot Mapping

| Docker | Chroot Equivalent |
|---|---|
| `docker compose up` | `doas ./chroot_deploy.sh deploy` |
| `docker compose stop` | `doas ./chroot_deploy.sh stop` |
| `docker compose ps` | `doas ./chroot_deploy.sh status` |
| `docker compose down -v` | `doas ./chroot_deploy.sh destroy` |
| Container `db` | Chroot `/var/chroot/smarterp-db` |
| Container `api` | Chroot `/var/chroot/smarterp-api` |
| Container `web` | Chroot `/var/chroot/smarterp-web` |

## What the Deploy Script Does

| Step | Docker Equivalent | What Happens |
|---|---|---|
| 0 | `docker pull` | Downloads `base.tgz` + `comp.tgz` from OpenBSD mirrors |
| 1 | `docker build db` | Creates DB chroot, installs PostgreSQL, initializes cluster |
| 2 | `docker build api` | Creates API chroot, installs Rust, builds binary |
| 3 | `docker build web` | Creates Web chroot, installs Nginx+Node, builds frontend |
| 4 | `docker compose up` | Installs rc.d scripts, enables auto-start, launches all |

## Management Commands

```sh
# Service control (like docker compose start/stop)
doas rcctl start smarterp_db
doas rcctl start smarterp_api
doas rcctl start smarterp_web

doas rcctl stop smarterp_web
doas rcctl stop smarterp_api
doas rcctl stop smarterp_db

# Status check (like docker compose ps)
doas ./chroot_deploy.sh status

# Full rebuild (like docker compose build --no-cache)
doas ./chroot_deploy.sh rebuild

# Destroy everything (like docker compose down -v --rmi all)
doas ./chroot_deploy.sh destroy
```

## Container Isolation

Each service runs in its own chroot with its own:
- **Filesystem**: Complete OpenBSD base system (`/var/chroot/<name>/`)
- **User**: Dedicated service user (`_smarterp_db`, `_smarterp_api`, `_smarterp_web`)
- **Process space**: Processes in one chroot cannot see or interact with another
- **Networking**: Services communicate via `127.0.0.1` loopback only

### Lateral Movement Prevention

| Attack Scenario | Protection |
|---|---|
| Web → API filesystem | chroot(2) prevents access to `/var/chroot/smarterp-api/` |
| API → DB filesystem | chroot(2) prevents access to `/var/chroot/smarterp-db/` |
| Web shell → host OS | chroot(2) + pledge(2) restrict capabilities |
| Brute-force login | Nginx rate limiting (5 req/sec) |
| Large payload DoS | 2MB body limit on both Nginx and Axum |

### OpenBSD-Specific Security

The API binary uses OpenBSD kernel security primitives (compiled in at `main.rs`):

- **pledge(2)**: Restricts the API process to only `stdio inet rpath dns` — it *cannot* fork, exec, write files, or access the network beyond TCP
- **unveil(2)**: Restricts filesystem visibility to only `/etc/ssl` and `/etc/resolv.conf` — everything else is invisible

## Configuration

Set environment variables before deploying:

```sh
export SMARTERP_DB_PASS="your_secure_password"
export SMARTERP_JWT_SECRET="$(openssl rand -hex 32)"
export SMARTERP_DB_NAME="smart_erp"
doas -E ./chroot_deploy.sh
```

## File Structure

```
chroot/
├── lib/
│   └── chroot_base.sh        # Core library (Dockerfile operations)
├── containers/
│   ├── db.sh                  # PostgreSQL container definition
│   ├── api.sh                 # Rust API container definition
│   └── web.sh                 # Nginx web container definition
└── rc.d/
    ├── smarterp_db            # DB rc.d service script
    ├── smarterp_api           # API rc.d service script
    └── smarterp_web           # Web rc.d service script

chroot_deploy.sh               # Master deploy (docker compose equivalent)
```

## Prerequisites

- OpenBSD 7.4 or newer
- `doas` configured for root access
- Internet connection (for `pkg_add` and `npm install`)
- ~2GB disk space per chroot (~6GB total)
