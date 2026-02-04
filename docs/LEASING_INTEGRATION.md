# Leasing Module Integration Guide

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PROPERTY MANAGEMENT SYSTEM               │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
    ┌───▼────┐          ┌────▼─────┐         ┌────▼────┐
    │ LEASING │          │ PROPERTIES│        │ ACCOUNTING
    └────┬────┘          └──────────┘        └──────────┘
         │
    ┌────┴──────────────────┐
    │                       │
  ┌─▼──────────┐       ┌───▼────────┐
  │  LEASES    │       │ RENT        │
  │  (Master)  │       │ COLLECTION  │
  └────────────┘       └─────┬──────┘
         │                   │
         └─────────┬─────────┘
                   │
         ┌─────────▼──────────┐
         │  RECEIVABLES &     │
         │  REVENUE ACCOUNTS  │
         └────────────────────┘
```

## Data Flow

### 1. Lease Creation Flow

```
User Creates Lease
    ↓
LeaseForm.js submits data
    ↓
leaseService.create()
    ↓
POST /api/property/leases/
    ↓
LeaseSerializer validates
    ↓
Lease model saved to database
    ↓
Signals trigger accounting entries (future)
    ↓
Lease appears in LeaseList
```

### 2. Lease → Rent Collection Flow

```
Lease Status = "Active"
    ↓
Monthly rent becomes due on start_date + monthly interval
    ↓
Rent Collection module queries active leases
    ↓
Creates rent receivable from lease.monthly_rent
    ↓
Records in Accounts Receivable
    ↓
Tenant payment recorded
    ↓
Revenue recognized in Rent Income
```

### 3. Lease → Accounting Flow

```
Lease Financial Data:
├── monthly_rent
├── security_deposit
├── tenant reference
└── dates

    ↓

Accounting Entries (When Implemented):
├── Monthly Revenue Recognition
│   └── Dr. A/R Tenant  Cr. Rent Income
├── Deposit Tracking
│   └── Dr. Cash  Cr. Refundable Deposits (Liability)
└── Charge Tracking
    └── Dr. A/R  Cr. Other Tenant Charges
```

## Entity Relationships

```
┌──────────────────┐
│    Property      │
│  (Location)      │
└────────┬─────────┘
         │ 1:Many
         │
    ┌────▼──────────┐
    │     Unit      │
    │ (Apartment)   │
    └────┬──────────┘
         │ 1:Many
         │
    ┌────▼──────────┐         ┌────────────────┐
    │     Lease     │◄───────►│  Related Party │
    │ (Agreement)   │ 1:1     │   (Tenant)     │
    └────┬──────────┘         └────────────────┘
         │ 1:Many
         │
    ┌────▼──────────┐
    │ Rent Payment  │
    │ (Collection)  │
    └───────────────┘
```

## Module Interaction Map

### Lease Module ↔ Properties Module
```
Properties Module provides:
├── Property details
└── Unit information

Lease Module requires:
├── unit_id (FK to Unit)
└── Lease terms specific to unit

Flow: Select Property → Select Unit → Create Lease
```

### Lease Module ↔ Related Parties Module
```
Related Parties provides:
├── Tenant contact info
└── Tenant identification

Lease Module uses:
├── tenant_id (FK to Tenant)
└── Tenant details for lease

Flow: Create Related Party → Lease to Tenant
```

### Lease Module ↔ Rent Collection Module
```
Lease Module defines:
├── monthly_rent amount
├── payment schedule
└── lease duration

Rent Collection uses:
├── lease.monthly_rent
├── lease.start_date
└── lease.end_date

Flow: Active Leases → Generate Rent Receivables → Collect Payments
```

### Lease Module ↔ Accounting Module (Future)
```
Lease Module triggers:
├── A/R creation for monthly rent
├── Liability tracking for deposits
└── Revenue recognition

Accounting Module:
├── Creates journal entries
├── Updates GL accounts
└── Generates financial reports

Flow: Lease Event → Journal Entry → Financial Statement
```

## API Integration Points

### Frontend Services
```javascript
// In propertyService.js
export const leaseService = {
  getAll: (params) => GET /api/property/leases/
  getById: (id) => GET /api/property/leases/{id}/
  create: (data) => POST /api/property/leases/
  update: (id, data) => PUT /api/property/leases/{id}/
  delete: (id) => DELETE /api/property/leases/{id}/
}
```

### Backend Serializers
```python
# serializers.py
LeaseSerializer validates:
├── lease_number (unique)
├── unit (exists, foreign key)
├── tenant (optional, foreign key)
├── start_date (valid date)
├── end_date (valid date, >= start_date)
├── monthly_rent (positive decimal)
├── security_deposit (positive decimal)
└── status (choice: draft/active/expired/terminated)
```

### Backend Views
```python
# viewsets.py
LeaseViewSet provides:
├── list() - All leases with pagination
├── create() - Create new lease
├── retrieve() - Get single lease
├── update() - Update lease details
├── partial_update() - Partial updates
├── destroy() - Delete lease
└── Custom actions (future):
    ├── @action activate_lease()
    ├── @action terminate_lease()
    ├── @action get_active_tenants()
    └── @action revenue_summary()
```

## State Management

### Lease States
```
         ┌─────────────┐
         │    DRAFT    │ (Initial state)
         └──────┬──────┘
                │ approve/start
         ┌──────▼──────┐
         │   ACTIVE    │ (Lease is current)
         └──────┬──────┘
                │
         ┌──────┴──────────────┐
         │                     │
    ┌────▼────────┐    ┌──────▼────┐
    │ TERMINATED  │    │  EXPIRED  │ (End date passed)
    └─────────────┘    └───────────┘
```

### Related State Changes
```
Lease ACTIVE
    ↓
A/R generated monthly
    ↓
Tenant can make payments
    ↓
Lease TERMINATED
    ↓
A/R may remain (if unpaid)
    ↓
Security deposit refund processed
```

## Error Handling

### Lease Creation Errors
```
Validation errors:
├── lease_number already exists
├── unit not found
├── tenant not found
├── end_date before start_date
├── monetary values negative
└── invalid status choice

Handled by:
├── LeaseSerializer validation
├── Model constraints
└── Frontend error display
```

### Rent Collection Errors
```
When processing leases:
├── Lease not found
├── Unit not associated
├── Tenant not found
├── Date calculations fail

Fallback:
├── Skip lease, log error
├── Notify admin
└── Manual review required
```

## Performance Considerations

### Database Queries
```
Optimized queries:
├── Lease list with pagination (10-50 per page)
├── Select_related: unit, tenant
├── Prefetch_related: rent payments
└── Indexes on:
    ├── unit_id
    ├── tenant_id
    ├── start_date
    └── status
```

### Caching Strategy
```
Cache invalidation on:
├── Lease create/update/delete
├── Status change
├── Date passing (end_date)
└── TTL: 5 minutes for lease lists
```

## Security Considerations

### Authorization
```
Lease operations require:
├── Authentication (login)
├── Property ownership check
├── Unit belongs to property
└── Tenant access validation

Audit trail:
├── User who created lease
├── Timestamp of creation
├── All modifications tracked
└── Deletion soft-deletes (future)
```

### Data Validation
```
Frontend:
├── Required field validation
├── Date format validation
├── Positive number enforcement

Backend:
├── All data re-validated
├── Type checking
├── Constraint verification
└── Serializer validation
```

## Reporting & Analytics (Future)

### Lease Reports
```
├── Active Lease Summary
│   └── Count by property, occupancy rate
├── Revenue Report
│   └── Actual vs. expected rental income
├── Expiring Leases
│   └── Renewals, terminations, tenant departures
├── Tenant Analysis
│   └── Tenure, payment history, charges
└── Financial Summary
    └── Total deposits, receivables, revenue
```

### Integration with Financial Reporting
```
GL Impact:
├── Asset side (A/R from leases)
├── Liability side (Deposit liabilities)
├── Revenue (Rent income, charges)
└── Cash flow (Payment timing)

Reports generated:
├── Balance Sheet (deposits, A/R)
├── Income Statement (rent revenue)
├── Cash Flow (payment receipts)
└── Trial Balance (GL accounts)
```

## Implementation Checklist

✅ **Phase 1 - Completed**
- [x] Lease creation form
- [x] Lease list view
- [x] API integration
- [x] Navigation menu
- [x] Related Parties edit button
- [x] Accounting documentation

🟡 **Phase 2 - Ready to Implement**
- [ ] Lease edit functionality
- [ ] Lease detail view
- [ ] Lease termination workflow
- [ ] Rent receivable automation
- [ ] Security deposit management

⏳ **Phase 3 - Future Implementation**
- [ ] Lease renewal process
- [ ] Automatic revenue recognition
- [ ] Tenant charge management
- [ ] Lease analytics dashboard
- [ ] Financial reporting integration
- [ ] Document management (PDF leases)
- [ ] E-signature integration
- [ ] Notification system (renewal reminders)

