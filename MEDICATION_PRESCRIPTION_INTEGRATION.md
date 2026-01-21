# Medication Dashboard - Prescription Integration Guide

## Overview
This guide documents the complete integration between the Medication Dashboard and Doctor Prescriptions. The system now displays both direct medication entries and prescriptions from doctors in a unified view.

## What Was Implemented

### 1. Frontend Services

#### **New: Prescription Service** (`src/services/prescriptionService.ts`)
Complete service for managing prescriptions with the following capabilities:
- `getAllPrescriptions()` - Fetch all prescriptions (for medical staff)
- `getPatientPrescriptions(patientId)` - Get prescriptions for a specific patient
- `getPrescriptionById(id)` - Get prescription details
- `createPrescription(data)` - Create new prescription (doctors only)
- `updatePrescription(id, data)` - Update existing prescription
- `requestRefill(id, itemIndex)` - Request medication refill
- `updatePrescriptionItem(id, itemIndex, data)` - Update specific prescription item
- `discontinuePrescriptionItem(id, itemIndex)` - Discontinue prescription item
- `deletePrescription(id)` - Delete prescription (admin only)
- `fulfillPrescription(id, notes)` - Mark prescription as fulfilled (pharmacy)

**TypeScript Interfaces:**
```typescript
interface PrescriptionItem {
  medication: string;
  dosage: string;
  frequency: string;
  duration?: string;
  instructions?: string;
  refillsRemaining?: number;
  status: 'Active' | 'Discontinued';
}

interface Prescription {
  _id: string;
  patientId: string | object;
  doctorId: string | object;
  appointmentId?: string;
  medication?: string;  // Legacy single-medicine
  dosage?: string;
  frequency?: string;
  duration?: string;
  notes?: string;
  items?: PrescriptionItem[];  // Multi-medicine structure
  startDate: string | Date;
  endDate?: string | Date;
  status: 'Active' | 'Expired' | 'Pending' | 'Discontinued';
  createdAt?: string | Date;
  updatedAt?: string | Date;
}
```

#### **Updated: Medication Service** (`src/services/medicationService.ts`)
Added new method:
- `getCombinedMedications(patientId)` - Fetches medications AND prescriptions together

### 2. Backend Routes

#### **Updated: Prescriptions Route** (`server/src/routes/prescriptions.ts`)
Enhanced endpoints:
- `GET /api/prescriptions/patient/:patientId` - New dedicated endpoint for patient prescriptions
- Improved population of patient and doctor data with firstName, lastName, and email
- Better handling of ObjectId routing

#### **Updated: Medications Route** (`server/src/routes/medications.ts`)
New combined endpoint:
- `GET /api/medications/patient/:patientId/combined` - Returns unified list of medications and prescriptions

**How it works:**
1. Fetches both medications and prescriptions for a patient
2. Transforms prescriptions into medication-compatible format
3. Handles both single medication and multi-item prescription formats
4. Adds `source` field to distinguish between 'medication' and 'prescription'
5. Returns sorted combined list

**Response Format:**
```json
[
  {
    "_id": "med123",
    "patientId": "patient123",
    "name": "Aspirin",
    "dosage": "100mg",
    "frequency": "Once daily",
    "status": "Active",
    "source": "medication",
    "prescribedBy": {...}
  },
  {
    "_id": "rx456-Lisinopril",
    "prescriptionId": "rx456",
    "patientId": "patient123",
    "name": "Lisinopril",
    "dosage": "10mg",
    "frequency": "Once daily",
    "status": "Active",
    "source": "prescription",
    "prescribedBy": {...},
    "refillsRemaining": 3
  }
]
```

### 3. Medication Dashboard UI

#### **Updated: MedicationDashboard Component** (`src/components/dashboard/MedicationDashboard.tsx`)

**Key Changes:**

1. **Imports prescription service**
   ```typescript
   import prescriptionService, { Prescription } from '@/services/prescriptionService';
   ```

2. **Fetches combined data**
   - Uses `medicationService.getCombinedMedications()` to get unified list
   - Displays both medications and prescriptions together

3. **Enhanced Table Display**
   - Added "Source" column to distinguish medications from prescriptions
   - Prescription items show a blue badge with "Prescription" label
   - Medication items show an outline badge with "Medication" label
   - Prescription items display a "From Doctor" badge instead of reminder button

4. **Statistics Cards**
   Four cards showing:
   - **Total Items**: All medications + prescriptions
   - **From Medications**: Direct medication entries
   - **From Prescriptions**: Doctor-prescribed items
   - **Active Status**: Currently active items

5. **Smart Edit Controls**
   - Prescription items cannot be edited/deleted directly (managed through prescription system)
   - Only direct medication entries can be edited
   - Clear visual distinction between editable and read-only items

6. **Improved Patient Name Display**
   - Handles both `name` and `firstName/lastName` formats
   - Shows proper patient identification from populated data

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     Medication Dashboard                     │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ getCombinedMedications(patientId)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Medication Service (Frontend)                   │
│                                                              │
│  GET /api/medications/patient/{patientId}/combined          │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│          Medications Router (Backend)                        │
│                                                              │
│  1. Fetch Medication.find({ patientId })                    │
│  2. Fetch Prescription.find({ patientId, active })          │
│  3. Transform prescriptions to medication format            │
│  4. Merge and tag with 'source' field                       │
│  5. Sort by date and return                                 │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │   MongoDB     │
                    │               │
                    │ - Medication  │
                    │ - Prescription│
                    └───────────────┘
```

## Features

### For Patients
- View all their medications in one place
- See which items are from direct medication entries vs doctor prescriptions
- Track active, pending, and completed medications
- Set reminders for direct medication entries

### For Doctors
- Add direct medication entries
- View prescriptions they've written (via Prescriptions module)
- See unified medication list for patients
- Edit/delete direct medication entries

### For Nurses & Medical Staff
- View complete medication history for patients
- See both medications and prescriptions
- Distinguish between different sources
- Track medication compliance

## Database Schema

### Medication Schema (from `server/src/models.ts`)
```typescript
{
  patientId: ObjectId (ref: 'Patient'),
  name: String,
  dosage: String,
  frequency: String,
  startDate: Date,
  endDate: Date,
  instructions: String,
  prescribedBy: ObjectId (ref: 'User'),
  status: 'Active' | 'Completed' | 'Discontinued'
}
```

### Prescription Schema (from `server/src/models.ts`)
```typescript
{
  patientId: ObjectId (ref: 'Patient'),
  doctorId: ObjectId (ref: 'User'),
  appointmentId: ObjectId (ref: 'Appointment'),
  // Legacy single-medicine fields
  medication: String,
  dosage: String,
  frequency: String,
  duration: String,
  notes: String,
  // Multi-medicine structure
  items: [{
    medication: String,
    dosage: String,
    frequency: String,
    duration: String,
    instructions: String,
    refillsRemaining: Number (default: 2),
    status: 'Active' | 'Discontinued'
  }],
  startDate: Date,
  endDate: Date,
  status: 'Active' | 'Expired' | 'Pending' | 'Discontinued'
}
```

## API Endpoints

### Medication Endpoints
- `GET /api/medications` - Get all medications (role-based)
- `GET /api/medications/stats` - Get medication statistics
- `GET /api/medications/patient/:patientId` - Get medications for patient
- `GET /api/medications/patient/:patientId/combined` - **NEW** Get combined medications and prescriptions
- `POST /api/medications` - Create medication (doctors only)
- `PUT /api/medications/:id` - Update medication (doctors only)
- `DELETE /api/medications/:id` - Delete medication (doctors only)
- `PATCH /api/medications/:id/reminder` - Toggle reminder

### Prescription Endpoints
- `GET /api/prescriptions` - Get all prescriptions (medical staff)
- `GET /api/prescriptions/patient/:patientId` - **NEW** Get prescriptions for patient
- `GET /api/prescriptions/:patientId` - Get prescriptions (legacy, supports both patient and prescription ID)
- `GET /api/prescriptions/detail/:id` - Get prescription details
- `POST /api/prescriptions` - Create prescription (doctors only)
- `PUT /api/prescriptions/:id` - Update prescription (doctors only)
- `POST /api/prescriptions/:id/request-refill` - Request refill
- `PATCH /api/prescriptions/:id/items/:index/dosage` - Update prescription item
- `POST /api/prescriptions/:id/items/:index/discontinue` - Discontinue item
- `DELETE /api/prescriptions/:id` - Delete prescription (admin only)
- `PUT /api/prescriptions/:id/fulfill` - Fulfill prescription (pharmacy)

## Usage Examples

### Creating a Prescription (Doctor)
```typescript
import prescriptionService from '@/services/prescriptionService';

const createPrescription = async () => {
  const prescription = await prescriptionService.createPrescription({
    patientId: 'patient123',
    items: [
      {
        medication: 'Lisinopril',
        dosage: '10mg',
        frequency: 'Once daily',
        duration: '30 days',
        instructions: 'Take with food'
      }
    ],
    startDate: new Date(),
    status: 'Active'
  });
  
  // Automatically creates pharmacy order
  console.log('Prescription created:', prescription._id);
};
```

### Viewing Combined Medications (Any User)
```typescript
import medicationService from '@/services/medicationService';

const viewMedications = async (patientId: string) => {
  const items = await medicationService.getCombinedMedications(patientId);
  
  items.forEach(item => {
    console.log(`${item.name} - Source: ${item.source}`);
    if (item.source === 'prescription') {
      console.log(`  From Doctor: ${item.prescribedBy.name}`);
      console.log(`  Refills: ${item.refillsRemaining}`);
    }
  });
};
```

### Adding Direct Medication (Doctor)
```typescript
import medicationService from '@/services/medicationService';

const addMedication = async () => {
  const medication = await medicationService.addMedication({
    patientId: 'patient123',
    name: 'Vitamin D',
    dosage: '1000 IU',
    frequency: 'Once daily',
    startDate: new Date(),
    status: 'pending',
    isReminderSet: true,
    reminderTime: '09:00'
  });
  
  console.log('Medication added:', medication._id);
};
```

## Security & Permissions

### Role-Based Access
- **Patients**: View their own medications and prescriptions
- **Doctors**: Create/update/delete medications, create/update prescriptions
- **Nurses**: View all medications and prescriptions (read-only for prescriptions)
- **Admin**: Full access to all operations
- **Pharmacy**: Can fulfill prescriptions

### Data Protection
- All endpoints require JWT authentication
- Patient data is properly filtered by user role
- Prescriptions are linked to specific doctors
- Medications are linked to prescribing user

## Testing

### Manual Testing Checklist
1. ✅ Login as doctor
2. ✅ Navigate to Medications dashboard
3. ✅ View combined list of medications and prescriptions
4. ✅ Create a new prescription (via Prescriptions page)
5. ✅ Verify prescription appears in Medications dashboard
6. ✅ Add direct medication entry
7. ✅ Verify both items appear with correct source badges
8. ✅ Check statistics cards show correct counts
9. ✅ Login as patient
10. ✅ Verify patient can only see their own medications/prescriptions
11. ✅ Verify patient cannot edit prescription items

## Benefits

1. **Unified View**: All medications and prescriptions in one place
2. **Source Tracking**: Clear distinction between direct medications and prescriptions
3. **Doctor Workflow**: Seamless integration with prescription creation
4. **Patient Safety**: Complete medication history visible
5. **Compliance**: Track all prescribed and administered medications
6. **Pharmacy Integration**: Prescriptions automatically create pharmacy orders
7. **Audit Trail**: Track who prescribed what and when

## Future Enhancements

### Potential Improvements
1. **Drug Interaction Checking**: Alert for potential drug interactions
2. **Medication History**: Timeline view of all medications
3. **Compliance Tracking**: Monitor if patients take medications on time
4. **Refill Reminders**: Automated notifications for refills
5. **Insurance Integration**: Check coverage for prescriptions
6. **E-Prescribing**: Direct integration with pharmacies
7. **Allergy Checking**: Alert for known allergies
8. **Dosage Calculator**: Help calculate proper dosages

## Troubleshooting

### Common Issues

**Issue: Prescriptions not showing up**
- Check that prescription status is 'Active' or 'Pending'
- Verify prescription items status is not 'Discontinued'
- Ensure patient ID matches

**Issue: Cannot edit prescription items**
- Prescription items can only be edited via the Prescriptions module
- Direct medications can be edited from the Medications dashboard

**Issue: Missing patient names**
- Check that prescription/medication has proper population
- Verify patient record exists in database

## Related Files

### Frontend
- `src/services/prescriptionService.ts` - Prescription API service
- `src/services/medicationService.ts` - Medication API service (updated)
- `src/components/dashboard/MedicationDashboard.tsx` - Main UI component (updated)
- `src/pages/dashboard/Medications.tsx` - Page wrapper

### Backend
- `server/src/routes/prescriptions.ts` - Prescription routes (updated)
- `server/src/routes/medications.ts` - Medication routes (updated)
- `server/src/models.ts` - Database schemas

## Support

For issues or questions:
1. Check this guide first
2. Review console logs for error messages
3. Verify API endpoints are working
4. Check user permissions and roles
5. Ensure MongoDB connection is active

---

**Last Updated**: January 20, 2026
**Version**: 1.0.0
**Status**: ✅ Production Ready
