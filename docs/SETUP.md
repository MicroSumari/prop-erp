# Property Management ERP System - Setup Guide

## Prerequisites

- Python 3.9+
- Node.js 16+
- PostgreSQL 12+
- Git

## Backend Setup

### 1. PostgreSQL Database Setup

#### On Linux (Ubuntu/Debian)
```bash
# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql
```

In PostgreSQL prompt:
```sql
CREATE DATABASE erp_property_db;
CREATE USER erp_user WITH PASSWORD 'your_secure_password';
ALTER ROLE erp_user SET client_encoding TO 'utf8';
ALTER ROLE erp_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE erp_user SET default_transaction_deferrable TO on;
ALTER ROLE erp_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE erp_property_db TO erp_user;
\q
```

#### On macOS (with Homebrew)
```bash
# Install PostgreSQL
brew install postgresql@15

# Start PostgreSQL service
brew services start postgresql@15

# Create database and user
createuser erp_user -P  # Enter password when prompted
createdb -O erp_user erp_property_db
```

#### On Windows
- Download PostgreSQL installer from https://www.postgresql.org/download/windows/
- Run the installer and follow instructions
- Remember the password set for `postgres` user
- Use pgAdmin tool to create user and database

### 2. Python Virtual Environment

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Linux/macOS:
source venv/bin/activate

# On Windows:
venv\Scripts\activate
```

### 3. Install Python Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 4. Configure Environment Variables

```bash
# Copy example env file
cp .env.example .env

# Edit .env with your database credentials
# Update DB_PASSWORD to match your PostgreSQL user password
nano .env  # or use your preferred editor
```

### 5. Database Migrations

```bash
# Create migrations for all apps
python manage.py makemigrations

# Apply migrations
python manage.py migrate
```

### 6. Create Superuser

```bash
python manage.py createsuperuser
# Follow prompts to create admin user
```

### 7. Run Development Server

```bash
python manage.py runserver
```

The backend will be available at `http://localhost:8000`

Django Admin: `http://localhost:8000/admin`

## Frontend Setup

### 1. Install Node Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment Variables

```bash
# Create .env file
cat > .env << EOF
REACT_APP_API_URL=http://localhost:8000/api
EOF
```

### 3. Run Development Server

```bash
npm start
```

The frontend will be available at `http://localhost:3000`

## Verification

### Backend Verification

1. Open `http://localhost:8000/admin` in browser
2. Login with superuser credentials
3. You should see Django admin interface with Property Management models

Test API endpoint:
```bash
curl http://localhost:8000/api/property/properties/
```

### Frontend Verification

1. Open `http://localhost:3000` in browser
2. You should see the Property Management Dashboard
3. Navigate through different sections to verify all pages load

## Troubleshooting

### PostgreSQL Connection Error

**Error**: `psycopg2.OperationalError: could not connect to server`

**Solution**:
1. Verify PostgreSQL is running:
   ```bash
   # Linux/macOS
   sudo systemctl status postgresql
   # or
   brew services list
   ```

2. Check database credentials in `.env`
3. Verify database and user exist:
   ```bash
   psql -U postgres -l
   ```

### Port Already in Use

**Error**: `Address already in use`

**Solution**:
- Change port in command:
  ```bash
  python manage.py runserver 8001  # backend
  npm start -- --port 3001  # frontend
  ```

### Module Not Found

**Error**: `ModuleNotFoundError: No module named 'django'`

**Solution**:
- Make sure virtual environment is activated
- Reinstall dependencies:
  ```bash
  pip install -r requirements.txt
  ```

### CORS Error

**Error**: `Access to XMLHttpRequest has been blocked by CORS policy`

**Solution**:
- Verify `CORS_ALLOWED_ORIGINS` in `.env`:
  ```
  CORS_ALLOWED_ORIGINS=http://localhost:3000
  ```
- Restart backend server

### React App Not Starting

**Error**: Port 3000 already in use

**Solution**:
```bash
# Kill process on port 3000
# Linux/macOS
lsof -ti:3000 | xargs kill -9

# Windows (PowerShell)
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process

# Then restart
npm start
```

## Initial Data Setup

### Create Sample Data

```bash
cd backend

# Open Django shell
python manage.py shell
```

In Python shell:
```python
from django.contrib.auth.models import User
from erp_system.apps.property.models import Property
from datetime import date

# Create owner user (if not exists)
user, created = User.objects.get_or_create(
    username='owner1',
    defaults={
        'email': 'owner@example.com',
        'first_name': 'John',
        'last_name': 'Doe'
    }
)

# Create sample property
property = Property.objects.create(
    property_id='PROP-001',
    name='Downtown Residential Complex',
    description='Modern apartment complex',
    property_type='residential',
    status='available',
    street_address='123 Main St',
    city='New York',
    state='NY',
    zip_code='10001',
    country='USA',
    purchase_price=500000.00,
    total_area=5000.00,
    acquisition_date=date(2023, 1, 15),
    owner=user
)

print('Sample property created successfully!')
exit()
```

Access the data via:
- Django Admin: `http://localhost:8000/admin`
- API: `http://localhost:8000/api/property/properties/`
- Frontend: `http://localhost:3000`

## Next Steps

1. Review the main [README.md](README.md) for system overview
2. Explore Django Admin interface to understand data models
3. Check API endpoints documentation
4. Start building custom features as needed

## Additional Resources

- Django Documentation: https://docs.djangoproject.com/
- Django REST Framework: https://www.django-rest-framework.org/
- React Documentation: https://react.dev/
- PostgreSQL: https://www.postgresql.org/docs/

## Support

For issues:
1. Check error messages carefully
2. Review logs in terminal
3. Check Django Admin for data integrity
4. Verify all services (PostgreSQL, Django, React) are running
