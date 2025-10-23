import { ResponsiveContainer, BarChart, Bar, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BarMiniProps {
  title: string;
  data: Array<{ x: string | number; y: number }>;
  color?: string;
}

export const BarMini = ({ title, data, color = '#10b981' }: BarMiniProps) => {
  const chartData = data.map(d => ({ x: d.x, y: d.y }));
  return (
    <Card className="medical-card">
      <CardHeader>
        <CardTitle className="text-foreground text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
            <XAxis dataKey="x" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={30} />
            <Tooltip cursor={{ fill: '#e5e7eb' }} />
            <Bar dataKey="y" fill={color} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
