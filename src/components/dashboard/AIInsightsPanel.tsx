import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp, AlertTriangle, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { apiRequest } from "@/hooks/useApi";
import { useSocket } from "@/hooks/useSocket";

interface AIInsight {
  alertId: string;
  patientName: string;
  nursePriority: string;
  aiPriority: string;
  aiConfidence: number;
  details: string;
  createdAt: string;
  outcome?: 'correct' | 'incorrect' | 'pending';
}

interface AIMetrics {
  totalClassifications: number;
  accuracy: number;
  highConfidenceCorrect: number;
  disagreements: number;
  avgConfidence: number;
}

export const AIInsightsPanel = () => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [metrics, setMetrics] = useState<AIMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const { socket, connected } = useSocket();

  useEffect(() => {
    fetchAIInsights();
  }, []);

  // Listen for real-time AI classification events
  useEffect(() => {
    if (!socket || !connected) return;

    const handleNewClassification = () => {
      console.log('New AI classification received, refreshing insights...');
      fetchAIInsights();
    };

    socket.on('ai_classification', handleNewClassification);
    socket.on('emergency_alert', handleNewClassification);

    return () => {
      socket.off('ai_classification', handleNewClassification);
      socket.off('emergency_alert', handleNewClassification);
    };
  }, [socket, connected]);

  const fetchAIInsights = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/api/ai-insights/metrics?limit=50');
      
      if (data) {
        setMetrics(data.metrics || null);
        setInsights(data.disagreements || []);
      }
    } catch (error) {
      console.error('Failed to fetch AI insights:', error);
      // Fallback to empty data
      setMetrics({
        totalClassifications: 0,
        accuracy: 0,
        highConfidenceCorrect: 0,
        disagreements: 0,
        avgConfidence: 0
      });
      setInsights([]);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-orange-100 text-orange-700';
      case 'low': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getOutcomeIcon = (outcome?: string) => {
    switch (outcome) {
      case 'correct': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'incorrect': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading AI insights...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Metrics Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            AI Classification Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-3 border border-border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{metrics?.totalClassifications || 0}</div>
              <div className="text-xs text-muted-foreground mt-1">Total Classifications</div>
            </div>
            <div className="text-center p-3 border border-border rounded-lg">
              <div className="text-2xl font-bold text-green-600">{metrics?.accuracy || 0}%</div>
              <div className="text-xs text-muted-foreground mt-1">Overall Accuracy</div>
            </div>
            <div className="text-center p-3 border border-border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{metrics?.highConfidenceCorrect || 0}%</div>
              <div className="text-xs text-muted-foreground mt-1">High Confidence Correct</div>
            </div>
            <div className="text-center p-3 border border-border rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{metrics?.disagreements || 0}</div>
              <div className="text-xs text-muted-foreground mt-1">Disagreements</div>
            </div>
            <div className="text-center p-3 border border-border rounded-lg">
              <div className="text-2xl font-bold text-indigo-600">{metrics?.avgConfidence || 0}%</div>
              <div className="text-xs text-muted-foreground mt-1">Avg Confidence</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Disagreements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-orange-600" />
            AI vs Nurse Priority Disagreements
          </CardTitle>
        </CardHeader>
        <CardContent>
          {insights.filter(i => i.nursePriority !== i.aiPriority).length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              No recent disagreements found
            </div>
          ) : (
            <div className="space-y-3">
              {insights
                .filter(i => i.nursePriority !== i.aiPriority)
                .map((insight) => (
                  <div key={insight.alertId} className="p-3 border border-border rounded-lg">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-sm">{insight.patientName}</span>
                          {getOutcomeIcon(insight.outcome)}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{insight.details}</p>
                        <div className="flex items-center gap-3 text-xs">
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">Nurse:</span>
                            <Badge className={getPriorityColor(insight.nursePriority)}>
                              {insight.nursePriority.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">AI:</span>
                            <Badge className={getPriorityColor(insight.aiPriority)}>
                              {insight.aiPriority.toUpperCase()}
                            </Badge>
                            <span className="text-muted-foreground">({insight.aiConfidence}%)</span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(insight.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Training Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            Training Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Chest Pain Keywords</p>
                  <p className="text-xs text-blue-700 mt-1">
                    AI correctly identified 8/10 high-priority chest pain cases. Consider reviewing cases where "mild chest discomfort" was marked as medium priority.
                  </p>
                </div>
              </div>
            </div>
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-900">Routine Check-ups</p>
                  <p className="text-xs text-green-700 mt-1">
                    AI shows 95% accuracy in identifying low-priority routine alerts. No training needed.
                  </p>
                </div>
              </div>
            </div>
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-start gap-2">
                <TrendingUp className="h-4 w-4 text-orange-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-orange-900">Respiratory Symptoms</p>
                  <p className="text-xs text-orange-700 mt-1">
                    AI tends to over-prioritize respiratory symptoms. Consider adding more training data for "shortness of breath" context.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
