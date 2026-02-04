# API Documentation

Complete API reference for the Property Management ERP System.

## Base URL

```
http://localhost:8000/api
```

## Authentication

All endpoints require Token authentication (except login).

### Header Format
```
Authorization: Token your_auth_token_here
```

## Properties

### List Properties
```
GET /property/properties/
```

**Query Parameters:**
- `status` - Filter by status (available, occupied, leased, maintenance, sold)
- `property_type` - Filter by type (residential, commercial, industrial, land, mixed)
- `owner` - Filter by owner ID
- `search` - Search by name or property_id
- `ordering` - Order by field (created_at, name)
- `page` - Pagination page number
- `page_size` - Results per page (default 20)

**Example:**
```bash
curl "http://localhost:8000/api/property/properties/?status=available&city=New%20York" \
  -H "Authorization: Token your_token"
```

**Response:**
```json
{
  "count": 5,
  "next": "http://localhost:8000/api/property/properties/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "property_id": "PROP-001",
      "name": "Downtown Residential",
      "property_type": "residential",
      "status": "available",
      "street_address": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zip_code": "10001",
      "country": "USA",
      "purchase_price": "500000.00",
      "market_value": "550000.00",
      "total_area": "5000.00",
      "built_area": "4500.00",
      "number_of_units": 10,
      "year_built": 2015,
      "owner": 1,
      "acquisition_date": "2023-01-15",
      "created_at": "2024-01-29T10:30:00Z",
      "updated_at": "2024-01-29T10:30:00Z"
    }
  ]
}
```

### Get Property Details
```
GET /property/properties/{id}/
```

**Example:**
```bash
curl http://localhost:8000/api/property/properties/1/ \
  -H "Authorization: Token your_token"
```

### Create Property
```
POST /property/properties/
```

**Request Body:**
```json
{
  "property_id": "PROP-001",
  "name": "Downtown Residential",
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
}
```

**Example:**
```bash
curl -X POST http://localhost:8000/api/property/properties/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Token your_token" \
  -d '{
    "property_id": "PROP-001",
    "name": "Downtown Residential",
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

### Update Property
```
PUT /property/properties/{id}/
PATCH /property/properties/{id}/
```

### Delete Property
```
DELETE /property/properties/{id}/
```

---

## Units

### List Units
```
GET /property/units/
```

**Query Parameters:**
- `property` - Filter by property ID
- `status` - Filter by status (vacant, occupied, maintenance)
- `search` - Search by unit_number

### Create Unit
```
POST /property/units/
```

**Request Body:**
```json
{
  "unit_number": "A-101",
  "property": 1,
  "unit_type": "2-Bedroom",
  "status": "vacant",
  "area": "1000.00",
  "bedrooms": 2,
  "bathrooms": 1,
  "monthly_rent": "2000.00"
}
```

### Get, Update, Delete Units
```
GET /property/units/{id}/
PUT /property/units/{id}/
PATCH /property/units/{id}/
DELETE /property/units/{id}/
```

---

## Tenants

### List Tenants
```
GET /property/tenants/
```

**Query Parameters:**
- `search` - Search by first_name, last_name, email

### Create Tenant
```
POST /property/tenants/
```

**Request Body:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone": "+1-555-0123",
  "move_in_date": "2024-01-01",
  "emergency_contact": "Jane Doe",
  "emergency_contact_phone": "+1-555-0124"
}
```

### Get, Update, Delete Tenants
```
GET /property/tenants/{id}/
PUT /property/tenants/{id}/
PATCH /property/tenants/{id}/
DELETE /property/tenants/{id}/
```

---

## Leases

### List Leases
```
GET /property/leases/
```

**Query Parameters:**
- `status` - Filter by status (draft, active, expired, terminated)
- `unit` - Filter by unit ID
- `tenant` - Filter by tenant ID

### Create Lease
```
POST /property/leases/
```

**Request Body:**
```json
{
  "lease_number": "LEASE-001",
  "unit": 1,
  "tenant": 1,
  "start_date": "2024-01-01",
  "end_date": "2025-01-01",
  "monthly_rent": "2000.00",
  "security_deposit": "4000.00",
  "status": "active",
  "terms_conditions": "Standard lease terms apply"
}
```

### Get, Update, Delete Leases
```
GET /property/leases/{id}/
PUT /property/leases/{id}/
PATCH /property/leases/{id}/
DELETE /property/leases/{id}/
```

---

## Maintenance

### List Maintenance Records
```
GET /property/maintenance/
```

**Query Parameters:**
- `status` - Filter by status (pending, in_progress, completed, cancelled)
- `priority` - Filter by priority (low, medium, high, critical)
- `property` - Filter by property ID

### Create Maintenance Record
```
POST /property/maintenance/
```

**Request Body:**
```json
{
  "maintenance_id": "MNT-001",
  "property": 1,
  "unit": 1,
  "title": "AC Unit Repair",
  "description": "Air conditioning unit not cooling properly",
  "priority": "high",
  "status": "pending",
  "scheduled_date": "2024-02-05",
  "estimated_cost": "500.00",
  "assigned_to": "John Smith"
}
```

### Get, Update, Delete Maintenance
```
GET /property/maintenance/{id}/
PUT /property/maintenance/{id}/
PATCH /property/maintenance/{id}/
DELETE /property/maintenance/{id}/
```

---

## Expenses

### List Expenses
```
GET /property/expenses/
```

**Query Parameters:**
- `expense_type` - Filter by type (maintenance, utilities, insurance, tax, management, other)
- `payment_status` - Filter by status (pending, paid, overdue)
- `property` - Filter by property ID

### Create Expense
```
POST /property/expenses/
```

**Request Body:**
```json
{
  "expense_id": "EXP-001",
  "property": 1,
  "expense_type": "maintenance",
  "description": "Monthly maintenance",
  "amount": "500.00",
  "expense_date": "2024-01-29",
  "vendor": "ABC Maintenance Co",
  "invoice_number": "INV-12345",
  "payment_status": "pending"
}
```

### Get, Update, Delete Expenses
```
GET /property/expenses/{id}/
PUT /property/expenses/{id}/
PATCH /property/expenses/{id}/
DELETE /property/expenses/{id}/
```

---

## Rent Payments

### List Rent Payments
```
GET /property/rent/
```

**Query Parameters:**
- `status` - Filter by status (pending, paid, overdue, partial)
- `lease` - Filter by lease ID
- `tenant` - Filter by tenant ID

### Create Rent Payment
```
POST /property/rent/
```

**Request Body:**
```json
{
  "lease": 1,
  "tenant": 1,
  "rent_date": "2024-02-01",
  "due_date": "2024-02-05",
  "amount": "2000.00",
  "paid_amount": "0.00",
  "status": "pending",
  "payment_method": "bank_transfer",
  "notes": "Monthly rent - February 2024"
}
```

### Get, Update, Delete Rent Payments
```
GET /property/rent/{id}/
PUT /property/rent/{id}/
PATCH /property/rent/{id}/
DELETE /property/rent/{id}/
```

### Record Rent Payment
```
PATCH /property/rent/{id}/
```

**Request Body:**
```json
{
  "paid_amount": "2000.00",
  "status": "paid",
  "paid_date": "2024-02-03",
  "transaction_id": "TXN-123456"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "field_name": ["Error message about this field"]
}
```

### 401 Unauthorized
```json
{
  "detail": "Authentication credentials were not provided."
}
```

### 403 Forbidden
```json
{
  "detail": "You do not have permission to perform this action."
}
```

### 404 Not Found
```json
{
  "detail": "Not found."
}
```

### 500 Internal Server Error
```json
{
  "detail": "Internal server error"
}
```

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request succeeded |
| 201 | Created - Resource created successfully |
| 204 | No Content - Request succeeded, no content |
| 400 | Bad Request - Invalid request parameters |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Permission denied |
| 404 | Not Found - Resource not found |
| 500 | Internal Server Error |

---

## Pagination

Default page size is 20 results. To change:

```
GET /property/properties/?page=1&page_size=50
```

Response includes:
- `count` - Total number of results
- `next` - URL for next page
- `previous` - URL for previous page
- `results` - Array of objects

---

## Filtering & Searching

### Filter Example
```
GET /property/properties/?status=available&city=New%20York
```

### Search Example
```
GET /property/properties/?search=Downtown
```

### Ordering Example
```
GET /property/properties/?ordering=-created_at
# Use - prefix for descending order
```

---

## Examples

### Python (Requests)
```python
import requests

headers = {
    'Authorization': 'Token your_auth_token'
}

# Get properties
response = requests.get(
    'http://localhost:8000/api/property/properties/',
    headers=headers
)
properties = response.json()

# Create property
data = {
    'property_id': 'PROP-001',
    'name': 'My Property',
    'property_type': 'residential',
    'status': 'available',
    'street_address': '123 Main St',
    'city': 'New York',
    'state': 'NY',
    'zip_code': '10001',
    'country': 'USA',
    'purchase_price': '500000.00',
    'total_area': '5000.00',
    'acquisition_date': '2024-01-29'
}

response = requests.post(
    'http://localhost:8000/api/property/properties/',
    json=data,
    headers=headers
)
```

### JavaScript (Fetch)
```javascript
const headers = {
  'Content-Type': 'application/json',
  'Authorization': 'Token your_auth_token'
};

// Get properties
fetch('http://localhost:8000/api/property/properties/', {
  headers: headers
})
.then(response => response.json())
.then(data => console.log(data));

// Create property
const propertyData = {
  property_id: 'PROP-001',
  name: 'My Property',
  property_type: 'residential',
  status: 'available',
  street_address: '123 Main St',
  city: 'New York',
  state: 'NY',
  zip_code: '10001',
  country: 'USA',
  purchase_price: '500000.00',
  total_area: '5000.00',
  acquisition_date: '2024-01-29'
};

fetch('http://localhost:8000/api/property/properties/', {
  method: 'POST',
  headers: headers,
  body: JSON.stringify(propertyData)
})
.then(response => response.json())
.then(data => console.log(data));
```

### JavaScript (Axios)
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Authorization': 'Token your_auth_token'
  }
});

// Get properties
api.get('/property/properties/')
  .then(response => console.log(response.data))
  .catch(error => console.error(error));

// Create property
api.post('/property/properties/', {
  property_id: 'PROP-001',
  name: 'My Property',
  property_type: 'residential',
  status: 'available',
  street_address: '123 Main St',
  city: 'New York',
  state: 'NY',
  zip_code: '10001',
  country: 'USA',
  purchase_price: '500000.00',
  total_area': '5000.00',
  acquisition_date: '2024-01-29'
})
.then(response => console.log(response.data))
.catch(error => console.error(error));
```

---

For more information, see the main documentation in `docs/README.md`
