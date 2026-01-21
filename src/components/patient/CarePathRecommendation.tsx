import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Brain, Loader2, CheckCircle, AlertTriangle, TrendingUp, ArrowRight } from 'lucide-react';
import { useCarePath, DecisionResult } from '@/hooks/useDecisionTree';
import { useToast } from '@/hooks/use-toast';

interface CarePathRecommendationProps {
  patientId: string;
  patientName?: string;
  refreshTrigger?: number; // Add trigger to force refresh
}

export const CarePathRecommendation = ({ patientId, patientName, refreshTrigger }: CarePathRecommendationProps) => {
  const { getRecommendation, loading, error, result } = useCarePath();
  const { toast } = useToast();
  const [showDetails, setShowDetails] = useState(false);

  // Auto-refresh when patient changes or vitals are updated
  useEffect(() => {
    if (result) {
      // Only auto-refresh if there's already a result showing
      handleGetRecommendation();
    }
  }, [patientId, refreshTrigger]);

  const handleGetRecommendation = async () => {
    try {
      await getRecommendation(patientId);
      toast({
        title: '✅ AI Recommendation Generated',
        description: 'Care path recommendation based on current patient data',
      });
      setShowDetails(true);
    } catch (err) {
      toast({
        title: '❌ Failed to Generate Recommendation',
        description: error || 'Please try again',
        variant: 'destructive',
      });
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    if (recommendation.includes('ICU') || recommendation.includes('EMERGENCY')) {
      return 'bg-red-100 text-red-700 border-red-300';
    }
    if (recommendation.includes('CONSULT') || recommendation.includes('PROTOCOL')) {
      return 'bg-orange-100 text-orange-700 border-orange-300';
    }
    if (recommendation.includes('DISCHARGE')) {
      return 'bg-green-100 text-green-700 border-green-300';
    }
    return 'bg-blue-100 text-blue-700 border-blue-300';
  };

  const getRecommendationIcon = (recommendation: string) => {
    if (recommendation.includes('ICU') || recommendation.includes('EMERGENCY')) {
      return <AlertTriangle className="h-5 w-5" />;
    }
    if (recommendation.includes('DISCHARGE')) {
      return <CheckCircle className="h-5 w-5" />;
    }
    return <TrendingUp className="h-5 w-5" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-600" />
          AI Care Path Recommendation
        </CardTitle>
        <CardDescription>
          Get explainable AI recommendations based on patient vitals and conditions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!result && (
          <Button 
            onClick={handleGetRecommendation} 
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing Patient Data...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Generate Care Path Recommendation
              </>
            )}
          </Button>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <div className="space-y-4">
            {/* Recommendation Badge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg ${getRecommendationColor(result.recommendation)}`}>
                  {getRecommendationIcon(result.recommendation)}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    {result.recommendation.replace(/_/g, ' ')}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Confidence: {Math.round(result.confidence * 100)}%
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleGetRecommendation}
                disabled={loading}
              >
                Refresh
              </Button>
            </div>

            {/* Reasoning */}
            <Alert>
              <Brain className="h-4 w-4" />
              <AlertTitle>AI Reasoning</AlertTitle>
              <AlertDescription className="mt-2">
                {result.reasoning}
              </AlertDescription>
            </Alert>

            {/* Decision Path */}
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="mb-2"
              >
                {showDetails ? 'Hide' : 'Show'} Decision Path
              </Button>

              {showDetails && (
                <div className="space-y-2 pl-4 border-l-2 border-purple-300">
                  {result.rulePath.map((rule, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <ArrowRight className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-muted-foreground">{rule}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Next Steps */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                Recommended Next Steps
              </h4>
              <ul className="space-y-1">
                {result.nextSteps.map((step, index) => (
                  <li key={index} className="text-sm text-blue-900 flex items-start gap-2">
                    <span className="text-blue-600 font-bold mt-0.5">•</span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>

            {/* Timestamp */}
            <p className="text-xs text-muted-foreground text-right">
              Generated: {new Date(result.timestamp).toLocaleString()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
