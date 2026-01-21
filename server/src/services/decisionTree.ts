/**
 * Decision Tree Implementation for Care Path Recommendations
 * Provides explainable decisions with transparent rule paths
 */

interface TreeNode {
  feature?: string;
  threshold?: number;
  operator?: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  left?: TreeNode;
  right?: TreeNode;
  prediction?: string;
  confidence?: number;
  rule?: string;
}

interface PatientFeatures {
  age: number;
  heartRate?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  temperature?: number;
  oxygenSaturation?: number;
  respiratoryRate?: number;
  painLevel?: number;
  mobilityScore?: number;
  daysAdmitted?: number;
  hasChronicCondition?: boolean;
  recentSurgery?: boolean;
}

interface DecisionResult {
  recommendation: string;
  confidence: number;
  rulePath: string[];
  reasoning: string;
  nextSteps: string[];
}

/**
 * Care Path Decision Tree
 * Trained on common clinical pathways and best practices
 */
class CarePathDecisionTree {
  private root: TreeNode;

  constructor() {
    // Build the decision tree based on clinical guidelines
    this.root = this.buildCarePathTree();
  }

  private buildCarePathTree(): TreeNode {
    return {
      feature: 'oxygenSaturation',
      threshold: 90,
      operator: 'lt',
      rule: 'Oxygen saturation < 90%',
      left: {
        // Critical oxygen levels
        prediction: 'IMMEDIATE_ICU_TRANSFER',
        confidence: 0.95,
        rule: 'Critical oxygen levels detected'
      },
      right: {
        feature: 'heartRate',
        threshold: 100,
        operator: 'gt',
        rule: 'Heart rate > 100 bpm',
        left: {
          feature: 'bloodPressureSystolic',
          threshold: 140,
          operator: 'gt',
          rule: 'Systolic BP > 140 mmHg',
          left: {
            prediction: 'CARDIOLOGY_CONSULT',
            confidence: 0.88,
            rule: 'Tachycardia with hypertension'
          },
          right: {
            prediction: 'MONITOR_VITALS_HOURLY',
            confidence: 0.82,
            rule: 'Elevated heart rate, normal BP'
          }
        },
        right: {
          feature: 'temperature',
          threshold: 38.5,
          operator: 'gt',
          rule: 'Temperature > 38.5°C',
          left: {
            feature: 'recentSurgery',
            threshold: 1,
            operator: 'eq',
            rule: 'Recent surgery',
            left: {
              prediction: 'INFECTION_PROTOCOL',
              confidence: 0.90,
              rule: 'Post-surgical fever'
            },
            right: {
              prediction: 'ANTIPYRETIC_TREATMENT',
              confidence: 0.85,
              rule: 'Fever without surgery'
            }
          },
          right: {
            feature: 'age',
            threshold: 65,
            operator: 'gte',
            rule: 'Age >= 65 years',
            left: {
              feature: 'mobilityScore',
              threshold: 3,
              operator: 'lt',
              rule: 'Mobility score < 3',
              left: {
                prediction: 'PHYSICAL_THERAPY',
                confidence: 0.87,
                rule: 'Elderly with low mobility'
              },
              right: {
                feature: 'daysAdmitted',
                threshold: 5,
                operator: 'gte',
                rule: 'Days admitted >= 5',
                left: {
                  prediction: 'DISCHARGE_PLANNING',
                  confidence: 0.83,
                  rule: 'Stable elderly patient, long stay'
                },
                right: {
                  prediction: 'CONTINUE_MONITORING',
                  confidence: 0.80,
                  rule: 'Stable elderly patient, short stay'
                }
              }
            },
            right: {
              feature: 'painLevel',
              threshold: 7,
              operator: 'gte',
              rule: 'Pain level >= 7',
              left: {
                prediction: 'PAIN_MANAGEMENT_CONSULT',
                confidence: 0.89,
                rule: 'Severe pain reported'
              },
              right: {
                feature: 'daysAdmitted',
                threshold: 3,
                operator: 'gte',
                rule: 'Days admitted >= 3',
                left: {
                  prediction: 'DISCHARGE_EVALUATION',
                  confidence: 0.85,
                  rule: 'Stable patient, ready for discharge assessment'
                },
                right: {
                  prediction: 'STANDARD_CARE',
                  confidence: 0.78,
                  rule: 'Continue standard care protocol'
                }
              }
            }
          }
        }
      }
    };
  }

  predict(features: PatientFeatures): DecisionResult {
    const rulePath: string[] = [];
    let currentNode = this.root;

    // Traverse the tree
    while (currentNode.prediction === undefined) {
      const feature = currentNode.feature!;
      const threshold = currentNode.threshold!;
      const operator = currentNode.operator!;
      const featureValue = this.getFeatureValue(features, feature);

      rulePath.push(currentNode.rule || `${feature} ${operator} ${threshold}`);

      const condition = this.evaluateCondition(featureValue, operator, threshold);
      currentNode = condition ? currentNode.left! : currentNode.right!;
    }

    // Add final prediction rule
    if (currentNode.rule) {
      rulePath.push(currentNode.rule);
    }

    return {
      recommendation: currentNode.prediction!,
      confidence: currentNode.confidence || 0.75,
      rulePath,
      reasoning: this.generateReasoning(currentNode.prediction!, rulePath),
      nextSteps: this.getNextSteps(currentNode.prediction!)
    };
  }

  private getFeatureValue(features: PatientFeatures, feature: string): number {
    const value = (features as any)[feature];
    if (typeof value === 'boolean') return value ? 1 : 0;
    return value || 0;
  }

  private evaluateCondition(value: number, operator: string, threshold: number): boolean {
    switch (operator) {
      case 'gt': return value > threshold;
      case 'lt': return value < threshold;
      case 'gte': return value >= threshold;
      case 'lte': return value <= threshold;
      case 'eq': return value === threshold;
      default: return false;
    }
  }

  private generateReasoning(prediction: string, rulePath: string[]): string {
    const reasons = rulePath.join(' → ');
    return `Based on clinical assessment: ${reasons}. Recommendation: ${prediction.replace(/_/g, ' ').toLowerCase()}.`;
  }

  private getNextSteps(prediction: string): string[] {
    const nextStepsMap: Record<string, string[]> = {
      IMMEDIATE_ICU_TRANSFER: [
        'Alert ICU team immediately',
        'Prepare oxygen therapy',
        'Continuous vital monitoring',
        'Notify attending physician'
      ],
      CARDIOLOGY_CONSULT: [
        'Request cardiology consultation',
        'Perform ECG',
        'Monitor blood pressure every 30 minutes',
        'Review cardiac medications'
      ],
      MONITOR_VITALS_HOURLY: [
        'Set up hourly vital sign monitoring',
        'Document trends in patient chart',
        'Alert nurse if vitals worsen',
        'Review in 4 hours'
      ],
      INFECTION_PROTOCOL: [
        'Collect blood cultures',
        'Start empiric antibiotics per protocol',
        'Monitor temperature every 2 hours',
        'Notify surgical team'
      ],
      ANTIPYRETIC_TREATMENT: [
        'Administer antipyretic medication',
        'Monitor temperature response',
        'Ensure adequate hydration',
        'Reassess in 4 hours'
      ],
      PHYSICAL_THERAPY: [
        'Consult physical therapy team',
        'Assess fall risk',
        'Create mobility improvement plan',
        'Daily therapy sessions'
      ],
      DISCHARGE_PLANNING: [
        'Initiate discharge planning process',
        'Assess home care needs',
        'Schedule follow-up appointments',
        'Prepare discharge instructions'
      ],
      DISCHARGE_EVALUATION: [
        'Evaluate discharge readiness',
        'Review medications and instructions',
        'Confirm follow-up appointments',
        'Assess patient understanding'
      ],
      PAIN_MANAGEMENT_CONSULT: [
        'Request pain management consultation',
        'Review current pain medications',
        'Assess pain characteristics',
        'Consider multimodal approach'
      ],
      CONTINUE_MONITORING: [
        'Continue current care plan',
        'Monitor vital signs per protocol',
        'Document patient progress',
        'Reassess daily'
      ],
      STANDARD_CARE: [
        'Follow standard care protocols',
        'Regular vital sign monitoring',
        'Administer scheduled medications',
        'Daily physician rounds'
      ]
    };

    return nextStepsMap[prediction] || ['Continue standard care', 'Monitor patient status', 'Document progress'];
  }

  exportTree(): TreeNode {
    return JSON.parse(JSON.stringify(this.root));
  }
}

/**
 * Discharge Readiness Decision Tree
 */
class DischargeReadinessTree {
  private root: TreeNode;

  constructor() {
    this.root = this.buildDischargeTree();
  }

  private buildDischargeTree(): TreeNode {
    return {
      feature: 'oxygenSaturation',
      threshold: 92,
      operator: 'lt',
      rule: 'Oxygen saturation < 92%',
      left: {
        prediction: 'NOT_READY',
        confidence: 0.95,
        rule: 'Oxygen levels too low for discharge'
      },
      right: {
        feature: 'temperature',
        threshold: 37.5,
        operator: 'gt',
        rule: 'Temperature > 37.5°C',
        left: {
          prediction: 'NOT_READY',
          confidence: 0.90,
          rule: 'Fever present'
        },
        right: {
          feature: 'painLevel',
          threshold: 5,
          operator: 'gt',
          rule: 'Pain level > 5',
          left: {
            prediction: 'NOT_READY',
            confidence: 0.85,
            rule: 'Uncontrolled pain'
          },
          right: {
            feature: 'mobilityScore',
            threshold: 3,
            operator: 'gte',
            rule: 'Mobility score >= 3',
            left: {
              feature: 'daysAdmitted',
              threshold: 2,
              operator: 'gte',
              rule: 'Days admitted >= 2',
              left: {
                feature: 'age',
                threshold: 75,
                operator: 'gte',
                rule: 'Age >= 75 years',
                left: {
                  feature: 'hasChronicCondition',
                  threshold: 1,
                  operator: 'eq',
                  rule: 'Has chronic condition',
                  left: {
                    prediction: 'READY_WITH_HOME_CARE',
                    confidence: 0.82,
                    rule: 'Elderly with chronic condition needs home support'
                  },
                  right: {
                    prediction: 'READY',
                    confidence: 0.88,
                    rule: 'Stable elderly patient'
                  }
                },
                right: {
                  prediction: 'READY',
                  confidence: 0.92,
                  rule: 'Stable patient, adequate stay'
                }
              },
              right: {
                prediction: 'OBSERVE_24H',
                confidence: 0.78,
                rule: 'Short stay, observe longer'
              }
            },
            right: {
              prediction: 'NOT_READY',
              confidence: 0.87,
              rule: 'Mobility too limited'
            }
          }
        }
      }
    };
  }

  predict(features: PatientFeatures): DecisionResult {
    const rulePath: string[] = [];
    let currentNode = this.root;

    while (currentNode.prediction === undefined) {
      const feature = currentNode.feature!;
      const threshold = currentNode.threshold!;
      const operator = currentNode.operator!;
      const featureValue = this.getFeatureValue(features, feature);

      rulePath.push(currentNode.rule || `${feature} ${operator} ${threshold}`);

      const condition = this.evaluateCondition(featureValue, operator, threshold);
      currentNode = condition ? currentNode.left! : currentNode.right!;
    }

    if (currentNode.rule) {
      rulePath.push(currentNode.rule);
    }

    return {
      recommendation: currentNode.prediction!,
      confidence: currentNode.confidence || 0.75,
      rulePath,
      reasoning: this.generateReasoning(currentNode.prediction!, rulePath),
      nextSteps: this.getDischargeNextSteps(currentNode.prediction!)
    };
  }

  private getFeatureValue(features: PatientFeatures, feature: string): number {
    const value = (features as any)[feature];
    if (typeof value === 'boolean') return value ? 1 : 0;
    return value || 0;
  }

  private evaluateCondition(value: number, operator: string, threshold: number): boolean {
    switch (operator) {
      case 'gt': return value > threshold;
      case 'lt': return value < threshold;
      case 'gte': return value >= threshold;
      case 'lte': return value <= threshold;
      case 'eq': return value === threshold;
      default: return false;
    }
  }

  private generateReasoning(prediction: string, rulePath: string[]): string {
    const reasons = rulePath.join(' → ');
    return `Discharge assessment: ${reasons}. Status: ${prediction.replace(/_/g, ' ').toLowerCase()}.`;
  }

  private getDischargeNextSteps(prediction: string): string[] {
    const stepsMap: Record<string, string[]> = {
      READY: [
        'Complete discharge paperwork',
        'Provide medication instructions',
        'Schedule follow-up appointment',
        'Give emergency contact information',
        'Ensure patient understands care plan'
      ],
      READY_WITH_HOME_CARE: [
        'Arrange home health care services',
        'Coordinate with home care agency',
        'Provide detailed care instructions',
        'Schedule home visit within 48 hours',
        'Ensure caregiver is present at discharge'
      ],
      NOT_READY: [
        'Continue current treatment plan',
        'Address barriers to discharge',
        'Reassess in 24 hours',
        'Document reasons for延期',
        'Update care team'
      ],
      OBSERVE_24H: [
        'Continue observation for 24 hours',
        'Monitor vital signs closely',
        'Reassess discharge criteria',
        'Prepare preliminary discharge plan',
        'Educate patient on discharge expectations'
      ]
    };

    return stepsMap[prediction] || ['Continue assessment', 'Consult care team'];
  }

  exportTree(): TreeNode {
    return JSON.parse(JSON.stringify(this.root));
  }
}

// Singleton instances
export const carePathTree = new CarePathDecisionTree();
export const dischargeReadinessTree = new DischargeReadinessTree();

// Export types
export type { PatientFeatures, DecisionResult, TreeNode };
