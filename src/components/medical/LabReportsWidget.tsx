import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, Download, Eye, Calendar, Lock, 
  AlertCircle, Filter, Search 
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LabReportViewer } from '@/components/medical/LabReportViewer';

interface LabReportsWidgetProps {
  patientId?: string; // For doctors/nurses viewing specific patient
  viewMode?: 'patient' | 'doctor' | 'nurse'; // Determines which endpoint to use
}

interface LabReport {
  _id: string;
  testName: string;
  patientId: { _id: string; name: string } | string;
  uploadedBy: { name: string; role: string } | string;
  reportType?: string;
  status: string;
  priority: string;
  date: string;
  createdAt: string;
  fileUrl?: string;
}

export const LabReportsWidget: React.FC<LabReportsWidgetProps> = ({ 
  patientId, 
  viewMode = 'patient' 
}) => {
  const [reports, setReports] = useState<LabReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<LabReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('authToken') : null;
  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const { toast } = useToast();

  useEffect(() => {
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  useEffect(() => {
    filterReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reports, searchQuery, statusFilter]);

  const loadReports = async () => {
    setLoading(true);
    try {
      let url = '';
      
      if (viewMode === 'patient') {
        // Patient viewing their own reports
        url = `${backendUrl}/api/lab/reports/my`;
      } else if (patientId) {
        // Doctor/Nurse viewing specific patient's reports
        url = `${backendUrl}/api/lab/reports/patient/${patientId}`;
      } else {
        toast({
          title: "Error",
          description: "No patient selected",
          variant: "destructive"
        });
        return;
      }

      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to load reports');
      }

      const data = await res.json();
      setReports(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to load lab reports', err);
      toast({
        title: "Error",
        description: err.message || "Failed to load lab reports",
        variant: "destructive"
      });
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const filterReports = () => {
    let filtered = [...reports];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        r.testName.toLowerCase().includes(query) ||
        r.reportType?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    setFilteredReports(filtered);
  };

  const handleViewReport = (reportId: string) => {
    setSelectedReportId(reportId);
    setIsViewerOpen(true);
  };

  const handleDownload = async (reportId: string, reportName: string) => {
    try {
      const res = await fetch(`${backendUrl}/api/lab/reports/${reportId}/download`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to download');
      }

      const data = await res.json();
      
      // Open file in new tab
      window.open(data.fileUrl, '_blank');

      toast({
        title: "Success",
        description: `Downloading ${reportName}`,
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to download report",
        variant: "destructive"
      });
    }
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, string> = {
      Routine: 'bg-gray-100 text-gray-800 border-gray-300',
      Urgent: 'bg-orange-100 text-orange-800 border-orange-300',
      STAT: 'bg-red-100 text-red-800 border-red-300'
    };
    return (
      <Badge variant="outline" className={variants[priority] || ''}>
        {priority}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      Pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      Processed: 'bg-blue-100 text-blue-800 border-blue-300',
      Reviewed: 'bg-green-100 text-green-800 border-green-300',
      Archived: 'bg-gray-100 text-gray-800 border-gray-300'
    };
    return (
      <Badge variant="outline" className={variants[status] || ''}>
        {status}
      </Badge>
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Lab Reports
              </CardTitle>
              <CardDescription>
                {viewMode === 'patient' 
                  ? 'View your lab test results' 
                  : 'Patient lab test results (View Only)'}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={loadReports} disabled={loading}>
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Read-Only Notice */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md flex items-center gap-2">
            <Lock className="h-4 w-4 text-blue-600 flex-shrink-0" />
            <p className="text-sm text-blue-800">
              <strong>View Only:</strong> You can view and download reports, but cannot edit or delete them.
            </p>
          </div>

          {/* Filters */}
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reports..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Processed">Processed</SelectItem>
                <SelectItem value="Reviewed">Reviewed</SelectItem>
                <SelectItem value="Archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reports List */}
          {loading ? (
            <div className="py-10 text-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading reports...</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="py-10 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="font-semibold text-muted-foreground">No lab reports found</p>
              <p className="text-sm text-muted-foreground mt-2">
                {reports.length === 0 
                  ? 'No reports have been uploaded yet.' 
                  : 'Try adjusting your filters.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReports.map((report) => (
                <div 
                  key={report._id} 
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{report.testName}</h4>
                        {getPriorityBadge(report.priority)}
                        {getStatusBadge(report.status)}
                      </div>
                      {report.reportType && (
                        <p className="text-sm text-muted-foreground mb-1">
                          Type: {report.reportType}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(report.date || report.createdAt).toLocaleDateString()}
                        </div>
                        <div>
                          Uploaded by:{' '}
                          <span className="font-medium">
                            {typeof report.uploadedBy === 'object' 
                              ? report.uploadedBy.name 
                              : 'Lab'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewReport(report._id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      {report.fileUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(report._id, report.testName)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* Uploaded by Lab badge */}
                  <div className="mt-3 pt-3 border-t flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded">
                      <FileText className="h-3 w-3 text-primary" />
                      <span>Uploaded by Lab User</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Report Viewer Dialog */}
      <Dialog open={isViewerOpen} onOpenChange={setIsViewerOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedReportId && (
            <LabReportViewer 
              reportId={selectedReportId} 
              onClose={() => setIsViewerOpen(false)} 
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LabReportsWidget;
