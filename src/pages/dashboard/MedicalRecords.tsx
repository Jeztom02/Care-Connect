import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FileText, Search, Download, Eye, Plus, Filter, Calendar, User } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMedicalRecordsQuery, usePatientsQuery, useUserProfile, usePatientUsers } from "@/hooks/useApi";
import { apiRequest } from "@/hooks/useApi";
import { useSocket } from "@/hooks/useSocket";
import { useToast } from "@/hooks/use-toast";

export const MedicalRecords = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<{ patientId?: string; title?: string; type?: string; diagnosis?: string; summary?: string; recordedAt?: string; status?: string; files?: Array<{ url: string; name: string; mime: string }> }>({ status: 'Final', type: 'Consultation', files: [] });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ title?: string; type?: string; diagnosis?: string; summary?: string; recordedAt?: string; status?: string; files?: Array<{ url: string; name: string; mime: string }> }>({});
  const { data: me } = useUserProfile();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const { data, loading, error, refetch } = useMedicalRecordsQuery({ q: searchTerm || undefined, type: filterType !== 'all' ? filterType : undefined, page, limit, sort: '-createdAt' });
  const { data: patients } = usePatientUsers();
  const { on, off } = useSocket();
  const { toast } = useToast();

  // Realtime refetch on medical record changes
  useEffect(() => {
    const handlers: Array<[string, () => void]> = [
      ['medicalRecord:new', () => refetch()],
      ['medicalRecord:updated', () => refetch()],
      ['medicalRecord:deleted', () => refetch()],
    ];
    handlers.forEach(([e, h]) => on?.(e, h));
    return () => handlers.forEach(([e, h]) => off?.(e, h));
  }, [on, off, refetch]);

  const records = useMemo(() => {
    const list = Array.isArray((data as any)?.items) ? (data as any).items : (Array.isArray(data) ? (data as any) : []);
    return list.map((r: any) => ({
      id: r._id,
      patientId: r.patientId?._id || r.patientId,
      patient: r.patientId?.name || 'Unknown',
      title: r.title,
      type: r.type,
      date: r.recordedAt || r.createdAt,
      doctor: r.createdBy?.name || 'Staff',
      summary: r.summary,
      attachments: Array.isArray(r.files) ? r.files.length : 0,
      files: Array.isArray(r.files) ? r.files : [],
      status: r.status || 'Final',
    }));
  }, [data]);

  const metrics = useMemo(() => {
    const list = Array.isArray(records) ? records : [];
    const total = list.length;
    const finalized = list.filter((r: any) => String(r.status || '').toLowerCase() === 'final').length;
    const drafts = list.filter((r: any) => String(r.status || '').toLowerCase() === 'draft').length;
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setHours(0, 0, 0, 0);
    const day = startOfWeek.getDay();
    const diffToMonday = (day === 0 ? -6 : 1) - day;
    startOfWeek.setDate(startOfWeek.getDate() + diffToMonday);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    const thisWeek = list.filter((r: any) => {
      const d = new Date(r.date);
      return !isNaN(d.getTime()) && d >= startOfWeek && d < endOfWeek;
    }).length;
    return { total, finalized, drafts, thisWeek };
  }, [records]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Consultation": return "bg-blue-100 text-blue-700";
      case "Lab Results": return "bg-green-100 text-green-700";
      case "Assessment": return "bg-purple-100 text-purple-700";
      case "Prescription": return "bg-orange-100 text-orange-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Final": return "bg-green-100 text-green-700";
      case "Draft": return "bg-yellow-100 text-yellow-700";
      case "Pending": return "bg-gray-100 text-gray-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const filteredRecords = records;

  // Helper: S3 presigned upload flow
  const uploadFiles = async (fileList: FileList | null): Promise<Array<{ url: string; key?: string; name: string; mime: string }>> => {
    if (!fileList || fileList.length === 0) return [];
    const files = Array.from(fileList);
    const presignResp = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/uploads/presign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify({ files: files.map(f => ({ name: f.name, type: f.type || 'application/octet-stream' })) })
    });
    if (!presignResp.ok) throw new Error('Failed to presign');
    const presigned = await presignResp.json();
    const entries: Array<{ uploadUrl: string; url: string; key?: string; name: string; mime: string }>= presigned.files || [];
    await Promise.all(entries.map(async (e, idx) => {
      const file = files[idx];
      const put = await fetch(e.uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type || 'application/octet-stream' }, body: file });
      if (!put.ok) throw new Error('Failed to upload to S3');
    }));
    return entries.map(e => ({ url: e.url, key: e.key, name: e.name, mime: e.mime }));
  };

  // Helper: resolve a file href, signing if needed or converting s3:// URLs
  const resolveFileHref = async (f: any): Promise<string> => {
    try {
      if (!f) throw new Error('No file');
      if (f.key) {
        const signed = await apiRequest(`/api/uploads/sign-get?key=${encodeURIComponent(f.key)}`);
        return signed.url;
      }
      const url: string = String(f.url || '');
      if (url) {
        // Prefer server-side signing from URL to normalize duplicated prefixes
        try {
          const signedFromUrl = await apiRequest(`/api/uploads/sign-from-url?url=${encodeURIComponent(url)}`);
          if (signedFromUrl?.url) return signedFromUrl.url;
        } catch {}
        // Fallback: if s3:// scheme, derive key directly
        if (url.startsWith('s3://')) {
          const withoutScheme = url.slice('s3://'.length);
          const parts = withoutScheme.split('/');
          parts.shift(); // drop bucket
          const key = parts.join('/');
          if (key) {
            const signed = await apiRequest(`/api/uploads/sign-get?key=${encodeURIComponent(key)}`);
            return signed.url;
          }
        }
      }
      return url;
    } catch {
      throw new Error('resolve_failed');
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-primary/10">
          <FileText className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Medical Records</h1>
          <p className="text-muted-foreground">Access and manage patient medical documentation</p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search records by title or patient name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="consultation">Consultation</SelectItem>
                  <SelectItem value="lab results">Lab Results</SelectItem>
                  <SelectItem value="assessment">Assessment</SelectItem>
                  <SelectItem value="prescription">Prescription</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => setCreating(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Record
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Records Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metrics.total}</p>
                <p className="text-sm text-muted-foreground">Total Records</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{metrics.finalized}</p>
                <p className="text-sm text-muted-foreground">Finalized</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100">
                <FileText className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">{metrics.drafts}</p>
                <p className="text-sm text-muted-foreground">Drafts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">{metrics.thisWeek}</p>
                <p className="text-sm text-muted-foreground">This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create New Record Inline */
      }
      {creating && (
        <Card>
          <CardHeader>
            <CardTitle>New Medical Record</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select value={form.patientId} onValueChange={(v) => setForm(f => ({ ...f, patientId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                <SelectContent>
                  {(Array.isArray(patients) ? patients : []).map((p: any) => (
                    <SelectItem key={p._id} value={p._id}>
                      {(p.firstName || p.lastName ? `${[p.firstName, p.lastName].filter(Boolean).join(' ')}` : p.name) || 'Unnamed'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input placeholder="Title" value={form.title || ''} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} />
              <Input placeholder="Diagnosis (optional)" value={form.diagnosis || ''} onChange={(e) => setForm(f => ({ ...f, diagnosis: e.target.value }))} />
              <Select value={form.type || 'Consultation'} onValueChange={(v) => setForm(f => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select value={form.status || 'Final'} onValueChange={(v) => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Final">Final</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="Summary" value={form.summary || ''} onChange={(e) => setForm(f => ({ ...f, summary: e.target.value }))} />
              <Input type="date" value={form.recordedAt || ''} onChange={(e) => setForm(f => ({ ...f, recordedAt: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Input type="file" multiple onChange={async (e) => {
                try {
                  const uploaded = await uploadFiles(e.target.files);
                  setForm(f => ({ ...f, files: [...(f.files || []), ...uploaded] }));
                  e.currentTarget.value = '';
                } catch {
                  toast({ title: 'File upload failed', variant: 'destructive' });
                }
              }} />
              {Array.isArray(form.files) && form.files.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">Attachments:</span>
                  <ul className="list-disc pl-5">
                    {form.files.map((f, idx) => (
                      <li key={f.url} className="flex items-center justify-between">
                        <span>{f.name}</span>
                        <Button size="sm" variant="ghost" onClick={() => setForm(v => ({ ...v, files: (v.files || []).filter((_, i) => i !== idx) }))}>Remove</Button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button onClick={async () => {
                try {
                  if (!form.patientId || !form.title) {
                    toast({ title: 'Patient and Title required', variant: 'destructive' });
                    return;
                  }
                  await apiRequest('/api/medical-records', { method: 'POST', body: JSON.stringify(form) });
                  setCreating(false);
                  setForm({ status: 'Final', type: 'Consultation', files: [] });
                  refetch();
                  toast({ title: 'Record created' });
                } catch {
                  toast({ title: 'Failed to create record', variant: 'destructive' });
                }
              }}>Create</Button>
              <Button variant="outline" onClick={() => setCreating(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Records List */}
      <div className="grid gap-4">
        {filteredRecords.map((record) => (
          <Card key={record.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    {editingId === record.id ? (
                      <Input value={editValues.title ?? record.title} onChange={(e) => setEditValues(v => ({ ...v, title: e.target.value }))} className="font-semibold text-lg mb-1" />
                    ) : (
                      <h3 className="font-semibold text-lg mb-1">{record.title}</h3>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>{record.patient}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(record.date).toLocaleDateString()}</span>
                      </div>
                      <span>by {record.doctor}</span>
                    </div>
                    {editingId === record.id ? (
                      <Input value={editValues.summary ?? record.summary ?? ''} onChange={(e) => setEditValues(v => ({ ...v, summary: e.target.value }))} />
                    ) : (
                      <p className="text-sm text-muted-foreground mb-3">{record.summary}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {editingId === record.id ? (
                    <Select value={editValues.type ?? record.type} onValueChange={(v) => setEditValues(val => ({ ...val, type: v }))}>
                      <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Consultation">Consultation</SelectItem>
                        <SelectItem value="Lab Results">Lab Results</SelectItem>
                        <SelectItem value="Assessment">Assessment</SelectItem>
                        <SelectItem value="Imaging">Imaging</SelectItem>
                        <SelectItem value="Prescription">Prescription</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge className={getTypeColor(record.type)}>
                      {record.type}
                    </Badge>
                  )}
                  {editingId === record.id ? (
                    <Select value={editValues.status ?? record.status} onValueChange={(v) => setEditValues(val => ({ ...val, status: v }))}>
                      <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Final">Final</SelectItem>
                        <SelectItem value="Draft">Draft</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge className={getStatusColor(record.status)}>
                      {record.status}
                    </Badge>
                  )}
                </div>
              </div>

              {Array.isArray(record.files) && record.files.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                  {record.files.map((f: any) => (
                    <div key={f.url} className="flex items-center gap-2 border rounded p-2">
                      {String(f.mime || '').startsWith('image/') ? (
                        <img src={f.url} alt={f.name} className="h-12 w-12 object-cover rounded" />
                      ) : (
                        <div className="p-2 rounded bg-muted"><FileText className="h-6 w-6" /></div>
                      )}
                      <div className="min-w-0">
                        <div className="truncate text-sm">{f.name}</div>
                        <Button size="sm" variant="ghost" onClick={async () => {
                          try {
                            const href = await resolveFileHref(f);
                            window.open(href, '_blank');
                          } catch {
                            toast({ title: 'Failed to open file', variant: 'destructive' });
                          }
                        }}>Open</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{record.attachments} attachment{record.attachments !== 1 ? 's' : ''}</span>
                </div>
                
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={async () => {
                    try {
                      const f = (record.files || [])[0];
                      if (!f) return;
                      const href = await resolveFileHref(f);
                      window.open(href, '_blank');
                    } catch {
                      toast({ title: 'Failed to open file', variant: 'destructive' });
                    }
                  }}>
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                  {record.files && record.files.length > 0 && (
                    <Button size="sm" variant="outline" onClick={async () => {
                      try {
                        const f = record.files[0];
                        const href = await resolveFileHref(f);
                        const a = document.createElement('a');
                        a.href = href;
                        a.download = f.name || 'download';
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                      } catch {
                        toast({ title: 'Failed to download file', variant: 'destructive' });
                      }
                    }}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  )}
                  {editingId === record.id ? (
                    <>
                      <Button size="sm" variant="outline" onClick={async () => {
                        try {
                          await apiRequest(`/api/medical-records/${record.id}`, { method: 'PUT', body: JSON.stringify(editValues) });
                          setEditingId(null);
                          setEditValues({});
                          refetch();
                          toast({ title: 'Record updated' });
                        } catch {
                          toast({ title: 'Failed to update record', variant: 'destructive' });
                        }
                      }}>Save</Button>
                      <Button size="sm" variant="outline" onClick={() => { setEditingId(null); setEditValues({}); }}>Cancel</Button>
                    </>
                  ) : (
                    <>
                      <Button size="sm" variant="outline" onClick={() => { setEditingId(record.id); setEditValues({}); }}>Edit</Button>
                      <Button size="sm" variant="outline" onClick={async (e) => {
                        // upload more files to existing record
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.multiple = true;
                        input.onchange = async () => {
                          try {
                            const uploaded = await uploadFiles(input.files);
                            await apiRequest(`/api/medical-records/${record.id}`, { method: 'PUT', body: JSON.stringify({ files: [...(record.files || []), ...uploaded] }) });
                            refetch();
                            toast({ title: 'Attachments added' });
                          } catch {
                            toast({ title: 'Failed to add attachments', variant: 'destructive' });
                          }
                        };
                        input.click();
                      }}>Add Attachments</Button>
                      {(((me as any)?.role === 'admin') || ((me as any)?.role === 'doctor')) && (
                        <Button size="sm" variant="outline" onClick={async () => {
                          try {
                            await apiRequest(`/api/medical-records/${record.id}`, { method: 'DELETE' });
                            refetch();
                            toast({ title: 'Record deleted' });
                          } catch {
                            toast({ title: 'Failed to delete record', variant: 'destructive' });
                          }
                        }}>Delete</Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-end gap-2">
        <Button size="sm" variant="outline" disabled={page <= 1 || loading} onClick={() => { setPage(p => Math.max(1, p - 1)); refetch(); }}>Previous</Button>
        <Button size="sm" variant="outline" disabled={loading || ((data as any)?.items && ((data as any).items.length < limit))} onClick={() => { setPage(p => p + 1); refetch(); }}>Next</Button>
      </div>

      {filteredRecords.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No medical records found matching your search criteria.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};