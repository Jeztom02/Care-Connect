# KNN Workflow Examples

## Scenario 1: Finding Similar Patients

### Clinical Use Case
Dr. Smith has a 65-year-old patient with hypertension and wants to see how similar patients were treated.

### Workflow
```
1. Doctor views patient "John Doe" (ID: 67abc123)
   - Age: 65
   - Condition: Hypertension
   - HR: 105, BP: 145/90, O2: 94%

2. Doctor clicks "Find Similar Patients"

3. System extracts features:
   {
     age: 65,
     heartRate: 105,
     bloodPressureSystolic: 145,
     oxygenSaturation: 94,
     chronicConditionsCount: 2
   }

4. System normalizes features (0-1 scale)

5. System calculates distance to all other patients

6. System returns top 5 most similar:
   
   Rank 1: Jane Smith (92% similar)
   - Age: 67 (similar)
   - HR: 102 (similar)
   - BP: 148/92 (similar)
   - Same conditions: Hypertension, Diabetes
   
   Rank 2: Bob Johnson (88% similar)
   - Age: 63 (similar)
   - HR: 108 (similar)
   - Different conditions but similar vitals

7. Doctor reviews treatment history of similar patients

8. Doctor applies insights to current patient
```

### API Call
```bash
GET /api/knn/patients/67abc123/similar?k=5
```

---

## Scenario 2: Volunteer-Task Matching

### Use Case
Admin needs to assign a patient care task requiring nursing skills.

### Workflow
```
1. Admin creates task:
   - Type: Patient Care
   - Required Skills: [nursing, patient_monitoring]
   - Required Languages: [English]
   - Duration: 4 hours

2. Admin clicks "Find Best Volunteers"

3. System extracts task requirements

4. System evaluates all volunteers:
   
   Volunteer A:
   - Skills: [nursing, patient_monitoring, communication] ✓
   - Experience: 5 years
   - Tasks completed: 42
   - Rating: 4.8/5
   - Available: 20 hours/week
   
   Volunteer B:
   - Skills: [administrative] ✗
   - Experience: 2 years
   - Tasks completed: 15
   - Rating: 4.2/5
   - Available: 10 hours/week

5. System calculates match scores:
   - Volunteer A: 95% match (excellent)
   - Volunteer B: 45% match (poor)

6. System ranks by match score

7. Admin assigns task to Volunteer A
```

### API Call
```bash
GET /api/knn/volunteer/tasks/task123/candidates?k=5
```

---

## Scenario 3: Doctor Recommendation

### Use Case
Patient with heart condition needs a cardiologist.

### Workflow
```
1. Nurse views patient "John Doe"
   - Condition: Heart Disease
   - Department: Cardiology
   - Needs: Specialist consultation

2. Nurse clicks "Recommend Doctors"

3. System filters doctors:
   - Specialty: Cardiology (preferred)
   - Department: Cardiology (preferred)
   - Availability: Available

4. System evaluates candidates:
   
   Dr. Emily Chen:
   - Specialty: Cardiology ✓✓✓
   - Experience: 15 years
   - Rating: 4.9/5
   - Current patients: 8 (low caseload)
   - Department: Cardiology ✓
   
   Dr. Michael Brown:
   - Specialty: General Medicine
   - Experience: 20 years
   - Rating: 4.7/5
   - Current patients: 15 (high caseload)
   - Department: General

5. System calculates match scores:
   - Dr. Chen: 96% match (specialty + availability)
   - Dr. Brown: 72% match (experience but wrong specialty)

6. System recommends Dr. Chen

7. Nurse assigns patient to Dr. Chen
```

### API Call
```bash
GET /api/knn/patients/67abc123/recommend-doctors?k=3&specialty=Cardiology
```

---

## How Distance Calculation Works

### Example: Comparing Two Patients

**Patient A (Target):**
```
age: 65 → normalized: 0.65
heartRate: 105 → normalized: 0.70
oxygenSaturation: 94 → normalized: 0.94
```

**Patient B (Candidate):**
```
age: 67 → normalized: 0.67
heartRate: 102 → normalized: 0.68
oxygenSaturation: 96 → normalized: 0.96
```

**Euclidean Distance:**
```
distance = √[(0.65-0.67)² + (0.70-0.68)² + (0.94-0.96)²]
distance = √[0.0004 + 0.0004 + 0.0004]
distance = √0.0012
distance = 0.035 (very small = very similar!)
```

**Similarity Score:**
```
similarity = 1 / (1 + 0.035)
similarity = 1 / 1.035
similarity = 0.966 (96.6% similar!)
```

---

## Weighted Features Example

### Doctor Recommendation Weights

```javascript
weights = {
  specialtyMatch: 3,      // Most important
  departmentMatch: 2,
  availability: 2,
  experienceYears: 1.5,
  averageRating: 1.5,
  caseloadSimilarity: 1.5,
  languageMatch: 1
}
```

**Why weights matter:**

Without weights:
- Dr. A: Specialty ✓, Low experience → 70% match
- Dr. B: Wrong specialty, High experience → 75% match
- **Dr. B wins** (wrong!)

With weights (specialty × 3):
- Dr. A: Specialty ✓ (×3), Low experience → 85% match
- Dr. B: Wrong specialty (×3), High experience → 60% match
- **Dr. A wins** (correct!)

---

## Feature Normalization Example

### Why normalize?

**Before normalization:**
```
age: 65 (range: 0-100)
heartRate: 105 (range: 40-200)
oxygenSaturation: 94 (range: 0-100)
```

Problem: Heart rate dominates distance calculation!

**After normalization (0-1 scale):**
```
age: 0.65 (65/100)
heartRate: 0.41 ((105-40)/(200-40))
oxygenSaturation: 0.94 (94/100)
```

Now all features contribute equally!

---

## Real-World Benefits

### Clinical Cohorting
```
Before KNN:
- Manual chart review: 2 hours
- Find 3-5 similar patients
- Subjective selection

After KNN:
- Automated search: 2 seconds
- Find top 10 most similar
- Objective, data-driven
```

### Volunteer Assignment
```
Before KNN:
- Admin reviews all volunteers manually
- Picks based on availability only
- May miss best match

After KNN:
- System ranks by skill + experience + rating
- Considers all factors
- Always picks optimal match
```

### Doctor Recommendations
```
Before KNN:
- Assign based on availability only
- May not match specialty
- Patient dissatisfaction

After KNN:
- Match specialty + experience + rating
- Consider current caseload
- Better patient outcomes
```

---

## Summary

KNN provides:

✅ **Fast similarity search** - Seconds vs hours  
✅ **Objective matching** - Data-driven, not subjective  
✅ **Multi-factor analysis** - Considers all relevant features  
✅ **Explainable results** - Shows why items match  
✅ **No training needed** - Works immediately  
✅ **Flexible weighting** - Adjust importance by domain  

Perfect for healthcare where quick, accurate matching is critical! 🎯
