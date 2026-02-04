# System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND LAYER                           │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    React Application                     │  │
│  │           (http://localhost:3000)                        │  │
│  │                                                          │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐   │  │
│  │  │  Dashboard  │  │  Properties  │  │   Tenants    │   │  │
│  │  └─────────────┘  └──────────────┘  └──────────────┘   │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐   │  │
│  │  │  Maintenance│  │  Rent Collect│  │  Expenses    │   │  │
│  │  └─────────────┘  └──────────────┘  └──────────────┘   │  │
│  │                                                          │  │
│  │  Navigation Component │ Bootstrap UI │ Responsive       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│              ↓ (HTTP REST API Calls)                           │
│              Axios API Client                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↕
                         CORS Bridge
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND LAYER                            │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │            Django REST API                               │  │
│  │      (http://localhost:8000/api)                         │  │
│  │                                                          │  │
│  │  ┌────────────────────────────────────────────────────┐ │  │
│  │  │         REST Framework Endpoints                   │ │  │
│  │  │                                                    │ │  │
│  │  │  /property/properties/     - Property CRUD        │ │  │
│  │  │  /property/units/          - Unit CRUD            │ │  │
│  │  │  /property/tenants/        - Tenant CRUD          │ │  │
│  │  │  /property/leases/         - Lease CRUD           │ │  │
│  │  │  /property/maintenance/    - Maintenance CRUD     │ │  │
│  │  │  /property/expenses/       - Expense CRUD         │ │  │
│  │  │  /property/rent/           - Rent CRUD            │ │  │
│  │  │                                                    │ │  │
│  │  │  + Accounts, HRM, Inventory, Purchase, Sales      │ │  │
│  │  └────────────────────────────────────────────────────┘ │  │
│  │                                                          │  │
│  │  ┌────────────────────────────────────────────────────┐ │  │
│  │  │              Django ORM Layer                       │ │  │
│  │  │                                                    │ │  │
│  │  │  ┌──────────────┐  ┌──────────────┐              │ │  │
│  │  │  │   Property   │  │     Unit     │              │ │  │
│  │  │  └──────────────┘  └──────────────┘              │ │  │
│  │  │  ┌──────────────┐  ┌──────────────┐              │ │  │
│  │  │  │    Tenant    │  │     Lease    │              │ │  │
│  │  │  └──────────────┘  └──────────────┘              │ │  │
│  │  │  ┌──────────────┐  ┌──────────────┐              │ │  │
│  │  │  │ Maintenance  │  │   Expense    │              │ │  │
│  │  │  └──────────────┘  └──────────────┘              │ │  │
│  │  │  ┌──────────────┐  ┌──────────────┐              │ │  │
│  │  │  │     Rent     │  │   Account    │              │ │  │
│  │  │  └──────────────┘  └──────────────┘              │ │  │
│  │  └────────────────────────────────────────────────────┘ │  │
│  │                                                          │  │
│  │  Authentication │ Permissions │ Validation │ Serializers│ │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│              ↓ (SQL Queries)                                   │
│              ORM Database Abstraction                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↕
                         Database Bridge
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE LAYER                             │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           PostgreSQL Database                            │  │
│  │       (localhost:5432)                                   │  │
│  │                                                          │  │
│  │  ┌─────────────────────────────────────────────────────┐│  │
│  │  │           Database Tables                            ││  │
│  │  │                                                      ││  │
│  │  │  property_property        │ property_unit           ││  │
│  │  │  property_tenant          │ property_lease          ││  │
│  │  │  property_maintenance     │ property_expense        ││  │
│  │  │  property_rent            │ accounts_account        ││  │
│  │  │  hrm_employee             │ inventory_item          ││  │
│  │  │  purchase_purchaseorder   │ sales_salesorder        ││  │
│  │  │                                                      ││  │
│  │  │  + Django built-in tables (auth, sessions, etc.)    ││  │
│  │  └─────────────────────────────────────────────────────┘│  │
│  │                                                          │  │
│  │  Indexes │ Constraints │ Relationships │ Transactions   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Component Architecture

```
FRONTEND
├── React App (index.js)
│   └── App.js (Routes)
│       ├── Navigation Component
│       │   ├── Link to Dashboard
│       │   ├── Link to Properties
│       │   ├── Link to Tenants
│       │   ├── Link to Maintenance
│       │   ├── Link to Expenses
│       │   └── Link to Rent Collection
│       │
│       └── Pages
│           ├── Dashboard
│           │   └── Displays Statistics
│           │       └── Calls Dashboard API
│           │
│           ├── Properties
│           │   ├── PropertyList (View)
│           │   │   └── Calls propertyService.getAll()
│           │   └── PropertyForm (Create/Edit)
│           │       └── Calls propertyService.create() or update()
│           │
│           ├── Tenants
│           │   └── TenantList
│           │       └── Calls tenantService.getAll()
│           │
│           ├── Maintenance
│           │   └── MaintenanceList
│           │       └── Calls maintenanceService.getAll()
│           │
│           ├── Expenses
│           │   └── ExpenseList
│           │       └── Calls expenseService.getAll()
│           │
│           └── Rent Collection
│               └── RentCollection
│                   └── Calls rentService.getAll()
│
└── Services
    └── propertyService.js
        ├── propertyService
        ├── unitService
        ├── tenantService
        ├── leaseService
        ├── maintenanceService
        ├── expenseService
        └── rentService
        └── api.js (Axios setup)

BACKEND
└── Django (manage.py)
    └── erp_system/ (Project)
        ├── config/
        │   ├── settings.py (Database, CORS, Installed Apps)
        │   ├── urls.py (Main Routes)
        │   └── wsgi.py (WSGI Application)
        │
        └── apps/
            ├── property/ (Main App)
            │   ├── models.py (7 Models)
            │   │   ├── Property
            │   │   ├── Unit
            │   │   ├── Tenant
            │   │   ├── Lease
            │   │   ├── Maintenance
            │   │   ├── Expense
            │   │   └── Rent
            │   ├── views.py (ViewSets)
            │   │   ├── PropertyViewSet
            │   │   ├── UnitViewSet
            │   │   ├── TenantViewSet
            │   │   ├── LeaseViewSet
            │   │   ├── MaintenanceViewSet
            │   │   ├── ExpenseViewSet
            │   │   └── RentViewSet
            │   ├── serializers.py (Model Serializers)
            │   ├── urls.py (API Routes)
            │   ├── admin.py (Django Admin)
            │   └── apps.py (App Config)
            │
            ├── accounts/ (Accounting App)
            │   ├── models.py (Account)
            │   ├── views.py (AccountViewSet)
            │   ├── serializers.py
            │   ├── urls.py
            │   └── admin.py
            │
            ├── hrm/ (HR App)
            │   ├── models.py (Employee)
            │   ├── views.py (EmployeeViewSet)
            │   ├── serializers.py
            │   ├── urls.py
            │   └── admin.py
            │
            ├── inventory/ (Inventory App)
            │   ├── models.py (Item)
            │   ├── views.py (ItemViewSet)
            │   ├── serializers.py
            │   ├── urls.py
            │   └── admin.py
            │
            ├── purchase/ (Purchase App)
            │   ├── models.py (PurchaseOrder)
            │   ├── views.py (PurchaseOrderViewSet)
            │   ├── serializers.py
            │   ├── urls.py
            │   └── admin.py
            │
            └── sales/ (Sales App)
                ├── models.py (SalesOrder)
                ├── views.py (SalesOrderViewSet)
                ├── serializers.py
                ├── urls.py
                └── admin.py

DATABASE
└── PostgreSQL (erp_property_db)
    ├── property_property
    ├── property_unit
    ├── property_tenant
    ├── property_lease
    ├── property_maintenance
    ├── property_expense
    ├── property_rent
    ├── accounts_account
    ├── hrm_employee
    ├── inventory_item
    ├── purchase_purchaseorder
    ├── sales_salesorder
    └── Django Built-in Tables
        ├── auth_user
        ├── auth_group
        ├── django_session
        └── ...
```

## Data Flow Diagram

```
USER INTERACTION
      ↓
┌─────────────────────────────────────┐
│    React Component (e.g., Page)     │
│    - Renders HTML/Form              │
│    - Handles User Input             │
└─────────────────────────────────────┘
      ↓
┌─────────────────────────────────────┐
│    Service Layer (propertyService)  │
│    - Calls API Methods              │
│    - Handles API URLs               │
└─────────────────────────────────────┘
      ↓
┌─────────────────────────────────────┐
│    Axios HTTP Client                │
│    - Sets Headers                   │
│    - Handles Authentication         │
│    - Sends HTTP Request             │
└─────────────────────────────────────┘
      ↓
┌─────────────────────────────────────┐
│  Django REST Framework              │
│  - Routes Request                   │
│  - Validates Authentication         │
│  - Deserializes Data                │
└─────────────────────────────────────┘
      ↓
┌─────────────────────────────────────┐
│    ViewSet/View                     │
│    - Processes Request              │
│    - Applies Business Logic         │
│    - Calls Model Methods            │
└─────────────────────────────────────┘
      ↓
┌─────────────────────────────────────┐
│    Model/Serializer                 │
│    - Validates Data                 │
│    - Transforms Data                │
└─────────────────────────────────────┘
      ↓
┌─────────────────────────────────────┐
│    Django ORM                       │
│    - Generates SQL                  │
│    - Manages Database Connection    │
└─────────────────────────────────────┘
      ↓
┌─────────────────────────────────────┐
│    PostgreSQL Database              │
│    - Executes SQL Query             │
│    - Returns Data                   │
└─────────────────────────────────────┘
      ↓
     (Response travels back through layers)
      ↓
┌─────────────────────────────────────┐
│    React Component Updates State    │
│    - Re-renders UI                  │
│    - Displays Data                  │
└─────────────────────────────────────┘
      ↓
    USER SEES RESULT
```

## Module Relationships

```
┌──────────────────────────────────────────────────────────┐
│                 PROPERTY MANAGEMENT                      │
│                   (Core Module)                          │
│                                                          │
│  ┌────────────┐      ┌────────────┐                    │
│  │ Property   │◄────►│   Unit     │                    │
│  └────────────┘      └────────────┘                    │
│       ▲                    ▲                            │
│       │ 1:N                │ 1:1                        │
│       │                    ▼                            │
│       │              ┌────────────┐                    │
│       │              │  Tenant    │                    │
│       │              └────────────┘                    │
│       │                    ▲                            │
│       │                    │ 1:N                        │
│       │                    ▼                            │
│       │              ┌────────────┐                    │
│       │              │   Lease    │                    │
│       │              └────────────┘                    │
│       │                    ▲                            │
│       │                    │ 1:N                        │
│       │                    ▼                            │
│       │              ┌────────────┐                    │
│       │              │    Rent    │                    │
│       │              └────────────┘                    │
│       │                                                 │
│       │ 1:N                                             │
│       ▼                                                 │
│  ┌────────────┐        ┌────────────┐                 │
│  │ Maintenance│        │  Expense   │                 │
│  └────────────┘        └────────────┘                 │
│                                                          │
└──────────────────────────────────────────────────────────┘
         │                    │
         │                    │
         ▼                    ▼
┌──────────────────────┐ ┌──────────────────────┐
│  ACCOUNTING MODULE   │ │  OTHER MODULES       │
│  ├─ Accounts         │ │  ├─ HRM              │
│  └─ Financial Track  │ │  ├─ Inventory        │
└──────────────────────┘ │  ├─ Purchase         │
                         │  └─ Sales            │
                         └──────────────────────┘
```

## Deployment Architecture (Production)

```
┌─────────────────────────────────────────────────────────────┐
│                   CLIENT TIER (Internet)                    │
│                                                             │
│     User Browser ──HTTPS──► Domain Name                    │
└─────────────────────────────────────────────────────────────┘
         ▲
         │
    HTTPS/SSL
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│              REVERSE PROXY TIER                             │
│                                                             │
│              Nginx / Apache                                │
│        (Port 80 → 443, Load Balancing)                    │
└─────────────────────────────────────────────────────────────┘
         ▲
         │
    HTTP
         │
         ├──────────┬──────────┐
         ▼          ▼          ▼
┌─────────────────────────────────────────────────────────────┐
│         APPLICATION TIER (Gunicorn Workers)                 │
│                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                   │
│  │ Gunicorn │ │ Gunicorn │ │ Gunicorn │                   │
│  │ Worker 1 │ │ Worker 2 │ │ Worker N │                   │
│  └──────────┘ └──────────┘ └──────────┘                   │
│        │           │           │                           │
│        └───────────┼───────────┘                           │
│                    ▼                                        │
│        ┌─────────────────────┐                            │
│        │   Django App        │                            │
│        │  (Shared Settings)  │                            │
│        └─────────────────────┘                            │
└─────────────────────────────────────────────────────────────┘
         ▲
         │
    TCP Connection
         │
         ├──────────┬──────────┬──────────┐
         ▼          ▼          ▼          ▼
┌─────────────────────────────────────────────────────────────┐
│           DATA TIER                                         │
│                                                             │
│  ┌──────────────────┐   ┌──────────────────┐             │
│  │  PostgreSQL      │   │  Redis Cache     │             │
│  │  Master (Write)  │   │  (Sessions/Tasks)│             │
│  └──────────────────┘   └──────────────────┘             │
│        ▲                                                   │
│        │                                                   │
│  ┌──────────────────────────────────────────┐            │
│  │  PostgreSQL Replicas (Read)              │            │
│  │  (Optional for Load Balancing)           │            │
│  └──────────────────────────────────────────┘            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
         ▲
         │
      Storage
         │
    ┌────┴────┐
    ▼         ▼
┌─────────┐ ┌──────────────────┐
│  SSD    │ │  S3 / File Store │
│ Database│ │  (Backups/Media) │
└─────────┘ └──────────────────┘
```

---

For more details, see the documentation files in the `docs/` directory.
