# Screen Implementation Documentation

## Overview
This document describes the business process and system implementation for three critical screens:
1. Receipt Vouchers - Tenant payment collection
2. Lease Renewal - Extending existing leases
3. Lease Termination - Ending leases with accounting

---

## 🔹 Screen 1: Receipt Vouchers

### Business Meaning
**Tenant pays money to the property owner**

### System Meaning
- **Debit:** Cash / Bank / Post-Dated Cheques (Asset increases)
- **Credit:** Tenant (Customer) Account (Liability decreases)

### Business Process

| Field | Description |
|-------|-------------|
| **Receipt Number** | Unique identifier (auto-generated: RV-YYYYMMDD-XXXX) |
| **Tenant** | Select the paying tenant |
| **Payment Date** | When payment was received |
| **Amount** | Payment amount in rupees |
| **Payment Method** | Cash / Bank Transfer / Cheque / Post-Dated Cheque |
| **Bank Name** | (If bank/cheque payment) Name of the bank |
| **Cheque Number** | (If cheque payment) Cheque reference number |
| **Cheque Date** | (If post-dated cheque) When cheque will be presented |
| **Status** | Draft → Submitted → Cleared/Bounced → Cancelled |

### Key Features
1. **Payment Method Handling**
   - Cash: Immediate settlement
   - Bank Transfer: Requires bank details
   - Cheque: Requires cheque number and date
   - Post-Dated Cheque: Future clearing date tracked

2. **Status Workflow**
   - Draft: Initial state, can be edited
   - Submitted: Sent for clearance
   - Cleared: Payment confirmed (bank/cheque)
   - Bounced: Payment failed (cheque)
   - Cancelled: Payment cancelled

3. **Actions**
   - Create new receipt voucher
   - Mark cheque/bank as cleared
   - Mark cheque as bounced
   - Filter by status and payment method
   - View receipt summary and statistics

### Accounting Entries

```
Normal Cash Receipt:
  Debit:  Cash Account        ₹X,XXX
  Credit: Tenant Account      ₹X,XXX

Bank Transfer Receipt:
  Debit:  Bank Account        ₹X,XXX
  Credit: Tenant Account      ₹X,XXX

Cheque Receipt (On Clearing):
  Debit:  Cheque-in-Hand      ₹X,XXX  (initially)
  Credit: Tenant Account      ₹X,XXX
  
  Later when cleared:
  Debit:  Bank Account        ₹X,XXX
  Credit: Cheque-in-Hand      ₹X,XXX
```

---

## 🔹 Screen 2: Lease Renewal

### Business Meaning
**Extend existing lease with new terms**

### System Meaning
- Same lease logic (rent, deposit, tenant)
- Different start/end dates
- Possibly new rent amount
- Code-wise: Reuse Lease Creation logic with modifications

### Business Process

| Phase | Description |
|-------|-------------|
| **Selection** | Select lease to renew |
| **New Terms** | Enter new start date, end date, rent |
| **Approval** | Lease renewal must be approved |
| **Activation** | Create new lease and end old lease |

### Workflow Steps

1. **Create Renewal**
   - Select lease to renew
   - Display current lease terms (read-only)
   - Enter new dates and rent
   - Optionally update security deposit
   - Add terms & conditions
   - Save as "Draft"

2. **Approve**
   - Move from Draft to Approved
   - Set approval date

3. **Activate**
   - Create new Lease with renewed terms
   - Mark old lease as "Expired"
   - Update renewal status to "Active"
   - Update unit availability if needed

### Key Features

1. **Data Display**
   - Show current lease details in read-only format
   - Calculate lease duration
   - Compare old vs new rent

2. **Validations**
   - New end date > New start date
   - New monthly rent > 0
   - Mandatory fields validation

3. **Status Workflow**
   - Draft → Pending Approval → Approved → Active
   - Rejection option available

4. **Automatic Actions on Activation**
   - Create new lease with renewed terms
   - End original lease
   - Update audit trail

### Accounting Entries

```
When Renewal is Activated (if rent changes):
  For Advance Rent Collection (if applicable):
  Debit:  Tenant Account              ₹New Rent
  Credit: Rent Received               ₹New Rent
```

---

## 🔹 Screen 3: Lease Termination

### Business Meaning
**End lease agreement and settle accounts with tenant**

### System Meaning
**Two behaviors, one screen:**

#### Normal Termination
```
Debit:  Refundable Security Deposit  ₹X,XXX
Credit: Maintenance Charges          ₹X,XXX
Credit: Tenant Account               ₹Net Refund
```

#### Early Termination
```
Debit:  Unearned Revenue             ₹X,XXX (rent not yet earned)
Debit:  Refundable Security Deposit  ₹X,XXX
Credit: Early Termination Penalties  ₹X,XXX
Credit: Maintenance Charges          ₹X,XXX
Credit: Post-Dated Cheques (adjust)  ₹X,XXX
Credit: Tenant Account               ₹Net Amount
```

### Business Process

#### Normal Termination

| Step | Action |
|------|--------|
| 1. Select lease | Choose lease to terminate at end date |
| 2. Refund calculation | Security deposit - Maintenance charges = Net refund |
| 3. Documentation | Record exit condition, damages, repairs needed |
| 4. Approval | Manager approves termination |
| 5. Completion | Process refund, close lease, update tenant record |

#### Early Termination

| Step | Action |
|------|--------|
| 1. Select lease | Choose lease to terminate before end date |
| 2. Calculate unearned rent | Days remaining × (Monthly Rent / 30) |
| 3. Apply penalties | Early termination penalty charges |
| 4. Manage cheques | Cancel/adjust post-dated cheques |
| 5. Final settlement | Refund - Penalties - Maintenance = Net amount |
| 6. Approval & Completion | Same as normal |

### Key Features

1. **Termination Type Selection**
   - Normal: Charge maintenance, refund security
   - Early: Charge penalties, reverse unearned rent

2. **Financial Details**
   - Original security deposit (read-only from lease)
   - Refundable amount (editable)
   - Maintenance charges (for both types)
   - Unearned rent (early termination only)
   - Early termination penalty (early termination only)

3. **Post-Dated Cheque Management** (Early Termination)
   - Checkbox to mark cheques as adjusted/cancelled
   - Notes field for cheque adjustment details

4. **Documentation**
   - Exit notes: Tenant exit condition, damage report, repairs needed
   - Terms & conditions
   - General notes

5. **Status Workflow**
   ```
   Draft → Pending Approval → Approved → Completed
   ```

6. **Net Refund Calculation**
   - Normal: Refundable - Maintenance
   - Early: (Refundable + Unearned) - (Penalties + Maintenance)

7. **Automatic Actions on Completion**
   - Update lease status to "Terminated"
   - Update tenant move-out date
   - Create accounting entries
   - Close termination record

### Validations
- Termination date validation
- Refundable amount cannot be negative
- Charges cannot be negative
- Financial fields mandatory

### Helper Endpoint
- `POST /api/property/lease-terminations/create_early_termination/`
  - Auto-calculates unearned rent based on lease dates
  - Initializes termination form

---

## 🛠️ Implementation Details

### Backend Models

#### ReceiptVoucher (Sales App)
```python
- receipt_number: CharField (unique)
- tenant: ForeignKey(Tenant)
- payment_date: DateField
- amount: DecimalField
- payment_method: CharField (choices: cash, bank, cheque, post_dated_cheque)
- bank_name: CharField (optional)
- cheque_number: CharField (optional)
- cheque_date: DateField (optional)
- status: CharField (choices: draft, submitted, cleared, bounced, cancelled)
- cleared_date: DateField (optional)
- description: TextField
- notes: TextField
- created_at, updated_at: DateTimeField
```

#### LeaseRenewal (Property App)
```python
- renewal_number: CharField (unique)
- original_lease: ForeignKey(Lease)
- original_start_date, original_end_date: DateField
- original_monthly_rent: DecimalField
- new_start_date, new_end_date: DateField
- new_monthly_rent: DecimalField
- new_security_deposit: DecimalField (optional)
- status: CharField (draft, pending_approval, approved, active, rejected, cancelled)
- renewal_date, approval_date, activation_date: DateField
- terms_conditions: TextField
- notes: TextField
- created_by: CharField
- created_at, updated_at: DateTimeField
```

#### LeaseTermination (Property App)
```python
- termination_number: CharField (unique)
- lease: ForeignKey(Lease)
- termination_type: CharField (normal, early)
- termination_date: DateField
- status: CharField (draft, pending_approval, approved, completed, rejected, cancelled)
- original_security_deposit: DecimalField
- refundable_amount: DecimalField
- unearned_rent: DecimalField (early only)
- early_termination_penalty: DecimalField (early only)
- maintenance_charges: DecimalField
- post_dated_cheques_adjusted: BooleanField
- post_dated_cheques_notes: TextField
- net_refund: DecimalField (calculated)
- exit_notes, terms_conditions, notes: TextField
- approval_date, completion_date: DateField
- created_by: CharField
- created_at, updated_at: DateTimeField
```

### API Endpoints

#### Receipt Vouchers
```
POST   /api/sales/receipt-vouchers/              - Create voucher
GET    /api/sales/receipt-vouchers/              - List all
GET    /api/sales/receipt-vouchers/{id}/         - Get detail
PUT    /api/sales/receipt-vouchers/{id}/         - Update
POST   /api/sales/receipt-vouchers/{id}/mark_cleared/  - Mark cleared
POST   /api/sales/receipt-vouchers/{id}/mark_bounced/  - Mark bounced
GET    /api/sales/receipt-vouchers/by_tenant/?tenant_id=X  - By tenant
GET    /api/sales/receipt-vouchers/summary/      - Statistics
```

#### Lease Renewals
```
POST   /api/property/lease-renewals/             - Create renewal
GET    /api/property/lease-renewals/             - List all
GET    /api/property/lease-renewals/{id}/        - Get detail
PUT    /api/property/lease-renewals/{id}/        - Update
POST   /api/property/lease-renewals/{id}/approve/    - Approve
POST   /api/property/lease-renewals/{id}/activate/   - Activate
POST   /api/property/lease-renewals/{id}/reject/     - Reject
```

#### Lease Terminations
```
POST   /api/property/lease-terminations/         - Create termination
GET    /api/property/lease-terminations/         - List all
GET    /api/property/lease-terminations/{id}/    - Get detail
PUT    /api/property/lease-terminations/{id}/    - Update
POST   /api/property/lease-terminations/{id}/approve/  - Approve
POST   /api/property/lease-terminations/{id}/complete/ - Complete
POST   /api/property/lease-terminations/create_early_termination/  - Auto-create
```

### Frontend Components

#### ReceiptVoucher.js
- Form with tenant selection
- Dynamic fields based on payment method
- Status filter and display
- Actions: Mark cleared, Mark bounced
- Table view with all receipts

#### LeaseRenewal.js
- Lease selection with current terms display
- New terms input form
- Status workflow (Draft → Approve → Activate)
- Renewal list with status badge
- Date validation

#### LeaseTermination.js
- Lease selection
- Termination type selection (Normal/Early)
- Conditional fields based on type
- Early termination specific fields
- Financial summary
- Exit documentation fields
- Status workflow (Draft → Approve → Complete)

---

## 📋 Testing Checklist

### Receipt Vouchers
- [ ] Create cash receipt
- [ ] Create bank transfer receipt
- [ ] Create cheque receipt
- [ ] Create post-dated cheque receipt
- [ ] Mark cheque as cleared
- [ ] Mark cheque as bounced
- [ ] Filter by payment method
- [ ] Filter by status
- [ ] Validate required fields
- [ ] View receipt summary

### Lease Renewal
- [ ] Create renewal from active lease
- [ ] Display current lease terms
- [ ] Validate new dates (end > start)
- [ ] Approve renewal
- [ ] Activate renewal (creates new lease)
- [ ] Old lease marked as expired
- [ ] Filter by status
- [ ] Reject renewal

### Lease Termination
- [ ] Create normal termination
- [ ] Create early termination
- [ ] Auto-calculate unearned rent (early)
- [ ] Apply maintenance charges (normal)
- [ ] Apply penalties (early)
- [ ] Manage post-dated cheques (early)
- [ ] Calculate net refund correctly
- [ ] Approve termination
- [ ] Complete termination (closes lease)
- [ ] Validate financial fields
- [ ] Filter by type and status

---

## 🔐 Security Considerations

1. **Authorization**: Ensure only authorized users can:
   - Approve/Activate/Complete transactions
   - Modify amounts and charges
   - Mark receipts as cleared/bounced

2. **Audit Trail**: All operations logged with:
   - User who created/modified
   - Timestamp
   - Changes made

3. **Data Validation**: 
   - Server-side validation for all inputs
   - Amount validations (non-negative)
   - Date validations (logical ordering)

4. **Integrity**:
   - Cannot delete completed transactions
   - Cannot modify completed terminations
   - Cheque status changes tracked

---

## 📝 Future Enhancements

1. **Receipt Vouchers**
   - Bulk upload for bank statements
   - Automatic reconciliation
   - Receipt generation and printing
   - Email receipts to tenants

2. **Lease Renewal**
   - Automated renewal reminders
   - Document generation (renewal agreement)
   - Tenant notification workflow
   - Payment plan adjustments

3. **Lease Termination**
   - Damage assessment form
   - Inventory check-out
   - Utility meter readings
   - Integrated refund processing
   - Legal document generation
   - Timeline tracking (30-day notice, etc.)

---

## 📚 Related Screens

- **Tenant Management**: View/Edit tenant information
- **Lease Management**: View/Create/Edit leases
- **Rent Payments**: Track monthly rent
- **Maintenance**: Maintenance charges for lease termination
- **Reports**: Financial reports, tenant statements
