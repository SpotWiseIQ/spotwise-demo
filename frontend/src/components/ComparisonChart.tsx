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
          const capacityFactor = event.expected_attendance ? parseInt(String(event.expected_attendance)) / 1000 : 
                                 event.capacity ? parseInt(event.capacity) / 1000 : 0.5;
          
          // Calculate duration factor from start_time and end_time if available
          let durationFactor = 0.5;
          if (event.start_time && event.end_time) {
            try {
              const startDate = new Date(event.start_time);
              const endDate = new Date(event.end_time);
              const durationHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
              durationFactor = durationHours / 8;
            } catch (e) {
              console.error("Error calculating duration:", e);
            }
          } else if (event.duration) {
            durationFactor = parseInt(event.duration.replace(/[^\d]/g, '')) / 8;
          }
          
          const typeFactor = event.event_type === 'Music' ? 0.8 : 
                            event.event_type === 'Cultural' ? 0.7 : 
                            event.type === 'Music' ? 0.8 : 
                            event.type === 'Cultural' ? 0.7 : 0.6;
          
          value = Math.min(0.95, (capacityFactor + durationFactor + typeFactor) / 3);
          break;
        case 'capacity':
          rawValue = event.expected_attendance ? parseInt(String(event.expected_attendance)) : 
                    event.capacity ? parseInt(event.capacity) : 800;
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

  // MOCK DATA FOR HOTSPOT DETAILED METRICS
  const mockPopulationData = [
    { year: 2020, h1: 950, h2: 1200, h3: 1100 },
    { year: 2021, h1: 1050, h2: 1250, h3: 1150 },
    { year: 2022, h1: 1120, h2: 1300, h3: 1200 },
    { year: 2023, h1: 1250, h2: 1350, h3: 1300 },
    { year: 2024, h1: 1300, h2: 1400, h3: 1350 },
  ];
  const mockAreaTypeData = [
    { subject: 'Residential', h1: 90, h2: 40, h3: 60 },
    { subject: 'Commercial', h1: 40, h2: 90, h3: 50 },
    { subject: 'Industrial', h1: 20, h2: 10, h3: 30 },
    { subject: 'Leisure', h1: 60, h2: 30, h3: 80 },
    { subject: 'Green Space', h1: 45, h2: 60, h3: 55 },
  ];
  const mockFootTrafficHourData = [
    { hour: 0, h1: 10, h2: 5, h3: 8 },
    { hour: 4, h1: 5, h2: 8, h3: 6 },
    { hour: 8, h1: 90, h2: 70, h3: 80 },
    { hour: 12, h1: 60, h2: 80, h3: 70 },
    { hour: 16, h1: 80, h2: 90, h3: 85 },
    { hour: 17, h1: 110, h2: 100, h3: 120 },
    { hour: 18, h1: 95, h2: 110, h3: 100 },
    { hour: 20, h1: 40, h2: 60, h3: 50 },
  ];
  const mockAvgDailyTrafficData = [
    { day: 'Mon', h1: 2200, h2: 2000, h3: 2400 },
    { day: 'Tue', h1: 2300, h2: 2100, h3: 2600 },
    { day: 'Wed', h1: 2400, h2: 2200, h3: 2700 },
    { day: 'Thu', h1: 2500, h2: 2300, h3: 2800 },
    { day: 'Fri', h1: 2600, h2: 2400, h3: 3000 },
    { day: 'Sat', h1: 1400, h2: 1800, h3: 2200 },
    { day: 'Sun', h1: 1200, h2: 1600, h3: 1800 },
  ];
  const mockDemoData = [
    { group: '18-24', h1: 33, h2: 25, h3: 20 },
    { group: '25-34', h1: 25, h2: 30, h3: 25 },
    { group: '35-44', h1: 25, h2: 20, h3: 30 },
    { group: '45+', h1: 17, h2: 25, h3: 25 },
  ];
  const mockBusinessData = [
    { type: 'Retail', h1: 12, h2: 10, h3: 15 },
    { type: 'Food', h1: 8, h2: 12, h3: 10 },
    { type: 'Services', h1: 15, h2: 18, h3: 12 },
    { type: 'Entertainment', h1: 5, h2: 7, h3: 8 },
    { type: 'Other', h1: 10, h2: 8, h3: 9 },
  ];

  // MOCK DATA FOR EVENT DETAILED METRICS
  const mockEventCapacityData = [
    { year: 2020, e1: 800, e2: 1200, e3: 1000 },
    { year: 2021, e1: 900, e2: 1300, e3: 1100 },
    { year: 2022, e1: 950, e2: 1400, e3: 1200 },
    { year: 2023, e1: 1000, e2: 1500, e3: 1300 },
    { year: 2024, e1: 1100, e2: 1600, e3: 1400 },
  ];
  const mockEventTypeData = [
    { type: 'Music', e1: 80, e2: 40, e3: 60 },
    { type: 'Sports', e1: 40, e2: 90, e3: 50 },
    { type: 'Cultural', e1: 20, e2: 10, e3: 30 },
    { type: 'Food', e1: 60, e2: 30, e3: 80 },
    { type: 'Other', e1: 45, e2: 60, e3: 55 },
  ];
  const mockEventFootTrafficImpactData = [
    { hour: -2, e1: 10, e2: 8, e3: 12 },
    { hour: -1, e1: 20, e2: 18, e3: 22 },
    { hour: 0, e1: 90, e2: 70, e3: 80 },
    { hour: 1, e1: 60, e2: 80, e3: 70 },
    { hour: 2, e1: 80, e2: 90, e3: 85 },
  ];
  const mockEventAvgDailyTrafficData = [
    { day: 'Mon', e1: 2200, e2: 2000, e3: 2400 },
    { day: 'Tue', e1: 2300, e2: 2100, e3: 2600 },
    { day: 'Wed', e1: 2400, e2: 2200, e3: 2700 },
    { day: 'Thu', e1: 2500, e2: 2300, e3: 2800 },
    { day: 'Fri', e1: 2600, e2: 2400, e3: 3000 },
    { day: 'Sat', e1: 1400, e2: 1800, e3: 2200 },
    { day: 'Sun', e1: 1200, e2: 1600, e3: 1800 },
  ];
  const mockEventDemoData = [
    { group: '18-24', e1: 33, e2: 25, e3: 20 },
    { group: '25-34', e1: 25, e2: 30, e3: 25 },
    { group: '35-44', e1: 25, e2: 20, e3: 30 },
    { group: '45+', e1: 17, e2: 25, e3: 25 },
  ];
  const mockEventBusinessData = [
    { type: 'Retail', e1: 12, e2: 10, e3: 15 },
    { type: 'Food', e1: 8, e2: 12, e3: 10 },
    { type: 'Services', e1: 15, e2: 18, e3: 12 },
    { type: 'Entertainment', e1: 5, e2: 7, e3: 8 },
    { type: 'Other', e1: 10, e2: 8, e3: 9 },
  ];

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
          // Multi-line LineChart for population
          return (
            <LineChart data={mockPopulationData} margin={{ top: 5, right: 5, bottom: 25, left: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" fontSize={10} />
              <YAxis fontSize={10} />
              <Tooltip />
              <Line type="monotone" dataKey="h1" stroke="#FF6B7D" name="Hotspot 1" dot={false} />
              <Line type="monotone" dataKey="h2" stroke="#FF8E61" name="Hotspot 2" dot={false} />
              <Line type="monotone" dataKey="h3" stroke="#FFA849" name="Hotspot 3" dot={false} />
            </LineChart>
          );
        case 'areaType':
          // Multi-series RadarChart for area type
          return (
            <RadarChart outerRadius={60} width={300} height={180} data={mockAreaTypeData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" fontSize={10} />
              <Radar name="Hotspot 1" dataKey="h1" stroke="#FF6B7D" fill="#FF6B7D" fillOpacity={0.2} />
              <Radar name="Hotspot 2" dataKey="h2" stroke="#FF8E61" fill="#FF8E61" fillOpacity={0.2} />
              <Radar name="Hotspot 3" dataKey="h3" stroke="#FFA849" fill="#FFA849" fillOpacity={0.2} />
              <Tooltip />
            </RadarChart>
          );
        case 'peakHour':
          // Multi-line LineChart for peak foot traffic hour
          return (
            <LineChart data={mockFootTrafficHourData} margin={{ top: 5, right: 5, bottom: 25, left: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" fontSize={10} />
              <YAxis fontSize={10} />
              <Tooltip />
              <Line type="monotone" dataKey="h1" stroke="#FF6B7D" name="Hotspot 1" dot={false} />
              <Line type="monotone" dataKey="h2" stroke="#FF8E61" name="Hotspot 2" dot={false} />
              <Line type="monotone" dataKey="h3" stroke="#FFA849" name="Hotspot 3" dot={false} />
            </LineChart>
          );
        case 'footTraffic':
          // Multi-line LineChart for avg daily traffic (by day of week)
          return (
            <LineChart data={mockAvgDailyTrafficData} margin={{ top: 5, right: 5, bottom: 25, left: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" fontSize={10} />
              <YAxis fontSize={10} />
              <Tooltip />
              <Line type="monotone" dataKey="h1" stroke="#FF6B7D" name="Hotspot 1" dot={false} />
              <Line type="monotone" dataKey="h2" stroke="#FF8E61" name="Hotspot 2" dot={false} />
              <Line type="monotone" dataKey="h3" stroke="#FFA849" name="Hotspot 3" dot={false} />
            </LineChart>
          );
        case 'demographics':
          // Stacked BarChart for dominant demographics
          return (
            <BarChart data={mockDemoData} margin={{ top: 5, right: 5, bottom: 25, left: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="group" fontSize={10} />
              <YAxis fontSize={10} />
              <Tooltip />
              <Bar dataKey="h1" stackId="a" fill="#FF6B7D" name="Hotspot 1" />
              <Bar dataKey="h2" stackId="a" fill="#FF8E61" name="Hotspot 2" />
              <Bar dataKey="h3" stackId="a" fill="#FFA849" name="Hotspot 3" />
            </BarChart>
          );
        case 'nearbyBusinesses':
          // Multi-line LineChart for nearby businesses by type
          return (
            <LineChart data={mockBusinessData} margin={{ top: 5, right: 5, bottom: 25, left: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" fontSize={10} />
              <YAxis fontSize={10} />
              <Tooltip />
              <Line type="monotone" dataKey="h1" stroke="#FF6B7D" name="Hotspot 1" dot={false} />
              <Line type="monotone" dataKey="h2" stroke="#FF8E61" name="Hotspot 2" dot={false} />
              <Line type="monotone" dataKey="h3" stroke="#FFA849" name="Hotspot 3" dot={false} />
            </LineChart>
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
          // Multi-line LineChart for capacity
          return (
            <LineChart data={mockEventCapacityData} margin={{ top: 5, right: 5, bottom: 25, left: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" fontSize={10} />
              <YAxis fontSize={10} />
              <Tooltip />
              <Line type="monotone" dataKey="e1" stroke="#FF6B7D" name="Event 1" dot={false} />
              <Line type="monotone" dataKey="e2" stroke="#FF8E61" name="Event 2" dot={false} />
              <Line type="monotone" dataKey="e3" stroke="#FFA849" name="Event 3" dot={false} />
            </LineChart>
          );
        case 'eventType':
          // Multi-series RadarChart for event type
          return (
            <RadarChart outerRadius={60} width={300} height={180} data={mockEventTypeData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="type" fontSize={10} />
              <Radar name="Event 1" dataKey="e1" stroke="#FF6B7D" fill="#FF6B7D" fillOpacity={0.2} />
              <Radar name="Event 2" dataKey="e2" stroke="#FF8E61" fill="#FF8E61" fillOpacity={0.2} />
              <Radar name="Event 3" dataKey="e3" stroke="#FFA849" fill="#FFA849" fillOpacity={0.2} />
              <Tooltip />
            </RadarChart>
          );
        case 'footTrafficImpact':
          // Multi-line LineChart for peak foot traffic impact
          return (
            <LineChart data={mockEventFootTrafficImpactData} margin={{ top: 5, right: 5, bottom: 25, left: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" fontSize={10} />
              <YAxis fontSize={10} />
              <Tooltip />
              <Line type="monotone" dataKey="e1" stroke="#FF6B7D" name="Event 1" dot={false} />
              <Line type="monotone" dataKey="e2" stroke="#FF8E61" name="Event 2" dot={false} />
              <Line type="monotone" dataKey="e3" stroke="#FFA849" name="Event 3" dot={false} />
            </LineChart>
          );
        case 'footTraffic':
          // Multi-line LineChart for avg daily traffic (by day of week)
          return (
            <LineChart data={mockEventAvgDailyTrafficData} margin={{ top: 5, right: 5, bottom: 25, left: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" fontSize={10} />
              <YAxis fontSize={10} />
              <Tooltip />
              <Line type="monotone" dataKey="e1" stroke="#FF6B7D" name="Event 1" dot={false} />
              <Line type="monotone" dataKey="e2" stroke="#FF8E61" name="Event 2" dot={false} />
              <Line type="monotone" dataKey="e3" stroke="#FFA849" name="Event 3" dot={false} />
            </LineChart>
          );
        case 'demographics':
          // Stacked BarChart for expected crowd/demographics
          return (
            <BarChart data={mockEventDemoData} margin={{ top: 5, right: 5, bottom: 25, left: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="group" fontSize={10} />
              <YAxis fontSize={10} />
              <Tooltip />
              <Bar dataKey="e1" stackId="a" fill="#FF6B7D" name="Event 1" />
              <Bar dataKey="e2" stackId="a" fill="#FF8E61" name="Event 2" />
              <Bar dataKey="e3" stackId="a" fill="#FFA849" name="Event 3" />
            </BarChart>
          );
        case 'nearbyBusinesses':
          // Multi-line LineChart for nearby businesses by type
          return (
            <LineChart data={mockEventBusinessData} margin={{ top: 5, right: 5, bottom: 25, left: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" fontSize={10} />
              <YAxis fontSize={10} />
              <Tooltip />
              <Line type="monotone" dataKey="e1" stroke="#FF6B7D" name="Event 1" dot={false} />
              <Line type="monotone" dataKey="e2" stroke="#FF8E61" name="Event 2" dot={false} />
              <Line type="monotone" dataKey="e3" stroke="#FFA849" name="Event 3" dot={false} />
            </LineChart>
          );
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