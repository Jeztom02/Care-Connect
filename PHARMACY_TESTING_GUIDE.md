# Pharmacy E-Commerce System - Testing Guide

## Quick Start Testing

### Prerequisites
- ✅ Backend server running on port 3001
- ✅ Frontend running on port 5173 (or configured port)
- ✅ MongoDB connected
- ✅ Test accounts for: Doctor, Pharmacy, Patient

---

## Test Accounts Setup

### Create Test Accounts (if not already exists)

#### Doctor Account
```
Email: doctor@test.com
Password: Test123!
Role: doctor
```

#### Pharmacy Account
```
Email: pharmacy@test.com
Password: Test123!
Role: pharmacy
```

#### Patient Account
```
Email: patient@test.com
Password: Test123!
Role: patient
```

---

## Test Scenario 1: Complete Order Flow

### Step 1: Doctor Creates Prescription

1. **Login as Doctor**
   - Navigate to: `http://localhost:5173`
   - Login with doctor credentials
   - Should redirect to: `/dashboard/doctor`

2. **Create Prescription**
   - Click "Prescriptions" in sidebar
   - Click "New Prescription" or "Create Prescription"
   - Fill form:
     - Patient: Select a test patient (or patient@test.com)
     - Medication: "Amoxicillin"
     - Dosage: "500mg"
     - Frequency: "3 times daily"
     - Duration: "7 days"
     - Notes: "Take with food"
   - Click "Save" or "Create"

3. **Verify Success**
   - ✅ Toast notification: "Prescription created successfully"
   - ✅ Prescription appears in list
   - ✅ Check console logs: Should see "Auto-created pharmacy order"

### Step 2: Verify Order in Pharmacy Dashboard

1. **Login as Pharmacy Staff**
   - Logout from doctor account
   - Login with pharmacy credentials
   - Should redirect to: `/dashboard/pharmacy`

2. **Check Pharmacy Dashboard**
   - Should see "Pharmacy Dashboard" page
   - Check Stats Cards:
     - ✅ Total Orders: Should increase by 1
     - ✅ Pending: Should increase by 1
   
3. **Find the New Order**
   - Scroll to Orders Table
   - Look for order with:
     - Order Number: RX000XXX
     - Patient: Test patient name
     - Status Badge: Yellow "Pending"
     - Payment Badge: Yellow "Pending"
   - ✅ Verify "Fulfill" button is visible

### Step 3: Verify Order in Patient View

1. **Login as Patient**
   - Logout from pharmacy account
   - Login with patient credentials
   - Should redirect to: `/dashboard/patient`

2. **Navigate to Pharmacy Orders**
   - Click "Pharmacy Orders" in sidebar
   - Should navigate to: `/dashboard/patient/pharmacy-orders`

3. **Verify Order Appears**
   - Check "All Orders" tab
   - ✅ Order RX000XXX should be visible
   - ✅ Status: "Pending"
   - ✅ Payment: "Pending"
   - ✅ Doctor name displayed
   - ✅ Medication name visible
   - ✅ "View Details" button present

4. **View Order Details**
   - Click eye icon or "View Details"
   - ✅ Modal opens showing:
     - Order Number
     - Doctor name
     - Medications with dosage
     - Order date
     - Status badges
   - Close modal

### Step 4: Pharmacy Fulfills Order

1. **Back to Pharmacy Dashboard**
   - Login as pharmacy staff
   - Go to Pharmacy Dashboard

2. **Fulfill the Order**
   - Find the pending order
   - Click "Fulfill" button
   - ✅ Modal opens: "Fulfill Order"
   
3. **Fill Fulfillment Form**
   - Order Number: (displayed, read-only)
   - Patient Name: (displayed, read-only)
   - Medications: (displayed, read-only)
   - **Total Amount**: Enter `25.99`
   - **Fulfillment Notes**: "Ready for pickup at counter 3"
   - Click "Fulfill Order" button

4. **Verify Success**
   - ✅ Toast: "Order fulfilled successfully"
   - ✅ Modal closes
   - ✅ Order status changes to "Fulfilled" (Green badge)
   - ✅ New button appears: "Request Payment"

### Step 5: Pharmacy Requests Payment

1. **Request Payment**
   - Find the fulfilled order
   - Click "Request Payment" button
   - ✅ Confirmation or immediate action

2. **Verify Success**
   - ✅ Toast: "Payment request sent to patient"
   - ✅ Status changes to "PaymentRequested" (Purple badge)
   - ✅ Payment Status: "Requested" (Purple badge)

### Step 6: Patient Sees Payment Request

1. **Login as Patient**
   - Switch to patient account
   - Go to "Pharmacy Orders"

2. **Check for Payment Alert**
   - ✅ RED/PURPLE alert banner at top of page
   - ✅ Text: "Payment Required - You have 1 order(s) waiting for payment"
   - ✅ Order shown in alert with "Pay Now" button

3. **Verify in Tabs**
   - Click "Payment Required" tab
   - ✅ Order appears here
   - ✅ "Pay" button visible in table
   - ✅ Status: "PaymentRequested"
   - ✅ Payment Status: "Requested"

### Step 7: Patient Makes Payment

1. **Initiate Payment**
   - Click "Pay Now" button (from alert or table)
   - ✅ Payment dialog opens

2. **Review Order in Dialog**
   - ✅ Order Total displayed: $25.99
   - ✅ Items count shown
   - ✅ Payment methods visible:
     - Credit/Debit Card (radio button)
     - Insurance (radio button)
     - Cash on Pickup (radio button)

3. **Select Payment Method**
   - Select "Credit/Debit Card"
   - ✅ Security note displayed

4. **Confirm Payment**
   - Click "Pay $25.99" button
   - ✅ Processing indicator

5. **Verify Success**
   - ✅ Toast: "Payment Successful - Payment of $25.99 processed successfully"
   - ✅ Dialog closes
   - ✅ Payment alert disappears
   - ✅ Order moves to different status

6. **Verify Order Updated**
   - Check "Completed" tab
   - ✅ Order status: "Paid" (Emerald badge)
   - ✅ Payment Status: "Paid" (Green badge)
   - ✅ No "Pay" button anymore

### Step 8: Pharmacy Completes Order

1. **Back to Pharmacy**
   - Login as pharmacy staff
   - Go to Pharmacy Dashboard

2. **Find Paid Order**
   - ✅ Order status: "Paid"
   - ✅ Button available: "Complete"

3. **Mark as Complete**
   - Click "Complete" button
   - ✅ Toast: "Order marked as completed"

4. **Verify Completion**
   - ✅ Order status: "Completed" (Gray badge)
   - ✅ Stats updated:
     - Completed count increases
     - Revenue increased by $25.99

### Step 9: Final Verification

1. **Patient View**
   - Login as patient
   - Go to Pharmacy Orders
   - Click "Completed" tab
   - ✅ Order appears here
   - ✅ All details preserved
   - ✅ Full order history viewable

2. **Order Details**
   - Click "View Details"
   - ✅ Complete order information
   - ✅ Fulfillment notes visible
   - ✅ Payment info shown
   - ✅ Timestamps displayed

---

## Test Scenario 2: Multiple Items Order

### Create Prescription with Multiple Medications

1. **Login as Doctor**
2. **Create Prescription**
   - Patient: Test patient
   - Use "items" array if supported:
     ```json
     items: [
       {
         medication: "Amoxicillin",
         dosage: "500mg",
         frequency: "3x daily",
         duration: "7 days"
       },
       {
         medication: "Ibuprofen",
         dosage: "200mg",
         frequency: "As needed",
         duration: "14 days"
       }
     ]
     ```

3. **Verify in Pharmacy**
   - ✅ Both medications visible in order
   - ✅ Can fulfill with individual pricing

4. **Verify in Patient View**
   - ✅ Both medications listed
   - ✅ Individual dosages shown

---

## Test Scenario 3: Order Search and Filtering

### Test Search Functionality

1. **Login as Pharmacy**
2. **Use Search Bar**
   - Search by order number: "RX000001"
   - ✅ Matching orders appear
   - Search by patient name: "John"
   - ✅ Orders for matching patients appear
   - Search by medication: "Amoxicillin"
   - ✅ Orders containing that medication appear

### Test Status Filter

1. **Use Status Dropdown**
   - Select "Pending"
   - ✅ Only pending orders shown
   - Select "Fulfilled"
   - ✅ Only fulfilled orders shown
   - Select "Completed"
   - ✅ Only completed orders shown
   - Select "All Status"
   - ✅ All orders shown

---

## Test Scenario 4: Error Handling

### Test Invalid Fulfillment

1. **Login as Pharmacy**
2. **Try to Fulfill Without Amount**
   - Click "Fulfill" on pending order
   - Leave amount field empty
   - Click "Fulfill Order"
   - ✅ Error toast: "Please enter a valid total amount"
   - ✅ Form validation prevents submission

### Test Unauthorized Access

1. **Try to Access Wrong Endpoints**
   - Login as Patient
   - Try to access `/dashboard/pharmacy`
   - ✅ Should redirect or show 403 error

2. **API Access Test**
   - Open browser console
   - Try: `fetch('/api/pharmacy-orders', { headers: { Authorization: 'Bearer INVALID' } })`
   - ✅ Should return 401 Unauthorized

---

## Test Scenario 5: Edge Cases

### No Orders

1. **Login as New Patient**
   - Navigate to Pharmacy Orders
   - ✅ Empty state shown
   - ✅ Message: "No orders found"
   - ✅ Icon displayed

### Payment Already Made

1. **Try to Pay Again**
   - Find paid order
   - ✅ "Pay" button should NOT be visible
   - ✅ Status clearly shows "Paid"

### Concurrent Requests

1. **Multiple Pharmacy Staff**
   - Have two pharmacy accounts
   - Try to fulfill same order simultaneously
   - ✅ Only one should succeed
   - ✅ Second should get appropriate error

---

## API Testing with Postman/cURL

### Get All Orders (Pharmacy)
```bash
curl -X GET http://localhost:3001/api/pharmacy-orders \
  -H "Authorization: Bearer YOUR_PHARMACY_TOKEN"
```

Expected Response:
```json
[
  {
    "_id": "...",
    "orderNumber": "RX000001",
    "status": "Pending",
    "paymentStatus": "Pending",
    "totalAmount": 0,
    "items": [...],
    "patientId": {...},
    "doctorId": {...}
  }
]
```

### Get My Orders (Patient)
```bash
curl -X GET http://localhost:3001/api/pharmacy-orders/my-orders \
  -H "Authorization: Bearer YOUR_PATIENT_TOKEN"
```

### Fulfill Order
```bash
curl -X PUT http://localhost:3001/api/pharmacy-orders/RX000001/fulfill \
  -H "Authorization: Bearer YOUR_PHARMACY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "totalAmount": 25.99,
    "fulfillmentNotes": "Ready for pickup"
  }'
```

### Request Payment
```bash
curl -X PUT http://localhost:3001/api/pharmacy-orders/RX000001/request-payment \
  -H "Authorization: Bearer YOUR_PHARMACY_TOKEN"
```

### Make Payment (Patient)
```bash
curl -X POST http://localhost:3001/api/pharmacy-orders/RX000001/payment \
  -H "Authorization: Bearer YOUR_PATIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentMethod": "credit-card",
    "amount": 25.99
  }'
```

---

## Database Verification

### Check PharmacyOrder Collection

```javascript
// In MongoDB Compass or mongosh
db.pharmacyorders.find({}).sort({createdAt: -1}).limit(5)
```

Verify:
- ✅ orderNumber is auto-generated
- ✅ Status values are valid enums
- ✅ Timestamps are present
- ✅ References are populated correctly

---

## Performance Testing

### Load Testing

1. **Create Multiple Orders**
   - Create 50+ prescriptions rapidly
   - ✅ All orders created successfully
   - ✅ Order numbers sequential
   - ✅ No duplicate order numbers

2. **Concurrent Pharmacy Access**
   - Multiple pharmacy staff access dashboard
   - ✅ All see same orders
   - ✅ Updates reflect across sessions

3. **Large Order List**
   - Patient with 100+ orders
   - ✅ Page loads quickly
   - ✅ Pagination works (if implemented)
   - ✅ Search remains responsive

---

## Browser Compatibility

Test in:
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Edge (latest)
- ✅ Safari (latest, if available)

Verify:
- ✅ All dialogs open correctly
- ✅ Payment buttons work
- ✅ Tabs switch smoothly
- ✅ Alerts display properly

---

## Mobile Responsiveness

Test on:
- ✅ iPhone (Safari)
- ✅ Android (Chrome)
- ✅ Tablet (various browsers)

Verify:
- ✅ Tables are scrollable
- ✅ Buttons are tappable
- ✅ Dialogs fit screen
- ✅ Payment flow works

---

## Checklist Summary

### Backend ✅
- [ ] Server starts without errors
- [ ] PharmacyOrder model creates documents
- [ ] All 10 endpoints respond correctly
- [ ] Authentication works on all endpoints
- [ ] Role-based access enforced
- [ ] Auto-creation from prescription works

### Frontend ✅
- [ ] Patient pharmacy orders page loads
- [ ] Payment alerts display correctly
- [ ] Payment dialog functions properly
- [ ] Order details modal shows all information
- [ ] Tabs filter orders correctly
- [ ] Search and status filters work

### Integration ✅
- [ ] Doctor → Prescription → Auto-order
- [ ] Pharmacy → Fulfill → Status update
- [ ] Pharmacy → Request payment → Patient alert
- [ ] Patient → Pay → Status update
- [ ] Pharmacy → Complete → Final status

### Security ✅
- [ ] Patients can only see their orders
- [ ] Pharmacy can only fulfill/complete
- [ ] Invalid tokens rejected
- [ ] Role enforcement works

---

## Known Issues / Limitations

Document any issues found during testing:

1. **Issue**: [Description]
   - **Impact**: [High/Medium/Low]
   - **Workaround**: [If any]
   - **Status**: [Open/Fixed]

---

## Success Criteria

System is ready for production when:
- ✅ All test scenarios pass
- ✅ No critical bugs found
- ✅ Performance acceptable (< 2s page load)
- ✅ Security verified
- ✅ Mobile works properly
- ✅ Documentation complete

---

## Testing Timeline

- Day 1: Backend API testing
- Day 2: Frontend component testing
- Day 3: Integration testing
- Day 4: Edge case and error handling
- Day 5: Performance and browser testing
- Day 6: Mobile testing
- Day 7: Final verification and sign-off

---

## Contact for Issues

If you encounter issues during testing:
1. Check server logs in terminal
2. Check browser console for errors
3. Verify MongoDB connection
4. Review API responses in Network tab
5. Check authentication token validity

---

## Next Steps After Testing

1. Deploy to staging environment
2. User acceptance testing (UAT)
3. Load testing with realistic data
4. Security audit
5. Production deployment
6. Monitoring setup
7. User training

---

**Happy Testing! 🧪**
