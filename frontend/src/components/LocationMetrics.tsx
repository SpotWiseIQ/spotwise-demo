import React, { useState, useEffect } from "react";
import { Users, Clock, Wallet, Sun, CloudSnow, TrendingUp, MapPin, Building, Calendar, UserCheck, Users2 } from "lucide-react";
import { useTampere } from "@/lib/TampereContext";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  RadialBarChart,
  RadialBar,
  Legend,
  ScatterChart,
  Scatter,
  ComposedChart,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { FootTrafficChart } from "@/components/FootTrafficChart";
import { ChatBox } from "@/components/ChatBox";
import { logFootTrafficSource } from "@/lib/debug_utils";

interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  vs?: string;
  onExpandToggle: (expanded: boolean) => void;
  footTrafficData?: any[];
  isLoadingTraffic?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  icon, 
  vs, 
  onExpandToggle, 
  footTrafficData = [], 
  isLoadingTraffic = false 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Notify parent component when expanded state changes
  useEffect(() => {
    onExpandToggle(isExpanded);
  }, [isExpanded, onExpandToggle]);

  // --- Enhanced Mock Data --- 
  const populationData = [
    { name: '2020', population: 950 },
    { name: '2021', population: 1050 },
    { name: '2022', population: 1120 },
    { name: '2023', population: 1250 },
    { name: '2024', population: 1300 },
  ];

  const areaTypeData = [
    { subject: 'Residential', A: 90, fullMark: 100 },
    { subject: 'Commercial', A: 40, fullMark: 100 },
    { subject: 'Industrial', A: 20, fullMark: 100 },
    { subject: 'Leisure', A: 60, fullMark: 100 },
    { subject: 'Green Space', A: 45, fullMark: 100 },
  ];

  const trafficHourData = [
    { hour: '00:00', traffic: 10 },
    { hour: '04:00', traffic: 5 },
    { hour: '08:00', traffic: 90 },
    { hour: '12:00', traffic: 60 },
    { hour: '16:00', traffic: 80 },
    { hour: '17:00', traffic: 110 },
    { hour: '18:00', traffic: 95 },
    { hour: '20:00', traffic: 40 },
  ];

  const avgTrafficData = [
    { day: 'Mon', morning: 2200, afternoon: 2000, evening: 2400 },
    { day: 'Tue', morning: 2300, afternoon: 2100, evening: 2600 },
    { day: 'Wed', morning: 2400, afternoon: 2200, evening: 2700 },
    { day: 'Thu', morning: 2500, afternoon: 2300, evening: 2800 },
    { day: 'Fri', morning: 2600, afternoon: 2400, evening: 3000 },
    { day: 'Sat', morning: 1400, afternoon: 1800, evening: 2200 },
    { day: 'Sun', morning: 1200, afternoon: 1600, evening: 1800 },
  ];

  const demoData = [
    { name: '18-24', value: 400, color: '#0088FE' },
    { name: '25-34', value: 300, color: '#00C49F' },
    { name: '35-44', value: 300, color: '#FFBB28' },
    { name: '45+', value: 200, color: '#FF8042' },
  ];

  const businessData = [
    { name: 'Retail', count: 12, size: 120 },
    { name: 'Food', count: 8, size: 80 },
    { name: 'Services', count: 15, size: 150 },
    { name: 'Entertainment', count: 5, size: 50 },
    { name: 'Other', count: 10, size: 100 },
  ];

  const eventTypeData = [
    { name: 'Music', value: 35 },
    { name: 'Sports', value: 25 },
    { name: 'Cultural', value: 20 },
    { name: 'Food', value: 15 },
    { name: 'Other', value: 5 },
  ];

  const durationData = [
    { name: 'Setup', start: 0, duration: 2 },
    { name: 'Main Event', start: 2, duration: 4 },
    { name: 'Breakdown', start: 6, duration: 1.5 },
  ];

  const capacityValue = parseInt(value) || 500;
  const capacityData = [
    { name: 'Capacity', value: capacityValue },
  ];

  const trafficImpactData = [
    { name: 'Before', value: 65, fill: '#29549a' },
    { name: 'During', value: 90, fill: '#c83e36' },
    { name: 'After', value: 75, fill: '#82ca9d' },
  ];

  const ticketStatusData = [
    { name: 'Sold', value: 65 },
    { name: 'Reserved', value: 15 },
    { name: 'Available', value: 20 },
  ];

  const COLORS = ['#29549a', '#c83e36', '#FFBB28', '#FF8042', '#8884d8', '#ff3d7f'];

  // --- Render Chart Logic --- 
  const renderChart = () => {
    let chartComponent = null;

    switch (title) {
      case "Population (Est.)":
        // Gradient area chart showing population growth
        chartComponent = (
          <AreaChart data={populationData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
            <defs>
              <linearGradient id="colorPopulation" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="name" fontSize={10} />
            <YAxis fontSize={10} />
            <Tooltip />
            <Area type="monotone" dataKey="population" stroke="#8884d8" fillOpacity={1} fill="url(#colorPopulation)" />
          </AreaChart>
        );
        break;
        
      case "Area Type":
        // Radar chart showing area attributes
        chartComponent = (
          <RadarChart outerRadius={50} width={200} height={130} data={areaTypeData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="subject" fontSize={8} />
            <Radar name="Area Type" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
            <Tooltip />
          </RadarChart>
        );
        break;
        
      case "Peak Foot Traffic Hour":
      case "Peak Foot Traffic Impact":
        // Use the provided foot traffic data or fall back to mock data
        const dataToUse = footTrafficData.length > 0 ? footTrafficData : 
          trafficHourData.map(item => ({
            hour: parseInt(item.hour.split(':')[0]),
            value: item.traffic,
            type: item.hour === '17:00' ? 'past' as const : 'predicted' as const
          }));
        
        // Find the peak hour for highlighting
        const peakHour = dataToUse.reduce(
          (max, item) => item.value > max.value ? item : max, 
          { hour: 0, value: 0 }
        ).hour;
        
        // For Peak Foot Traffic Impact with no data, show the bar chart instead
        if (title === "Peak Foot Traffic Impact" && footTrafficData.length === 0 && !isLoadingTraffic) {
          // Enhanced bar chart with gradient (fallback)
          chartComponent = (
            <ComposedChart
              width={200}
              height={130}
              data={trafficImpactData}
              margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={10} />
              <YAxis fontSize={10} />
              <Tooltip />
              <Bar dataKey="value" barSize={30}>
                {trafficImpactData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
              <Line type="monotone" dataKey="value" stroke="#ff7300" strokeWidth={2} dot={false} />
            </ComposedChart>
          );
        } else {
          chartComponent = (
            <div className="w-full h-[130px] relative">
              {isLoadingTraffic ? (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-75">
                  <div className="text-xs text-gray-500">Loading foot traffic data...</div>
                </div>
              ) : (
                <FootTrafficChart 
                  data={dataToUse}
                  currentHour={peakHour} // Use the actual peak hour
                />
              )}
            </div>
          );
        }
        break;
        
      case "Avg. Daily Traffic":
        // Stacked area chart showing traffic patterns
        chartComponent = (
          <AreaChart data={avgTrafficData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
            <defs>
              <linearGradient id="colorMorning" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorAfternoon" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorEvening" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ffc658" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#ffc658" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="day" fontSize={10} />
            <YAxis fontSize={10} />
            <Tooltip />
            <Area type="monotone" dataKey="morning" stackId="1" stroke="#8884d8" fill="url(#colorMorning)" />
            <Area type="monotone" dataKey="afternoon" stackId="1" stroke="#82ca9d" fill="url(#colorAfternoon)" />
            <Area type="monotone" dataKey="evening" stackId="1" stroke="#ffc658" fill="url(#colorEvening)" />
          </AreaChart>
        );
        break;
        
      case "Dominant Demo.":
      case "Expected Crowd": 
        // Enhanced pie chart with labels
        chartComponent = (
          <PieChart width={200} height={130}> 
             <Pie
              data={demoData}
              cx="50%" 
              cy="50%" 
              labelLine={false}
              outerRadius={50}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              fontSize={8}
             > 
              {demoData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        );
        break;
        
      case "Nearby Businesses":
        // Scatter/bubble chart showing business types by count
        chartComponent = (
          <ScatterChart
            width={200}
            height={130}
            margin={{ top: 10, right: 10, bottom: 10, left: -20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="count" type="number" name="count" fontSize={8} />
            <YAxis dataKey="size" type="number" name="size" fontSize={8} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Scatter name="Businesses" data={businessData} fill="#8884d8">
              {businessData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Scatter>
          </ScatterChart>
        );
        break;
        
      case "Event Type":
        // Donut chart showing event type distribution
        chartComponent = (
          <PieChart width={200} height={130}>
            <Pie
              data={eventTypeData}
              cx="50%"
              cy="50%"
              innerRadius={30}
              outerRadius={50}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              fontSize={8}
            >
              {eventTypeData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        );
        break;
        
      case "Duration":
        // Horizontal bar chart showing timeline
        chartComponent = (
          <BarChart
            layout="vertical"
            width={200}
            height={130}
            data={durationData}
            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
          >
            <XAxis type="number" fontSize={8} />
            <YAxis type="category" dataKey="name" fontSize={8} />
            <Tooltip />
            <Bar dataKey="duration" stackId="a" fill="#8884d8">
              {durationData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        );
        break;
        
      case "Expected Attendance":
        // Radial gauge chart
        const max = 1000; // Example maximum
        const percentage = Math.min(100, (capacityValue / max) * 100);
        
        chartComponent = (
          <RadialBarChart 
            width={200} 
            height={130} 
            innerRadius="60%" 
            outerRadius="100%" 
            startAngle={180} 
            endAngle={0}
            data={[{
              name: 'capacity',
              value: percentage,
              fill: percentage > 80 ? '#FF8042' : percentage > 50 ? '#FFBB28' : '#00C49F'
            }]}
          >
            <RadialBar 
              background
              dataKey="value"
              cornerRadius={10}
              label={{ position: 'center', fill: '#666', fontSize: 12, formatter: () => `${capacityValue}/${max}` }}
            />
            <Tooltip />
          </RadialBarChart>
        );
        break;
        
      case "Ticket Status":
        // Funnel-like chart
        chartComponent = (
          <BarChart
            width={200}
            height={130}
            data={ticketStatusData}
            margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
          >
            <XAxis dataKey="name" fontSize={10} />
            <YAxis fontSize={10} />
            <Tooltip />
            <Bar dataKey="value">
              {ticketStatusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        );
        break;
        
      default:
        // Return a message if no chart is applicable
        return <div className="text-xs text-center p-4 text-gray-500">No specialized visualization for this metric.</div>;
    }

    return (
       <div style={{ width: '100%', height: 200 }} className="mt-2"> 
        <ResponsiveContainer>
          {chartComponent}
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div
      className={`bg-gray-50 rounded-lg shadow-sm border border-gray-100 transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'ring-2 ring-blue-300' : ''}`}
      onClick={() => setIsExpanded(!isExpanded)}
      style={{ cursor: 'pointer' }}
    >
      <div className="pt-2 px-2 pb-0.5">
        <div className="flex items-center gap-1 mb-0.5">
          <div className="text-gray-500">{React.cloneElement(icon as React.ReactElement, { size: 14 })}</div>
          <div className="text-xs text-gray-500">{title}</div>
        </div>
        <div className="flex items-baseline gap-1">
          <div className="text-xl font-semibold leading-tight">{value}</div>
        </div>
        {vs && <div className="text-[10px] text-gray-400 mt-0.5">{vs}</div>}
      </div>
      {isExpanded && (
        <div style={{ width: '100%', height: 200 }}>
          <ResponsiveContainer>
            {renderChart()}
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export interface LocationMetricsProps {
  onAnyCardExpanded?: (expanded: boolean) => void;
}

export const LocationMetrics: React.FC<LocationMetricsProps> = ({ onAnyCardExpanded }) => {
  const {
    selectedLocation,
    loadHotspotFootTraffic,
    loadEventFootTraffic,
    loadHotspotDetailedMetrics,
    loadEventDetailedMetrics,
    detailedMetrics
  } = useTampere();

  const [expandedCardCount, setExpandedCardCount] = useState(0);
  const [footTrafficData, setFootTrafficData] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const isHotspot = selectedLocation?.type === 'natural';
  const isEvent = selectedLocation?.type === 'event';

  // Track when any card is expanded
  const handleCardExpandToggle = (expanded: boolean) => {
    setExpandedCardCount(prev => expanded ? prev + 1 : Math.max(0, prev - 1));
  };

  // Notify parent component if any card is expanded
  useEffect(() => {
    if (onAnyCardExpanded) {
      onAnyCardExpanded(expandedCardCount > 0);
    }
  }, [expandedCardCount, onAnyCardExpanded]);

  // Load foot traffic data when a location is selected
  useEffect(() => {
    const loadData = async () => {
      if (selectedLocation) {
        setIsLoadingData(true);
        try {
          // First check for event_foot_traffic (for event-type locations)
          if (isEvent && (selectedLocation as any).event_foot_traffic) {
            setFootTrafficData((selectedLocation as any).event_foot_traffic);
            logFootTrafficSource(selectedLocation, "LocationMetrics");
          } 
          // Then check for regular footTraffic as fallback
          else if (selectedLocation.footTraffic) {
            setFootTrafficData(selectedLocation.footTraffic);
            logFootTrafficSource(selectedLocation, "LocationMetrics");
          } else if (isHotspot) {
            const data = await loadHotspotFootTraffic(selectedLocation.id);
            if (data) setFootTrafficData(data);
            logFootTrafficSource(selectedLocation, "LocationMetrics");
          } else if (isEvent) {
            const data = await loadEventFootTraffic(selectedLocation.id);
            if (data) setFootTrafficData(data);
            logFootTrafficSource(selectedLocation, "LocationMetrics");
          }
        } catch (error) {
          console.error('Error loading foot traffic data:', error);
        } finally {
          setIsLoadingData(false);
        }
      } else {
        setFootTrafficData([]);
      }
    };
    loadData();
  }, [selectedLocation, loadHotspotFootTraffic, loadEventFootTraffic, isHotspot, isEvent]);

  // Calculate the peak hour from foot traffic data
  const findPeakHour = (data: any[]) => {
    if (!data || data.length === 0) return null;
    return data.reduce((max, item) => item.value > max.value ? item : max, { hour: 0, value: 0 }).hour;
  };

  // Format hour to display format (e.g., "17:00")
  const formatHour = (hour: number | null) => {
    if (hour === null) return "N/A";
    return `${hour}:00`;
  };

  const peakHour = findPeakHour(footTrafficData);

  // Helper to get detailed data safely
  const getDetailed = (key: string) => detailedMetrics?.detailed?.[key];

  return (
    <div className="grid grid-cols-3 gap-2 p-2 bg-white h-full">
      {selectedLocation && isHotspot && (
        <>
          <div className="col-span-2 overflow-y-auto pr-1" style={{ maxHeight: '400px' }}>
            <div className="grid grid-cols-2 gap-2">
              <MetricCard
                title="Population (Est.)"
                value={selectedLocation.population || detailedMetrics?.metrics?.population || "N/A"}
                icon={<Users size={18} />}
                vs="in this zone"
                onExpandToggle={handleCardExpandToggle}
                footTrafficData={footTrafficData}
                isLoadingTraffic={isLoadingData}
              />
              <MetricCard
                title="Area Type"
                value={selectedLocation.areaType || detailedMetrics?.metrics?.areaType || "N/A"}
                icon={<Building size={18} />}
                onExpandToggle={handleCardExpandToggle}
                footTrafficData={footTrafficData}
                isLoadingTraffic={isLoadingData}
              />
              <MetricCard
                title="Peak Foot Traffic Hour"
                value={isLoadingData ? "Loading..." : formatHour(peakHour) || selectedLocation.peakHour || detailedMetrics?.metrics?.peakHour || "17:00"}
                icon={<Clock size={18} />}
                vs="estimated daily peak"
                onExpandToggle={handleCardExpandToggle}
                footTrafficData={footTrafficData}
                isLoadingTraffic={isLoadingData}
              />
              <MetricCard
                title="Avg. Daily Traffic"
                value={selectedLocation.avgDailyTraffic || detailedMetrics?.metrics?.avgDailyTraffic || "~2,500"}
                icon={<TrendingUp size={18} />}
                vs="people/day"
                onExpandToggle={handleCardExpandToggle}
                footTrafficData={footTrafficData}
                isLoadingTraffic={isLoadingData}
              />
              <MetricCard
                title="Dominant Demo."
                value={selectedLocation.dominantDemographics || detailedMetrics?.metrics?.dominantDemographics || "N/A"}
                icon={<Users2 size={18} />}
                onExpandToggle={handleCardExpandToggle}
                footTrafficData={footTrafficData}
                isLoadingTraffic={isLoadingData}
              />
              <MetricCard
                title="Nearby Businesses"
                value={selectedLocation.nearbyBusinesses || detailedMetrics?.metrics?.nearbyBusinesses || "15+"}
                icon={<Wallet size={18} />}
                vs="within 500m"
                onExpandToggle={handleCardExpandToggle}
                footTrafficData={footTrafficData}
                isLoadingTraffic={isLoadingData}
              />
            </div>
          </div>
          <div className="col-span-1 h-full flex items-center">
            <ChatBox 
              className="h-[230px]"
              onExpandToggle={handleCardExpandToggle} 
            />
          </div>
        </>
      )}
      {selectedLocation && isEvent && (
        <>
          <div className="col-span-2 overflow-y-auto pr-1" style={{ maxHeight: '400px' }}>
            <div className="grid grid-cols-2 gap-2">
              <MetricCard
                title="Event Type"
                value={
                  selectedLocation.event_type ||
                  selectedLocation.type_info ||
                  selectedLocation.type ||
                  detailedMetrics?.metrics?.type ||
                  "N/A"
                }
                icon={<Calendar size={18} />}
                onExpandToggle={handleCardExpandToggle}
                footTrafficData={footTrafficData}
                isLoadingTraffic={isLoadingData}
              />
              <MetricCard
                title="Duration"
                value={selectedLocation.duration || detailedMetrics?.metrics?.duration || "N/A"}
                icon={<Clock size={18} />}
                onExpandToggle={handleCardExpandToggle}
                footTrafficData={footTrafficData}
                isLoadingTraffic={isLoadingData}
              />
              <MetricCard
                title="Expected Attendance"
                value={
                  (selectedLocation.expected_attendance !== undefined
                    ? selectedLocation.expected_attendance.toString()
                    : selectedLocation.capacity?.toString()) ||
                  detailedMetrics?.metrics?.capacity ||
                  "N/A"
                }
                icon={<Users size={18} />}
                vs="max attendees"
                onExpandToggle={handleCardExpandToggle}
                footTrafficData={footTrafficData}
                isLoadingTraffic={isLoadingData}
              />
              <MetricCard
                title="Expected Crowd"
                value={
                  (getDetailed('expected_crowd') && getDetailed('expected_crowd').primary_demographic) ||
                  selectedLocation.demographics ||
                  detailedMetrics?.metrics?.demographics ||
                  "N/A"
                }
                icon={<Users2 size={18} />}
                vs="primary demographic"
                onExpandToggle={handleCardExpandToggle}
                footTrafficData={footTrafficData}
                isLoadingTraffic={isLoadingData}
              />
              <MetricCard
                title="Peak Foot Traffic Impact"
                value={
                  isLoadingData
                    ? "Loading..."
                    : (peakHour !== null
                        ? `+${peakHour}:00`
                        : selectedLocation.peakTrafficImpact ||
                          detailedMetrics?.metrics?.peakTrafficImpact ||
                          "+40%")
                }
                icon={<TrendingUp size={18} />}
                vs="around event time"
                onExpandToggle={handleCardExpandToggle}
                footTrafficData={footTrafficData}
                isLoadingTraffic={isLoadingData}
              />
            </div>
          </div>
          <div className="col-span-1 h-full flex items-center">
            <ChatBox 
              className="h-[230px]"
              onExpandToggle={handleCardExpandToggle} 
            />
          </div>
        </>
      )}
      {!selectedLocation && (
        <div className="col-span-3 text-center text-gray-500 pt-4 text-sm">
          Select a hotspot or event on the map or list to see details.
        </div>
      )}
    </div>
  );
}; 