# Complete Booking Status Flow - Full Arrow Format

## USER Status Flow (Complete)
```
PENDING → ASSIGNED → ACCEPTED → VISITED → REPORT_UPLOADED → AWAITING_PAYMENT → PAYMENT_SUCCESS → BOREWELL_UPLOADED → ADMIN_APPROVED → FINAL_SETTLEMENT → COMPLETED
```

### Step-by-Step Changes:

**1. PENDING → ASSIGNED**
- **When:** User pays advance payment (40%)
- **Changes:**
  - `userStatus = ASSIGNED`
  - `status = ASSIGNED`
  - `vendorStatus = ASSIGNED`
  - `payment.advancePaid = true`
  - Travel charges credited to vendor wallet

**2. ASSIGNED → ACCEPTED**
- **When:** Vendor accepts booking
- **Changes:**
  - `userStatus = ACCEPTED`
  - `status = ACCEPTED`
  - `vendorStatus = ACCEPTED`
  - `acceptedAt = new Date()`

**3. ACCEPTED → VISITED**
- **When:** Vendor marks as visited
- **Changes:**
  - `userStatus = VISITED`
  - `status = VISITED`
  - `vendorStatus = VISITED`
  - `visitedAt = new Date()`

**4. VISITED → REPORT_UPLOADED**
- **When:** Vendor uploads report
- **Changes:**
  - `userStatus = AWAITING_PAYMENT` (user needs to pay 60%)
  - `status = REPORT_UPLOADED`
  - `vendorStatus = REPORT_UPLOADED` (waiting for admin payment)
  - `report.uploadedAt = new Date()`

**5. REPORT_UPLOADED → AWAITING_PAYMENT**
- **When:** Vendor uploads report (automatic)
- **Changes:**
  - `userStatus = AWAITING_PAYMENT`
  - `status = REPORT_UPLOADED`
  - `vendorStatus = REPORT_UPLOADED`

**6. AWAITING_PAYMENT → PAYMENT_SUCCESS**
- **When:** User pays remaining payment (60%)
- **Changes:**
  - `userStatus = PAYMENT_SUCCESS` (can now view report)
  - `status = PAYMENT_SUCCESS`
  - `vendorStatus = REPORT_UPLOADED` (unchanged)
  - `payment.remainingPaid = true`

**7. PAYMENT_SUCCESS → BOREWELL_UPLOADED**
- **When:** User uploads borewell result
- **Changes:**
  - `userStatus = BOREWELL_UPLOADED`
  - `status = BOREWELL_UPLOADED`
  - `vendorStatus = BOREWELL_UPLOADED`
  - `borewellResult.status = 'SUCCESS' or 'FAILED'`

**8. BOREWELL_UPLOADED → ADMIN_APPROVED**
- **When:** Admin approves borewell result
- **Changes:**
  - `userStatus = ADMIN_APPROVED` (waiting for final settlement)
  - `status = ADMIN_APPROVED`
  - `vendorStatus = APPROVED` (waiting for final settlement)
  - `borewellResult.approvedAt = new Date()`

**9. ADMIN_APPROVED → FINAL_SETTLEMENT**
- **When:** Admin processes final settlement (vendor or user)
- **Changes:**
  - `userStatus = FINAL_SETTLEMENT` (if vendor settlement done but user pending)
  - `status = FINAL_SETTLEMENT`
  - `vendorStatus = FINAL_SETTLEMENT_COMPLETE` (if vendor settlement done)

**10. FINAL_SETTLEMENT → COMPLETED**
- **When:** Both vendor and user settlements complete
- **Changes:**
  - `userStatus = COMPLETED`
  - `status = COMPLETED`
  - `vendorStatus = FINAL_SETTLEMENT_COMPLETE`
  - `finalSettlement.status = 'PROCESSED'`

---

## VENDOR Status Flow (Complete)
```
PENDING → ASSIGNED → ACCEPTED → VISITED → REPORT_UPLOADED → PAID_FIRST → BOREWELL_UPLOADED → APPROVED → FINAL_SETTLEMENT_COMPLETE
```

### Step-by-Step Changes:

**1. PENDING → ASSIGNED**
- **When:** User pays advance payment (40%)
- **Changes:**
  - `vendorStatus = ASSIGNED`
  - `status = ASSIGNED`
  - `userStatus = ASSIGNED`
  - Travel charges credited to vendor wallet

**2. ASSIGNED → ACCEPTED**
- **When:** Vendor accepts booking
- **Changes:**
  - `vendorStatus = ACCEPTED`
  - `status = ACCEPTED`
  - `userStatus = ACCEPTED`
  - `acceptedAt = new Date()`

**3. ACCEPTED → VISITED**
- **When:** Vendor marks as visited
- **Changes:**
  - `vendorStatus = VISITED`
  - `status = VISITED`
  - `userStatus = VISITED`
  - `visitedAt = new Date()`

**4. VISITED → REPORT_UPLOADED**
- **When:** Vendor uploads report
- **Changes:**
  - `vendorStatus = REPORT_UPLOADED` (waiting for admin to pay 50%)
  - `status = REPORT_UPLOADED`
  - `userStatus = AWAITING_PAYMENT` (user needs to pay 60%)
  - `report.uploadedAt = new Date()`

**5. REPORT_UPLOADED → PAID_FIRST**
- **When:** Admin pays first installment (50% + travel)
- **Changes:**
  - `vendorStatus = PAID_FIRST` (received 50% + travel)
  - `status = PAYMENT_SUCCESS` (unchanged)
  - `userStatus = PAYMENT_SUCCESS` (unchanged)
  - `firstInstallment.paid = true`

**6. PAID_FIRST → BOREWELL_UPLOADED**
- **When:** User uploads borewell result
- **Changes:**
  - `vendorStatus = BOREWELL_UPLOADED`
  - `status = BOREWELL_UPLOADED`
  - `userStatus = BOREWELL_UPLOADED`
  - `borewellResult.status = 'SUCCESS' or 'FAILED'`

**7. BOREWELL_UPLOADED → APPROVED**
- **When:** Admin approves borewell result
- **Changes:**
  - `vendorStatus = APPROVED` (waiting for final settlement)
  - `status = ADMIN_APPROVED`
  - `userStatus = ADMIN_APPROVED`
  - `borewellResult.approvedAt = new Date()`

**8. APPROVED → FINAL_SETTLEMENT_COMPLETE**
- **When:** Admin processes vendor final settlement (reward/penalty)
- **Changes:**
  - `vendorStatus = FINAL_SETTLEMENT_COMPLETE`
  - `status = FINAL_SETTLEMENT` or `COMPLETED` (depends on user settlement)
  - `userStatus = FINAL_SETTLEMENT` or `COMPLETED` (depends on user settlement)
  - `finalSettlement.rewardAmount` or `penaltyAmount` set
  - Money credited/debited to vendor wallet

---

## Key Status Points

### User Timeline:
- **ASSIGNED** - After advance payment
- **ACCEPTED** - Vendor accepted
- **VISITED** - Vendor visited site
- **AWAITING_PAYMENT** - Need to pay 60% to view report
- **PAYMENT_SUCCESS** - Paid, can view report
- **BOREWELL_UPLOADED** - Uploaded borewell result
- **ADMIN_APPROVED** - Admin approved result
- **FINAL_SETTLEMENT** - Settlement processing
- **COMPLETED** - All done

### Vendor Timeline:
- **PENDING** - Booking created
- **ASSIGNED** - After user payment
- **ACCEPTED** - Vendor accepted
- **VISITED** - Visited site
- **REPORT_UPLOADED** - Uploaded report, waiting for admin payment
- **PAID_FIRST** - Received 50% + travel
- **BOREWELL_UPLOADED** - User uploaded result
- **APPROVED** - Admin approved result
- **FINAL_SETTLEMENT_COMPLETE** - Final settlement done (reward/penalty)

---

## Final Settlement Logic

**Vendor Settlement:**
- Admin processes reward (SUCCESS) or penalty (FAILED)
- `vendorStatus = FINAL_SETTLEMENT_COMPLETE`
- Money credited/debited to vendor wallet

**User Settlement:**
- For SUCCESS: Just mark complete (no payment)
- For FAILED: Admin pays remittance amount
- `userStatus = FINAL_SETTLEMENT` or `COMPLETED`

**Both Complete:**
- `status = COMPLETED`
- `finalSettlement.status = 'PROCESSED'`
