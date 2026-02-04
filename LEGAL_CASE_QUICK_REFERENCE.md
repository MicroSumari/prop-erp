# Rental Legal Case Module - Quick Reference

## 🎯 What's New?

A complete legal case tracking system for rental properties with:
- Case creation and management
- Status tracking with state machine
- Automatic unit status updates
- Complete audit history
- Intuitive UI

---

## 📱 How to Access

**Menu Path:** Sidebar → Leasing → Legal Cases

**Direct URL:** `http://localhost:3000/legal-cases`

---

## 🚀 Quick Workflows

### Create a New Case
1. Click "Create Legal Case"
2. Select tenant (dropdown)
3. Select lease (auto-filtered)
4. Fill details (case number, type, filing date, etc.)
5. Submit

**Auto-Happens:** Cost center assigned, unit marked "Under Legal Case"

### View Cases
1. See all cases in table format
2. Color-coded status and type badges
3. Click eye icon to view details

### Change Case Status
1. Click "Change Status" button
2. Select new status (only valid options shown)
3. Explain why (required)
4. Submit

**Auto-Happens:** Unit status updates, history recorded

### View History
Click on any case to see complete timeline of:
- Who changed status
- When it changed
- Why it changed
- Previous status

---

## 📊 Status Flow

```
FILED
  ↓
IN_PROGRESS
  ↓
JUDGMENT_PASSED
  ↓
CLOSED (Won or Lost)
```

Each status automatically updates unit status:
- **Filed/In Progress** → Unit: Under Legal Case
- **Judgment Passed** → Unit: Blocked
- **Closed-Won** → Unit: Occupied
- **Closed-Lost** → Unit: Vacant

---

## 🎨 Color Coding

### Status Colors
- 🔵 **Blue** = Filed
- 🟠 **Orange** = In Progress
- 🔷 **Light Blue** = Judgment Passed
- 🟢 **Green** = Closed (Tenant Won)
- 🔴 **Red** = Closed (Owner Won)

### Case Type Colors
- 🔴 **Red** = Eviction
- 🟠 **Orange** = Non-Payment
- 🔵 **Blue** = Damage
- 🟤 **Gray** = Other

---

## 📋 Fields You'll Use

### Case Information
- **Tenant** - Who's involved (required)
- **Lease** - Which lease (required, filtered by tenant)
- **Property** - Auto-filled from lease
- **Unit** - Auto-filled from lease
- **Case Number** - Your identifier (required, must be unique)
- **Case Type** - Eviction, Non-Payment, Damage, Other (required)

### Details
- **Filing Date** - When filed (required)
- **Court Name** - Which court (optional)
- **Remarks** - Notes/summary (optional)

### Auto-Assigned
- **Cost Center** - From unit (for accounting)
- **Status** - "Filed" on creation

---

## 🔐 Audit Trail

Every change is recorded:
- ✅ What changed (from → to status)
- ✅ When it changed (timestamp)
- ✅ Why it changed (reason entered)
- ✅ Who changed it (user tracking)

View timeline on case detail page.

---

## ⚙️ Technical Details

### Backend API
```
GET    /property/legal-cases/              List all
POST   /property/legal-cases/              Create new
GET    /property/legal-cases/{id}/         View details
PATCH  /property/legal-cases/{id}/         Edit
POST   /property/legal-cases/{id}/change_status/  Change status
```

### Database Tables
- `property_rentallegalcase` - Main cases
- `property_rentallegalcasestatushistory` - Change history

### Frontend Components
- `LegalCaseForm.js` - Create cases
- `LegalCaseList.js` - View all cases
- `LegalCaseDetail.js` - View & edit specific case

---

## 💡 Pro Tips

1. **Use Consistent Case Numbers**
   - Format: `LEG-2024-0001` or `CASE-20240115`
   - Makes searching easier

2. **Document Everything**
   - Use Remarks for case summary
   - Include key dates
   - Add important notes

3. **Provide Reasons**
   - When changing status, explain why
   - Helps audit trail and team communication
   - Required field for compliance

4. **Check History**
   - Before closing, review entire timeline
   - Verify unit status updates are correct
   - Ensure all steps documented

5. **Use Filters**
   - Filter by status to find active cases
   - Filter by type for analysis
   - Search by case number or court

---

## ❓ Common Questions

**Q: Can I delete a case?**
A: No - audit trail must stay intact for compliance.

**Q: Can I change to any status?**
A: No - only valid next statuses available (state machine).

**Q: What if I made a mistake?**
A: Contact admin to resolve. Can proceed to correct status.

**Q: Can one tenant have multiple cases?**
A: Yes - eviction, non-payment, damage, etc. can all exist.

**Q: Who can see cases?**
A: All users with property module access. History shows who changed what.

**Q: What happens when case closes?**
A: Unit status updates to Occupied (tenant won) or Vacant (owner won).

---

## 🔗 Related Information

**Unit Statuses Affected:**
- Vacant → Under Legal Case (when case filed)
- Occupied → Under Legal Case (when case filed)
- Under Legal Case → Blocked (when judgment passed)
- Under Legal Case → Occupied (when tenant won)
- Under Legal Case → Vacant (when owner won)

**Cost Centers:**
- Auto-created from unit when case created
- Used for financial tracking
- Appears in case details
- Cannot be manually changed

**Leases:**
- Must select existing lease
- Tenant-lease relationship validated
- Property and unit auto-fill from lease
- Cannot be changed after case creation

---

## 📞 Support

**Issues?**
1. Check this quick reference
2. Review User Guide
3. Check status history timeline
4. Verify all required fields filled
5. Contact administrator

---

## 📚 Full Documentation

- **User Guide:** LEGAL_CASE_USER_GUIDE.md
- **Technical Details:** LEGAL_CASE_TECHNICAL_ARCHITECTURE.md
- **Implementation Report:** LEGAL_CASE_IMPLEMENTATION_COMPLETE.md

---

**Version:** 1.0
**Last Updated:** February 2024
**Status:** Production Ready ✅
