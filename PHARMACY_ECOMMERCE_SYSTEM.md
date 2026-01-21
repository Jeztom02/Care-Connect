# Complete Pharmacy E-Commerce System

## Overview
This guide explains the complete pharmacy order management system that functions like an online store with full order tracking, payment requests, and fulfillment workflow.

## System Architecture

### Backend Models & Routes

#### PharmacyOrder Model (`server/src/models/pharmacyOrder.ts`)
Complete order tracking model with:
- **Auto-generated order numbers** (RX000001 format)
- **Order lifecycle states**: Pending → Processing → Fulfilled → PaymentRequested → Paid → Completed
- **Payment tracking**: Pending → Requested → Paid → Refunded
- **Item management**: medications with dosage, quantity, price, instructions
- **Fulfillment tracking**: fulfilledBy, fulfilledAt, fulfillmentNotes
- **Delivery options**: Pickup or Delivery with tracking

#### Pharmacy Orders Routes (`server/src/routes/pharmacyOrders.ts`)
10 RESTful API endpoints:
1. `GET /api/pharmacy-orders` - Get all orders (pharmacy/admin)
2. `GET /api/pharmacy-orders/patient/:patientId` - Get patient's orders
3. `GET /api/pharmacy-orders/my-orders` - Get logged-in patient's orders
4. `GET /api/pharmacy-orders/:orderId` - Get single order details
5. `POST /api/pharmacy-orders` - Create order from prescription
6. `PUT /api/pharmacy-orders/:orderId/fulfill` - Pharmacy fulfills order
7. `PUT /api/pharmacy-orders/:orderId/request-payment` - Request payment from patient
8. `POST /api/pharmacy-orders/:orderId/payment` - Patient makes payment
9. `PUT /api/pharmacy-orders/:orderId/complete` - Mark order as delivered
10. `PUT /api/pharmacy-orders/:orderId/cancel` - Cancel order

#### Enhanced Prescriptions Route
Auto-creation of pharmacy orders when doctor creates prescription:
- When prescription is created, a PharmacyOrder is automatically created
- Order starts in 'Pending' status
- Visible to pharmacy staff, patient, and prescribing doctor

### Frontend Components

#### 1. PharmacyDashboard (Pharmacy Staff)
**Location**: `src/components/dashboard/PharmacyDashboard.tsx`
**Access**: Pharmacy role only
**Features**:
- **Stats Dashboard**: Total orders, pending, fulfilled, completed, revenue
- **Order Management**: Search, filter, view all orders
- **Fulfill Orders**: Add pricing, update quantities, add notes
- **Request Payment**: Send payment request to patient
- **Complete Orders**: Mark as delivered/completed
- **Order Details**: View full order information, patient details, doctor info

**Status Workflow**:
```
Pending → [Fulfill] → Fulfilled → [Request Payment] → PaymentRequested → 
[Patient Pays] → Paid → [Mark Complete] → Completed
```

#### 2. PatientPharmacyOrders (Patient View)
**Location**: `src/pages/dashboard/PatientPharmacyOrders.tsx`
**Access**: Patient role
**Features**:
- **Payment Alerts**: Prominent alerts for pending payments
- **Order Tracking**: View all orders with status updates
- **Tabs**: All Orders, Pending, Payment Required, Completed
- **Payment Dialog**: Multiple payment methods (Credit Card, Insurance, Cash)
- **Order Details**: View medications, dosages, instructions, total amount
- **Real-time Updates**: Status changes reflect immediately

**Payment Flow**:
1. Pharmacy fulfills order and requests payment
2. Patient sees payment alert at top of page
3. Patient clicks "Pay Now" button
4. Selects payment method
5. Confirms payment
6. Order status updates to "Paid"
7. Pharmacy can mark as completed

## Complete Workflow

### 1. Doctor Prescribes Medicine
```typescript
// Doctor creates prescription
POST /api/prescriptions
{
  patientId: "123",
  medication: "Amoxicillin",
  dosage: "500mg",
  frequency: "3 times daily",
  duration: "7 days"
}

// Automatically creates PharmacyOrder
{
  orderNumber: "RX000001",
  status: "Pending",
  paymentStatus: "Pending",
  items: [{
    medication: "Amoxicillin",
    dosage: "500mg",
    quantity: 1,
    price: 0,  // To be filled by pharmacy
    instructions: "3 times daily, 7 days"
  }]
}
```

### 2. Order Appears in Pharmacy & Patient
- **Pharmacy Dashboard**: Shows in pending orders table
- **Patient View**: Shows in "Pending" tab with status "Pending"
- **Both see**: Patient name, doctor name, medications, order number

### 3. Pharmacy Fulfills Order
```typescript
// Pharmacy staff clicks "Fulfill" button
PUT /api/pharmacy-orders/RX000001/fulfill
{
  totalAmount: 25.99,
  fulfillmentNotes: "Ready for pickup at counter 3"
}

// Order updated
{
  status: "Fulfilled",
  totalAmount: 25.99,
  fulfilledBy: "Pharmacist John",
  fulfilledAt: "2024-01-15T10:30:00Z"
}
```

### 4. Pharmacy Requests Payment
```typescript
// Pharmacy clicks "Request Payment"
PUT /api/pharmacy-orders/RX000001/request-payment

// Order updated
{
  status: "PaymentRequested",
  paymentStatus: "Requested"
}
```

### 5. Patient Receives Payment Request
- **Alert appears** at top of PatientPharmacyOrders page
- **Email notification** (if configured)
- **Shows**: Order number, amount due, "Pay Now" button

### 6. Patient Makes Payment
```typescript
// Patient clicks "Pay Now" and selects method
POST /api/pharmacy-orders/RX000001/payment
{
  paymentMethod: "credit-card",
  amount: 25.99
}

// Order updated
{
  status: "Paid",
  paymentStatus: "Paid",
  paymentMethod: "credit-card",
  paidAt: "2024-01-15T11:00:00Z"
}
```

### 7. Pharmacy Completes Order
```typescript
// After pickup/delivery, pharmacy marks complete
PUT /api/pharmacy-orders/RX000001/complete

// Order updated
{
  status: "Completed",
  completedAt: "2024-01-15T14:00:00Z"
}
```

## Integration Points

### Doctor Dashboard
- Creates prescriptions as usual
- No changes needed - orders auto-create

### Pharmacy Dashboard Navigation
```typescript
// Route: /dashboard/pharmacy
// Component: PharmacyDashboard
// Shows all pharmacy orders with management tools
```

### Patient Dashboard Navigation
```typescript
// Route: /dashboard/patient/pharmacy-orders
// Menu: "Pharmacy Orders"
// Component: PatientPharmacyOrders
// Shows patient's orders and payment interface
```

## Status Badge Colors

### Order Status
- **Pending**: Yellow (waiting for pharmacy)
- **Processing**: Blue (pharmacy working on it)
- **Fulfilled**: Green (ready for payment)
- **PaymentRequested**: Purple (waiting for patient payment)
- **Paid**: Emerald (payment received)
- **Completed**: Gray (fully delivered)
- **Cancelled**: Red (cancelled)

### Payment Status
- **Pending**: Yellow
- **Requested**: Purple
- **Paid**: Green
- **Refunded**: Red

## Key Features

### For Pharmacy Staff
✅ Dashboard with revenue tracking
✅ Order search and filtering
✅ Fulfill orders with pricing
✅ One-click payment requests
✅ Order completion tracking
✅ Patient contact information
✅ Doctor prescription details

### For Patients
✅ Clear payment alerts
✅ Order status tracking
✅ Multiple payment methods
✅ Order history
✅ Medication details view
✅ Doctor information
✅ Delivery tracking

### For Doctors
✅ Seamless prescription creation
✅ Auto-order generation
✅ No workflow changes

## API Authentication

All endpoints require JWT authentication:
```typescript
headers: {
  Authorization: `Bearer ${token}`
}
```

Role-based access:
- Pharmacy endpoints: `authorizeRoles('pharmacy', 'admin')`
- Patient orders: Authenticated patient (own orders only)
- Doctor prescriptions: `authorizeRoles('doctor')`

## Database Schema

### PharmacyOrder Collection
```typescript
{
  orderNumber: String (auto-generated, indexed)
  prescriptionId: ObjectId (ref: Prescription)
  patientId: ObjectId (ref: Patient)
  doctorId: ObjectId (ref: User)
  items: [{
    medication: String
    dosage: String
    quantity: Number
    price: Number
    instructions: String
  }]
  totalAmount: Number
  status: Enum
  paymentStatus: Enum
  fulfilledBy: ObjectId (ref: User)
  fulfilledAt: Date
  fulfillmentNotes: String
  deliveryMethod: Enum
  deliveryAddress: String
  deliveryTracking: String
  paymentMethod: String
  paidAt: Date
  completedAt: Date
  cancelledAt: Date
  cancellationReason: String
  createdAt: Date (auto)
  updatedAt: Date (auto)
}
```

## Testing the System

### 1. Test Order Creation
1. Login as doctor
2. Create prescription for a patient
3. Check pharmacy dashboard - order should appear as "Pending"
4. Check patient view - order should appear as "Pending"

### 2. Test Fulfillment
1. Login as pharmacy staff
2. Find pending order
3. Click "Fulfill"
4. Enter total amount
5. Add optional notes
6. Submit
7. Verify status changed to "Fulfilled"

### 3. Test Payment Request
1. As pharmacy, click "Request Payment" on fulfilled order
2. Verify status changed to "PaymentRequested"
3. Login as patient
4. Check for payment alert at top of page
5. Verify order appears in "Payment Required" tab

### 4. Test Payment
1. As patient, click "Pay Now"
2. Select payment method
3. Confirm payment
4. Verify status changed to "Paid"
5. Check pharmacy dashboard - should show as "Paid"

### 5. Test Completion
1. As pharmacy, find paid order
2. Click "Complete"
3. Verify status changed to "Completed"
4. Check patient view - should show in "Completed" tab

## Troubleshooting

### Orders Not Appearing
- Check JWT token is valid
- Verify user role permissions
- Check backend server is running
- Verify routes are registered in `server/src/index.ts`

### Auto-Creation Not Working
- Check prescription creation endpoint
- Verify PharmacyOrder model is imported
- Check server logs for errors
- Verify database connection

### Payment Not Processing
- Check payment endpoint is receiving correct data
- Verify order status is "PaymentRequested"
- Check authentication token
- Review server logs

## Future Enhancements

- [ ] Email notifications for payment requests
- [ ] SMS notifications for order updates
- [ ] Real-time WebSocket updates for order status
- [ ] Inventory management integration
- [ ] Insurance claim processing
- [ ] Refund processing
- [ ] Delivery tracking integration
- [ ] Multiple payment method support (Stripe, PayPal)
- [ ] Order analytics and reporting
- [ ] Prescription refill requests

## Summary

The pharmacy e-commerce system provides:
1. **Automated workflow** from prescription to delivery
2. **Clear order tracking** for all parties
3. **Flexible payment options** for patients
4. **Complete fulfillment control** for pharmacy
5. **Integrated** with existing prescription system
6. **Scalable** architecture for future enhancements

All backend infrastructure is complete and ready. Frontend components are integrated with routing and navigation.
