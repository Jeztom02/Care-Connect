import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Pill, Search, Plus, Filter, Calendar, User, Clock, AlertTriangle, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAllPrescriptions, usePrescriptionsByPatient, usePatientUsers, apiRequest, useUserProfile } from "@/hooks/useApi";
import { useToast } from "@/hooks/use-toast";
import { useSocket } from "@/hooks/useSocket";

interface PrescriptionsProps {
  userRole: string;
}

export const Prescriptions = ({ userRole }: PrescriptionsProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<{ patientId?: string; medication?: string; dosage?: string; frequency?: string; duration?: string; notes?: string; startDate?: string; endDate?: string; items?: any[] }>({});
  const { toast } = useToast();
  const { on, off } = useSocket();
  const { data: meData } = useUserProfile();
  const { data: patientUsersData, loading: patientUsersLoading } = usePatientUsers();
  const myUserId = (meData as any)?._id || (meData as any)?.id;
  const myPatientFromUsers = useMemo(() => {
    const arr = Array.isArray(patientUsersData) ? patientUsersData : [];
    return arr.find((p: any) => String(p.userId) === String(myUserId));
  }, [patientUsersData, myUserId]);
  const myPatientId: string | undefined = userRole === 'patient' ? myPatientFromUsers?._id : undefined;
  const { data: allRx, loading: allLoading, error: allError, refetch: refetchAll } = useAllPrescriptions();
  const { data: patientRx, loading: patLoading, error: patError, refetch: refetchPatient } = usePrescriptionsByPatient(myPatientId);
  const loading = userRole === 'patient' ? patLoading : allLoading;
  const error = userRole === 'patient' ? patError : allError;
  const list = useMemo(() => (userRole === 'patient' ? (Array.isArray(patientRx) ? patientRx : []) : (Array.isArray(allRx) ? allRx : [])), [userRole, patientRx, allRx]);
  useEffect(() => {
    const handlers: Array<[string, () => void]> = [
      ['prescription:new', () => { refetchByRole(); }],
      ['prescription:updated', () => { refetchByRole(); }],
      ['prescription:deleted', () => { refetchByRole(); }],
    ];
    handlers.forEach(([e, h]) => on?.(e, h));
    return () => handlers.forEach(([e, h]) => off?.(e, h));
  }, [on, off, refetchAll, refetchPatient, userRole]);

  const prescriptions = useMemo(() => (Array.isArray(list) ? list : []), [list]);

  const patientsMap = useMemo(() => {
    const arr = Array.isArray(patientUsersData) ? (patientUsersData as any[]) : [];
    const map = new Map<string, string>();
    arr.forEach((p: any) => {
      const name = (p.firstName || p.lastName)
        ? [p.firstName, p.lastName].filter(Boolean).join(' ')
        : (p.name || '');
      map.set(String(p._id), name);
    });
    return map;
  }, [patientUsersData]);

  const enrichedPrescriptions = useMemo(() => {
    return prescriptions.map((p: any) => {
      const existing = String(p.patientName || p.patient || '');
      if (existing.trim()) return p;
      const pid = String(p.patientId || (p.patient?._id));
      const name = patientsMap.get(pid) || '';
      return { ...p, patientName: name };
    });
  }, [prescriptions, patientsMap]);

  const refetchByRole = () => {
    if (userRole === 'patient') {
      refetchPatient();
    } else {
      refetchAll();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "bg-green-100 text-green-700";
      case "Expired": return "bg-red-100 text-red-700";
      case "Pending": return "bg-yellow-100 text-yellow-700";
      case "Discontinued": return "bg-gray-100 text-gray-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getPriorityColor = (refills: number) => {
    if (refills === 0) return "text-red-600";
    if (refills <= 1) return "text-yellow-600";
    return "text-green-600";
  };

  const filteredPrescriptions = enrichedPrescriptions.filter((p: any) => {
    const patientName = (p.patientName || p.patient || '').toString();
    const matchesSearch = String(p.medication || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      patientName.toLowerCase().includes(searchTerm.toLowerCase());
    const statusStr = String(p.status || '').toLowerCase();
    const matchesFilter = filterStatus === "all" || statusStr === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const metrics = useMemo(() => {
    const list = Array.isArray(enrichedPrescriptions) ? enrichedPrescriptions : [];
    const total = list.length;
    const active = list.filter((p: any) => String(p.status || '').toLowerCase() === 'active').length;
    const expired = list.filter((p: any) => String(p.status || '').toLowerCase() === 'expired').length;
    const needRefill = list.filter((p: any) => {
      // Multi-item prescription: any item with refillsRemaining <= 1
      if (Array.isArray(p.items) && p.items.length > 0) {
        return p.items.some((it: any) => Number(it?.refillsRemaining ?? 0) <= 1);
      }
      // Legacy: look at top-level refillsRemaining if present
      if (p && typeof p.refillsRemaining !== 'undefined') {
        return Number(p.refillsRemaining) <= 1;
      }
      return false;
    }).length;
    return { total, active, needRefill, expired };
  }, [enrichedPrescriptions]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-primary/10">
          <Pill className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Prescriptions</h1>
          <p className="text-muted-foreground">
            {userRole === 'patient' ? 'Your current medications' : 'Manage patient prescriptions'}
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by medication or patient name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
              {userRole === 'doctor' && (
                <Button onClick={() => { setCreating(true); setForm({}); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Prescription
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {creating && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">New Prescription</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {userRole !== 'patient' ? (
              <Select value={form.patientId} onValueChange={(v) => setForm((f) => ({ ...f, patientId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select patient" />
                </SelectTrigger>
                <SelectContent>
                  {patientUsersLoading ? (
                    <SelectItem value="loading" disabled>Loading patients…</SelectItem>
                  ) : (Array.isArray(patientUsersData) && patientUsersData.length > 0) ? (
                    (patientUsersData as any[]).map((p) => (
                      <SelectItem key={p._id} value={p._id}>
                        {(p.firstName || p.lastName ? `${[p.firstName, p.lastName].filter(Boolean).join(' ')}` : p.name)}
                        {p.email ? ` • ${p.email}` : ''}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="empty" disabled>No patients found</SelectItem>
                  )}
                </SelectContent>
              </Select>
            ) : null}
            {userRole === 'patient' && (
              <Input value={myPatientFromUsers?.name || ''} readOnly placeholder="Patient" />
            )}
            {/* Multi-medicine items editor */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Medicines</span>
                <Button type="button" variant="outline" size="sm" onClick={() => setForm((f: any) => ({ ...f, items: [...(f.items || []), { medication: '', dosage: '', frequency: '', duration: '', instructions: '', refillsRemaining: 2 }] }))}>Add Medicine</Button>
              </div>
              {(form.items || []).length > 0 && (
                <div className="space-y-3">
                  {(form.items || []).map((it: any, idx: number) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-start">
                      <Input placeholder="Medication" value={it.medication} onChange={(e) => setForm((f: any) => { const items = [...(f.items || [])]; items[idx] = { ...items[idx], medication: e.target.value }; return { ...f, items }; })} />
                      <Input placeholder="Dosage" value={it.dosage} onChange={(e) => setForm((f: any) => { const items = [...(f.items || [])]; items[idx] = { ...items[idx], dosage: e.target.value }; return { ...f, items }; })} />
                      <Input placeholder="Frequency" value={it.frequency} onChange={(e) => setForm((f: any) => { const items = [...(f.items || [])]; items[idx] = { ...items[idx], frequency: e.target.value }; return { ...f, items }; })} />
                      <Input placeholder="Duration" value={it.duration} onChange={(e) => setForm((f: any) => { const items = [...(f.items || [])]; items[idx] = { ...items[idx], duration: e.target.value }; return { ...f, items }; })} />
                      <div className="flex gap-2">
                        <Input placeholder="Refills" type="number" value={it.refillsRemaining} onChange={(e) => setForm((f: any) => { const items = [...(f.items || [])]; items[idx] = { ...items[idx], refillsRemaining: Number(e.target.value) }; return { ...f, items }; })} />
                        <Button type="button" variant="ghost" onClick={() => setForm((f: any) => { const items = [...(f.items || [])]; items.splice(idx, 1); return { ...f, items }; })}>Remove</Button>
                      </div>
                      <div className="md:col-span-5">
                        <Input placeholder="Instructions (optional)" value={it.instructions || ''} onChange={(e) => setForm((f: any) => { const items = [...(f.items || [])]; items[idx] = { ...items[idx], instructions: e.target.value }; return { ...f, items }; })} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Legacy single medicine fields (used if no items added) */}
            {(form.items || []).length === 0 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Input placeholder="Medication name" value={form.medication || ''} onChange={(e) => setForm((f) => ({ ...f, medication: e.target.value }))} />
                  <Input placeholder="Dosage (e.g., 10mg)" value={form.dosage || ''} onChange={(e) => setForm((f) => ({ ...f, dosage: e.target.value }))} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Input placeholder="Frequency (e.g., Twice daily)" value={form.frequency || ''} onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value }))} />
                  <Input placeholder="Duration (e.g., 14 days)" value={form.duration || ''} onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))} />
                </div>
              </>
            )}
            <Input placeholder="Instructions (optional)" value={form.notes || ''} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Input type="date" placeholder="Start date" value={form.startDate || ''} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
              <Input type="date" placeholder="End date (optional)" value={form.endDate || ''} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} />
            </div>
            <div className="flex gap-2">
              <Button onClick={async () => {
                try {
                  const payload: any = { ...form };
                  if (userRole === 'patient') payload.patientId = myPatientId;
                  const itemsAll = Array.isArray(payload.items) ? payload.items : [];
                  const itemsClean = itemsAll.filter((it: any) => String(it.medication || '').trim() && String(it.dosage || '').trim() && String(it.frequency || '').trim());
                  const hasItems = itemsClean.length > 0;
                  // If some items exist but not all required fields filled, block with message
                  if (itemsAll.length > 0 && itemsClean.length !== itemsAll.length) {
                    toast({ title: 'Please complete all medicine rows', description: 'Fill medication, dosage and frequency for each added medicine or remove incomplete rows.', variant: 'destructive' });
                    return;
                  }
                  if (hasItems) payload.items = itemsClean;
                  if (!payload.patientId || (!hasItems && (!payload.medication || !payload.dosage || !payload.frequency))) {
                    toast({ title: 'Missing required fields', description: 'Patient and either items[] or medication, dosage, frequency are required', variant: 'destructive' });
                    return;
                  }
                  const resp = await apiRequest('/api/prescriptions', {
                    method: 'POST',
                    body: JSON.stringify(payload),
                  });
                  if (!resp || !resp._id) throw new Error('Failed to create prescription');
                  setCreating(false);
                  setForm({});
                  refetchByRole();
                  toast({ title: 'Prescription created successfully' });
                } catch (e: any) {
                  const message = e?.message || 'Failed to create prescription';
                  toast({ title: 'Failed to create prescription', description: message, variant: 'destructive' });
                }
              }}>Prescribe</Button>
              <Button variant="outline" onClick={() => { setCreating(false); setForm({}); }}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prescription Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Pill className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metrics.total}</p>
                <p className="text-sm text-muted-foreground">Total Prescriptions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <Pill className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{metrics.active}</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">{metrics.needRefill}</p>
                <p className="text-sm text-muted-foreground">Need Refill</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100">
                <Clock className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{metrics.expired}</p>
                <p className="text-sm text-muted-foreground">Expired</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Prescriptions List */}
      <div className="grid gap-4">
        {loading && (
          <Card><CardContent className="p-6 text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading prescriptions…</CardContent></Card>
        )}
        {error && (
          <Card><CardContent className="p-6 text-sm text-destructive">{error}</CardContent></Card>
        )}
        {filteredPrescriptions.map((prescription: any) => (
          <Card key={String(prescription._id || prescription.id)} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <Pill className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">{prescription.medication}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                      <span>{prescription.dosage} • {prescription.frequency}</span>
                    </div>
                    {userRole !== 'patient' && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                        <User className="h-4 w-4" />
                        <span>{prescription.patientName || prescription.patient || ''}</span>
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground">{prescription.notes}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(prescription.status || 'Active')}>
                    {prescription.status || 'Active'}
                  </Badge>
                </div>
              </div>

              {/* Items list (multi-medicine) or legacy display */}
              {Array.isArray(prescription.items) && prescription.items.length > 0 ? (
                <div className="space-y-3 mb-4">
                  {prescription.items.map((it: any, idx: number) => (
                    <div key={idx} className="p-3 border rounded">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold">{it.medication}</div>
                        <Badge variant="outline">{it.status || 'Active'}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">{it.dosage} • {it.frequency} {it.duration ? `• ${it.duration}` : ''}</div>
                      {it.instructions && <div className="text-sm">{it.instructions}</div>}
                      <div className="mt-2 text-sm">Refills Remaining: <span className={getPriorityColor(Number(it.refillsRemaining ?? 0))}>{Number(it.refillsRemaining ?? 0)}</span></div>
                      <div className="mt-2 flex gap-2">
                        {String(prescription.status) === 'Active' && String(it.status) === 'Active' && (
                          <>
                            <Button size="sm" variant="outline" onClick={async () => {
                              try {
                                await apiRequest(`/api/prescriptions/${prescription._id}/request-refill`, { method: 'POST', body: JSON.stringify({ itemIndex: idx }) });
                                userRole === 'patient' ? refetchPatient() : refetchAll();
                                toast({ title: 'Refill requested' });
                              } catch { toast({ title: 'Failed to request refill', variant: 'destructive' }); }
                            }}>Request Refill</Button>
                            {userRole === 'doctor' && (
                              <Button size="sm" variant="outline" onClick={async () => {
                                const newDosage = prompt('New dosage', String(it.dosage || ''));
                                const newFrequency = prompt('New frequency', String(it.frequency || ''));
                                if (newDosage || newFrequency) {
                                  try {
                                    await apiRequest(`/api/prescriptions/${prescription._id}/items/${idx}/dosage`, { method: 'PATCH', body: JSON.stringify({ dosage: newDosage || undefined, frequency: newFrequency || undefined }) });
                                    userRole === 'patient' ? refetchPatient() : refetchAll();
                                    toast({ title: 'Dosage updated' });
                                  } catch { toast({ title: 'Failed to update dosage', variant: 'destructive' }); }
                                }
                              }}>Modify Dosage</Button>
                            )}
                          </>
                        )}
                        <Button size="sm" variant="outline" onClick={async () => {
                          try {
                            const detail = await apiRequest(`/api/prescriptions/detail/${prescription._id}`);
                            console.log('Prescription detail', detail);
                            toast({ title: 'Details loaded', description: Array.isArray(detail.items) ? `${detail.items.length} medicines` : (detail.medication || '') });
                          } catch { toast({ title: 'Failed to load details', variant: 'destructive' }); }
                        }}>View Details</Button>
                        {userRole === 'doctor' && String(it.status) === 'Active' && (
                          <Button size="sm" variant="outline" onClick={async () => {
                            try {
                              await apiRequest(`/api/prescriptions/${prescription._id}/items/${idx}/discontinue`, { method: 'POST' });
                              userRole === 'patient' ? refetchPatient() : refetchAll();
                              toast({ title: 'Item discontinued' });
                            } catch { toast({ title: 'Failed to discontinue', variant: 'destructive' }); }
                          }}>Discontinue</Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Medication</p>
                    <p className="font-semibold">{prescription.medication}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Dosage / Frequency</p>
                    <p className="font-semibold">{prescription.dosage} • {prescription.frequency}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Duration</p>
                    <p className="font-semibold">{prescription.duration || '-'}</p>
                  </div>
                </div>
              )}

              {/* Global actions for legacy prescriptions */}
              {(!Array.isArray(prescription.items) || prescription.items.length === 0) && (
                <div className="flex gap-2">
                  {prescription.status === 'Active' && (
                    <>
                      <Button size="sm" variant="outline" onClick={async () => {
                        try {
                          await apiRequest(`/api/prescriptions/${prescription._id}/request-refill`, { method: 'POST' });
                          userRole === 'patient' ? refetchPatient() : refetchAll();
                          toast({ title: 'Refill requested' });
                        } catch { toast({ title: 'Failed to request refill', variant: 'destructive' }); }
                      }}>Request Refill</Button>
                      {userRole === 'doctor' && (
                        <Button size="sm" variant="outline" onClick={async () => {
                          const newDosage = prompt('New dosage', String(prescription.dosage || ''));
                          const newFrequency = prompt('New frequency', String(prescription.frequency || ''));
                          if (newDosage || newFrequency) {
                            try {
                              await apiRequest(`/api/prescriptions/${prescription._id}`, { method: 'PUT', body: JSON.stringify({ dosage: newDosage || undefined, frequency: newFrequency || undefined }) });
                              userRole === 'patient' ? refetchPatient() : refetchAll();
                              toast({ title: 'Dosage updated' });
                            } catch { toast({ title: 'Failed to update dosage', variant: 'destructive' }); }
                          }
                        }}>Modify Dosage</Button>
                      )}
                    </>
                  )}
                  <Button size="sm" variant="outline" onClick={async () => {
                    try {
                      const detail = await apiRequest(`/api/prescriptions/detail/${prescription._id}`);
                      console.log('Prescription detail', detail);
                      toast({ title: 'Details loaded', description: detail.medication || `${(detail.items||[]).length} medicines` });
                    } catch { toast({ title: 'Failed to load details', variant: 'destructive' }); }
                  }}>View Details</Button>
                  {userRole === 'doctor' && (
                    <Button size="sm" variant="outline" onClick={async () => {
                      try {
                        await apiRequest(`/api/prescriptions/${prescription._id}`, { method: 'PUT', body: JSON.stringify({ status: 'Discontinued' }) });
                        userRole === 'patient' ? refetchPatient() : refetchAll();
                        toast({ title: 'Prescription discontinued' });
                      } catch { toast({ title: 'Failed to discontinue', variant: 'destructive' }); }
                    }}>Discontinue</Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPrescriptions.length === 0 && !loading && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No prescriptions found matching your search criteria.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};