import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles, FileText } from "lucide-react";
import { apiRequest } from "@/hooks/useApi";

interface CreateMedicalRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: {
    patientId: string;
    title: string;
    type: string;
    diagnosis?: string;
    summary?: string;
    status: string;
  }) => Promise<void>;
  patients: Array<{ _id: string; name: string }>;
  isLoading?: boolean;
}

export function CreateMedicalRecordDialog({
  open,
  onOpenChange,
  onSave,
  patients,
  isLoading = false
}: CreateMedicalRecordDialogProps) {
  const [formData, setFormData] = useState({
    patientId: '',
    title: '',
    type: 'Consultation',
    diagnosis: '',
    summary: '',
    status: 'Final'
  });
  const [aiSuggestion, setAiSuggestion] = useState<{ type: string; confidence: number } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);

  // Debounced AI classification
  const analyzeText = useCallback(async (title: string, summary: string, diagnosis: string) => {
    const combinedText = `${title} ${summary} ${diagnosis}`.trim();
    
    if (!combinedText || combinedText.length < 10 || !aiEnabled) {
      setAiSuggestion(null);
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await apiRequest('/api/medical-records/classify-type', {
        method: 'POST',
        body: JSON.stringify({ title, summary, diagnosis }),
      });

      if (result && result.label && result.scores) {
        const confidence = Math.round(result.scores[result.label] * 100);
        setAiSuggestion({ type: result.label, confidence });
        
        // Auto-select AI suggestion if confidence is high
        if (confidence >= 75) {
          setFormData(prev => ({ ...prev, type: result.label }));
        }
      }
    } catch (error) {
      console.error('AI classification failed:', error);
      setAiSuggestion(null);
    } finally {
      setIsAnalyzing(false);
    }
  }, [aiEnabled]);

  // Debounce text analysis
  useEffect(() => {
    const timer = setTimeout(() => {
      analyzeText(formData.title, formData.summary, formData.diagnosis);
    }, 1000);

    return () => clearTimeout(timer);
  }, [formData.title, formData.summary, formData.diagnosis, analyzeText]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patientId || !formData.title) return;
    
    await onSave(formData);
    
    // Reset form
    setFormData({
      patientId: '',
      title: '',
      type: 'Consultation',
      diagnosis: '',
      summary: '',
      status: 'Final'
    });
    setAiSuggestion(null);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Create Medical Record
            </DialogTitle>
            <DialogDescription>
              Add a new medical record for a patient. AI will suggest the record type based on your input.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Patient Selection */}
            <div className="space-y-2">
              <Label htmlFor="patientId">Patient *</Label>
              <Select value={formData.patientId} onValueChange={(value) => handleChange('patientId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient._id} value={patient._id}>
                      {patient.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="e.g., Annual Physical Examination"
                required
              />
            </div>

            {/* Record Type with AI Suggestion */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="type">Record Type *</Label>
                {aiSuggestion && (
                  <div className="flex items-center gap-2 text-xs">
                    <Sparkles className="h-3 w-3 text-purple-500" />
                    <span className="text-muted-foreground">
                      AI suggests: <span className="font-semibold text-foreground">{aiSuggestion.type}</span>
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
              <Select value={formData.type} onValueChange={(value) => handleChange('type', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Consultation">Consultation</SelectItem>
                  <SelectItem value="Lab Results">Lab Results</SelectItem>
                  <SelectItem value="Assessment">Assessment</SelectItem>
                  <SelectItem value="Imaging">Imaging</SelectItem>
                  <SelectItem value="Prescription">Prescription</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Summary */}
            <div className="space-y-2">
              <Label htmlFor="summary">Summary</Label>
              <Textarea
                id="summary"
                value={formData.summary}
                onChange={(e) => handleChange('summary', e.target.value)}
                placeholder="Brief summary of the record..."
                rows={3}
              />
            </div>

            {/* Diagnosis */}
            <div className="space-y-2">
              <Label htmlFor="diagnosis">Diagnosis</Label>
              <Textarea
                id="diagnosis"
                value={formData.diagnosis}
                onChange={(e) => handleChange('diagnosis', e.target.value)}
                placeholder="Diagnosis or findings..."
                rows={3}
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Final">Final</SelectItem>
                  <SelectItem value="Pending">Pending Review</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !formData.patientId || !formData.title}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Record
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
