# Decision Tree Implementation Guide

## Overview
The Decision Tree module provides explainable AI decisions for clinical care paths and discharge readiness.

## Features
1. Care Path Recommendations
2. Discharge Readiness Evaluation
3. Explainable Decisions with rule paths
4. Auditable Tree Export

## API Endpoints

### POST /api/decision-tree/patients/:id/care-path
Get care path recommendation for a patient.

### POST /api/decision-tree/patients/:id/discharge-readiness
Evaluate discharge readiness.

### GET /api/decision-tree/export/care-path
Export care path tree structure for audit.

### GET /api/decision-tree/export/discharge-readiness
Export discharge readiness tree structure.

### POST /api/decision-tree/batch-evaluate
Batch evaluate multiple patients.

## Testing

Test with curl:
```bash
curl -X POST http://localhost:3001/api/decision-tree/patients/PATIENT_ID/care-path \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"oxygenSaturation": 94, "heartRate": 105}'
```

## Files Created
- server/src/services/decisionTree.ts - Decision tree logic
- server/src/routes/decisionTree.ts - API routes
