import { Card } from "./card";
import { ReactNode } from "react";

interface VitalCardProps {
  title: string;
  value: string | number;
  unit: string;
  icon: ReactNode;
  className?: string;
}

export function VitalCard({ title, value, unit, icon, className = "" }: VitalCardProps) {
  return (
    <Card className={`p-4 flex flex-col items-center ${className}`}>
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        {icon}
        <span className="text-xs font-medium">{title}</span>
      </div>
      <div className="text-2xl font-bold text-foreground">
        {value}
        <span className="ml-1 text-sm font-normal text-muted-foreground">
          {unit}
        </span>
      </div>
    </Card>
  );
}
