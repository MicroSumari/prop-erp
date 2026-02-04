# Rental Legal Case Module - Quick Start Guide

## Access the Module

1. **From Dashboard:** Click "Leasing" → "Legal Cases" in the sidebar
2. **Direct URL:** http://localhost:3000/legal-cases

## Main Screens

### 1. Legal Cases List
**URL:** `/legal-cases`

**What You See:**
- Table of all legal cases in the system
- Columns: Case Number, Tenant, Property, Unit, Case Type, Filing Date, Status, Court

**Actions Available:**
- **View Details:** Click eye icon to see full case information and status history
- **Change Status:** Click "Change Status" button (only appears if status can be changed)
- **Create New:** Click "Create Legal Case" button at top right

**Color Coding:**
- Case Types: Red (Eviction), Orange (Non-Payment), Blue (Damage), Gray (Other)
- Status: Blue (Filed), Orange (In Progress), Light Blue (Judgment), Green (Closed-Won), Red (Closed-Lost)

---

### 2. Create Legal Case Form
**URL:** `/legal-cases/new`

**Step-by-Step:**

1. **Select Tenant** (Required)
   - Dropdown loads list of all tenants from the system
   - This also filters available leases

2. **Select Lease** (Required)
   - Dropdown shows only leases for the selected tenant
   - Automatically populates property and unit fields

3. **Property & Unit** (Auto-filled, Read-only)
   - Automatically filled from the selected lease
   - These cannot be edited in the form

4. **Case Type** (Required)
   - Options: Eviction, Non-Payment, Damage, Other
   - Select the type of legal case

5. **Case Number** (Required)
   - Unique identifier for the case
   - Example: "CASE-2024-001" or "LGL-2024-0123"

6. **Filing Date** (Required)
   - Date when the case was filed
   - Click calendar icon to select date

7. **Court Name** (Optional)
   - Name of the court handling the case
   - Example: "District Court - Civil Division"

8. **Remarks** (Optional)
   - Additional notes about the case
   - Can include case summary, notes, etc.

9. **Submit**
   - Click "Create Legal Case" button
   - Success message appears
   - Redirected to case details page

**Auto-Actions on Creation:**
- ✅ Cost center is automatically assigned from the unit
- ✅ Unit status changes to "Under Legal Case"
- ✅ Initial case status set to "Filed"
- ✅ Status history entry created

---

### 3. Case Details & Status Timeline
**URL:** `/legal-cases/:id`

**Information Displayed:**

**Left Column:**
- Case Number
- Tenant Name
- Lease Number
- Property Name
- Unit Number

**Right Column:**
- Case Type (colored badge)
- Current Status (colored badge)
- Filing Date
- Court Name
- Cost Center (for accounting reference)

**Remarks Section:**
- Full text of any remarks for the case

**Action Buttons:**
- **Edit:** Modify court name or remarks (non-status fields)
- **Change Status:** Update case status (if allowed)

**Status History Timeline:**
- Chronological list of all status changes
- Shows: Date/Time, From → To status, Reason, Changed By user
- Visual timeline with connecting lines

---

## Status Management

### Valid Status Transitions

```
FILED
  ↓ (can only go to)
IN_PROGRESS
  ↓ (can go to)
JUDGMENT_PASSED
  ↓ (can go to)
CLOSED - TENANT WON
    OR
CLOSED - OWNER WON
```

**Closed statuses are final** - no further transitions possible.

### Changing Status

1. Click "Change Status" button on case list or detail page
2. Select new status from dropdown (shows only allowed options)
3. Enter reason for change (required)
   - Example: "Court issued judgment in favor of tenant"
   - This reason is logged in the audit trail
4. Click "Update Status"
5. Status updates immediately, history entry created

### Unit Status Auto-Updates

When case status changes, unit status automatically updates:

| Case Status | Unit Status |
|---|---|
| Filed | Under Legal Case |
| In Progress | Under Legal Case |
| Judgment Passed | Blocked |
| Closed - Tenant Won | Occupied |
| Closed - Owner Won | Vacant |

---

## Filtering & Searching (Future Enhancement)

*Currently available in list view:*
- Filter by status (shows all statuses)
- Filter by case type (shows all types)
- Search by case number or court name

---

## Common Workflows

### Workflow 1: Eviction Process
1. **Create Case**
   - Case Type: Eviction
   - Filing Date: Today
   - Status: Filed

2. **Case Preparation**
   - Change Status → In Progress
   - Reason: "Case preparation underway"
   - Unit Status: Under Legal Case

3. **Court Judgment**
   - Change Status → Judgment Passed
   - Reason: "Court has issued judgment"
   - Unit Status: Blocked

4. **Tenant Removal**
   - Change Status → Closed - Owner Won
   - Reason: "Judgment executed, tenant vacated"
   - Unit Status: Vacant

### Workflow 2: Non-Payment Recovery
1. **Create Case**
   - Case Type: Non-Payment
   - Filing Date: Date of filing
   - Remarks: "Tenant owed 3 months rent"

2. **Legal Process**
   - Change Status → In Progress
   - Unit Status: Under Legal Case

3. **Settlement or Judgment**
   - If payment received: Closed - Tenant Won (payment accepted)
   - Unit Status: Occupied (continues with tenant)
   - OR
   - If judgment: Closed - Owner Won (eviction proceeds)
   - Unit Status: Vacant

---

## Important Notes

### Data You Cannot Edit After Creation
- Case Number
- Tenant
- Lease
- Property
- Unit
- Case Type
- Filing Date

These are core case identifiers and changing them would break the case history.

### What You Can Edit
- Court Name
- Remarks

Click "Edit" button on detail page to modify these fields.

### Audit Trail
- Every change is logged
- View complete history on case detail page
- See who made changes and when
- This is important for legal compliance

### Cost Center
- Automatically assigned from the unit
- Used for financial tracking
- Cannot be changed (assigned automatically)
- Appears in case details for accounting reference

---

## Troubleshooting

**Problem: Can't find Create Legal Case button**
- You might be on the detail page
- Go to `/legal-cases` (list page)
- Button is at top right

**Problem: Lease dropdown is empty**
- Ensure you've selected a tenant first
- Only leases for that tenant will appear
- Check if tenant has any active leases

**Problem: Change Status button not showing**
- Case might be in a closed status (final state)
- Closed cases cannot be changed
- Check the current status (should show colored badge)

**Problem: Status change was rejected**
- Invalid transition attempted
- Each status has specific allowed next statuses
- Check the valid transitions chart above
- Contact system administrator if unexpected

---

## Tips & Best Practices

1. **Case Number Format:** Use consistent format
   - Example: "LEG-2024-0001" or "CASE-20240115"
   - Makes searching easier

2. **Court Name:** Always include district/division if applicable
   - Example: "District Court - Civil Division"
   - Helps with case organization

3. **Remarks:** Use for case summary
   - What the case is about
   - Key dates
   - Important notes
   - Updates during process

4. **Status Changes:** Always provide meaningful reasons
   - Helps with audit trail
   - Legal compliance
   - Team communication

5. **Check History:** Before closing a case
   - Review entire timeline
   - Ensure all steps were documented
   - Verify unit status updates were correct

---

## Keyboard Shortcuts

*To be added based on frontend implementation*

---

## FAQs

**Q: Can I delete a legal case?**
A: This version doesn't allow deletion to maintain audit trail integrity. Cases remain in the system for compliance purposes.

**Q: Can multiple cases exist for one tenant?**
A: Yes, a tenant can have multiple cases (eviction, non-payment, damage, etc.).

**Q: What happens to unit when case closes?**
A: Unit status automatically updates based on case outcome (tenant won = occupied, owner won = vacant).

**Q: Can I change case status multiple times?**
A: Yes, as long as you follow the valid transition path. Each change is logged.

**Q: Who can see the cases?**
A: All system users with access to the property module can see cases. Audit trail shows who made changes.

**Q: What if I made a mistake in status change?**
A: Contact system administrator. Check status history to understand current state. You can proceed to correct status following valid transitions.

---

## Support

For issues or questions:
1. Check this guide's Troubleshooting section
2. Review the status history timeline
3. Verify all required fields are filled
4. Contact system administrator with case number

---

**Version:** 1.0  
**Last Updated:** 2024  
**Module:** Rental Legal Case Management
