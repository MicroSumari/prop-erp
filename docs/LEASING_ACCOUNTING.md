# Section 2: Leasing - Accounting & Financial Structure

## Overview
The Leasing module manages all tenant lease agreements, rental income, and associated financial transactions. This section focuses on the accounting treatment of lease-related activities.

## Lease Accounting Structure

### Account Types & Journal Entries

#### **Account: Tenant (Customer) - DEBIT**
- **Account Type**: Asset / Receivable
- **Purpose**: Tracks money owed by tenants
- **When to Use**: 
  - Recording lease agreements
  - Recording rent receivables
  - Tracking tenant balances

**Entry Format:**
```
Dr. Tenant (Receivables)
    Cr. Revenue (Rent Income)
```

**Example:**
```
Monthly rent due from Tenant A: $1,500

Dr. Accounts Receivable - Tenant A    1,500
    Cr. Rent Income                          1,500
```

---

#### **Account: Unearned Revenue - CREDIT**
- **Account Type**: Liability
- **Purpose**: Tracks advance payments received from tenants
- **When to Use**:
  - Recording advance rent payments
  - Recording deposits in advance
  - Recording security deposit credits

**Entry Format:**
```
Dr. Cash/Bank
    Cr. Unearned Revenue
```

**Example:**
```
Tenant B paid 3 months rent in advance: $4,500

Dr. Cash                    4,500
    Cr. Unearned Revenue            4,500

(As rent is earned each month:)
Dr. Unearned Revenue        1,500
    Cr. Rent Income                 1,500
```

---

#### **Account: Refundable Security Deposits - CREDIT**
- **Account Type**: Liability
- **Purpose**: Tracks security deposits held on behalf of tenants
- **When to Use**:
  - Recording initial security deposit received
  - Holding tenant deposits during lease term
  - Tracking refundable amounts

**Entry Format:**
```
Dr. Cash/Bank
    Cr. Refundable Security Deposits
```

**Example:**
```
Tenant C provides security deposit: $2,000

Dr. Cash                              2,000
    Cr. Refundable Security Deposits        2,000

(Upon lease termination with no damages:)
Dr. Refundable Security Deposits      2,000
    Cr. Cash                                2,000
```

---

#### **Account: Other Tenant Charges - CREDIT**
- **Account Type**: Revenue / Liability
- **Purpose**: Tracks additional charges beyond base rent
- **When to Use**:
  - Utility reimbursements
  - Late fees
  - Maintenance charges passed to tenant
  - Pet fees
  - Parking fees
  - Other miscellaneous charges

**Entry Format:**
```
Dr. Cash/Bank or Accounts Receivable
    Cr. Other Tenant Charges (Revenue)
```

**Example:**
```
Tenant D charged $150 for water damage repair (not covered by deposit):

Dr. Accounts Receivable - Tenant D    150
    Cr. Other Tenant Charges              150

(When payment is received:)
Dr. Cash                150
    Cr. Accounts Receivable        150
```

---

## Lease Financial Details Tracked

### Required Information
1. **Lease Number** - Unique identifier
2. **Unit** - Property unit being leased
3. **Tenant** - Related party leasing the unit
4. **Start Date** - Lease commencement date
5. **End Date** - Lease expiration date
6. **Monthly Rent** - Regular monthly payment amount
7. **Security Deposit** - Amount held as security
8. **Status** - Draft, Active, Expired, or Terminated

### Lease Terms & Conditions
- Document lease agreements
- Record special provisions
- Note payment schedules
- Document renewal clauses

---

## Accounting Flow for a Complete Lease Cycle

### 1. Lease Initiation
```
Lease Start: Tenant signs agreement
- Monthly Rent: $1,500
- Security Deposit: $3,000

Dr. Cash                              3,000
    Cr. Refundable Security Deposits        3,000

(Record earned portion as revenue)
Dr. Accounts Receivable              1,500
    Cr. Rent Income                        1,500
```

### 2. Monthly Rent Receipt
```
Tenant pays rent on due date

Dr. Cash                    1,500
    Cr. Accounts Receivable         1,500
```

### 3. Lease Termination (Example - No Damage)
```
Lease ends, security deposit returned

Dr. Refundable Security Deposits     3,000
    Cr. Cash                              3,000
```

### 4. Lease Termination (Example - With Damage)
```
$500 damage found, tenant balance applied to repair

Dr. Refundable Security Deposits     3,000
    Cr. Cash                            2,500
    Cr. Other Tenant Charges              500
```

---

## Integration with System

### Lease → Rent Collection Flow
1. Lease created with monthly rent amount
2. On due date, rent becomes receivable (A/R created)
3. Rent Collection module records payments
4. Income recognized through Rent Income account

### Lease → Accounting Flow
1. Lease details feed financial statements
2. Deposit liability tracked separately
3. Revenue recognized monthly
4. Charges tracked by type (utilities, maintenance, fees)

---

## Key Reports Available

- **Lease Portfolio** - All active leases by property
- **Rent Receivables** - Outstanding rent due
- **Deposit Liabilities** - Security deposits held
- **Tenant Charges** - Additional income by type
- **Lease Expiration Schedule** - Upcoming lease endings
- **Revenue Analysis** - Rent vs. other charges

---

## Best Practices

1. **Always Create Lease Before Rent Collection** - Ensures proper revenue attribution
2. **Separate Revenue Types** - Use appropriate accounts for different income streams
3. **Track Deposits Carefully** - Maintain clear liability distinction
4. **Document Disputes** - Record any deductions from deposits
5. **Regular Reconciliation** - Match lease terms to accounting entries
6. **Timely Recognition** - Record revenue when earned, not when paid

