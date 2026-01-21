import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Home, Loader2, CheckCircle, XCircle, Clock, ArrowRight, Brain } from 'lucide-react';
import { useDischargeReadiness, DecisionResult } from '@/hooks/useDecisionTree';
import { useToast } from '@/hooks/use-toast';

interface DischargeReadinessProps {
  patientId: string;
  patientName?: string;
  refreshTrigger?: number;
}

export const DischargeReadiness = ({ patientId, patientName, refreshTrigger }: DischargeReadinessProps) => {
  const { evaluate, loading, error, result } = useDischargeReadiness();
  const { toast } = useToast();
  const [showDetails, setShowDetails] = useState(false);

  // Auto-refresh when patient changes or vitals are updated
  useEffect(() => {
    if (result) {
      // Only auto-refresh if there's already a result showing
      handleEvaluate();
    }
  }, [patientId, refreshTrigger]);

  const handleEvaluate = async () => {
    try {
      await evaluate(patientId);
      toast({
        title: '✅ Discharge Assessment Complete',
        description: 'AI evaluation based on current patient status',
      });
      setShowDetails(true);
    } catch (err) {
      toast({
        title: '❌ Assessment Failed',
        description: error || 'Please try again',
        variant: 'destructive',
      });
    }
  };

  const getStatusConfig = (recommendation: string) => {
    switch (recommendation) {
      case 'READY':
        return {
          icon: <CheckCircle className="h-6 w-6" />,
          color: 'bg-green-100 text-green-700 border-green-300',
          label: 'Ready for Discharge',
          description: 'Patient meets all discharge criteria'
        };
      case 'READY_WITH_HOME_CARE':
        return {
          icon: <Home className="h-6 w-6" />,
          color: 'bg-blue-100 text-blue-700 border-blue-300',
          label: 'Ready with Home Care',
          description: 'Discharge with home health support recommended'
        };
      case 'NOT_READY':
        return {
          icon: <XCircle className="h-6 w-6" />,
          color: 'bg-red-100 text-red-700 border-red-300',
          label: 'Not Ready for Discharge',
          description: 'Patient does not meet discharge criteria'
        };
      case 'OBSERVE_24H':
        return {
          icon: <Clock className="h-6 w-6" />,
          color: 'bg-orange-100 text-orange-700 border-orange-300',
          label: 'Observe 24 Hours',
          description: 'Additional observation period needed'
        };
      default:
        return {
          icon: <Clock className="h-6 w-6" />,
          color: 'bg-gray-100 text-gray-700 border-gray-300',
          label: recommendation,
          description: 'Assessment in progress'
        };
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Home className="h-5 w-5 text-blue-600" />
          Discharge Readiness Assessment
        </CardTitle>
        <CardDescription>
          AI-powered evaluation of patient discharge criteria
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!result && (
          <Button 
            onClick={handleEvaluate} 
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Evaluating Discharge Readiness...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Evaluate Discharge Readiness
              </>
            )}
          </Button>
        )}

        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <div className="space-y-4">
            {/* Status Display */}
            {(() => {
              const config = getStatusConfig(result.recommendation);
              return (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${config.color}`}>
                      {config.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{config.label}</h3>
                      <p className="text-sm text-muted-foreground">{config.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Confidence: {Math.round(result.confidence * 100)}%
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleEvaluate}
                    disabled={loading}
                  >
                    Re-evaluate
                  </Button>
                </div>
              );
            })()}

            {/* Assessment Reasoning */}
            <Alert>
              <Brain className="h-4 w-4" />
              <AlertTitle>Assessment Reasoning</AlertTitle>
              <AlertDescription className="mt-2">
                {result.reasoning}
              </AlertDescription>
            </Alert>

            {/* Evaluation Criteria */}
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="mb-2"
              >
                {showDetails ? 'Hide' : 'Show'} Evaluation Criteria
              </Button>

              {showDetails && (
                <div className="space-y-2 pl-4 border-l-2 border-blue-300">
                  {result.rulePath.map((rule, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <ArrowRight className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-muted-foreground">{rule}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Items */}
            <div className={`rounded-lg p-4 border ${
              result.recommendation === 'READY' || result.recommendation === 'READY_WITH_HOME_CARE'
                ? 'bg-green-50 border-green-200'
                : 'bg-orange-50 border-orange-200'
            }`}>
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <CheckCircle className={`h-4 w-4 ${
                  result.recommendation === 'READY' || result.recommendation === 'READY_WITH_HOME_CARE'
                    ? 'text-green-600'
                    : 'text-orange-600'
                }`} />
                {result.recommendation === 'READY' || result.recommendation === 'READY_WITH_HOME_CARE'
                  ? 'Discharge Preparation Steps'
                  : 'Required Actions Before Discharge'}
              </h4>
              <ul className="space-y-1">
                {result.nextSteps.map((step, index) => (
                  <li key={index} className={`text-sm flex items-start gap-2 ${
                    result.recommendation === 'READY' || result.recommendation === 'READY_WITH_HOME_CARE'
                      ? 'text-green-900'
                      : 'text-orange-900'
                  }`}>
                    <span className={`font-bold mt-0.5 ${
                      result.recommendation === 'READY' || result.recommendation === 'READY_WITH_HOME_CARE'
                        ? 'text-green-600'
                        : 'text-orange-600'
                    }`}>•</span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>

            {/* Timestamp */}
            <p className="text-xs text-muted-foreground text-right">
              Evaluated: {new Date(result.timestamp).toLocaleString()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
