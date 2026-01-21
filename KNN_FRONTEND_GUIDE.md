# KNN Frontend Components Guide

## Overview
Complete UI implementation for K-Nearest Neighbors similarity matching system.

## Components Created

### 1. Similar Patients Component
**File:** `src/components/patient/SimilarPatients.tsx`

**Purpose:** Find and display patients with similar clinical profiles

**Features:**
- ✅ Select number of similar patients (3, 5, or 10)
- ✅ Color-coded similarity scores
- ✅ Expandable match details
- ✅ Shared conditions display
- ✅ Visual similarity indicators

**Location:** Patient Care page (integrated)

**Usage:**
```tsx
<SimilarPatientsComponent 
  patientId={currentPatient.id}
  patientName={currentPatient.name}
/>
```

---

### 2. Doctor Recommendation Component
**File:** `src/components/patient/DoctorRecommendation.tsx`

**Purpose:** Recommend best doctors for a patient

**Features:**
- ✅ Specialty filtering (optional)
- ✅ Select number of recommendations (3, 5, or 10)
- ✅ Doctor ratings with star display
- ✅ Availability indicators (High/Medium/Low)
- ✅ Experience and caseload stats
- ✅ Match reasoning explanations
- ✅ One-click assignment

**Location:** Patient Care page (integrated)

**Usage:**
```tsx
<DoctorRecommendation 
  patientId={currentPatient.id}
  patientName={currentPatient.name}
  patientCondition={currentPatient.condition}
/>
```

---

### 3. Volunteer Matcher Component
**File:** `src/components/admin/VolunteerMatcher.tsx`

**Purpose:** Match volunteers to tasks based on skills and experience

**Features:**
- ✅ Task ID input
- ✅ Select number of candidates (3, 5, or 10)
- ✅ Skill matching with visual indicators
- ✅ Experience, tasks completed, and rating display
- ✅ Match score with color coding
- ✅ Detailed match reasoning
- ✅ One-click task assignment

**Location:** Admin panel (new page created)

**Usage:**
```tsx
<VolunteerMatcher taskId="task123" />
```

---

### 4. Custom Hooks
**File:** `src/hooks/useKNN.ts`

**Hooks:**
- `useSimilarPatients()` - Find similar patients
- `useDoctorRecommendation()` - Recommend doctors
- `useVolunteerMatch()` - Match volunteers to tasks

**Example:**
```tsx
const { findSimilar, loading, error, result } = useSimilarPatients();

await findSimilar(patientId, k);
```

---

## Where to Find Components

### Patient Care Page
**Path:** Dashboard → Patient Care → Select Patient → Scroll Down

**Components Visible:**
1. 🧠 **AI Care Path Recommendation** (Decision Tree)
2. 🏠 **Discharge Readiness Assessment** (Decision Tree)
3. 👥 **Similar Patients (KNN)** ← NEW
4. 🩺 **Doctor Recommendations (KNN)** ← NEW

### Admin Panel
**Path:** Admin → Volunteer Management (new page)

**Components Visible:**
1. 👤 **Volunteer-Task Matcher (KNN)** ← NEW

---

## UI Features

### Color-Coded Match Scores

**Similar Patients & Volunteers:**
- 🟢 **90-100%**: Excellent Match (Green)
- 🔵 **75-89%**: Good Match (Blue)
- 🟡 **60-74%**: Fair Match (Yellow)
- ⚪ **<60%**: Possible Match (Gray)

### Availability Indicators (Doctors)
- 🟢 **High**: < 10 patients
- 🟡 **Medium**: 10-14 patients
- 🔴 **Low**: 15+ patients

### Star Ratings
Visual 5-star rating system for doctors and volunteers

### Expandable Details
Click "Show Match Details" to see:
- Why items are similar
- Shared conditions/skills
- Distance metrics

---

## User Workflows

### Workflow 1: Find Similar Patients

```
1. Login as doctor/nurse
2. Go to Patient Care
3. Select patient (e.g., "John Doe")
4. Scroll to "Similar Patients (KNN)" card
5. Select number of patients (3, 5, or 10)
6. Click "Find Similar Patients"
7. View results:
   - Ranked by similarity
   - Color-coded match scores
   - Expandable match details
   - Shared conditions
8. Click patient name to view their details
```

**Use Case:** Doctor wants to see how similar patients were treated

---

### Workflow 2: Recommend Doctors

```
1. Login as doctor/nurse
2. Go to Patient Care
3. Select patient (e.g., "John Doe with Heart Disease")
4. Scroll to "Doctor Recommendations (KNN)" card
5. (Optional) Enter specialty: "Cardiology"
6. Select number of recommendations (3, 5, or 10)
7. Click "Recommend Doctors"
8. View results:
   - Ranked by match score
   - Specialty and department
   - Availability status
   - Experience and ratings
   - Match reasoning
9. Click "Assign Doctor to Patient"
```

**Use Case:** Patient needs specialist consultation

---

### Workflow 3: Match Volunteers to Task

```
1. Login as admin
2. Go to Admin → Volunteer Management
3. Enter Task ID (e.g., "task123")
4. Select number of candidates (3, 5, or 10)
5. Click "Find Volunteer Candidates"
6. View results:
   - Ranked by match score
   - Skills with checkmarks for matches
   - Experience and performance stats
   - Match reasoning
7. Click "Assign to Task"
```

**Use Case:** Admin needs to assign patient care task

---

## Component Props

### SimilarPatientsComponent
```typescript
interface SimilarPatientsProps {
  patientId: string;        // Required
  patientName?: string;     // Optional
}
```

### DoctorRecommendation
```typescript
interface DoctorRecommendationProps {
  patientId: string;        // Required
  patientName?: string;     // Optional
  patientCondition?: string; // Optional
}
```

### VolunteerMatcher
```typescript
interface VolunteerMatcherProps {
  taskId?: string;          // Optional (can enter manually)
}
```

---

## API Integration

All components use custom hooks that call the KNN API:

**Similar Patients:**
```
GET /api/knn/patients/:id/similar?k=5
```

**Doctor Recommendations:**
```
GET /api/knn/patients/:id/recommend-doctors?k=3&specialty=Cardiology
```

**Volunteer Matching:**
```
GET /api/knn/volunteer/tasks/:taskId/candidates?k=5
```

---

## Visual Design

### Card Layout
```
┌─────────────────────────────────────────┐
│ 👥 Similar Patients (KNN)               │
│ Find patients with similar conditions   │
├─────────────────────────────────────────┤
│                                         │
│ Number of patients: [3] [5] [10]       │
│ [Find Similar Patients]                 │
│                                         │
│ ┌─────────────────────────────────────┐│
│ │ #1 Jane Smith          92% Match    ││
│ │ 67 years • female • Room 302        ││
│ │ Hypertension                        ││
│ │ [Show Match Details]                ││
│ └─────────────────────────────────────┘│
│                                         │
└─────────────────────────────────────────┘
```

### Match Details (Expanded)
```
┌─────────────────────────────────────────┐
│ Why Similar:                            │
│ ✓ Similar age: 0.95 vs 0.97            │
│ ✓ Similar heart rate: 0.72 vs 0.75     │
│ ✓ Similar chronic conditions           │
│                                         │
│ Shared Conditions:                      │
│ [Hypertension] [Diabetes]              │
└─────────────────────────────────────────┘
```

---

## Responsive Design

All components are fully responsive:

**Desktop (lg):**
- 2-column layout for admin page
- Full details visible

**Tablet (md):**
- Single column
- Compact stats grid

**Mobile (sm):**
- Stacked layout
- Scrollable lists
- Touch-friendly buttons

---

## Error Handling

All components include:
- ✅ Loading states with spinners
- ✅ Error alerts with messages
- ✅ Empty state handling
- ✅ Toast notifications for success/error

**Example Error:**
```tsx
<Alert variant="destructive">
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>
    Failed to find similar patients. Please try again.
  </AlertDescription>
</Alert>
```

---

## Performance

### Optimization Features
- Lazy loading of match details
- Debounced API calls
- Cached results until refresh
- Minimal re-renders

### Loading States
```tsx
{loading ? (
  <Loader2 className="animate-spin" />
) : (
  <TrendingUp />
)}
```

---

## Accessibility

All components follow accessibility best practices:
- ✅ Semantic HTML
- ✅ ARIA labels
- ✅ Keyboard navigation
- ✅ Screen reader support
- ✅ Color contrast compliance

---

## Files Created

**Components:**
1. `src/components/patient/SimilarPatients.tsx` (300+ lines)
2. `src/components/patient/DoctorRecommendation.tsx` (400+ lines)
3. `src/components/admin/VolunteerMatcher.tsx` (400+ lines)

**Hooks:**
4. `src/hooks/useKNN.ts` (150+ lines)

**Pages:**
5. `src/pages/admin/VolunteerManagement.tsx` (100+ lines)

**Integration:**
6. Updated `src/pages/dashboard/PatientCare.tsx`

---

## Testing Checklist

### Similar Patients
- [ ] Select patient in Patient Care
- [ ] Choose k=5
- [ ] Click "Find Similar Patients"
- [ ] Verify results display
- [ ] Expand match details
- [ ] Check color coding

### Doctor Recommendations
- [ ] Select patient in Patient Care
- [ ] Enter specialty (optional)
- [ ] Choose k=3
- [ ] Click "Recommend Doctors"
- [ ] Verify results display
- [ ] Check availability indicators
- [ ] View match reasoning

### Volunteer Matcher
- [ ] Go to Admin → Volunteer Management
- [ ] Enter task ID
- [ ] Choose k=5
- [ ] Click "Find Volunteer Candidates"
- [ ] Verify results display
- [ ] Check skill matching
- [ ] View match scores

---

## Summary

✅ **3 Complete UI Components** - Similar Patients, Doctor Recommendations, Volunteer Matcher  
✅ **Custom React Hooks** - Easy API integration  
✅ **Fully Responsive** - Works on all devices  
✅ **Accessible** - WCAG compliant  
✅ **Error Handling** - Graceful failures  
✅ **Loading States** - User feedback  
✅ **Color-Coded Results** - Visual clarity  
✅ **Expandable Details** - Progressive disclosure  
✅ **Integrated** - Works with existing app  

**All KNN frontend components are ready to use!** 🎉
