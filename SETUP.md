# Smart ERP - Setup Guide

Complete step-by-step guide for setting up Smart ERP from scratch.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Running the Application](#running-the-application)
5. [Verification](#verification)
6. [Common Issues](#common-issues)

## Prerequisites

### Required Software
- **Docker** (version 20.10.0 or higher)
  - [Download Docker Desktop](https://www.docker.com/products/docker-desktop)
  - Verify: `docker --version`

- **Docker Compose** (version 2.0.0 or higher)
  - Usually included with Docker Desktop
  - Verify: `docker-compose --version`

- **Git**
  - [Download Git](https://git-scm.com/downloads)
  - Verify: `git --version`

### System Requirements
- **RAM**: Minimum 4GB (8GB recommended)
- **Disk Space**: At least 2GB free
- **Ports**: Ensure ports 5173, 8000, and 5432 are available

## Installation

### Step 1: Clone the Repository

```bash
# Clone the repository
git clone https://github.com/yahya-azeem/Smart-ERP.git

# Navigate to project directory
cd Smart-ERP
```

### Step 2: Configure Environment Variables

```bash
# Create environment file from template
cp .env.example .env
```

**Review the .env file:**
```bash
# Open in your preferred editor
nano .env
# or
notepad .env
# or
vim .env
```

**Default configuration (works out of the box):**
```env
SECRET_KEY=your-secret-key-here-change-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,backend
DATABASE_URL=postgres://postgres:postgres@db:5432/smart_erp
```

**For Production:**
- Change `SECRET_KEY` to a long random string
- Set `DEBUG=False`
- Add your domain to `ALLOWED_HOSTS`

## Configuration

### Understanding Docker Services

The application consists of three services:

1. **db** - PostgreSQL database (port 5432)
2. **backend** - Django REST API (port 8000)
3. **frontend** - React application (port 5173)

### Docker Compose Configuration

The `docker-compose.yml` file defines:
- Service dependencies
- Port mappings
- Volume mounts
- Environment variables

**Key Features:**
- Automatic database migrations on startup
- Hot-reload for frontend development
- Persistent database storage

## Running the Application

### Option 1: Quick Start (Recommended)

```bash
# Build and start all services
docker-compose up -d --build

# Wait for initialization (approximately 30-60 seconds)
sleep 30

# Verify services are running
docker-compose ps
```

### Option 2: Step-by-Step

```bash
# 1. Build images
docker-compose build

# 2. Start database first
docker-compose up -d db

# 3. Wait for database to be ready
sleep 10

# 4. Start backend
docker-compose up -d backend

# 5. Start frontend
docker-compose up -d frontend

# 6. Verify all services
docker-compose ps
```

### Option 3: Using Helper Scripts

**Windows:**
```cmd
restart-docker.bat
```

**Linux/Mac:**
```bash
./restart-docker.sh
```

## Verification

### 1. Check Service Status

```bash
docker-compose ps
```

**Expected Output:**
```
NAME                   IMAGE                STATUS          PORTS
smart-erp-db-1         postgres:16-alpine   Up (healthy)    0.0.0.0:5432->5432/tcp
smart-erp-backend-1    smart-erp-backend    Up              0.0.0.0:8000->8000/tcp
smart-erp-frontend-1   smart-erp-frontend   Up              0.0.0.0:5173->5173/tcp
```

### 2. View Logs

```bash
# All services
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Frontend only
docker-compose logs -f frontend

# Database only
docker-compose logs -f db
```

### 3. Access the Application

Open your browser and navigate to:

- **Main Application**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/api/

### 4. Test Backend Health

```bash
curl http://localhost:8000/api/dashboard/
```

## Initial Setup

### Create Admin User

```bash
# Access backend container
docker-compose exec backend bash

# Create superuser
python manage.py createsuperuser

# Follow prompts:
# Username: admin
# Email: admin@example.com
# Password: your_secure_password

# Exit container
exit
```

### Access Django Admin

1. Go to http://localhost:8000/admin
2. Login with credentials created above
3. You can now manage:
   - Users and tenants
   - Products
   - Customers
   - All other models

## Common Issues

### Issue: "Port is already allocated"

**Cause**: Another service is using the required ports

**Solution:**
```bash
# Find process using port 8000
lsof -i :8000  # Mac/Linux
netstat -ano | findstr :8000  # Windows

# Stop the conflicting service
# Or modify ports in docker-compose.yml
```

### Issue: "Database connection failed"

**Cause**: Database isn't ready when backend starts

**Solution:**
```bash
# Restart backend after database is ready
docker-compose restart backend

# Or restart all services
docker-compose down
docker-compose up -d
```

### Issue: "Permission denied"

**Cause**: File permission issues (Linux/Mac)

**Solution:**
```bash
# Fix permissions
sudo chown -R $USER:$USER .

# Or run Docker without sudo (add user to docker group)
sudo usermod -aG docker $USER
```

### Issue: "Frontend shows blank page"

**Cause**: Browser cache or build issue

**Solution:**
```bash
# Hard refresh browser
# Windows/Linux: Ctrl + F5
# Mac: Cmd + Shift + R

# Or rebuild frontend
docker-compose up -d --build frontend

# Check frontend logs
docker-compose logs frontend
```

### Issue: "Cannot find module"

**Cause**: Node modules not installed

**Solution:**
```bash
# Rebuild frontend container
docker-compose down
docker-compose up -d --build frontend
```

## Development Workflow

### Making Changes

1. **Frontend Changes**: 
   - Edit files in `frontend/src/`
   - Changes reflect automatically (hot-reload)
   - Refresh browser to see updates

2. **Backend Changes**:
   - Edit Python files
   - Container auto-reloads in development mode
   - Check logs for errors

3. **Database Changes**:
   - Edit models in Django apps
   - Run migrations:
     ```bash
     docker-compose exec backend python manage.py makemigrations
     docker-compose exec backend python manage.py migrate
     ```

### Stopping the Application

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v

# Stop and remove everything including images
docker-compose down --rmi all -v
```

### Updating the Application

```bash
# Pull latest changes
git pull origin main

# Rebuild containers
docker-compose down
docker-compose up -d --build
```

## Next Steps

1. **Explore the Application**:
   - Login at http://localhost:5173
   - Create a customer
   - Add products
   - Create a sales order

2. **Read the API Documentation**:
   - Visit http://localhost:8000/api/
   - Test endpoints

3. **Review the Code**:
   - Backend: Django apps in root directory
   - Frontend: React components in `frontend/src/`

## Support

If you encounter issues:

1. Check the logs: `docker-compose logs`
2. Review this guide
3. Open an issue on GitHub
4. Check the README.md for more information

---

**You're all set! Happy ERP-ing! 🎉**
