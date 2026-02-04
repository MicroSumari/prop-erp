# Rental Legal Case Module - Technical Architecture

## System Overview

The Rental Legal Case module is a complete legal case tracking system integrated into the ERP property management platform. It enables systematic tracking of legal proceedings related to rental properties with automatic status management and comprehensive audit trails.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  LegalCaseForm  │  │ LegalCaseList│  │LegalCaseDetail│   │
│  │   (Create)      │  │   (Read)     │  │ (Read/Update)│    │
│  └────────┬────────┘  └──────┬───────┘  └──────┬───────┘    │
│           │                  │                 │             │
│           └──────────────────┼─────────────────┘             │
│                              │                               │
│                         API Client (Axios)                   │
│                              │                               │
├──────────────────────────────┼───────────────────────────────┤
│                              │                               │
│                   REST API (Django REST)                     │
│                              │                               │
│  ┌────────────────────────────────────────────────────┐     │
│  │  /property/legal-cases/                            │     │
│  │    - GET (list)                                    │     │
│  │    - POST (create)                                 │     │
│  │    - GET/:id (retrieve)                            │     │
│  │    - PATCH/:id (partial update)                    │     │
│  │    - POST/:id/change_status/ (status transition)   │     │
│  │    - GET/by_tenant/:id (filter by tenant)          │     │
│  │    - GET/by_unit/:id (filter by unit)              │     │
│  └────────────────────────────────────────────────────┘     │
│                              │                               │
├──────────────────────────────┼───────────────────────────────┤
│                    BACKEND (Django)                          │
│                              │                               │
│  ┌─────────────────────────────────────────────────┐        │
│  │  RentalLegalCaseViewSet (View Layer)            │        │
│  │  - perform_create()                             │        │
│  │  - perform_update()                             │        │
│  │  - change_status() [custom action]              │        │
│  │  - by_tenant() [custom action]                  │        │
│  │  - by_unit() [custom action]                    │        │
│  └─────────────────────────────────────────────────┘        │
│                              │                               │
│  ┌─────────────────────────────────────────────────┐        │
│  │  RentalLegalCaseService (Business Logic)        │        │
│  │  - create_case()                                │        │
│  │  - update_case()                                │        │
│  │  - change_status() [with validation]            │        │
│  │  - sync_unit_status()                           │        │
│  │  - ALLOWED_STATUS_TRANSITIONS [state machine]   │        │
│  └─────────────────────────────────────────────────┘        │
│                              │                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Serializers                                         │   │
│  │  - RentalLegalCaseStatusHistorySerializer           │   │
│  │  - RentalLegalCaseSerializer (with validation)      │   │
│  └──────────────────────────────────────────────────────┘   │
│                              │                               │
├──────────────────────────────┼───────────────────────────────┤
│                         DATA LAYER                           │
│                              │                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Django ORM Models                                   │   │
│  │                                                      │   │
│  │  RentalLegalCase                                    │   │
│  │  ├─ tenant (FK → User)                              │   │
│  │  ├─ lease (FK → Lease)                              │   │
│  │  ├─ property (FK → Property)                        │   │
│  │  ├─ unit (FK → Unit)                                │   │
│  │  ├─ cost_center (FK → CostCenter)                   │   │
│  │  ├─ case_type (CharField)                           │   │
│  │  ├─ case_number (CharField)                         │   │
│  │  ├─ filing_date (DateField)                         │   │
│  │  ├─ current_status (CharField)                      │   │
│  │  ├─ court_name (CharField)                          │   │
│  │  ├─ remarks (TextField)                             │   │
│  │  └─ audit_fields (created_at, created_by, etc)     │   │
│  │                                                      │   │
│  │  RentalLegalCaseStatusHistory                       │   │
│  │  ├─ rental_legal_case (FK → RentalLegalCase)       │   │
│  │  ├─ previous_status (CharField)                     │   │
│  │  ├─ new_status (CharField)                          │   │
│  │  ├─ change_reason (TextField)                       │   │
│  │  ├─ changed_by (CharField)                          │   │
│  │  └─ changed_at (DateTimeField)                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                              │                               │
│                         PostgreSQL                          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Component Details

### Frontend Layer

#### 1. **LegalCaseForm Component**
- **Purpose:** Create new legal cases
- **Dependencies:** React, React-Router, API client, React-Bootstrap
- **State Management:**
  - Form data (tenant, lease, case details)
  - Dropdown data (tenants, leases, properties, units)
  - Loading/error states
- **Flow:**
  1. Fetch tenants on mount
  2. User selects tenant → filter leases
  3. User selects lease → auto-fill property/unit
  4. User fills remaining fields → validate → submit
  5. API creates case → redirect to list

#### 2. **LegalCaseList Component**
- **Purpose:** Display all cases in table format with actions
- **Dependencies:** Same as form + Table component
- **Features:**
  - Fetch all cases on mount
  - Render table with case data
  - Color-coded badges for status/case type
  - Two action buttons:
    - View details (navigates to detail page)
    - Change status (opens modal if allowed)
- **Flow:**
  1. Load cases from API
  2. Display in table
  3. User clicks action → modal opens or navigate
  4. After status change → refresh list

#### 3. **LegalCaseDetail Component**
- **Purpose:** View detailed case info and manage status
- **Features:**
  - Full case information display
  - Edit modal for court name and remarks
  - Status change modal with validation
  - Status history timeline
  - Auto-refresh after updates
- **Flow:**
  1. Fetch case by ID
  2. Display all information
  3. User can edit → update via API
  4. User can change status → validate → update
  5. Display complete history with timeline

### Backend Layer

#### 1. **RentalLegalCaseViewSet**
```python
class RentalLegalCaseViewSet(viewsets.ModelViewSet):
    # Standard CRUD operations via ModelViewSet
    
    def perform_create(self, serializer):
        # Routes creation through RentalLegalCaseService
        
    def perform_update(self, serializer):
        # Routes updates through RentalLegalCaseService
        
    @action(detail=True, methods=['post'])
    def change_status(self, request, pk=None):
        # Custom endpoint for status transitions
        # Validates and applies status change
        
    @action(detail=False, methods=['get'])
    def by_tenant(self, request):
        # Filter cases by tenant
        
    @action(detail=False, methods=['get'])
    def by_unit(self, request):
        # Filter cases by unit
```

#### 2. **RentalLegalCaseService**
Business logic layer handling all operations:

```python
class RentalLegalCaseService:
    ALLOWED_STATUS_TRANSITIONS = {
        'filed': ['in_progress'],
        'in_progress': ['judgment_passed', 'closed_tenant_won', 'closed_owner_won'],
        'judgment_passed': ['closed_tenant_won', 'closed_owner_won'],
        'closed_tenant_won': [],
        'closed_owner_won': []
    }
    
    def create_case(self, data):
        # 1. Validate tenant-lease relationship
        # 2. Get unit from lease
        # 3. Assign cost center from unit
        # 4. Create case with status 'filed'
        # 5. Update unit status to 'under_legal_case'
        # 6. Log initial history entry
        
    def update_case(self, instance, data):
        # 1. Allow only court_name and remarks updates
        # 2. Prevent status changes (use change_status instead)
        
    def change_status(self, instance, new_status, reason, user):
        # 1. Validate transition is allowed
        # 2. Update case status
        # 3. Update unit status (via sync_unit_status)
        # 4. Create history entry
        # 5. Return updated case
        
    def sync_unit_status(self, case_status):
        # Map case status to unit status:
        # filed/in_progress → under_legal_case
        # judgment_passed → blocked
        # closed_tenant_won → occupied
        # closed_owner_won → vacant
```

#### 3. **RentalLegalCaseSerializer**
- Full serialization of case data
- Nested serialization of tenant_name, lease_number, property_name, unit_number
- Includes status_history nested serializer
- Custom validation for tenant-lease relationship
- Read-only fields: cost_center, current_status, audit fields

### Data Layer

#### 1. **RentalLegalCase Model**
```python
class RentalLegalCase(models.Model):
    tenant = ForeignKey(User)           # Tenant involved in case
    lease = ForeignKey(Lease)           # Associated lease
    property = ForeignKey(Property)     # Associated property
    unit = ForeignKey(Unit)             # Associated unit
    cost_center = ForeignKey(CostCenter)  # For financial tracking
    case_type = CharField(choices=[...])  # eviction, non_payment, damage, other
    case_number = CharField(unique=True)  # Unique case identifier
    filing_date = DateField()           # Date case was filed
    current_status = CharField(choices=[...])  # Case status
    court_name = CharField()            # Court handling case
    remarks = TextField()               # Additional notes
    created_at, created_by, updated_at, updated_by  # Audit fields
```

#### 2. **RentalLegalCaseStatusHistory Model**
```python
class RentalLegalCaseStatusHistory(models.Model):
    rental_legal_case = ForeignKey(RentalLegalCase)
    previous_status = CharField(null=True)  # Status before change
    new_status = CharField()            # Status after change
    change_reason = TextField()         # Why status changed
    changed_by = CharField()            # User who made change
    changed_at = DateTimeField(auto_now_add=True)  # When change occurred
```

## Data Flow Examples

### Creating a Legal Case

```
User Input (Form)
    ↓
Frontend: Collect form data
    ↓
Validation: Required fields present
    ↓
API Call: POST /property/legal-cases/
    ↓
Django ViewSet: perform_create()
    ↓
Serializer: Validate tenant-lease relationship
    ↓
RentalLegalCaseService.create_case()
    ├─ Validate tenant-lease exist
    ├─ Get unit from lease
    ├─ Get/create cost center from unit
    ├─ Create RentalLegalCase with status='filed'
    ├─ Update Unit.status to 'under_legal_case'
    ├─ Create RentalLegalCaseStatusHistory entry
    └─ Return created case
    ↓
Response: Case data with initial status
    ↓
Frontend: Show success message
    ↓
Navigate: To case list or detail page
```

### Changing Case Status

```
User Input: Select new status + reason
    ↓
Frontend Modal: Validate inputs
    ↓
API Call: POST /property/legal-cases/{id}/change_status/
    ↓
Django ViewSet: change_status() action
    ↓
Deserialize: Extract new_status and reason
    ↓
RentalLegalCaseService.change_status()
    ├─ Get case instance
    ├─ Check if transition is allowed
    ├─ If not allowed → raise error
    ├─ Update case.current_status
    ├─ Call sync_unit_status()
    │   ├─ Map case status to unit status
    │   └─ Update unit.status
    ├─ Create RentalLegalCaseStatusHistory
    │   ├─ Set previous_status
    │   ├─ Set new_status
    │   ├─ Set change_reason
    │   ├─ Set changed_by
    │   └─ Set changed_at
    └─ Return updated case
    ↓
Response: Updated case with new status
    ↓
Frontend: Show success message
    ↓
Auto-refresh: List view with updated data
```

## Status State Machine

```
┌─────────┐
│ FILED   │  ← Initial status when case created
└────┬────┘
     │ (only allowed transition)
     ↓
┌──────────────┐
│ IN_PROGRESS  │  ← Case is being processed
└────┬─────────┘
     │ (multiple transitions allowed)
     ├──────────────────────────┬──────────────────────┐
     ↓                          ↓                      ↓
┌──────────────────┐  ┌───────────────────────┐  ┌───────────────────────┐
│ JUDGMENT_PASSED  │  │ CLOSED - TENANT WON  │  │ CLOSED - OWNER WON    │
└────┬─────────────┘  └───────────────────────┘  └───────────────────────┘
     │
     ├──────────────────────────┬──────────────────────┐
     ↓                          ↓                      ↓
┌─────────────────────┐  ┌───────────────────────┐  ┌───────────────────────┐
│                     │  │ CLOSED - TENANT WON  │  │ CLOSED - OWNER WON    │
│ Can also transition │  │                       │  │                       │
│ directly to these   │  │ (Final state)         │  │ (Final state)         │
│ from IN_PROGRESS    │  │                       │  │                       │
└─────────────────────┘  └───────────────────────┘  └───────────────────────┘

All closed statuses are FINAL - no further transitions possible.
```

## Unit Status Updates

When legal case status changes, unit status automatically updates:

```
Case Status: FILED
    ↓ Sets Unit Status To
Unit Status: UNDER_LEGAL_CASE

Case Status: IN_PROGRESS
    ↓ Sets Unit Status To
Unit Status: UNDER_LEGAL_CASE

Case Status: JUDGMENT_PASSED
    ↓ Sets Unit Status To
Unit Status: BLOCKED
    (Unit cannot be rented or modified)

Case Status: CLOSED - TENANT WON
    ↓ Sets Unit Status To
Unit Status: OCCUPIED
    (Lease continues with tenant)

Case Status: CLOSED - OWNER WON
    ↓ Sets Unit Status To
Unit Status: VACANT
    (Unit available for new lease)
```

## Database Migrations

### Migration: 0010_rentallegalcase_alter_unit_status_and_more

Operations:
1. Create RentalLegalCase table
   - All defined fields
   - Indexes on foreign keys
   - Constraints for data integrity

2. Alter Unit model
   - Add new status choices
   - Update max_length for status field

3. Create RentalLegalCaseStatusHistory table
   - All audit trail fields
   - Index on rental_legal_case FK

## Security & Validation

### Input Validation
- ✅ Tenant-lease relationship validated (lease must belong to tenant)
- ✅ Required fields enforced
- ✅ Status transitions validated (state machine)
- ✅ Only allowed next statuses shown in dropdown

### Data Integrity
- ✅ Foreign key constraints ensure referenced data exists
- ✅ Unique constraint on case_number
- ✅ Audit fields track all modifications
- ✅ Status history immutable (append-only)

### Audit Trail
- ✅ All status changes logged
- ✅ Previous and new status recorded
- ✅ Reason for change documented
- ✅ User who made change recorded
- ✅ Timestamp of change recorded

## API Documentation

### Endpoints

**List Cases**
```
GET /property/legal-cases/
Query Parameters: tenant, lease, property, unit, case_type, current_status
Search: case_number, court_name
Returns: [{ id, case_number, tenant_name, ... }, ...]
```

**Create Case**
```
POST /property/legal-cases/
Body: {
  tenant: <int>,
  lease: <int>,
  case_type: <string>,
  case_number: <string>,
  filing_date: <date>,
  court_name: <string>,
  remarks: <string>
}
Returns: { id, case_number, current_status, cost_center, ... }
```

**Get Case Detail**
```
GET /property/legal-cases/{id}/
Returns: Full case details including status_history array
```

**Update Case**
```
PATCH /property/legal-cases/{id}/
Body: { court_name: <string>, remarks: <string> }
Returns: Updated case object
```

**Change Status**
```
POST /property/legal-cases/{id}/change_status/
Body: {
  new_status: <string>,
  change_reason: <string>
}
Returns: Updated case with new status_history entry
```

**Get Cases by Tenant**
```
GET /property/legal-cases/by_tenant/{tenant_id}/
Returns: [{ ... case data ... }]
```

**Get Cases by Unit**
```
GET /property/legal-cases/by_unit/{unit_id}/
Returns: [{ ... case data ... }]
```

## Performance Considerations

1. **Database Indexes**
   - Foreign keys indexed for fast lookups
   - Case number indexed for searches
   - Status indexed for filtering

2. **Query Optimization**
   - Nested serializers use select_related for FK fields
   - Status history fetched with case details
   - Filters applied at database level

3. **Caching** (Future Enhancement)
   - Cache list of allowed transitions
   - Cache status choices
   - Cache case data for detail view

## Error Handling

```python
# Invalid status transition
Response: 400 Bad Request
{
  "error": "Cannot transition from 'closed_owner_won' to 'in_progress'"
}

# Tenant-lease mismatch
Response: 400 Bad Request
{
  "error": "Selected lease does not belong to selected tenant"
}

# Case not found
Response: 404 Not Found
{
  "detail": "Not found."
}

# Missing required fields
Response: 400 Bad Request
{
  "case_number": ["This field is required."],
  "filing_date": ["This field is required."]
}
```

## Testing Recommendations

### Unit Tests
- Service method logic (state transitions, unit status mapping)
- Serializer validation
- Model methods

### Integration Tests
- End-to-end workflows (create → change status → close)
- API endpoint functionality
- Database migrations

### Frontend Tests
- Form validation
- Component rendering
- API integration
- Navigation

## Future Enhancements

1. **Advanced Filtering**
   - Date range filters
   - Multiple status filters
   - Case type grouping

2. **Reporting**
   - Case summary reports
   - Status history reports
   - Tenant/property case reports

3. **Notifications**
   - Status change notifications
   - Upcoming deadline alerts
   - Owner notifications

4. **Document Management**
   - Attach case documents
   - Store legal documents
   - Document versioning

5. **Cost Tracking**
   - Legal fee recording
   - Cost center allocation
   - Financial reporting integration

## Conclusion

The Rental Legal Case module provides a complete, production-ready solution for tracking legal proceedings in property management. Its architecture ensures data integrity, maintains comprehensive audit trails, and provides intuitive user interfaces for all case management workflows.
