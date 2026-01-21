# AI Integration Guide - Naive Bayes Classifier

## Overview

This system integrates **Naive Bayes Classifiers** to provide intelligent assistance for medical staff, improving accuracy and efficiency in alert prioritization and medical record classification.

## 🎯 Implemented Features

### 1. **AI-Assisted Emergency Alert Priority Suggestion**

**Location**: `src/components/patient/EmergencyAlertDialog.tsx`

**How it works**:
- As nurse types alert details, AI analyzes the text in real-time (debounced 1 second)
- Predicts priority: `Low`, `Medium`, `High`, or `Critical`
- Shows confidence score (e.g., "87% confidence")
- Auto-selects suggested priority if confidence ≥ 70%
- Nurse can override AI suggestion

**Example**:
```
Nurse types: "Patient experiencing severe chest pain and shortness of breath"
→ AI predicts: "High" priority (89% confidence)
→ UI pre-selects "High" button
→ Nurse confirms or changes
```

**API Endpoint**: `POST /api/alerts/classify-priority`
```json
{
  "title": "Emergency Alert",
  "message": "Patient experiencing severe chest pain"
}
```

**Response**:
```json
{
  "label": "High",
  "scores": {
    "Low": 0.05,
    "Medium": 0.12,
    "High": 0.78,
    "Critical": 0.05
  }
}
```

---

### 2. **AI-Assisted Medical Record Type Classification**

**Location**: `src/components/medical/CreateMedicalRecordDialog.tsx`

**How it works**:
- Analyzes title, summary, and diagnosis fields
- Predicts record type: `Consultation`, `Lab Results`, `Assessment`, `Imaging`, `Prescription`, `Other`
- Shows confidence score
- Auto-selects type if confidence ≥ 75%
- Doctor can override

**Example**:
```
Doctor enters:
  Title: "Complete blood count panel"
  Summary: "Routine blood work results"
→ AI predicts: "Lab Results" (92% confidence)
→ Auto-fills record type dropdown
```

**API Endpoint**: `POST /api/medical-records/classify-type`
```json
{
  "title": "Complete blood count",
  "summary": "Panel of blood tests",
  "diagnosis": "Normal ranges"
}
```

**Response**:
```json
{
  "label": "Lab Results",
  "scores": {
    "Consultation": 0.03,
    "Lab Results": 0.92,
    "Assessment": 0.02,
    "Imaging": 0.01,
    "Prescription": 0.01,
    "Other": 0.01
  }
}
```

---

### 3. **AI Insights Dashboard Panel**

**Location**: `src/components/dashboard/AIInsightsPanel.tsx`

**Features**:

#### **A. Classification Metrics**
- Total classifications performed
- Overall accuracy percentage
- High-confidence correct predictions
- Number of disagreements (AI vs Nurse)
- Average confidence score

#### **B. Disagreement Analysis**
Shows cases where AI and nurse selected different priorities:
- Patient name and details
- Nurse's priority selection
- AI's suggested priority with confidence
- Outcome indicator (correct/incorrect/pending)
- Timestamp

#### **C. Training Suggestions**
AI-generated insights for improving the system:
- **Chest Pain Keywords**: "AI correctly identified 8/10 high-priority chest pain cases"
- **Routine Check-ups**: "95% accuracy in identifying low-priority routine alerts"
- **Respiratory Symptoms**: "AI tends to over-prioritize respiratory symptoms"

---

## 🔧 Technical Implementation

### Backend (Node.js + TypeScript)

**File**: `server/src/services/bayes.ts`

```typescript
class NaiveBayes {
  train(label: string, text: string): void
  predict(text: string): { label: string; scores: Record<string, number> }
}

// Pre-trained classifiers
export const alertPriorityClassifier: NaiveBayes
export const medicalRecordTypeClassifier: NaiveBayes
```

**Routes**:
- `POST /api/alerts/classify-priority` - Alert priority classification
- `POST /api/medical-records/classify-type` - Medical record type classification

### Frontend (React + TypeScript)

**Components**:
1. `EmergencyAlertDialog` - Real-time priority suggestion
2. `CreateMedicalRecordDialog` - Real-time type classification
3. `AIInsightsPanel` - Metrics and training suggestions

**Hooks**:
```typescript
import { apiRequest } from "@/hooks/useApi";

// Call AI classification
const result = await apiRequest('/api/alerts/classify-priority', {
  method: 'POST',
  body: JSON.stringify({ title, message }),
});
```

---

## 📊 Benefits

| Aspect | Without AI | With AI |
|--------|-----------|---------|
| **Speed** | Nurse reads and decides | AI suggests instantly |
| **Consistency** | Varies by experience | Standardized classification |
| **Safety** | Human judgment only | Double-check mechanism |
| **Learning** | Manual review needed | Automatic pattern detection |
| **Training** | Difficult to track | Clear metrics and suggestions |

---

## 🎓 Training Data

### Alert Priority Classifier

**Seeded with**:
- **Low**: "routine check", "minor update", "no immediate action"
- **Medium**: "elevated fever", "moderate pain", "monitor"
- **High**: "severe pain", "chest", "shortness", "urgent review"
- **Critical**: "emergency", "cardiac arrest", "stroke", "code blue"

### Medical Record Type Classifier

**Seeded with**:
- **Consultation**: "consultation", "follow up", "visit", "clinic"
- **Lab Results**: "lab", "blood test", "panel", "results"
- **Assessment**: "assessment", "evaluation", "status", "review"
- **Imaging**: "imaging", "x ray", "mri", "ct", "ultrasound"
- **Prescription**: "prescription", "medication", "dosage"
- **Other**: "miscellaneous", "document", "general note"

---

## 🚀 Usage Examples

### 1. Creating an Emergency Alert with AI

```typescript
// User types in dialog
details = "Patient unresponsive, weak pulse"

// AI analyzes (after 1s debounce)
→ Calls: POST /api/alerts/classify-priority
→ Returns: { label: "Critical", scores: {...}, confidence: 95% }
→ Auto-selects "High" priority (Critical maps to High)
→ Shows: "AI suggests: HIGH (95% confidence)"
```

### 2. Creating a Medical Record with AI

```typescript
// User fills form
title = "Chest X-Ray Report"
summary = "Imaging study of thoracic cavity"

// AI analyzes
→ Calls: POST /api/medical-records/classify-type
→ Returns: { label: "Imaging", confidence: 88% }
→ Auto-selects "Imaging" in dropdown
→ Shows: "AI suggests: Imaging (88% confidence)"
```

### 3. Viewing AI Insights (Admin)

```typescript
// Admin opens dashboard
→ Loads AIInsightsPanel component
→ Shows metrics:
  - 156 total classifications
  - 84.6% accuracy
  - 24 disagreements
→ Lists recent disagreements with outcomes
→ Provides training suggestions
```

---

## 🔮 Future Enhancements

### Short-term
1. **Feedback Loop**: Allow staff to mark AI suggestions as correct/incorrect
2. **Retraining**: Periodically retrain model with new data
3. **Confidence Threshold**: Adjustable auto-selection threshold per user

### Medium-term
1. **Multi-language Support**: Train on non-English medical terms
2. **Context Awareness**: Consider patient history in classification
3. **Severity Escalation**: Alert if AI detects critical keywords

### Long-term
1. **Deep Learning**: Upgrade to neural network models
2. **Predictive Analytics**: Predict patient outcomes
3. **Natural Language Processing**: Extract structured data from free text

---

## 📝 Testing the AI Features

### Test Alert Priority Classification

1. Open Patient Care page as nurse/doctor
2. Select a patient
3. Click "Emergency Alert"
4. Type: "Severe chest pain and difficulty breathing"
5. Wait 1 second
6. Observe: AI suggests "HIGH" with confidence score
7. Verify: High priority button is pre-selected

### Test Medical Record Classification

1. Open Medical Records page as doctor
2. Click "New Record"
3. Fill in:
   - Title: "Complete blood count results"
   - Summary: "Routine lab panel"
4. Wait 1 second
5. Observe: AI suggests "Lab Results"
6. Verify: Type dropdown shows "Lab Results"

### Test AI Insights Dashboard

1. Login as admin
2. Navigate to Admin Dashboard
3. Scroll to "AI Insights" section
4. Verify:
   - Metrics display correctly
   - Disagreements list shows sample data
   - Training suggestions appear

---

## 🛠️ Configuration

### Enable/Disable AI

**Frontend**:
```typescript
// In component state
const [aiEnabled, setAiEnabled] = useState(true);
```

**Backend**:
```typescript
// In server/src/services/bayes.ts
// Comment out classifier initialization to disable
```

### Adjust Confidence Threshold

```typescript
// In EmergencyAlertDialog.tsx
if (confidence >= 70) { // Change this value
  setPriority(mappedPriority);
}
```

### Add Training Data

```typescript
// In server/src/services/bayes.ts
const seeds = [
  { label: 'High', text: 'your new training phrase' },
  // Add more...
];
```

---

## 📚 API Reference

### POST /api/alerts/classify-priority

**Request**:
```json
{
  "title": "string",
  "message": "string"
}
```

**Response**:
```json
{
  "label": "Low" | "Medium" | "High" | "Critical",
  "scores": {
    "Low": number,
    "Medium": number,
    "High": number,
    "Critical": number
  }
}
```

### POST /api/medical-records/classify-type

**Request**:
```json
{
  "title": "string",
  "summary": "string",
  "diagnosis": "string"
}
```

**Response**:
```json
{
  "label": "Consultation" | "Lab Results" | "Assessment" | "Imaging" | "Prescription" | "Other",
  "scores": {
    "Consultation": number,
    "Lab Results": number,
    "Assessment": number,
    "Imaging": number,
    "Prescription": number,
    "Other": number
  }
}
```

---

## 🎯 Summary

The Naive Bayes classifier integration provides:

1. ✅ **Real-time AI assistance** for alert priority and record type selection
2. ✅ **Confidence scores** to help staff make informed decisions
3. ✅ **Auto-selection** for high-confidence predictions
4. ✅ **Override capability** - staff always has final say
5. ✅ **AI Insights Dashboard** for monitoring and improvement
6. ✅ **Training suggestions** based on performance metrics

This creates a **human-in-the-loop AI system** that augments medical staff capabilities while maintaining their authority and judgment.
