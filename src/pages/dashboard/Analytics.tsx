import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Users, Activity } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { LineMini } from "@/components/charts/LineMini";
import { BarMini } from "@/components/charts/BarMini";
import { PieMini } from "@/components/charts/PieMini";
import { useAppointments, usePatients, useAlerts } from "@/hooks/useApi";

export const Analytics = () => {
  const { data: appts } = useAppointments('doctor');
  const { data: patients } = usePatients();
  const { data: alerts } = useAlerts();

  const metrics = useMemo(() => {
    const apptsCount = Array.isArray(appts) ? appts.length : 0;
    const patientsCount = Array.isArray(patients) ? patients.length : 0;
    const openAlerts = Array.isArray(alerts) ? alerts.filter((a: any) => a.status === 'OPEN').length : 0;
    return { apptsCount, patientsCount, openAlerts };
  }, [appts, patients, alerts]);

  const apptTrend = useMemo(() => {
    const list = Array.isArray(appts) ? appts : [];
    const days: Array<{ x: string; y: number }> = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      d.setHours(0,0,0,0);
      const next = new Date(d);
      next.setDate(d.getDate() + 1);
      const count = list.filter((a: any) => {
        const t = new Date(a.startsAt).getTime();
        return t >= d.getTime() && t < next.getTime();
      }).length;
      const label = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
      days.push({ x: label, y: count });
    }
    return days;
  }, [appts]);

  const alertBreakdown = useMemo(() => {
    const list = Array.isArray(alerts) ? alerts : [];
    const groups: Record<string, number> = {};
    list.forEach((a: any) => {
      const k = String(a.priority || (a.status === 'OPEN' ? 'high' : 'low')).toLowerCase();
      groups[k] = (groups[k] || 0) + 1;
    });
    const entries = Object.entries(groups);
    return entries.length > 0
      ? entries.map(([x, y]) => ({ x, y }))
      : [{ x: 'low', y: 0 }, { x: 'medium', y: 0 }, { x: 'high', y: 0 }];
  }, [alerts]);

  const patientConditionPie = useMemo(() => {
    const list = Array.isArray(patients) ? patients : [];
    const groups: Record<string, number> = {};
    list.forEach((p: any) => {
      const cond = String(p.condition || p.status || 'other').toLowerCase();
      groups[cond] = (groups[cond] || 0) + 1;
    });
    const items = Object.entries(groups).map(([name, value]) => ({ name, value }));
    return items.length > 0 ? items : [{ name: 'no-data', value: 1 }];
  }, [patients]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-primary/10">
          <BarChart3 className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground">System performance and usage statistics</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard icon={<Users className="h-5 w-5 text-primary" />} label="Patients" value={metrics.patientsCount} />
        <StatCard icon={<Activity className="h-5 w-5 text-medical-healing" />} label="Appointments" value={metrics.apptsCount} />
        <StatCard icon={<BarChart3 className="h-5 w-5 text-accent" />} label="Open Alerts" value={metrics.openAlerts} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LineMini title="Appointments (last 7 days)" data={apptTrend} />
        <BarMini title="Alert Priority Breakdown" data={alertBreakdown} />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <PieMini title="Patient Conditions / Status" data={patientConditionPie} />
      </div>
    </div>
  );
};