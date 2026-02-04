# ERP System - Full Stack Property Management Application

A comprehensive Enterprise Resource Planning (ERP) system built with React and Django, specifically designed for property management with integrated accounting.

## 🚀 Features

### Property Management
- **Properties**: Manage multiple properties with detailed information
- **Units**: Track individual units within properties
- **Leases**: Complete lease lifecycle management
- **Lease Renewals**: Handle lease renewals with accounting integration
- **Lease Terminations**: Process lease terminations with financial calculations

### Tenant & Related Party Management
- **Tenants**: Comprehensive tenant information
- **Related Parties**: Manage landlords, vendors, contractors
- **Ledger Accounts**: Automatic account creation for parties

### Maintenance Management
- **Maintenance Requests**: Track and manage maintenance requests
- **Maintenance Contracts**: Manage maintenance contracts with amortization
- **Automatic Accounting**: Journal entries for maintenance expenses

### Financial Management
- **Receipt Vouchers**: Record payments with multiple payment methods
- **Chart of Accounts**: Structured accounting system
- **Automated Journal Entries**: Automatic accounting for transactions
- **Cost Centers**: Track costs by property/unit

### Legal Case Management
- **Case Tracking**: Manage legal cases related to properties
- **Court Information**: Track court details and case status
- **Financial Impact**: Record legal expenses and outcomes

## 🛠️ Tech Stack

### Frontend
- **React 18**: Modern UI library
- **React Router v6**: Client-side routing
- **React Bootstrap**: UI components
- **Axios**: API communication
- **Font Awesome**: Icons

### Backend
- **Django 4.2**: Python web framework
- **Django REST Framework**: API development
- **SQLite**: Database (easily configurable for PostgreSQL)
- **JWT Authentication**: Secure API access

## 📋 Prerequisites

- **Python 3.8+**
- **Node.js 14+** and npm
- **Git**

## 🔧 Installation & Setup

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd app-erp
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# On Linux/Mac:
source .venv/bin/activate
# On Windows:
# .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser

# Seed initial data
python manage.py seed_accounts
python manage.py seed_data

# Start backend server
python manage.py runserver
```

Backend will run on `http://localhost:8000`

### 3. Frontend Setup

```bash
# Open new terminal and navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start frontend development server
npm start
```

Frontend will run on `http://localhost:3000`

## 🎯 Usage

1. **Login**: Use the credentials you created during setup
2. **Properties**: Start by adding properties
3. **Units**: Add units to your properties
4. **Tenants**: Register tenants and related parties
5. **Leases**: Create leases for your units
6. **Maintenance**: Track maintenance requests and contracts
7. **Receipts**: Record payments from tenants

## 📁 Project Structure

```
app-erp/
├── backend/
│   ├── erp_system/
│   │   ├── apps/
│   │   │   ├── accounts/        # Chart of Accounts
│   │   │   ├── property/        # Property, Units, Leases
│   │   │   ├── maintenance/     # Maintenance Management
│   │   │   ├── sales/          # Receipt Vouchers
│   │   │   └── ...
│   │   └── config/             # Django settings
│   ├── manage.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/         # Reusable components
│   │   ├── pages/             # Page components
│   │   ├── services/          # API services
│   │   └── contexts/          # React contexts
│   ├── public/
│   └── package.json
│
└── docs/                      # Documentation
```

## 🔑 Key Features Implementation

### Custom Form Modal
All forms include a professional spinner modal that:
- Shows loading state during submission
- Displays success message on completion
- Auto-redirects after 1.5 seconds

### Responsive Tables
- Action buttons (view/edit) properly aligned
- No wrapping on multiple lines
- Optimized for various screen sizes

### Smart Data Display
- Conditional rendering of empty fields
- Intelligent fallbacks for missing data
- Clean, professional UI

### Accounting Integration
- Automatic journal entries for leases
- Receipt voucher accounting
- Maintenance contract amortization
- Cost center tracking

## 🌐 API Endpoints

### Properties
- `GET/POST /api/property/properties/`
- `GET/PUT/DELETE /api/property/properties/{id}/`

### Leases
- `GET/POST /api/property/leases/`
- `GET/PUT/DELETE /api/property/leases/{id}/`

### Maintenance
- `GET/POST /api/maintenance/requests/`
- `GET/POST /api/maintenance/contracts/`

### Financial
- `GET/POST /api/sales/receipt-vouchers/`
- `GET /api/accounts/accounts/`

See `docs/API.md` for complete API documentation.

## 🐛 Troubleshooting

### Backend Issues
- Ensure virtual environment is activated
- Check if port 8000 is available
- Verify database migrations are applied

### Frontend Issues
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check if port 3000 is available

## 📝 License

This project is private and proprietary.

## 👥 Contributors

- Development Team

## 📞 Support

For issues or questions, please contact the development team.

---

**Built with ❤️ using React and Django**
