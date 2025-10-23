import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  progress?: number; // 0-100
}

export const StatCard = ({ icon, label, value, progress }: StatCardProps) => {
  const pct = typeof progress === 'number' ? Math.max(0, Math.min(100, progress)) : undefined;
  return (
    <Card className="medical-card animate-slide-up">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <div>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        {typeof pct === 'number' && (
          <div className="mt-3 h-2 w-full rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-primary transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
