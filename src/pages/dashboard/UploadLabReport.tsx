import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Patient {
  _id: string;
  name: string;
  age?: number;
  gender?: string;
  phone?: string;
  email?: string;
}

export const UploadLabReport: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    testName: '',
    patientId: '',
    doctorId: '',
    reportType: '',
    priority: 'Routine',
    status: 'Pending',
    remarks: '',
    notes: ''
  });

  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('authToken') : null;
  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    setLoadingPatients(true);
    try {
      const res = await fetch(`${backendUrl}/api/patients`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      setPatients(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load patients', err);
      toast({
        title: "Error",
        description: "Failed to load patient list",
        variant: "destructive"
      });
    } finally {
      setLoadingPatients(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('reportFile', selectedFile);
      uploadFormData.append('testName', formData.testName);
      uploadFormData.append('patientId', formData.patientId);
      if (formData.doctorId) uploadFormData.append('doctorId', formData.doctorId);
      if (formData.reportType) uploadFormData.append('reportType', formData.reportType);
      uploadFormData.append('priority', formData.priority);
      uploadFormData.append('status', formData.status);
      if (formData.remarks) uploadFormData.append('remarks', formData.remarks);
      if (formData.notes) uploadFormData.append('notes', formData.notes);

      const res = await fetch(`${backendUrl}/api/lab/reports`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: uploadFormData
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Upload failed');
      }

      toast({
        title: "Success",
        description: "Lab report uploaded successfully",
      });

      // Reset form
      setFormData({
        testName: '',
        patientId: '',
        doctorId: '',
        reportType: '',
        priority: 'Routine',
        status: 'Pending',
        remarks: '',
        notes: ''
      });
      setSelectedFile(null);
      
      // Navigate back to lab dashboard
      setTimeout(() => {
        const userRole = localStorage.getItem('userRole');
        navigate(`/dashboard/${userRole}`);
      }, 1500);
      
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to upload report",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-6 w-6 text-primary" />
            Upload Lab Report
          </CardTitle>
          <CardDescription>
            Upload official lab reports (PDF/images) and enter structured test results.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="testName">Test Name *</Label>
                <Input
                  id="testName"
                  value={formData.testName}
                  onChange={(e) => setFormData({ ...formData, testName: e.target.value })}
                  placeholder="e.g., Complete Blood Count"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="patientId">Patient Name *</Label>
                <Select 
                  value={formData.patientId} 
                  onValueChange={(v) => setFormData({ ...formData, patientId: v })}
                  required
                >
                  <SelectTrigger id="patientId">
                    <SelectValue placeholder={loadingPatients ? "Loading patients..." : "Select a patient"} />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingPatients ? (
                      <SelectItem value="_loading" disabled>Loading patients...</SelectItem>
                    ) : patients.length === 0 ? (
                      <SelectItem value="_empty" disabled>No patients found</SelectItem>
                    ) : (
                      patients.map((patient) => (
                        <SelectItem key={patient._id} value={patient._id}>
                          {patient.name}
                          {(patient.gender || patient.age) && (
                            <span className="text-xs text-muted-foreground ml-2">
                              ({patient.gender && patient.gender}{patient.age && `, ${patient.age}y`})
                            </span>
                          )}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {formData.patientId && patients.find(p => p._id === formData.patientId) && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Selected: {patients.find(p => p._id === formData.patientId)?.name}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="reportType">Report Type</Label>
                <Input
                  id="reportType"
                  value={formData.reportType}
                  onChange={(e) => setFormData({ ...formData, reportType: e.target.value })}
                  placeholder="e.g., Blood Test, X-Ray"
                />
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Routine">Routine</SelectItem>
                    <SelectItem value="Urgent">Urgent</SelectItem>
                    <SelectItem value="STAT">STAT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="reportFile">Upload Report Document *</Label>
              <Input
                id="reportFile"
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    // Validate file size (10MB max)
                    if (file.size > 10 * 1024 * 1024) {
                      toast({
                        title: "Error",
                        description: "File size must be less than 10MB",
                        variant: "destructive"
                      });
                      e.target.value = '';
                      return;
                    }
                    setSelectedFile(file);
                  }
                }}
                required
                className="cursor-pointer"
              />
              {selectedFile && (
                <div className="flex items-center gap-2 mt-2 p-2 bg-green-50 dark:bg-green-950 rounded-md">
                  <FileText className="h-4 w-4 text-green-600" />
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                  </p>
                  <Check className="h-4 w-4 text-green-600 ml-auto" />
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Accepted formats: PDF, DOC, DOCX, JPG, PNG (Max 10MB)
              </p>
            </div>

            <div>
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                rows={3}
                placeholder="Any additional remarks or observations..."
              />
            </div>

            <div>
              <Label htmlFor="notes">Technical Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                placeholder="Technical notes for lab staff..."
              />
            </div>

            <div className="flex gap-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  const userRole = localStorage.getItem('userRole');
                  navigate(`/dashboard/${userRole}`);
                }}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={uploading} className="flex-1">
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Report
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UploadLabReport;
