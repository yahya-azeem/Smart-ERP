# Smart ERP

A full-featured ERP (Enterprise Resource Planning) system built with Django REST Framework backend and React TypeScript frontend. Features customer management, sales orders, invoicing, payments, inventory management, and raw material purchasing.

## 🚀 Features

### Core Modules
- **Customer Management** - Full CRUD with statistics and order history
- **Products** - Inventory tracking with stock levels and profit margins
- **Sales Orders** - Order creation with line items and confirmation workflow
- **Invoices** - Automated invoice generation with payment tracking
- **Payments** - Multi-method payment recording (Cash, Bank, Credit Card)
- **Vendors & Purchase Orders** - Supplier management and procurement
- **Raw Leather Module** - Specialized raw material purchasing system

### Technical Features
- ✅ Multi-tenant architecture
- ✅ JWT authentication
- ✅ Real-time stock management
- ✅ Responsive Material-UI design
- ✅ Pagination, search, and sorting
- ✅ Docker containerization
- ✅ Automatic database migrations

## 📋 Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)
- Git

## 🛠️ Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yahya-azeem/Smart-ERP.git
cd Smart-ERP
```

### 2. Set Up Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your settings (optional for local development)
nano .env  # or use any text editor
```

**Default .env configuration works out of the box for Docker setup.**

### 3. Start the Application

```bash
# Build and start all services
docker-compose up -d --build

# Wait for services to start (about 30 seconds)
sleep 30

# Check if all services are running
docker-compose ps
```

### 4. Create Superuser (Optional)

```bash
# Access the backend container
docker-compose exec backend bash

# Create admin user
python manage.py createsuperuser

# Exit container
exit
```

### 5. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/api/
- **Django Admin**: http://localhost:8000/admin (if superuser created)

## 🐳 Docker Commands

### Start/Stop Services

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Restart with fresh build
docker-compose down
docker-compose up -d --build

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
```

### Database Operations

```bash
# Run migrations manually
docker-compose exec backend python manage.py migrate

# Create migrations
docker-compose exec backend python manage.py makemigrations

# Access database shell
docker-compose exec db psql -U postgres -d smart_erp
```

## ⚙️ Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SECRET_KEY` | Django secret key | Change in production |
| `DEBUG` | Debug mode | True |
| `ALLOWED_HOSTS` | Allowed hosts | localhost,127.0.0.1 |
| `DATABASE_URL` | Database connection | PostgreSQL container |

## 📁 Project Structure

```
Smart-ERP/
├── accounting/          # Invoicing and payments
├── core/               # Base models and shared components
├── sales/              # Customers and sales orders
├── purchases/          # Vendors and purchase orders
├── raw_leather/        # Raw material purchasing
├── tenants/            # Multi-tenancy support
├── smart/              # Django project settings
├── frontend/           # React TypeScript frontend
│   ├── src/
│   │   ├── pages/     # Page components
│   │   ├── components/# Reusable components
│   │   └── api/       # API client
├── docker-compose.yml  # Docker orchestration
├── Dockerfile.backend  # Backend container
└── .env.example       # Environment template
```

## 🔌 API Endpoints

### Authentication
- `POST /api/token/` - Obtain JWT token
- `POST /api/token/refresh/` - Refresh JWT token

### Core Resources
- `/api/customers/` - Customer management
- `/api/products/` - Product catalog
- `/api/sales-orders/` - Sales orders
- `/api/invoices/` - Invoicing
- `/api/payments/` - Payment recording
- `/api/vendors/` - Vendor management
- `/api/purchase-orders/` - Purchase orders

### Raw Leather Module
- `/api/leather-suppliers/` - Leather suppliers
- `/api/leather-types/` - Leather types
- `/api/leather-purchase-orders/` - Leather orders

## 🎯 Default Login

After starting the application, you can use the test account:
- **Username**: (create via createsuperuser)
- **Password**: (set during createsuperuser)

Or create a new tenant and user through the Django admin.

## 🚨 Troubleshooting

### Port Already in Use
```bash
# Check what's using port 8000
lsof -i :8000  # Mac/Linux
netstat -ano | findstr :8000  # Windows

# Use different ports in docker-compose.yml
```

### Database Connection Issues
```bash
# Restart database container
docker-compose restart db

# Wait 10 seconds, then restart backend
docker-compose restart backend
```

### Frontend Not Loading
```bash
# Rebuild frontend container
docker-compose up -d --build frontend

# Check logs
docker-compose logs frontend
```

### Permission Denied Errors
```bash
# Fix permissions (Linux/Mac)
sudo chown -R $USER:$USER .

# Or use Docker without sudo
docker-compose up -d
```

## 🧪 Development

### Running Without Docker

#### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Running Tests
```bash
# Backend tests
docker-compose exec backend python manage.py test

# Frontend tests (if available)
cd frontend && npm test
```

## 📝 API Usage Examples

### Create a Customer
```bash
curl -X POST http://localhost:8000/api/customers/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name": "John Doe", "email": "john@example.com"}'
```

### Create Sales Order
```bash
curl -X POST http://localhost:8000/api/sales-orders/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "order_number": "SO-001",
    "date": "2026-02-10",
    "customer": "customer-uuid",
    "status": "DRAFT"
  }'
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support, please open an issue on GitHub or contact the development team.

## 🙏 Acknowledgments

- Django REST Framework
- React and Material-UI
- PostgreSQL
- Docker

---

**Built with ❤️ by the Smart ERP Team**
