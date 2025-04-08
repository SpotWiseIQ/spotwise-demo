import React, { useEffect } from "react";
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
  // Sort data by hour to ensure proper rendering
  const sortedData = [...data].sort((a, b) => a.hour - b.hour);
  
  // Debug logging for data received
  useEffect(() => {
    console.log(`🔍 CHART: Current hour is ${currentHour}`);
    console.log('🔍 CHART: All received data:', data);
    
    // Check for data around current hour
    const currentHourData = data.filter(item => item.hour === currentHour);
    console.log(`🔍 CHART: Data points at current hour (${currentHour}):`, currentHourData);
    
    // Check if there are hours before and after current hour
    const hourBefore = data.find(item => item.hour === currentHour - 1);
    const hourAfter = data.find(item => item.hour === currentHour + 1);
    console.log(`🔍 CHART: Hour before current (${currentHour - 1}):`, hourBefore);
    console.log(`🔍 CHART: Hour after current (${currentHour + 1}):`, hourAfter);
    
    // Check for continuity
    const hours = data.map(item => item.hour).sort((a, b) => a - b);
    console.log('🔍 CHART: All hours in data:', hours);
    
    for (let i = 1; i < hours.length; i++) {
      if (hours[i] - hours[i-1] > 1) {
        console.warn(`⚠️ CHART: Gap detected between hours ${hours[i-1]} and ${hours[i]}`);
      }
    }
  }, [data, currentHour]);
  
  // Format the tick label for hour
  const formatXAxis = (hour: number) => {
    return hour % 3 === 0 ? `${hour}:00` : '';
  };
  
  // Simple transformation for recharts - map data to the format needed by the chart
  const chartData = sortedData.map(item => ({
    hour: item.hour,
    pastValue: item.type === 'past' || item.type === 'current' ? item.value : undefined,
    predictedValue: item.type === 'predicted' || item.type === 'current' ? item.value : undefined
  }));
  
  // Debug logging for chart data
  useEffect(() => {
    console.log('🔍 CHART: Transformed data for chart:', chartData);
    
    // Check for the current hour in transformed data
    const currentHourTransformed = chartData.filter(item => item.hour === currentHour);
    console.log(`🔍 CHART: Transformed data at current hour (${currentHour}):`, currentHourTransformed);
    
    // Log specifically what values are being used for the transition
    const pastValueAtCurrentHour = chartData.find(item => item.hour === currentHour)?.pastValue;
    const predictedValueAtCurrentHour = chartData.find(item => item.hour === currentHour)?.predictedValue;
    
    console.log(`🔍 CHART: At current hour (${currentHour}): past=${pastValueAtCurrentHour}, predicted=${predictedValueAtCurrentHour}`);
  }, [chartData, currentHour]);
  
  return (
    <div className="w-full h-24 mt-1">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
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
            type="category"
            allowDuplicatedCategory={false}
            ticks={[...Array(24).keys()]}
            padding={{ left: 10, right: 10 }}
          />
          <YAxis hide domain={[0, 'auto']} />
          <Tooltip 
            labelFormatter={(label) => `${label}:00`}
            formatter={(value, name) => {
              const displayName = name === 'pastValue' ? 'Past' : 'Predicted';
              return [`${value} people`, displayName];
            }}
            contentStyle={{ fontSize: 10, padding: '4px 8px' }}
          />
          <ReferenceLine x={currentHour} stroke="#ff0000" strokeWidth={1.5} />
          
          {/* Past data */}
          <Area 
            type="monotone" 
            dataKey="pastValue" 
            stroke="#8884d8" 
            fillOpacity={1}
            fill="url(#pastGradient)" 
            strokeWidth={1.5}
            connectNulls={true}
            isAnimationActive={false}
          />
          
          {/* Predicted data */}
          <Area 
            type="monotone" 
            dataKey="predictedValue" 
            stroke="#82ca9d" 
            fillOpacity={1}
            fill="url(#predictedGradient)" 
            strokeWidth={1.5}
            strokeDasharray="3 3"
            connectNulls={true}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}; 