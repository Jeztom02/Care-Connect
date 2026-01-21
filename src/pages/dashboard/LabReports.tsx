import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, Upload, Scan, Search, Filter, 
  Download, Eye, Trash2, CheckCircle, AlertCircle, RefreshCw 
} from "lucide-react";
import {
  Table,
  TableBody,
  TableHeader,
  TableRow,
  TableHead,
  TableCell
} from "@/components/ui/table";
import labRequestService from '@/services/labRequestService';

export const LabReports = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [historyFileUrl, setHistoryFileUrl] = useState('');
  const [historyDescription, setHistoryDescription] = useState('');
  const [submittingHistory, setSubmittingHistory] = useState(false);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const userRole = typeof localStorage !== 'undefined' ? localStorage.getItem('userRole') : null;
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('authToken') : null;

  const [reports, setReports] = useState<any[]>([]);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [labRequests, setLabRequests] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [reportsError, setReportsError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [requestsError, setRequestsError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'reports' | 'results' | 'history' | 'requests'>('reports');

  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const exampleMock = [
    { id: '1', name: 'Blood_Count_Complete.pdf', date: '2024-03-15', type: 'Hematology', status: 'Processed', doctor: 'Dr. Wilson' },
    { id: '2', name: 'Lipid_Profile.pdf', date: '2024-03-10', type: 'Biochemistry', status: 'Processed', doctor: 'Dr. Chen' },
    { id: '3', name: 'Urinalysis_Report.pdf', date: '2024-03-08', type: 'Pathology', status: 'Pending OCR', doctor: 'Dr. Smith' },
  ];

  // Memoize load functions so they can be called from refresh
  const loadReports = useCallback(async () => {
    setLoadingReports(true);
    setReportsError(null);
    try {
      let res: Response | null = null;
      if (userRole === 'patient') {
        res = await fetch(`${backendUrl}/api/lab/reports/my`, { headers: { Authorization: `Bearer ${token}` } });
      } else if (userRole === 'doctor' || userRole === 'nurse' || userRole === 'lab' || userRole === 'admin') {
        // Use the main reports endpoint - backend now allows doctor/nurse access
        res = await fetch(`${backendUrl}/api/lab/reports`, { headers: { Authorization: `Bearer ${token}` } });
      }

      if (!res) {
        setReports([]);
        setReportsError('No accessible reports endpoint for this role');
        return;
      }

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to fetch reports');
      }

      const data = await res.json();
      setReports(Array.isArray(data) ? data : (data.reports || []));
    } catch (err: any) {
      setReportsError(err?.message || 'Failed to load reports');
      setReports([]);
    } finally {
      setLoadingReports(false);
    }
  }, [backendUrl, token, userRole]);

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    setHistoryError(null);
    try {
      let res: Response | null = null;
      if (userRole === 'patient') {
        res = await fetch(`${backendUrl}/api/lab/history/my`, { headers: { Authorization: `Bearer ${token}` } });
      } else if (userRole === 'doctor' || userRole === 'nurse') {
        const patientId = localStorage.getItem('viewPatientId');
        if (!patientId) {
          setHistoryError('No patient selected');
          setHistoryItems([]);
          return;
        }
        res = await fetch(`${backendUrl}/api/lab/history/patient/${patientId}`, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        res = null;
      }

      if (!res) {
        setHistoryItems([]);
        return;
      }

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to fetch history');
      }

      const data = await res.json();
      setHistoryItems(Array.isArray(data) ? data : (data.history || []));
    } catch (err: any) {
      setHistoryError(err?.message || 'Failed to load history');
      setHistoryItems([]);
    } finally {
      setLoadingHistory(false);
    }
  }, [backendUrl, token, userRole]);

  const loadLabRequests = useCallback(async () => {
    if (userRole !== 'patient') return;
    
    setLoadingRequests(true);
    setRequestsError(null);
    try {
      const requests = await labRequestService.getMyLabRequests();
      setLabRequests(requests);
    } catch (err: any) {
      setRequestsError(err?.message || 'Failed to load lab requests');
      setLabRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  }, [userRole]);

  // Refresh all data
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([loadReports(), loadHistory(), loadLabRequests()]);
    setIsRefreshing(false);
  }, [loadReports, loadHistory, loadLabRequests]);

  useEffect(() => {
    loadReports();
    loadHistory();
    loadLabRequests();
  }, [loadReports, loadHistory, loadLabRequests]);

  // Auto-refresh every 30 seconds for doctors/nurses/lab users to see status updates
  useEffect(() => {
    if (userRole === 'doctor' || userRole === 'nurse' || userRole === 'lab') {
      const interval = setInterval(() => {
        loadReports();
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [userRole, loadReports]);

  return (
    <div className="space-y-6">

      {/* Upload Area */}
      {isUploading && (
        <Card className="border-dashed border-2 border-primary/20 bg-primary/5 animate-in fade-in slide-in-from-top-4">
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <div className="p-4 rounded-full bg-background shadow-sm mb-4">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">Drop your lab report here</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Support for PDF, JPG, PNG. AI OCR will automatically extract values.
            </p>
            <div className="flex gap-3">
              <Button variant="outline">Browse Files</Button>
              <Button>Start Upload</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reports List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Reports</CardTitle>
              <div className="flex gap-2">
                <div className="relative w-48">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search reports..." className="pl-8 h-9" />
                </div>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-9 w-9"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  title="Refresh data"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
                <Button variant="outline" size="icon" className="h-9 w-9">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="flex gap-2">
                <button className={`px-3 py-1 rounded ${activeTab === 'reports' ? 'bg-primary text-white' : 'bg-muted/10'}`} onClick={() => setActiveTab('reports')}>Reports</button>
                <button className={`px-3 py-1 rounded ${activeTab === 'results' ? 'bg-primary text-white' : 'bg-muted/10'}`} onClick={() => setActiveTab('results')}>Test Results</button>
                <button className={`px-3 py-1 rounded ${activeTab === 'history' ? 'bg-primary text-white' : 'bg-muted/10'}`} onClick={() => setActiveTab('history')}>Previous History</button>
                {userRole === 'patient' && (
                  <button className={`px-3 py-1 rounded ${activeTab === 'requests' ? 'bg-primary text-white' : 'bg-muted/10'}`} onClick={() => setActiveTab('requests')}>Lab Requests</button>
                )}
              </div>
            </div>

            {/* Content per tab */}
            {activeTab === 'reports' && (
              <>
                {/* reports table rendered below */}
              </>
            )}
            {activeTab === 'results' && (
              <div className="p-4">
                {loadingReports ? (
                  <div>Loading results...</div>
                ) : reports.length === 0 ? (
                  <div className="text-muted-foreground">No structured results available</div>
                ) : (
                  <div className="space-y-3">
                    {reports.flatMap(r => (r.extractedResults || []).map((res: any, idx: number) => ({ ...res, reportName: r.name, reportId: r._id || r.id, key: `${r.id}-${idx}` }))).map((item: any) => (
                      <div key={item.key} className="p-3 border rounded bg-white">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">{item.testName}</div>
                            <div className="text-sm text-muted-foreground">{item.unit} — Normal: {item.normalRange}</div>
                          </div>
                          <div className={`font-semibold ${item.status === 'abnormal' ? 'text-red-600' : 'text-foreground'}`}>{String(item.value)}</div>
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">Source: {item.reportName}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {activeTab === 'history' && (
              <div>
                {loadingHistory ? <div>Loading history...</div> : historyItems.length === 0 ? <div className="text-muted-foreground">No history uploaded</div> : (
                  <div className="space-y-3">
                    {historyItems.map(h => (
                      <div key={h._id || h.id} className="p-3 border rounded bg-white">
                        <div className="flex justify-between">
                          <div>
                            <div className="font-medium">{h.documentType || 'Medical Document'}</div>
                            <div className="text-sm text-muted-foreground">{h.description}</div>
                          </div>
                          <a href={h.fileUrl} target="_blank" rel="noreferrer" className="text-primary">View</a>
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">Uploaded: {new Date(h.createdAt || h.date || h.dateUploaded || Date.now()).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {activeTab === 'requests' && userRole === 'patient' && (
              <div>
                {loadingRequests ? (
                  <div>Loading lab requests...</div>
                ) : requestsError ? (
                  <div className="text-red-600">Error: {requestsError}</div>
                ) : labRequests.length === 0 ? (
                  <div className="text-muted-foreground">No lab requests found</div>
                ) : (
                  <div className="space-y-3">
                    {labRequests.map(request => (
                      <div key={request._id} className="p-4 border rounded bg-white">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="font-medium text-lg">{request.testName}</div>
                            <div className="text-sm text-muted-foreground">{request.testType}</div>
                          </div>
                          <Badge variant={
                            request.status === 'Completed' ? 'default' :
                            request.status === 'Cancelled' || request.status === 'Rejected' ? 'destructive' :
                            'secondary'
                          }>
                            {request.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm mt-3">
                          <div>
                            <span className="text-muted-foreground">Priority:</span>{' '}
                            <span className={`font-medium ${
                              request.priority === 'STAT' ? 'text-red-600' :
                              request.priority === 'Urgent' ? 'text-orange-600' :
                              'text-foreground'
                            }`}>
                              {request.priority}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Requested:</span>{' '}
                            {new Date(request.requestDate).toLocaleDateString()}
                          </div>
                          {request.assignedToLab && (
                            <div className="col-span-2">
                              <span className="text-muted-foreground">Assigned to:</span>{' '}
                              {request.assignedToLab.name}
                            </div>
                          )}
                          {request.requestedBy && (
                            <div className="col-span-2">
                              <span className="text-muted-foreground">Requested by:</span>{' '}
                              {request.requestedBy.name} ({request.requestedByRole})
                            </div>
                          )}
                          {request.clinicalNotes && (
                            <div className="col-span-2">
                              <span className="text-muted-foreground">Clinical Notes:</span>{' '}
                              {request.clinicalNotes}
                            </div>
                          )}
                          {request.fastingRequired && (
                            <div className="col-span-2">
                              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                Fasting Required
                              </Badge>
                            </div>
                          )}
                        </div>
                        
                        {request.completedAt && (
                          <div className="mt-3 pt-3 border-t">
                            <div className="text-sm">
                              <span className="text-muted-foreground">Completed on:</span>{' '}
                              {new Date(request.completedAt).toLocaleDateString()}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient Name</TableHead>
                  <TableHead>Report Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingReports ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Loading reports...
                    </TableCell>
                  </TableRow>
                ) : reportsError ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-destructive">
                      {reportsError}
                    </TableCell>
                  </TableRow>
                ) : reports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No reports found
                    </TableCell>
                  </TableRow>
                ) : (
                  reports.map((report) => (
                    <TableRow 
                      key={report._id || report.id} 
                      className={`cursor-pointer ${selectedReport === (report._id || report.id) ? 'bg-muted/50' : ''}`}
                      onClick={() => setSelectedReport(report._id || report.id)}
                    >
                      <TableCell className="font-medium">
                        {typeof report.patientId === 'object' ? (
                          <div>
                            <div>{report.patientId.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {report.patientId.gender && `${report.patientId.gender}`}
                              {report.patientId.age && `, ${report.patientId.age}y`}
                            </div>
                          </div>
                        ) : userRole === 'patient' ? (
                          'You'
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          {report.testName || report.name || 'Untitled Report'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(report.date || report.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {report.reportType || report.type ? (
                          <span className="text-xs bg-muted px-2 py-1 rounded">
                            {report.reportType || report.type}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={report.status === 'Processed' || report.status === 'Reviewed' ? 'default' : 'secondary'} className={
                          report.status === 'Processed' || report.status === 'Reviewed' 
                            ? 'bg-green-100 text-green-700 hover:bg-green-100' 
                            : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'
                        }>
                          {report.status === 'Processed' || report.status === 'Reviewed' ? (
                            <div className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" /> {report.status}
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <Scan className="h-3 w-3" /> {report.status || 'Pending OCR'}
                            </div>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedReport(report._id || report.id);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                const res = await fetch(`${backendUrl}/api/lab/reports/${report._id || report.id}/download`, {
                                  headers: { Authorization: `Bearer ${token}` }
                                });
                                if (!res.ok) throw new Error('Download failed');
                                const blob = await res.blob();
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = report.fileName || report.name || 'lab-report.pdf';
                                document.body.appendChild(a);
                                a.click();
                                window.URL.revokeObjectURL(url);
                                document.body.removeChild(a);
                              } catch (err) {
                                alert('Failed to download report');
                              }
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* OCR Preview / Details */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scan className="h-5 w-5 text-primary" />
              AI Analysis
            </CardTitle>
            <CardDescription>
              {selectedReport ? 'Extracted values from report' : 'Select a report to view analysis'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedReport ? (
              <div className="space-y-6">
                <div className="p-4 bg-muted/30 rounded-lg border">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    Abnormal Findings
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm p-2 bg-white rounded border border-l-4 border-l-red-500">
                      <span className="font-medium">Hemoglobin</span>
                      <span className="text-red-600 font-bold">10.2 g/dL</span>
                    </div>
                    <div className="flex justify-between items-center text-sm p-2 bg-white rounded border border-l-4 border-l-amber-500">
                      <span className="font-medium">WBC</span>
                      <span className="text-amber-600 font-bold">11.5 K/uL</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3 text-sm text-muted-foreground">Extracted Data</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm py-1 border-b">
                      <span className="text-muted-foreground">RBC</span>
                      <span>4.5 M/uL</span>
                    </div>
                    <div className="flex justify-between text-sm py-1 border-b">
                      <span className="text-muted-foreground">Platelets</span>
                      <span>250 K/uL</span>
                    </div>
                    <div className="flex justify-between text-sm py-1 border-b">
                      <span className="text-muted-foreground">Hematocrit</span>
                      <span>38%</span>
                    </div>
                  </div>
                </div>

                <Button className="w-full" variant="outline">
                  View Full Analysis
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mb-4 opacity-20" />
                <p>No report selected</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LabReports;
