# Property Management ERP System

A comprehensive Property Management System integrated with ERP built with Django (Backend), React (Frontend), and PostgreSQL (Database).

## System Architecture

```
app-erp/
├── backend/
│   ├── erp_system/
│   │   ├── apps/
│   │   │   ├── property/          # Property Management Module
│   │   │   ├── accounts/          # Accounting Module
│   │   │   ├── hrm/               # Human Resource Module
│   │   │   ├── inventory/         # Inventory Module
│   │   │   ├── purchase/          # Purchase Module
│   │   │   └── sales/             # Sales Module
│   │   └── config/                # Django Configuration
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/            # Reusable Components
│   │   ├── pages/                 # Page Components
│   │   ├── services/              # API Services
│   │   └── App.js
│   ├── package.json
│   └── README.md
└── docs/
    └── SETUP.md
```

## Tech Stack

### Backend
- **Framework**: Django 4.2.7
- **API**: Django REST Framework 3.14.0
- **Database**: PostgreSQL
- **Task Queue**: Celery with Redis
- **Authentication**: Token-based Authentication

### Frontend
- **Library**: React 18.2.0
- **Routing**: React Router 6.20.0
- **UI Framework**: Bootstrap 5.3.2 / React Bootstrap
- **HTTP Client**: Axios
- **Charts**: Chart.js

### Database
- **Engine**: PostgreSQL
- **Port**: 5432 (default)

## Features

### Property Management
- Add and manage properties
- Track property details (location, type, area, value)
- Monitor property status
- Support for multiple property types (residential, commercial, industrial)

### Unit Management
- Create and manage units within properties
- Track unit status and occupancy
- Manage unit-specific details (bedrooms, bathrooms, area)

### Tenant Management
- Maintain tenant information
- Track move-in/move-out dates
- Store emergency contact details
- Link tenants to units

### Lease Management
- Create and manage lease agreements
- Track lease status and dates
- Record security deposits
- Define lease terms

### Rent Collection
- Track rent payments
- Monitor payment status (pending, paid, overdue)
- Record payment methods and transaction IDs
- Generate rent payment reports

### Maintenance Management
- Create maintenance requests
- Track work orders
- Monitor maintenance status
- Assign priority levels
- Track estimated vs actual costs

### Expense Management
- Record property expenses
- Categorize expenses
- Track payment status
- Maintain vendor information

## Installation & Setup

See [SETUP.md](docs/SETUP.md) for complete installation instructions.

### Quick Start

#### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py runserver
```

#### Frontend Setup
```bash
cd frontend
npm install
npm start
```

The application will be available at:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- Django Admin: `http://localhost:8000/admin`

## Database Setup

See [SETUP.md](docs/SETUP.md) for PostgreSQL installation and configuration.

## API Endpoints

### Property Management
- `GET/POST /api/property/properties/` - List/Create properties
- `GET/PUT/DELETE /api/property/properties/{id}/` - Property details

### Units
- `GET/POST /api/property/units/` - List/Create units
- `GET/PUT/DELETE /api/property/units/{id}/` - Unit details

### Tenants
- `GET/POST /api/property/tenants/` - List/Create tenants
- `GET/PUT/DELETE /api/property/tenants/{id}/` - Tenant details

### Leases
- `GET/POST /api/property/leases/` - List/Create leases
- `GET/PUT/DELETE /api/property/leases/{id}/` - Lease details

### Rent
- `GET/POST /api/property/rent/` - List/Create rent payments
- `GET/PUT/DELETE /api/property/rent/{id}/` - Rent payment details

### Maintenance
- `GET/POST /api/property/maintenance/` - List/Create maintenance records
- `GET/PUT/DELETE /api/property/maintenance/{id}/` - Maintenance details

### Expenses
- `GET/POST /api/property/expenses/` - List/Create expenses
- `GET/PUT/DELETE /api/property/expenses/{id}/` - Expense details

## Configuration

### Environment Variables

Create a `.env` file in the backend directory with the following:

```env
# Database
DB_ENGINE=django.db.backends.postgresql
DB_NAME=erp_property_db
DB_USER=erp_user
DB_PASSWORD=your_secure_password
DB_HOST=localhost
DB_PORT=5432

# Django
DEBUG=True
SECRET_KEY=your-super-secret-key
ALLOWED_HOSTS=localhost,127.0.0.1

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

For the frontend, create a `.env` file:

```env
REACT_APP_API_URL=http://localhost:8000/api
```

## Development

### Backend Development
```bash
cd backend
source venv/bin/activate
python manage.py runserver
```

### Frontend Development
```bash
cd frontend
npm start
```

### Create Superuser
```bash
cd backend
python manage.py createsuperuser
```

Access Django Admin at: `http://localhost:8000/admin`

## Database Migrations

```bash
cd backend
python manage.py makemigrations
python manage.py migrate
```

## Production Deployment

For production deployment, refer to the Django and React documentation:
- Django: https://docs.djangoproject.com/en/4.2/howto/deployment/
- React Build: https://create-react-app.dev/docs/deployment/

## Security Notes

⚠️ **Important**:
- Change `SECRET_KEY` in production
- Set `DEBUG=False` in production
- Use environment variables for sensitive data
- Enable HTTPS in production
- Configure proper CORS settings
- Use strong database passwords

## License

This project is private and proprietary.

## Support

For issues and questions, please contact the development team.
