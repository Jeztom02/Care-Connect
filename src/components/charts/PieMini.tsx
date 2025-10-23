import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PieMiniProps {
  title: string;
  data: Array<{ name: string; value: number; color?: string }>;
}

const defaultColors = ['#6366f1', '#10b981', '#06b6d4', '#f59e0b', '#ef4444'];

export const PieMini = ({ title, data }: PieMiniProps) => {
  const chartData = data.map((d, i) => ({ ...d, color: d.color || defaultColors[i % defaultColors.length] }));
  return (
    <Card className="medical-card">
      <CardHeader>
        <CardTitle className="text-foreground text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent style={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={chartData} dataKey="value" nameKey="name" outerRadius={80} innerRadius={50} strokeWidth={2}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color!} />
              ))}
            </Pie>
            <Tooltip />
            <Legend verticalAlign="bottom" height={24} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
