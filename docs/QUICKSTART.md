# Quick Start Guide

## System Setup Summary

Your Property Management ERP System has been successfully set up with the following structure:

## ✅ What's Been Created

### Backend (Django + Python)
✓ Django 4.2.7 project structure  
✓ PostgreSQL database configuration  
✓ 6 ERP modules:
  - **Property** - Core property management (Properties, Units, Tenants, Leases, Maintenance, Expenses, Rent)
  - **Accounts** - Chart of accounts
  - **HRM** - Human Resources
  - **Inventory** - Stock management
  - **Purchase** - Purchase orders
  - **Sales** - Sales orders

✓ REST API endpoints for all modules  
✓ Django Admin interface  
✓ Token-based authentication ready  

### Frontend (React + JavaScript)
✓ React 18 with React Router  
✓ Bootstrap 5 UI (ERPNext-style)  
✓ Navigation component with menu  
✓ Complete page structure:
  - Dashboard with stats
  - Properties management
  - Tenant management
  - Maintenance tracking
  - Expense management
  - Rent collection
  - Responsive design

✓ API service layer with Axios  

### Database (PostgreSQL)
✓ Configuration ready  
✓ All models defined with relationships  

---

## 🚀 Getting Started

### Step 1: PostgreSQL Setup

**Important**: Install and start PostgreSQL first!

#### On Ubuntu/Debian:
```bash
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql

# Create database
sudo -u postgres psql

# Run these SQL commands:
CREATE DATABASE erp_property_db;
CREATE USER erp_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE erp_property_db TO erp_user;
\q
```

#### On macOS:
```bash
brew install postgresql@15
brew services start postgresql@15

# Create database
createuser erp_user -P
createdb -O erp_user erp_property_db
```

#### On Windows:
- Download from https://www.postgresql.org/download/windows/
- Run installer, note your password
- Use pgAdmin to create database and user

---

### Step 2: Backend Setup

```bash
cd /home/sys1/Desktop/app-erp/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env

# Edit .env and update:
# DB_PASSWORD=your_postgresql_password
# SECRET_KEY=generate-a-random-key-or-use-the-default

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create admin user
python manage.py createsuperuser
# Follow prompts for username, email, password

# Start server
python manage.py runserver
```

**Backend running at**: `http://localhost:8000`  
**Admin panel**: `http://localhost:8000/admin`

---

### Step 3: Frontend Setup

**In a new terminal**:

```bash
cd /home/sys1/Desktop/app-erp/frontend

# Install dependencies
npm install

# Configure environment
echo "REACT_APP_API_URL=http://localhost:8000/api" > .env

# Start development server
npm start
```

**Frontend running at**: `http://localhost:3000`

---

## 📋 Initial Data

### Create Sample Property (Optional)

In Django admin or via API:

```bash
curl -X POST http://localhost:8000/api/property/properties/ \
  -H "Content-Type: application/json" \
  -d '{
    "property_id": "PROP-001",
    "name": "My First Property",
    "property_type": "residential",
    "status": "available",
    "street_address": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zip_code": "10001",
    "country": "USA",
    "purchase_price": "500000.00",
    "total_area": "5000.00",
    "acquisition_date": "2024-01-29"
  }'
```

---

## 📊 Available Pages

### Frontend
- **Dashboard** `/` - Overview with key metrics
- **Properties** `/properties` - List and manage properties
- **Tenants** `/tenants` - Tenant information
- **Rent Collection** `/rent-collection` - Rent payments tracking
- **Maintenance** `/maintenance` - Work orders and maintenance
- **Expenses** `/expenses` - Property expenses

### Backend API
- **Properties**: `/api/property/properties/`
- **Units**: `/api/property/units/`
- **Tenants**: `/api/property/tenants/`
- **Leases**: `/api/property/leases/`
- **Maintenance**: `/api/property/maintenance/`
- **Expenses**: `/api/property/expenses/`
- **Rent**: `/api/property/rent/`

---

## 🔑 Key Features

### Property Management
- Add properties with details (type, location, area, value)
- Create multiple units per property
- Track property status
- Manage property documents and images

### Tenant Management
- Store tenant information
- Track occupancy
- Link tenants to units
- Emergency contact details

### Financial Management
- Rent payment tracking
- Expense categorization
- Maintenance cost tracking
- Financial reports

### Maintenance Tracking
- Create work orders
- Assign priority levels
- Track costs
- Monitor completion status

---

## 📁 Project Structure

```
/app-erp/
├── backend/
│   ├── erp_system/
│   │   ├── apps/
│   │   │   ├── property/        ← Main property management
│   │   │   ├── accounts/
│   │   │   ├── hrm/
│   │   │   ├── inventory/
│   │   │   ├── purchase/
│   │   │   └── sales/
│   │   └── config/              ← Settings & URLs
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env.example
│   └── README.md
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/          ← Navigation, etc
│   │   ├── pages/               ← All page components
│   │   ├── services/            ← API calls
│   │   └── App.js
│   ├── package.json
│   └── README.md
└── docs/
    ├── README.md                ← System overview
    ├── SETUP.md                 ← Detailed setup guide
    └── QUICKSTART.md            ← This file
```

---

## 🔍 Checking Installation

### Backend Check
```bash
# In backend directory
python manage.py check
# Should output: System check identified no issues (0 silenced).
```

### Database Check
```bash
# In Django shell
python manage.py shell
>>> from erp_system.apps.property.models import Property
>>> print("Property model loaded successfully!")
>>> exit()
```

### API Check
```bash
curl http://localhost:8000/api/property/properties/
# Should return: {"count":0,"next":null,"previous":null,"results":[]}
```

---

## ⚙️ Configuration Tips

### Change Django Secret Key (for production)
```bash
python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
# Copy output and update SECRET_KEY in .env
```

### Change React API URL
Edit `frontend/.env`:
```
REACT_APP_API_URL=http://your-api-domain.com/api
```

### Add More Allowed Hosts
Edit `backend/.env`:
```
ALLOWED_HOSTS=localhost,127.0.0.1,your-domain.com
```

---

## 📚 Documentation

- **System Overview**: See `docs/README.md`
- **Detailed Setup**: See `docs/SETUP.md`
- **API Docs**: Available at `http://localhost:8000/api/`
- **Django Admin**: Visit `http://localhost:8000/admin`

---

## 🆘 Troubleshooting

### "Cannot connect to PostgreSQL"
- Check PostgreSQL is running: `sudo systemctl status postgresql`
- Verify credentials in `.env`
- Ensure database exists: `psql -U postgres -l`

### "Port 8000 already in use"
```bash
python manage.py runserver 8001
```

### "Port 3000 already in use"
```bash
npm start -- --port 3001
```

### "Module not found" error
```bash
# Ensure venv is activated
source venv/bin/activate
pip install -r requirements.txt
```

---

## 🎯 Next Steps

1. ✅ Set up PostgreSQL
2. ✅ Run backend server
3. ✅ Run frontend server
4. ✅ Access at `http://localhost:3000`
5. 📝 Create sample properties and tenants
6. 🔧 Customize as per requirements
7. 📦 Deploy to production

---

## 🚢 Production Deployment

When ready for production:

1. Set `DEBUG=False` in `.env`
2. Change `SECRET_KEY` to a random value
3. Update `ALLOWED_HOSTS` with actual domain
4. Build frontend: `npm run build`
5. Use Gunicorn for Django: `gunicorn erp_system.config.wsgi`
6. Use Nginx as reverse proxy
7. Enable HTTPS with SSL certificate

See `docs/SETUP.md` for detailed production guidelines.

---

## 📞 Support

If you encounter issues:
1. Check error messages in terminal
2. Review logs: `python manage.py runserver --verbosity 3`
3. Check Django Admin for data integrity
4. Verify all services are running

---

**System Setup Complete! 🎉**

Start the backend and frontend servers and begin using your Property Management ERP System.
