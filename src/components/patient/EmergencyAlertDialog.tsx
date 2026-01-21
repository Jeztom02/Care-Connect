import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2, AlertTriangle, Sparkles } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { apiRequest } from "@/hooks/useApi";

interface EmergencyAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAlert: (details: { priority: 'high' | 'medium' | 'low', details: string }) => Promise<void>;
  isLoading?: boolean;
  patientId?: string;
}

export function EmergencyAlertDialog({ open, onOpenChange, onAlert, isLoading = false, patientId }: EmergencyAlertDialogProps) {
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('high');
  const [details, setDetails] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{ priority: string; confidence: number } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);

  // Debounced AI classification
  const analyzeText = useCallback(async (text: string, currentPriority: string) => {
    console.log('[EmergencyAlertDialog] analyzeText called:', { text, currentPriority, patientId, textLength: text.length });
    
    if (!text.trim() || text.length < 10 || !aiEnabled) {
      console.log('[EmergencyAlertDialog] Skipping AI analysis:', { 
        hasText: !!text.trim(), 
        length: text.length, 
        aiEnabled 
      });
      setAiSuggestion(null);
      return;
    }

    console.log('[EmergencyAlertDialog] Starting AI classification...');
    setIsAnalyzing(true);
    try {
      const requestBody = { 
        title: 'Emergency Alert', 
        message: text,
        userSelection: currentPriority, // Send current selection for tracking
        patientId: patientId // Include patientId for tracking
      };
      console.log('[EmergencyAlertDialog] Request body:', requestBody);
      
      const result = await apiRequest('/api/alerts/classify-priority', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      console.log('[EmergencyAlertDialog] AI result:', result);

      if (result && result.label && result.scores) {
        const mappedPriority = result.label.toLowerCase() === 'critical' ? 'high' : result.label.toLowerCase();
        const confidence = Math.round(result.scores[result.label] * 100);
        setAiSuggestion({ priority: mappedPriority, confidence });
        console.log('[EmergencyAlertDialog] AI suggestion set:', { mappedPriority, confidence });
        
        // Auto-select AI suggestion if confidence is high
        if (confidence >= 70 && ['high', 'medium', 'low'].includes(mappedPriority)) {
          setPriority(mappedPriority as 'high' | 'medium' | 'low');
          console.log('[EmergencyAlertDialog] Auto-selected priority:', mappedPriority);
        }
      }
    } catch (error) {
      console.error('[EmergencyAlertDialog] AI classification failed:', error);
      setAiSuggestion(null);
    } finally {
      setIsAnalyzing(false);
    }
  }, [aiEnabled, patientId]);

  // Debounce text analysis
  useEffect(() => {
    const timer = setTimeout(() => {
      analyzeText(details, priority);
    }, 1000);

    return () => clearTimeout(timer);
  }, [details, priority, analyzeText]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfirmed) {
      setIsConfirmed(true);
      return;
    }
    await onAlert({ priority, details });
    setDetails('');
    setIsConfirmed(false);
    setAiSuggestion(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {isConfirmed ? 'Confirm Emergency Alert' : 'Trigger Emergency Alert'}
            </DialogTitle>
            <DialogDescription>
              {isConfirmed 
                ? 'Please confirm this emergency alert. This will notify the medical team immediately.'
                : 'Use this only for urgent medical situations requiring immediate attention.'}
            </DialogDescription>
          </DialogHeader>
          
          {!isConfirmed ? (
            <div className="space-y-4 py-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                  This will notify the emergency response team. Only use for genuine emergencies.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="priority">Priority Level</Label>
                  {aiSuggestion && (
                    <div className="flex items-center gap-2 text-xs">
                      <Sparkles className="h-3 w-3 text-purple-500" />
                      <span className="text-muted-foreground">
                        AI suggests: <span className="font-semibold text-foreground">{aiSuggestion.priority.toUpperCase()}</span>
                        {' '}({aiSuggestion.confidence}% confidence)
                      </span>
                    </div>
                  )}
                  {isAnalyzing && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Analyzing...
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={priority === 'high' ? 'destructive' : 'outline'}
                    className="flex-1"
                    onClick={() => setPriority('high')}
                  >
                    High
                  </Button>
                  <Button
                    type="button"
                    variant={priority === 'medium' ? 'destructive' : 'outline'}
                    className="flex-1"
                    onClick={() => setPriority('medium')}
                  >
                    Medium
                  </Button>
                  <Button
                    type="button"
                    variant={priority === 'low' ? 'destructive' : 'outline'}
                    className="flex-1"
                    onClick={() => setPriority('low')}
                  >
                    Low
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="details">Emergency Details</Label>
                <Textarea
                  id="details"
                  placeholder="Describe the emergency situation..."
                  className="min-h-[100px]"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  required
                />
              </div>
            </div>
          ) : (
            <div className="py-4">
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Emergency Alert - {priority.charAt(0).toUpperCase() + priority.slice(1)} Priority</AlertTitle>
                <AlertDescription className="mt-2">
                  {details}
                </AlertDescription>
              </Alert>
              <p className="text-sm text-muted-foreground">
                Are you sure you want to send this emergency alert? The medical team will be notified immediately.
              </p>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                if (isConfirmed) {
                  setIsConfirmed(false);
                } else {
                  onOpenChange(false);
                }
              }}
              disabled={isLoading}
            >
              {isConfirmed ? 'Back' : 'Cancel'}
            </Button>
            <Button 
              type="submit" 
              variant="destructive"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : isConfirmed ? (
                'Confirm Emergency Alert'
              ) : (
                'Trigger Alert'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
