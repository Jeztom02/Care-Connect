import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Download, FileText, User, Calendar, AlertCircle, 
  Lock, Eye, Clock, CheckCircle 
} from 'lucide-react';

interface LabReportViewerProps {
  reportId: string;
  onClose?: () => void;
}

interface LabReport {
  _id: string;
  testName: string;
  patientId: { _id: string; name: string; age?: number; gender?: string; email?: string };
  doctorId?: { _id: string; name: string; email?: string };
  uploadedBy: { _id: string; name: string; role: string };
  fileUrl?: string;
  fileName?: string;
  fileMimeType?: string;
  reportType?: string;
  status: string;
  priority: string;
  remarks?: string;
  notes?: string;
  date: string;
  createdAt: string;
  updatedAt: string;
  extractedResults?: Array<{
    testName: string;
    value: any;
    unit?: string;
    normalRange?: string;
    status?: string;
  }>;
}

export const LabReportViewer: React.FC<LabReportViewerProps> = ({ reportId, onClose }) => {
  const [report, setReport] = useState<LabReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('authToken') : null;
  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const { toast } = useToast();

  useEffect(() => {
    // Get user role from localStorage
    const role = typeof localStorage !== 'undefined' ? localStorage.getItem('userRole') : null;
    setUserRole(role);
    
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportId]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/lab/reports/${reportId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to load report');
      }

      const data = await res.json();
      setReport(data);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to load report",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!report?.fileUrl) {
      toast({
        title: "Error",
        description: "No file available for download",
        variant: "destructive"
      });
      return;
    }

    setDownloading(true);
    try {
      const res = await fetch(`${backendUrl}/api/lab/reports/${reportId}/download`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to download');
      }

      const data = await res.json();
      
      // Open file in new tab or trigger download
      window.open(data.fileUrl, '_blank');

      toast({
        title: "Success",
        description: "Report download started",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to download report",
        variant: "destructive"
      });
    } finally {
      setDownloading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Clock className="h-4 w-4" />;
      case 'Processed':
        return <Eye className="h-4 w-4" />;
      case 'Reviewed':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, string> = {
      Routine: 'bg-gray-100 text-gray-800',
      Urgent: 'bg-orange-100 text-orange-800',
      STAT: 'bg-red-100 text-red-800'
    };
    return <Badge className={variants[priority] || ''}>{priority}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      Pending: 'bg-yellow-100 text-yellow-800',
      Processed: 'bg-blue-100 text-blue-800',
      Reviewed: 'bg-green-100 text-green-800',
      Archived: 'bg-gray-100 text-gray-800'
    };
    return <Badge className={variants[status] || ''}>{status}</Badge>;
  };

  const getResultStatusColor = (status?: string) => {
    switch (status) {
      case 'Normal':
        return 'text-green-600';
      case 'Abnormal':
        return 'text-orange-600';
      case 'Critical':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  // Check if user can edit (only lab users)
  const canEdit = userRole === 'lab';

  if (loading) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading report...</p>
        </CardContent>
      </Card>
    );
  }

  if (!report) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="font-semibold">Report not found</p>
          {onClose && (
            <Button onClick={onClose} variant="outline" className="mt-4">
              Go Back
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <FileText className="h-6 w-6 text-primary" />
                <CardTitle className="text-2xl">{report.testName}</CardTitle>
              </div>
              <CardDescription className="text-base">
                {report.reportType || 'Lab Report'}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {getPriorityBadge(report.priority)}
              {getStatusBadge(report.status)}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Patient Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <User className="h-4 w-4" />
                Patient Information
              </div>
              <div className="space-y-2 pl-6">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{report.patientId.name}</p>
                </div>
                {report.patientId.age && (
                  <div>
                    <p className="text-sm text-muted-foreground">Age / Gender</p>
                    <p className="font-medium">
                      {report.patientId.age} years / {report.patientId.gender || 'N/A'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Report Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Report Information
              </div>
              <div className="space-y-2 pl-6">
                <div>
                  <p className="text-sm text-muted-foreground">Report Date</p>
                  <p className="font-medium">{new Date(report.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Uploaded By</p>
                  <p className="font-medium">{report.uploadedBy.name}</p>
                  <Badge variant="outline" className="mt-1">{report.uploadedBy.role}</Badge>
                </div>
                {report.doctorId && (
                  <div>
                    <p className="text-sm text-muted-foreground">Assigned Doctor</p>
                    <p className="font-medium">{report.doctorId.name}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 pt-6 border-t flex gap-3">
            {report.fileUrl && (
              <Button onClick={handleDownload} disabled={downloading}>
                <Download className="h-4 w-4 mr-2" />
                {downloading ? 'Downloading...' : 'Download Report'}
              </Button>
            )}
            {onClose && (
              <Button onClick={onClose} variant="outline">
                Close
              </Button>
            )}
          </div>

          {/* Read-Only Notice for non-Lab users */}
          {!canEdit && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md flex items-center gap-2">
              <Lock className="h-4 w-4 text-blue-600" />
              <p className="text-sm text-blue-800">
                <strong>View Only:</strong> You have read-only access to this report. 
                Only Lab users can edit or delete reports.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Extracted Results */}
      {report.extractedResults && report.extractedResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>Extracted laboratory values</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {report.extractedResults.map((result, idx) => (
                <div key={idx} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-semibold">{result.testName}</p>
                      {result.normalRange && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Normal Range: {result.normalRange}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${getResultStatusColor(result.status)}`}>
                        {result.value} {result.unit || ''}
                      </p>
                      {result.status && (
                        <Badge 
                          variant={result.status === 'Normal' ? 'default' : 'destructive'} 
                          className="mt-1"
                        >
                          {result.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Remarks & Notes */}
      {(report.remarks || report.notes) && (
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {report.remarks && (
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-2">Remarks</p>
                <p className="text-sm bg-accent/30 p-3 rounded-md">{report.remarks}</p>
              </div>
            )}
            {report.notes && canEdit && (
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-2">Technical Notes (Lab Only)</p>
                <p className="text-sm bg-yellow-50 border border-yellow-200 p-3 rounded-md">{report.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Report Metadata</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Report ID</p>
              <p className="font-mono text-xs">{report._id}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Created</p>
              <p>{new Date(report.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Last Updated</p>
              <p>{new Date(report.updatedAt).toLocaleString()}</p>
            </div>
            {report.fileName && (
              <div>
                <p className="text-muted-foreground">File Name</p>
                <p className="truncate">{report.fileName}</p>
              </div>
            )}
            {report.fileMimeType && (
              <div>
                <p className="text-muted-foreground">File Type</p>
                <p>{report.fileMimeType}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Label indicating uploaded by Lab */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2 bg-primary/10 px-3 py-1 rounded-full">
          <CheckCircle className="h-4 w-4 text-primary" />
          <span>Uploaded by Lab User: <strong>{report.uploadedBy.name}</strong></span>
        </div>
      </div>
    </div>
  );
};

export default LabReportViewer;
