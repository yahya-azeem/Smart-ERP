# Docker Quick Start Guide

## 🚀 To Restart Everything

### Option 1: Use the Restart Script (Easiest)

**On Windows:**
```bash
restart-docker.bat
```

**On Mac/Linux:**
```bash
./restart-docker.sh
```

### Option 2: Manual Docker Commands

**Step 1: Stop existing containers**
```bash
docker-compose down
```

**Step 2: Start everything (with latest changes)**
```bash
docker-compose up -d
```

**Step 3: Rebuild if needed (for major changes)**
```bash
docker-compose down
docker-compose up -d --build
```

---

## ✅ What Happens Automatically

When you restart the Docker containers, the backend will automatically:

1. ✅ **Create any new migrations** (like for raw_leather app)
2. ✅ **Apply all migrations** to the database
3. ✅ **Start the Django server**
4. ✅ **Start the React frontend**

**You don't need to run any Django commands manually!**

---

## 🔗 Access Your Application

After restarting:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/api/

---

## 📊 View Logs

```bash
# All services
docker-compose logs -f

# Just backend
docker-compose logs -f backend

# Just frontend
docker-compose logs -f frontend

# Just database
docker-compose logs -f db
```

---

## 🛑 Stop Everything

```bash
docker-compose down
```

To also remove data (start fresh):
```bash
docker-compose down -v
```

---

## 🔄 Update Frontend Only (Fast)

If you only changed frontend code (React), just refresh your browser!
The frontend uses hot-reload, so changes appear automatically.

---

## 🔧 Troubleshooting

### Issue: "Port already in use"
```bash
# Find what's using port 8000 or 5173
# On Windows:
netstat -ano | findstr :8000

# On Mac/Linux:
lsof -i :8000

# Kill the process or use different ports in docker-compose.yml
```

### Issue: Database connection errors
```bash
# Restart just the database
docker-compose restart db

# Wait 10 seconds, then restart backend
docker-compose restart backend
```

### Issue: Changes not appearing
```bash
# Force rebuild everything
docker-compose down
docker-compose up -d --build
```

### Issue: "Migration conflicts"
```bash
# Delete old migration files and start fresh (WARNING: This deletes data!)
docker-compose down -v
docker-compose up -d
```

---

## 📁 What Was Changed

The following files were updated to support automatic migrations:

1. **`docker-compose.yml`** - Updated to auto-run makemigrations and migrate
2. **`raw_leather/migrations/0001_initial.py`** - Created migration file for leather module
3. **`restart-docker.bat`** - Windows restart script (new)
4. **`restart-docker.sh`** - Mac/Linux restart script (new)

---

## ✅ Verification Checklist

After restarting, verify:

- [ ] Frontend loads at http://localhost:5173
- [ ] Can login successfully
- [ ] Can access Customers page
- [ ] Can access Payments page
- [ ] Can create/edit Products
- [ ] Can create Orders with line items
- [ ] Can confirm Orders (deducts stock)
- [ ] Can create Invoices
- [ ] Can record Payments
- [ ] Can manage Leather Suppliers
- [ ] Can manage Leather Types
- [ ] Can create Leather Purchase Orders

---

## 🆘 Emergency Reset (if everything breaks)

**⚠️ WARNING: This deletes all data!**

```bash
# Stop everything
docker-compose down -v

# Remove all images
docker-compose down --rmi all

# Start fresh
docker-compose up -d --build
```

---

## 💡 Pro Tips

1. **Frontend hot-reload**: Just save your file and the browser updates automatically
2. **Backend changes**: Restart the backend container: `docker-compose restart backend`
3. **Database inspection**: Use pgAdmin or similar tools on port 5432
4. **API testing**: Use the browser at http://localhost:8000/api/ or tools like Postman

---

**Happy coding! 🎉**
