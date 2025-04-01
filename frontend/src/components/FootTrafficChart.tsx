import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine
} from "recharts";

type FootTrafficData = {
  hour: number;
  value: number;
  type: 'past' | 'current' | 'predicted';
};

interface FootTrafficChartProps {
  data: FootTrafficData[];
  currentHour?: number;
}

export const FootTrafficChart: React.FC<FootTrafficChartProps> = ({
  data,
  currentHour = new Date().getHours()
}) => {
  // Sort data by hour
  const sortedData = [...data].sort((a, b) => a.hour - b.hour);
  
  // Format the tick label for hour
  const formatXAxis = (hour: number) => {
    return hour % 3 === 0 ? `${hour}:00` : '';
  };
  
  return (
    <div className="w-full h-20 mt-1">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={sortedData}
          margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="pastGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#8884d8" stopOpacity={0.2} />
            </linearGradient>
            <linearGradient id="predictedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#82ca9d" stopOpacity={0.2} />
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="hour" 
            tick={{ fontSize: 8 }} 
            tickFormatter={formatXAxis}
            stroke="#9ca3af"
          />
          <YAxis hide domain={[0, 'auto']} />
          <Tooltip 
            labelFormatter={(label) => `${label}:00`}
            formatter={(value) => [`${value} people`, 'Foot Traffic']}
            contentStyle={{ fontSize: 10, padding: '4px 8px' }}
          />
          <ReferenceLine x={currentHour} stroke="#ff0000" strokeWidth={1.5} />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke="#8884d8" 
            fillOpacity={1}
            fill="url(#pastGradient)" 
            strokeWidth={1.5}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}; 