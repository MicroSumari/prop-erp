# Leasing Module - Quick Reference Guide

## Menu Navigation

### Desktop Sidebar
```
MENU
├── 📊 Dashboard
├── 🏠 Properties
│   ├── 📋 Properties
│   ├── 📦 Property Units
│   └── 👥 Related Parties
├── 📄 LEASING
│   ├── 📋 Leases
│   └── 💵 Rent Collection
├── 🔧 Maintenance
└── 📊 Expenses
```

### Mobile Offcanvas
Same structure, accessible via hamburger menu toggle in header

---

## Lease Form Fields

### Section 1: Lease Information
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Lease Number | Text | ✓ | Unique identifier, e.g., "LEASE-001" |
| Unit | Select/Text | ✓ | Property unit being leased |
| Tenant | Select/Text | ✗ | Related party leasing unit |

### Section 2: Lease Dates
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Start Date | Date | ✓ | Lease commencement date |
| End Date | Date | ✓ | Lease expiration date |

### Section 3: Financial Details
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Monthly Rent | Decimal | ✓ | Regular monthly payment |
| Security Deposit | Decimal | ✓ | Amount held as security |
| Status | Select | ✓ | Draft / Active / Expired / Terminated |

### Section 4: Terms & Conditions
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Terms & Conditions | Textarea | ✗ | Lease terms documentation |

---

## Lease List Table

### Columns Displayed
```
Lease # | Tenant | Unit | Start Date | End Date | Monthly Rent | Security Deposit | Status | Actions
```

### Status Badges
| Status | Color | Meaning |
|--------|-------|---------|
| Draft | Gray | Lease not yet active |
| Active | Green | Current active lease |
| Expired | Red | Lease term has ended |
| Terminated | Yellow | Lease ended prematurely |

### Action Buttons
- **Edit** (Blue) - Opens edit form for the lease
- **View** (Info/Light) - Shows lease details

---

## Routes & URLs

### Lease Routes
```
/leases                    → Lease List (GET all leases)
/leases/new               → Create Lease Form (POST)
/leases/edit/:id          → Edit Lease Form (PUT)
/leases/:id               → Lease Detail View (GET) [Future]
```

### Related Navigation
```
/related-parties          → Related Parties List
/related-parties/new      → Create Related Party
/related-parties/edit/:id → Edit Related Party
```

---

## API Endpoints

### Lease Endpoints
```
GET    /api/property/leases/              List all leases
POST   /api/property/leases/              Create lease
GET    /api/property/leases/{id}/         Get lease details
PUT    /api/property/leases/{id}/         Update lease
PATCH  /api/property/leases/{id}/         Partial update
DELETE /api/property/leases/{id}/         Delete lease
```

### Related Endpoints
```
GET    /api/property/related-parties/     List related parties
POST   /api/property/related-parties/     Create related party
GET    /api/property/units/               List units
GET    /api/property/rent/                List rent payments [Rent Collection]
```

---

## Accounting Journal Entries

### Entry 1: Monthly Rent Recognition
```
When: Monthly, when rent is due
Entry:
  Dr. Accounts Receivable (Tenant)    $X
      Cr. Rent Income (Revenue)           $X
Description: Monthly rent due for [Tenant] at [Unit] for [Month]
```

### Entry 2: Rent Collection
```
When: Payment received from tenant
Entry:
  Dr. Cash/Bank                       $X
      Cr. Accounts Receivable (Tenant)    $X
Description: Rent payment received from [Tenant]
```

### Entry 3: Security Deposit Receipt
```
When: Lease starts, deposit collected
Entry:
  Dr. Cash/Bank                           $X
      Cr. Refundable Security Deposits     $X
Description: Security deposit received from [Tenant] for [Unit]
```

### Entry 4: Security Deposit Return (No Damage)
```
When: Lease ends, deposit refunded
Entry:
  Dr. Refundable Security Deposits    $X
      Cr. Cash/Bank                       $X
Description: Security deposit refunded to [Tenant]
```

### Entry 5: Security Deposit with Deduction (Damage)
```
When: Lease ends, damage deducted
Entry:
  Dr. Refundable Security Deposits    $X
  Cr. Cash/Bank                           $(X-Y)
  Cr. Other Tenant Charges (Revenue)      $Y
Description: Damage charge deducted from [Tenant] deposit
```

### Entry 6: Additional Tenant Charge
```
When: Extra charge applied (utilities, late fee, etc.)
Entry:
  Dr. Accounts Receivable (Tenant)    $X
      Cr. Other Tenant Charges (Revenue)  $X
Description: [Charge Type] for [Unit] - [Reason]
```

---

## Key Formulas

### Lease Duration
```
Lease Duration (days) = End Date - Start Date
```

### Monthly Rent Schedule
```
Total Expected Rent = Monthly Rent × (Lease Duration ÷ 30)
```

### Deposit as % of Rent
```
Deposit % = Security Deposit ÷ (Monthly Rent × 12)
```

### Unearned Revenue Recognition
```
If advance payment received:
  Advance Payment ÷ 12 months = Monthly Recognition
```

---

## Common Workflows

### Workflow 1: New Lease Creation
```
1. Navigate to Leasing → Leases
2. Click "New Lease" button
3. Fill in lease information
4. Enter financial details
5. Add terms and conditions
6. Click "Create Lease"
7. Confirmation: Lease appears in list
```

### Workflow 2: Edit Existing Lease
```
1. Navigate to Leasing → Leases
2. Find lease in table
3. Click "Edit" button
4. Modify desired fields
5. Click "Update" button
6. Confirmation: Changes saved
```

### Workflow 3: Record Rent Payment
```
1. Navigate to Leasing → Rent Collection
2. Identify due lease
3. Click "Record Payment"
4. Enter payment amount
5. Select payment method
6. Click "Record Payment"
7. A/R reduced, Cash increased
```

### Workflow 4: Terminate Lease
```
1. Navigate to Leasing → Leases
2. Click "Edit" on active lease
3. Change Status to "Terminated"
4. Record any damage charges (Other Tenant Charges)
5. Save lease
6. Process security deposit return or deduction
```

### Workflow 5: View Lease Details & History
```
1. Navigate to Leasing → Leases
2. Click "View" button on lease
3. See full lease terms
4. View payment history
5. See any charges or deductions
6. Access edit or terminate options
```

---

## Field Validation Rules

### Lease Number
- ✓ Must be unique
- ✓ Required
- ✓ Max 50 characters
- ✗ No special characters (except hyphen/underscore)

### Dates
- ✓ Must be valid dates
- ✓ End Date must be >= Start Date
- ✓ Format: YYYY-MM-DD
- ✗ Cannot be in past for new drafts

### Financial Values
- ✓ Must be positive numbers
- ✓ Maximum 10 digits before decimal
- ✓ 2 decimal places (cents)
- ✗ Cannot be negative
- ✗ Cannot be zero (optional: allow zero for some fields)

### Status
- ✓ Must be one of: Draft, Active, Expired, Terminated
- ✓ Required field

### Unit & Tenant
- ✓ Unit must reference existing unit
- ✓ Tenant must reference existing related party (if provided)
- ✓ Unit is required
- ✓ Tenant is optional

---

## Error Messages & Solutions

### Error: "Lease number already exists"
**Cause**: Lease number must be unique
**Solution**: Use a different lease number (e.g., LEASE-002)

### Error: "End date must be after start date"
**Cause**: Lease end date is before start date
**Solution**: Select an end date that is after the start date

### Error: "Unit not found"
**Cause**: Unit ID doesn't reference valid unit
**Solution**: Select a valid unit from the Property Units module

### Error: "Invalid monetary value"
**Cause**: Rent or deposit is negative or improperly formatted
**Solution**: Enter positive decimal values (e.g., 1500.00)

### Error: "Monthly rent required"
**Cause**: Monthly rent field is empty
**Solution**: Enter the monthly rent amount

### Error: "Invalid status"
**Cause**: Status value not recognized
**Solution**: Select from: Draft, Active, Expired, or Terminated

---

## Reports & Analytics Available

### Lease Portfolio Report
```
Shows:
- Total active leases
- By property
- By tenant
- Occupancy rate
```

### Rent Revenue Report
```
Shows:
- Expected rent (based on leases)
- Actual rent received
- Outstanding receivables
- By period (monthly, quarterly, yearly)
```

### Lease Expiration Schedule
```
Shows:
- Upcoming lease expirations
- By month/quarter
- Renewal candidates
- Tenant departures
```

### Tenant History
```
Shows:
- Current leases per tenant
- Tenure duration
- Payment history
- Charges/deductions
```

### Financial Summary
```
Shows:
- Total security deposits held (liability)
- A/R from tenants (asset)
- Rental income (revenue)
- Other charges (revenue)
```

---

## Tips & Best Practices

### ✓ Do's
- ✓ Create lease BEFORE recording rent payments
- ✓ Set correct monthly rent amount
- ✓ Document special terms in terms field
- ✓ Update lease status as conditions change
- ✓ Track security deposits separately
- ✓ Review expiring leases monthly
- ✓ Keep lease dates accurate
- ✓ Link tenant to lease immediately

### ✗ Don'ts
- ✗ Don't create duplicate lease numbers
- ✗ Don't set end date before start date
- ✗ Don't use negative numbers
- ✗ Don't forget to update status
- ✗ Don't mix security deposit with other charges
- ✗ Don't record rent before lease exists
- ✗ Don't leave tenant unassigned without reason
- ✗ Don't ignore expiring leases

---

## Keyboard Shortcuts (Future)

```
N    Create new lease
E    Edit selected lease
V    View selected lease
D    Delete selected lease
R    Go to rent collection
T    Go to related parties
Esc  Close current dialog
```

---

## Integration Points

### With Related Parties Module
- Select tenant when creating lease
- View tenant contact in lease details
- Quick link to tenant profile

### With Rent Collection Module
- See which leases are active for rent
- Auto-populate rent amount from lease
- Track payment against lease term

### With Maintenance Module
- Link maintenance to lease unit
- Charge tenant for maintenance (future)
- Track repairs during tenancy

### With Accounting Module (Future)
- Automatic journal entry creation
- GL account mapping
- Financial statement generation
- Revenue recognition automation

---

**Last Updated**: January 30, 2026
**Version**: 1.0
**Status**: Released

