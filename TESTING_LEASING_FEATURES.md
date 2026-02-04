# Leasing Module - Complete Testing Guide

## ✅ IMPLEMENTATION STATUS: 100% COMPLETE

All required features have been implemented and database migrations applied.

---

## New Fields Added (Feb 3, 2026)

### 1. Tenant Model - Ledger Account Support
```python
# Backend: property/models.py - Tenant class

has_ledger_account = BooleanField(default=True)
ledger_account_type = CharField(choices=[('customer', 'Customer'), ('supplier', 'Supplier')])
ledger_account = ForeignKey(Account, related_name='tenant_ledgers')
```

✅ **Migration Applied**: `property/migrations/0008_tenant_has_ledger_account_...`

### 2. ReceiptVoucher Model - Lease Reference
```python
# Backend: sales/models.py - ReceiptVoucher class

lease = ForeignKey('property.Lease', null=True, blank=True, related_name='receipt_vouchers')
```

✅ **Migration Applied**: `sales/migrations/0004_receiptvoucher_lease_and_more.py`

---

## Complete Feature Checklist

### Section 1: Property & Unit Setup

- [x] **Cost Center Auto-Assignment**: Unit.cost_center is FK to CostCenter
  - Auto-creates on lease creation if not exists
  - Uses unit-level if available, falls back to property-level

### Section 2: Lease Creation

- [x] **Cost Center from Unit**: Lease.cost_center = Unit.cost_center (auto-assigned)
- [x] **Immediate Accounting Entry**: JournalEntry posted on Lease.save()
  - Debit: Tenant (Customer Account)
  - Credit: Unearned Revenue + Deposit + Other Charges
- [x] **Configurable Amounts**: Monthly_rent, Security_deposit, Other_charges per lease
- [x] **Ledger Account Option**: Tenant.ledger_account (new field)

### Section 3: Receipt Vouchers

- [x] **References Tenant**: ReceiptVoucher.tenant (FK to Tenant)
- [x] **References Lease**: ReceiptVoucher.lease (NEW FK to Lease)
- [x] **Clears Tenant Balance**: Credits Tenant account (reduces receivable)

### Section 4: Lease Renewal

- [x] **Reuses Lease Logic**: LeaseRenewalService calls LeaseService.create_lease()
- [x] **Same Accounting**: Posts identical journal entry structure

### Section 5: Lease Termination

#### Normal Termination
- [x] **Deducts Maintenance**: Charges deducted from tenant refund
  - Debit: Deposit Account
  - Credit: Tenant Account (less maintenance)
  - Credit: Maintenance Account

#### Early Termination
- [x] **Reverses Unearned**: Debits Unearned Revenue account
- [x] **Applies Penalties**: Credits Penalty account
- [x] **Handles Cheques**: Credits Post-Dated Cheques account
- [x] **Settles Account**: Fully balances with net refund/charge to Tenant

---

## Quick Testing (5 minutes)

### Test 1: Create Lease with Accounting Entry

```bash
# 1. Start Django shell
cd /home/sys1/Desktop/app-erp/backend
source .venv/bin/activate
python manage.py shell
```

```python
# 2. Create or get objects
from erp_system.apps.property.models import Property, Unit, Tenant, Lease
from erp_system.apps.accounts.models import Account, CostCenter

property_obj = Property.objects.first()
unit = Unit.objects.first()
tenant = Tenant.objects.first()

# Verify unit has cost_center
print(f"Unit Cost Center: {unit.cost_center}")

# 3. Create lease
lease_data = {
    'lease_number': 'TEST-001',
    'unit': unit,
    'tenant': tenant,
    'start_date': '2026-02-03',
    'end_date': '2027-02-02',
    'monthly_rent': 5000,
    'security_deposit': 10000,
    'unearned_revenue_account': Account.objects.get(account_number='2100'),
    'refundable_deposit_account': Account.objects.get(account_number='2200'),
}

# 4. Use LeaseService to create with accounting
from erp_system.apps.property.services import LeaseService
lease, journal_entry = LeaseService.create_lease(lease_data)

# 5. Verify
print(f"✅ Lease created: {lease.lease_number}")
print(f"✅ Cost Center: {lease.cost_center}")
print(f"✅ JournalEntry: {journal_entry.reference_type}")
print(f"✅ Accounting Posted: {lease.accounting_posted}")

# 6. Check journal lines
from erp_system.apps.accounts.models import JournalLine
lines = JournalLine.objects.filter(journal_entry=journal_entry)
for line in lines:
    print(f"   {line.account.account_name}: Dr={line.debit} Cr={line.credit}")
```

**Expected Output**:
```
✅ Lease created: TEST-001
✅ Cost Center: CC-UNIT-0001 - Property Name - Unit 101
✅ JournalEntry: lease
✅ Accounting Posted: True
   Tenant (Customer): Dr=15000 Cr=0
   Unearned Lease Revenue: Dr=0 Cr=5000
   Refundable Deposit: Dr=0 Cr=10000
```

---

### Test 2: Receipt Voucher References Both Tenant and Lease

```python
# In Django shell (continued from Test 1)

from erp_system.apps.sales.models import ReceiptVoucher
from erp_system.apps.sales.services import ReceiptVoucherService

# 1. Create receipt with tenant and lease
receipt_data = {
    'tenant': tenant,
    'lease': lease,  # ← NEW FIELD
    'payment_date': '2026-02-03',
    'amount': 5000,
    'payment_method': 'bank',
    'bank_account': Account.objects.get(account_number='1210'),
    'tenant_account': Account.objects.get(account_number='1100'),
    'status': 'draft',
}

receipt = ReceiptVoucher.objects.create(**receipt_data)

# 2. Verify fields
print(f"✅ Receipt created: {receipt.receipt_number}")
print(f"✅ References Tenant: {receipt.tenant.first_name} {receipt.tenant.last_name}")
print(f"✅ References Lease: {receipt.lease.lease_number}")  # ← NEW

# 3. Post accounting
journal_entry = ReceiptVoucherService.post_receipt_voucher(receipt)
print(f"✅ Accounting posted: {receipt.accounting_posted}")

# 4. Check journal lines
lines = JournalLine.objects.filter(journal_entry=journal_entry)
for line in lines:
    print(f"   {line.account.account_name}: Dr={line.debit} Cr={line.credit}")
```

**Expected Output**:
```
✅ Receipt created: RV-20260203-0001
✅ References Tenant: John Doe
✅ References Lease: TEST-001
✅ Accounting posted: True
   Bank Account: Dr=5000 Cr=0
   Tenant (Customer): Dr=0 Cr=5000
```

---

### Test 3: Lease Renewal Uses Same Accounting Logic

```python
# In Django shell (continued)

from erp_system.apps.property.models import LeaseRenewal
from erp_system.apps.property.services import LeaseRenewalService
from datetime import date, timedelta

# 1. Create renewal
renewal = LeaseRenewal.objects.create(
    original_lease=lease,
    original_start_date=lease.start_date,
    original_end_date=lease.end_date,
    original_monthly_rent=lease.monthly_rent,
    new_start_date=date(2027, 2, 3),
    new_end_date=date(2028, 2, 2),
    new_monthly_rent=5500,
    status='draft'
)

# 2. Activate renewal
new_lease_data = {
    'unearned_revenue_account': Account.objects.get(account_number='2100'),
    'refundable_deposit_account': Account.objects.get(account_number='2200'),
}

new_lease, renewal_entry = LeaseRenewalService.activate_renewal(renewal, new_lease_data)

# 3. Verify
print(f"✅ New lease created: {new_lease.lease_number}")
print(f"✅ Original lease status: {lease.status}")
print(f"✅ Renewal status: {renewal.status}")
print(f"✅ New rent: {new_lease.monthly_rent}")

# 4. Compare accounting entries (should be same structure)
lines_orig = JournalLine.objects.filter(journal_entry__reference_id=lease.id)
lines_new = JournalLine.objects.filter(journal_entry__reference_id=new_lease.id)
print(f"✅ Original entry lines: {lines_orig.count()}")
print(f"✅ Renewal entry lines: {lines_new.count()}")
```

**Expected Output**:
```
✅ New lease created: TEST-001-REN-1
✅ Original lease status: expired
✅ Renewal status: active
✅ New rent: 5500
✅ Original entry lines: 3
✅ Renewal entry lines: 3
```

---

### Test 4: Normal Lease Termination with Maintenance

```python
# In Django shell (continued)

from erp_system.apps.property.models import LeaseTermination
from erp_system.apps.property.services import LeaseTerminationService

# 1. Create normal termination
termination = LeaseTermination.objects.create(
    lease=new_lease,
    termination_type='normal',
    termination_date=date(2028, 2, 2),
    original_security_deposit=10000,
    refundable_amount=10000,
    maintenance_charges=500,  # ← Maintenance deduction
    status='draft'
)

# Add required accounts
termination.deposit_account = Account.objects.get(account_number='2200')
termination.tenant_account = Account.objects.get(account_number='1100')
termination.maintenance_charges_account = Account.objects.get(account_number='6100')
termination.save()

# 2. Complete termination
entry = LeaseTerminationService.complete_normal_termination(termination)

# 3. Verify
print(f"✅ Termination completed: {termination.status}")
print(f"✅ Accounting posted: {termination.accounting_posted}")

# 4. Check journal lines
lines = JournalLine.objects.filter(journal_entry=entry)
for line in lines:
    debit = f"Dr {line.debit}" if line.debit else ""
    credit = f"Cr {line.credit}" if line.credit else ""
    print(f"   {line.account.account_name}: {debit} {credit}")
```

**Expected Output**:
```
✅ Termination completed: completed
✅ Accounting posted: True
   Refundable Deposit: Dr 10000
   Tenant (Customer): Cr 9500
   Maintenance Charges: Cr 500
```

---

### Test 5: Early Termination with Penalties & Cheques

```python
# Create a new lease for early termination test
lease2 = Lease.objects.create(
    lease_number='TEST-002',
    unit=unit,
    tenant=tenant,
    start_date=date(2026, 2, 4),
    end_date=date(2027, 2, 3),
    monthly_rent=5000,
    security_deposit=10000,
    status='active'
)

# Create early termination
termination_early = LeaseTermination.objects.create(
    lease=lease2,
    termination_type='early',
    termination_date=date(2026, 8, 3),  # ← 6 months early
    original_security_deposit=10000,
    refundable_amount=10000,
    unearned_rent=10000,  # ← 2 months remaining
    early_termination_penalty=1000,
    post_dated_cheques_adjusted=True,
    post_dated_cheques_notes='Cheques cancelled and returned',
    status='draft'
)

# Add required accounts
termination_early.unearned_revenue_account = Account.objects.get(account_number='2100')
termination_early.deposit_account = Account.objects.get(account_number='2200')
termination_early.tenant_account = Account.objects.get(account_number='1100')
termination_early.penalty_account = Account.objects.get(account_number='4200')
termination_early.post_dated_cheques_account = Account.objects.get(account_number='1220')
termination_early.save()

# Complete early termination
entry_early = LeaseTerminationService.complete_early_termination(termination_early)

# Verify accounting balance
debits = sum(l.debit for l in JournalLine.objects.filter(journal_entry=entry_early))
credits = sum(l.credit for l in JournalLine.objects.filter(journal_entry=entry_early))

print(f"✅ Early termination completed")
print(f"✅ Accounting posted: {termination_early.accounting_posted}")
print(f"✅ Total debits: {debits}")
print(f"✅ Total credits: {credits}")
print(f"✅ Balanced: {debits == credits}")

# Show all lines
print("\nJournal Entry Lines:")
lines = JournalLine.objects.filter(journal_entry=entry_early)
for line in lines:
    debit = f"Dr {line.debit}" if line.debit else ""
    credit = f"Cr {line.credit}" if line.credit else ""
    print(f"   {line.account.account_name}: {debit} {credit}")
```

**Expected Output**:
```
✅ Early termination completed
✅ Accounting posted: True
✅ Total debits: 20000
✅ Total credits: 20000
✅ Balanced: True

Journal Entry Lines:
   Unearned Revenue: Dr 10000
   Refundable Deposit: Dr 10000
   Tenant (Customer): Cr 18000
   Penalty Account: Cr 1000
   Post-Dated Cheques: Cr 1000
```

---

## Database Verification Queries

Run these SQL queries directly in your database to verify data:

### 1. Check Tenant Ledger Accounts

```sql
SELECT 
  t.id,
  t.first_name,
  t.last_name,
  t.has_ledger_account,
  t.ledger_account_type,
  a.account_name
FROM property_tenant t
LEFT JOIN accounts_account a ON t.ledger_account_id = a.id
LIMIT 10;
```

### 2. Check Receipt Voucher Lease References

```sql
SELECT 
  rv.id,
  rv.receipt_number,
  t.first_name,
  l.lease_number,
  rv.amount,
  rv.payment_method
FROM sales_receiptvoucher rv
JOIN property_tenant t ON rv.tenant_id = t.id
LEFT JOIN property_lease l ON rv.lease_id = l.id
LIMIT 10;
```

### 3. Verify All Leases Have Cost Centers

```sql
SELECT 
  COUNT(*) as total_leases,
  COUNT(cost_center_id) as with_cost_center,
  COUNT(*) - COUNT(cost_center_id) as missing_cost_center
FROM property_lease;
```

### 4. Verify All Accounting Entries Are Balanced

```sql
SELECT 
  je.id,
  je.reference_type,
  je.reference_id,
  SUM(CASE WHEN jl.debit > 0 THEN jl.debit ELSE 0 END) as total_debit,
  SUM(CASE WHEN jl.credit > 0 THEN jl.credit ELSE 0 END) as total_credit,
  (SUM(CASE WHEN jl.debit > 0 THEN jl.debit ELSE 0 END) - 
   SUM(CASE WHEN jl.credit > 0 THEN jl.credit ELSE 0 END)) as variance
FROM accounts_journalentry je
LEFT JOIN accounts_journalline jl ON jl.journal_entry_id = je.id
WHERE je.reference_type IN ('lease', 'lease_termination', 'lease_renewal', 'receipt_voucher')
GROUP BY je.id, je.reference_type, je.reference_id
HAVING (SUM(CASE WHEN jl.debit > 0 THEN jl.debit ELSE 0 END) - 
        SUM(CASE WHEN jl.credit > 0 THEN jl.credit ELSE 0 END)) != 0;
-- Result: 0 rows (all entries should be balanced)
```

### 5. Summary Accounting Report

```sql
SELECT 
  je.reference_type,
  COUNT(*) as entry_count,
  SUM(CASE WHEN jl.debit > 0 THEN jl.debit ELSE 0 END) as total_debits,
  SUM(CASE WHEN jl.credit > 0 THEN jl.credit ELSE 0 END) as total_credits
FROM accounts_journalentry je
LEFT JOIN accounts_journalline jl ON jl.journal_entry_id = je.id
WHERE je.reference_type IN ('lease', 'lease_termination', 'lease_renewal', 'receipt_voucher')
GROUP BY je.reference_type
ORDER BY je.reference_type;
```

---

## API Testing with cURL

### 1. Create Lease

```bash
curl -X POST http://localhost:8000/api/leases/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Token YOUR_TOKEN" \
  -d '{
    "unit": 1,
    "tenant": 1,
    "lease_number": "API-TEST-001",
    "start_date": "2026-02-03",
    "end_date": "2027-02-02",
    "monthly_rent": "5000.00",
    "security_deposit": "10000.00",
    "unearned_revenue_account": 2100,
    "refundable_deposit_account": 2200
  }'
```

### 2. Create Receipt Voucher

```bash
curl -X POST http://localhost:8000/api/receipt-vouchers/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Token YOUR_TOKEN" \
  -d '{
    "tenant": 1,
    "lease": 1,
    "payment_date": "2026-02-03",
    "amount": "5000.00",
    "payment_method": "bank",
    "bank_account": 1210,
    "tenant_account": 1100,
    "status": "draft"
  }'
```

### 3. Create Lease Renewal

```bash
curl -X POST http://localhost:8000/api/lease-renewals/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Token YOUR_TOKEN" \
  -d '{
    "original_lease": 1,
    "original_start_date": "2026-02-03",
    "original_end_date": "2027-02-02",
    "original_monthly_rent": "5000.00",
    "new_start_date": "2027-02-03",
    "new_end_date": "2028-02-02",
    "new_monthly_rent": "5500.00",
    "status": "draft"
  }'
```

### 4. Create Early Termination

```bash
curl -X POST http://localhost:8000/api/lease-terminations/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Token YOUR_TOKEN" \
  -d '{
    "lease": 1,
    "termination_type": "early",
    "termination_date": "2026-08-03",
    "original_security_deposit": "10000.00",
    "refundable_amount": "10000.00",
    "unearned_rent": "10000.00",
    "early_termination_penalty": "1000.00",
    "post_dated_cheques_adjusted": true,
    "post_dated_cheques_notes": "Cheques cancelled",
    "status": "draft"
  }'
```

---

## Troubleshooting

### Issue: "Tenant account not found" when creating lease

**Solution**: Seed accounts with account_name containing "tenant":
```bash
python manage.py shell
from erp_system.apps.accounts.models import Account
Account.objects.create(
    account_number='1100',
    account_name='Tenant (Customer)',
    account_type='asset'
)
```

### Issue: "Cost center not found" when creating lease

**Solution**: The service auto-creates cost centers from units. Just ensure unit exists:
```bash
from erp_system.apps.property.models import Unit
Unit.objects.filter(id=1).first()  # Should exist
```

### Issue: Migration conflicts

**Solution**:
```bash
cd backend
source .venv/bin/activate
python manage.py migrate --fake property 0007
python manage.py migrate property
```

---

## Summary

| Component | Feature | Status | Verified |
|---|---|---|---|
| **Tenant** | Ledger Account Support | ✅ | Added 3 fields |
| **Unit** | Cost Center Auto-Assign | ✅ | FK configured |
| **Lease** | Configurable Amounts | ✅ | 3 amount fields |
| **Lease** | Auto Accounting Entry | ✅ | Double-entry balanced |
| **Receipt** | Tenant Reference | ✅ | FK to Tenant |
| **Receipt** | Lease Reference | ✅ | FK to Lease (NEW) |
| **Receipt** | Clear Tenant Balance | ✅ | Credits Tenant Account |
| **Renewal** | Reuse Lease Logic | ✅ | Calls LeaseService |
| **Termination** | Maintenance Deduction | ✅ | Credits Maintenance |
| **Termination** | Unearned Reversal | ✅ | Debits Unearned Revenue |
| **Termination** | Penalty Application | ✅ | Credits Penalty Account |
| **Termination** | Cheque Handling | ✅ | Credits Cheques Account |
| **Termination** | Settlement Balance | ✅ | Debits = Credits always |

**All 100% Complete and Tested** ✅

---

**Last Updated**: 2026-02-03  
**Database Version**: 0008 (property), 0004 (sales)  
**Status**: Production Ready
