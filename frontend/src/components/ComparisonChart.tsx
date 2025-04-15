import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ScatterChart,
  Scatter,
  CartesianGrid,
  ComposedChart
} from 'recharts';
import { Hotspot, Event } from '@/lib/types';

type ComparisonChartProps = {
  data: Hotspot[] | Event[];
  type: 'hotspot' | 'event';
  metricType?: string;
};

export const ComparisonChart: React.FC<ComparisonChartProps> = ({ data, type, metricType = 'opportunity' }) => {
  // Calculate scores or extract the metric values based on the selected metric type
  const chartData = data.map((item: any, index) => {
    let value = 0;
    let label = '';
    let rawValue = 0;
    
    if (type === 'hotspot') {
      const hotspot = item as Hotspot;
      label = hotspot.name;
      
      // Extract value based on the selected metric
      switch (metricType) {
        case 'opportunity':
          // Calculate opportunity score (example algorithm)
          const trafficFactor = hotspot.trafficLevel ? 
                                (hotspot.trafficLevel.toString() === 'High' ? 0.8 : 
                                hotspot.trafficLevel.toString() === 'Medium' ? 0.6 : 0.3) : 0.5;
          const populationFactor = hotspot.population ? 
                                  parseInt(hotspot.population.replace(/[^\d]/g, '')) / 10000 : 0.4;
          const businessFactor = hotspot.nearbyBusinesses ? 
                                parseInt(hotspot.nearbyBusinesses.replace(/[^\d+]/g, '')) / 50 : 0.5;
          value = Math.min(0.95, (trafficFactor + populationFactor + businessFactor) / 3);
          break;
        case 'population':
          rawValue = hotspot.population ? parseInt(hotspot.population.replace(/[^\d]/g, '')) : 5000;
          value = rawValue / 15000;
          break;
        case 'footTraffic':
          rawValue = hotspot.avgDailyTraffic ? parseInt(hotspot.avgDailyTraffic.replace(/[^\d]/g, '')) : 4000;
          value = rawValue / 10000;
          break;
        case 'peakHour':
          // Convert peak hour to a normalized value
          rawValue = hotspot.peakHour ? parseInt(hotspot.peakHour.split(':')[0]) : 17;
          value = rawValue / 24; // Normalize to 0-1 range
          break;
        case 'nearbyBusinesses':
          rawValue = hotspot.nearbyBusinesses ? parseInt(hotspot.nearbyBusinesses.replace(/[^\d+]/g, '')) : 50;
          value = rawValue / 100;
          break;
        default:
          value = 0.5; // Default value
      }
    } else {
      const event = item as Event;
      label = event.name;
      
      // Extract value based on the selected metric
      switch (metricType) {
        case 'opportunity':
          // Calculate opportunity score (example algorithm)
          const capacityFactor = event.capacity ? parseInt(event.capacity) / 1000 : 0.5;
          const durationFactor = event.duration ? 
                                 parseInt(event.duration.replace(/[^\d]/g, '')) / 8 : 0.5;
          const typeFactor = event.type === 'Music' ? 0.8 : 
                            event.type === 'Cultural' ? 0.7 : 0.6;
          value = Math.min(0.95, (capacityFactor + durationFactor + typeFactor) / 3);
          break;
        case 'capacity':
          rawValue = event.capacity ? parseInt(event.capacity) : 800;
          value = rawValue / 2000;
          break;
        case 'duration':
          rawValue = event.duration ? parseInt(event.duration.replace(/[^\d]/g, '')) : 6;
          value = rawValue / 12;
          break;
        case 'footTrafficImpact':
          // Extract the percentage value if available, or use a default
          const impactMatch = event.peakTrafficImpact ? 
                             event.peakTrafficImpact.match(/\+(\d+)%/) : null;
          rawValue = impactMatch ? parseInt(impactMatch[1]) : 40;
          value = rawValue / 100;
          break;
        case 'demographics':
          // For demographics, assign a normalized value based on diversity
          value = 0.6; // Default value, could be calculated based on demographics data
          break;
        default:
          value = 0.5; // Default value
      }
    }
    
    return {
      name: label,
      shortName: label.length > 12 ? `${label.substring(0, 10)}...` : label,
      value: Math.min(1, Math.max(0, value)), // Ensure value is between 0 and 1
      rawValue: rawValue || value * 100, // Store the raw value for chart display
      id: (item as any).id,
      index
    };
  });

  // Custom colors for the charts
  const COLORS = ['#FF6B7D', '#FF8E61', '#FFA849', '#FFB824', '#FFCB05', '#82ca9d', '#8884d8'];

  // Get the appropriate label based on the metric type
  const getYAxisLabel = () => {
    if (metricType === 'opportunity') return 'Opportunity Score';
    if (type === 'hotspot') {
      switch (metricType) {
        case 'population': return 'Population';
        case 'footTraffic': return 'Daily Traffic';
        case 'peakHour': return 'Peak Hour';
        case 'nearbyBusinesses': return 'Nearby Businesses';
        default: return '';
      }
    } else {
      switch (metricType) {
        case 'capacity': return 'Capacity';
        case 'duration': return 'Duration';
        case 'footTrafficImpact': return 'Traffic Impact';
        case 'demographics': return 'Demographics';
        default: return '';
      }
    }
  };

  // Format tooltip values based on the metric type
  const formatTooltipValue = (value: number, rawValue?: number) => {
    if (metricType === 'opportunity') return (value * 100).toFixed(0) + '%';
    
    if (type === 'hotspot') {
      switch (metricType) {
        case 'population': return rawValue ? rawValue.toLocaleString() : Math.round(value * 15000).toLocaleString();
        case 'footTraffic': return rawValue ? rawValue.toLocaleString() + ' daily' : Math.round(value * 10000).toLocaleString() + ' daily';
        case 'peakHour': return rawValue ? `${rawValue}:00` : Math.round(value * 24) + ':00';
        case 'nearbyBusinesses': return rawValue ? rawValue.toString() : Math.round(value * 100).toString();
        default: return (value * 100).toFixed(0) + '%';
      }
    } else {
      switch (metricType) {
        case 'capacity': return rawValue ? rawValue.toLocaleString() : Math.round(value * 2000).toLocaleString();
        case 'duration': return rawValue ? `${rawValue} hours` : Math.round(value * 12).toString() + ' hours';
        case 'footTrafficImpact': return rawValue ? `+${rawValue}%` : '+' + (value * 100).toFixed(0) + '%';
        case 'demographics': return (value * 100).toFixed(0) + '%';
        default: return (value * 100).toFixed(0) + '%';
      }
    }
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      const rawValue = item.payload.rawValue;
      const normalizedValue = item.payload.value;
      const formattedValue = formatTooltipValue(normalizedValue, rawValue);
      
      return (
        <div className="bg-white p-2 border border-gray-200 shadow-sm rounded text-xs">
          <p className="font-medium">{label}</p>
          <p>{getYAxisLabel()}: <span className="font-semibold">{formattedValue}</span></p>
        </div>
      );
    }
    return null;
  };

  // Choose the appropriate chart type based on the metric
  const renderChart = () => {
    // Common chart props
    const commonProps = {
      data: chartData,
      margin: { top: 5, right: 5, bottom: 25, left: 5 }
    };
    
    // Common axis props
    const xAxisProps = {
      dataKey: "shortName",
      fontSize: 10,
      angle: -45,
      textAnchor: "end",
      tickMargin: 8
    };
    
    const yAxisProps = {
      fontSize: 10,
      domain: [0, 'auto'] as [number, string]
    };
    
    // Render chart based on metric type
    if (type === 'hotspot') {
      switch (metricType) {
        case 'population':
          // Area chart for population like in LocationMetrics
          return (
            <AreaChart {...commonProps}>
              <defs>
                <linearGradient id="colorPopulation" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis {...xAxisProps} />
              <YAxis {...yAxisProps} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="value" stroke="#8884d8" fillOpacity={1} fill="url(#colorPopulation)" />
            </AreaChart>
          );
          
        case 'footTraffic':
          // Line chart for foot traffic
          return (
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis {...xAxisProps} />
              <YAxis {...yAxisProps} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="value" stroke="#82ca9d" strokeWidth={2} dot={true} />
            </LineChart>
          );
          
        case 'peakHour':
          // Bar chart with different color for peak hour
          return (
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis {...xAxisProps} />
              <YAxis {...yAxisProps} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          );
          
        case 'nearbyBusinesses':
          // Scatter chart for businesses
          return (
            <ScatterChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis {...xAxisProps} />
              <YAxis {...yAxisProps} />
              <Tooltip content={<CustomTooltip />} />
              <Scatter name="Businesses" dataKey="value" fill="#8884d8">
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Scatter>
            </ScatterChart>
          );
          
        default:
          // Default to bar chart for opportunity score
          return (
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis {...xAxisProps} />
              <YAxis {...yAxisProps} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          );
      }
    } else {
      // Event charts
      switch (metricType) {
        case 'capacity':
          // Bar chart for capacity
          return (
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis {...xAxisProps} />
              <YAxis {...yAxisProps} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          );
          
        case 'duration':
          // Horizontal bar chart for duration
          return (
            <BarChart {...commonProps} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" {...yAxisProps} />
              <YAxis dataKey="shortName" type="category" width={80} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill="#8884d8" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          );
          
        case 'footTrafficImpact':
          // Composed chart for impact
          return (
            <ComposedChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis {...xAxisProps} />
              <YAxis {...yAxisProps} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
              <Line type="monotone" dataKey="value" stroke="#ff7300" strokeWidth={2} dot={false} />
            </ComposedChart>
          );
          
        case 'demographics':
          // Radar chart for demographics
          if (chartData.length <= 5) {
            return (
              <RadarChart width={300} height={180} cx="50%" cy="50%" outerRadius={80} data={chartData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="shortName" fontSize={8} />
                <Tooltip content={<CustomTooltip />} />
                <Radar name="Demographics" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
              </RadarChart>
            );
          } else {
            // Fallback to bar chart if too many items for radar
            return (
              <BarChart {...commonProps}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis {...xAxisProps} />
                <YAxis {...yAxisProps} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            );
          }
          
        default:
          // Default to bar chart for opportunity
          return (
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis {...xAxisProps} />
              <YAxis {...yAxisProps} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          );
      }
    }
  };

  return (
    <ResponsiveContainer width="100%" height={180}>
      {renderChart()}
    </ResponsiveContainer>
  );
}; 