import { ResponsiveContainer, LineChart, Line, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface LineMiniProps {
  title: string;
  data: Array<{ x: string | number; y: number }>;
  color?: string;
}

export const LineMini = ({ title, data, color = '#3b82f6' }: LineMiniProps) => {
  const chartData = data.map(d => ({ x: d.x, y: d.y }));
  return (
    <Card className="medical-card">
      <CardHeader>
        <CardTitle className="text-foreground text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
            <XAxis dataKey="x" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={30} />
            <Tooltip cursor={{ stroke: '#999', strokeDasharray: '3 3' }} />
            <Line type="monotone" dataKey="y" stroke={color} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
