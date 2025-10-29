import React from 'react';
import { format, subDays, parseISO } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceLine,
} from 'recharts';
import { cn } from '@/lib/utils';

// Types
type VitalType = 'temperature' | 'bloodPressure' | 'heartRate' | 'oxygenSaturation' | 'respiratoryRate';

interface VitalRecord {
  id: string;
  patientId: string;
  type: VitalType;
  value: number;
  unit: string;
  recordedAt: string;
  notes?: string;
}

interface PatientVitalsChartProps {
  /**
   * Array of vital records to display
   */
  data: VitalRecord[];
  /**
   * Type of vital to display
   */
  vitalType: VitalType;
  /**
   * Number of days to show in the chart
   * @default 7
   */
  days?: number;
  /**
   * Height of the chart
   * @default 300
   */
  height?: number;
  /**
   * Whether to show the legend
   * @default true
   */
  showLegend?: boolean;
  /**
   * Custom class name
   */
  className?: string;
}

// Vital type configurations
const VITAL_CONFIGS = {
  temperature: {
    label: 'Temperature',
    color: '#F59E0B',
    domain: [35, 40],
    unit: '°C',
    normalRange: [36.1, 37.2],
  },
  bloodPressure: {
    label: 'Blood Pressure',
    color: '#EF4444',
    unit: 'mmHg',
    domain: [70, 200],
    normalRange: [90, 120],
  },
  heartRate: {
    label: 'Heart Rate',
    color: '#3B82F6',
    unit: 'bpm',
    domain: [40, 120],
    normalRange: [60, 100],
  },
  oxygenSaturation: {
    label: 'Oxygen Saturation',
    color: '#10B981',
    unit: '%',
    domain: [85, 100],
    normalRange: [95, 100],
  },
  respiratoryRate: {
    label: 'Respiratory Rate',
    color: '#8B5CF6',
    unit: '/min',
    domain: [8, 30],
    normalRange: [12, 20],
  },
} as const;

// Custom tooltip component
const CustomTooltip = ({ active, payload, label, vitalType }: any) => {
  if (active && payload && payload.length) {
    const config = VITAL_CONFIGS[vitalType];
    return (
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <p className="font-medium text-gray-900 dark:text-white">
          {format(new Date(label), 'MMM d, yyyy h:mm a')}
        </p>
        <p className="text-sm">
          {config.label}:{' '}
          <span className="font-semibold">
            {payload[0].value} {config.unit}
          </span>
        </p>
      </div>
    );
  }
  return null;
};

// Generate mock data for the chart if no data is provided
const generateMockData = (days: number, vitalType: VitalType): VitalRecord[] => {
  const config = VITAL_CONFIGS[vitalType];
  const [min, max] = config.domain;
  const [normalMin, normalMax] = config.normalRange;
  
  return Array.from({ length: days * 4 }, (_, i) => {
    const date = subDays(new Date(), Math.floor(i / 4));
    // Generate values that mostly stay within normal range but occasionally go outside
    const isOutlier = Math.random() > 0.85;
    const value = isOutlier
      ? Math.random() > 0.5
        ? normalMax + Math.random() * (max - normalMax) * 0.5
        : normalMin - Math.random() * (normalMin - min) * 0.5
      : normalMin + Math.random() * (normalMax - normalMin);

    return {
      id: `mock-${i}`,
      patientId: 'mock-patient',
      type: vitalType,
      value: parseFloat(value.toFixed(1)),
      unit: config.unit,
      recordedAt: date.toISOString(),
    };
  });
};

/**
 * A responsive chart component for displaying patient vital signs over time.
 */
export function PatientVitalsChart({
  data: propData,
  vitalType,
  days = 7,
  height = 300,
  showLegend = true,
  className,
}: PatientVitalsChartProps) {
  const config = VITAL_CONFIGS[vitalType];
  const [showNormalRange, setShowNormalRange] = React.useState(true);
  
  // Use provided data or generate mock data if none provided
  const data = React.useMemo(() => {
    if (propData && propData.length > 0) {
      return [...propData]
        .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
        .filter((record) => record.type === vitalType)
        .slice(-days * 4); // Limit to last N days * 4 (assuming 6-hour intervals)
    }
    return generateMockData(days, vitalType);
  }, [propData, vitalType, days]);

  // Format data for the chart
  const chartData = React.useMemo(() => {
    return data.map((record) => ({
      date: new Date(record.recordedAt).toISOString(),
      value: record.value,
      formattedDate: format(new Date(record.recordedAt), 'MMM d'),
      time: format(new Date(record.recordedAt), 'h:mm a'),
    }));
  }, [data]);

  // Calculate average value
  const averageValue = React.useMemo(() => {
    const sum = data.reduce((acc, record) => acc + record.value, 0);
    return sum / data.length;
  }, [data]);

  // Custom tick formatter for X-axis
  const formatXAxis = (tickItem: string) => {
    return format(parseISO(tickItem), 'MMM d');
  };

  // Custom label formatter for Y-axis
  const formatYAxis = (value: number) => {
    return `${value}${config.unit}`;
  };

  return (
    <div className={cn('w-full', className)}>
      <div className="flex justify-between items-center mb-4 px-1">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {config.label} Trend
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Last {days} days
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setShowNormalRange(!showNormalRange)}
            className={cn(
              'text-xs px-2 py-1 rounded',
              showNormalRange
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
              'hover:opacity-80 transition-opacity'
            )}
          >
            {showNormalRange ? 'Hide Normal Range' : 'Show Normal Range'}
          </button>
        </div>
      </div>

      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <AreaChart
            data={chartData}
            margin={{
              top: 10,
              right: 20,
              left: 0,
              bottom: 10,
            }}
          >
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={config.color} stopOpacity={0.2} />
                <stop offset="95%" stopColor={config.color} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tickFormatter={formatXAxis}
              tick={{ fill: '#6B7280', fontSize: 12 }}
              tickMargin={10}
            />
            
            <YAxis
              domain={config.domain}
              tickFormatter={formatYAxis}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6B7280', fontSize: 12 }}
              width={60}
            />
            
            <Tooltip
              content={<CustomTooltip vitalType={vitalType} />}
              cursor={{ stroke: '#D1D5DB', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            
            {showLegend && (
              <Legend
                verticalAlign="top"
                height={36}
                formatter={(value) => (
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {value}
                  </span>
                )}
              />
            )}

            {/* Normal range area */}
            {showNormalRange && (
              <Area
                type="monotone"
                dataKey={() => config.normalRange[1]}
                stroke="none"
                fill="#D1FAE5"
                fillOpacity={0.3}
                activeDot={false}
                isAnimationActive={false}
                name="Normal Range"
              />
            )}

            {/* Main value line */}
            <Line
              type="monotone"
              dataKey="value"
              stroke={config.color}
              strokeWidth={2}
              dot={false}
              activeDot={{
                r: 6,
                stroke: config.color,
                strokeWidth: 2,
                fill: '#fff',
              }}
              name={config.label}
            />

            {/* Average line */}
            <ReferenceLine
              y={averageValue}
              stroke="#6B7280"
              strokeDasharray="3 3"
              strokeWidth={1}
              label={{
                value: `Avg: ${averageValue.toFixed(1)}${config.unit}`,
                position: 'right',
                fill: '#6B7280',
                fontSize: 12,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
