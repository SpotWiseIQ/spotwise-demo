import React, { useState, useEffect } from "react";
import { Car, Users, Clock, Ban, EuroIcon, TrendingUp } from "lucide-react";
import { useStaticBusiness } from "@/lib/StaticBusinessContext";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  CartesianGrid,
  Scatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar
} from 'recharts';
import { StaticChatBox } from "@/components/StaticChatBox";

interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  vs?: string;
  onExpandToggle: (expanded: boolean) => void;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, vs, onExpandToggle }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    onExpandToggle(isExpanded);
  }, [isExpanded, onExpandToggle]);

  // Mock data for charts
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

  const COLORS = ['#29549a', '#c83e36', '#FFBB28', '#FF8042', '#8884d8', '#ff3d7f'];

  const renderChart = () => {
    let chartComponent = null;

    switch (title) {
      case "Population (Est.)":
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
        chartComponent = (
          <AreaChart data={trafficHourData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
            <defs>
              <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="hour" fontSize={10} />
            <YAxis fontSize={10} />
            <Tooltip />
            <Area type="monotone" dataKey="traffic" stroke="#82ca9d" fillOpacity={1} fill="url(#colorTraffic)" />
          </AreaChart>
        );
        break;

      case "Dominant Demo.":
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

      default:
        return <div className="text-xs text-center p-4 text-gray-500">No specialized visualization for this metric.</div>;
    }

    return (
      <div style={{ width: '100%', height: 150 }} className="mt-2">
        <ResponsiveContainer>
          {chartComponent}
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-100 transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'ring-2 ring-blue-300' : ''}`}
      onClick={() => setIsExpanded(!isExpanded)}
      style={{ cursor: 'pointer' }}
    >
      <div className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="text-gray-500">{icon}</div>
          <div className="text-sm text-gray-500">{title}</div>
        </div>
        <div className="flex items-baseline gap-2">
          <div className="text-3xl font-semibold">{value}</div>
        </div>
        {vs && <div className="text-xs text-gray-400 mt-1">{vs}</div>}
      </div>
      {isExpanded && renderChart()}
    </div>
  );
};

export interface StaticLocationMetricsProps {
  onAnyCardExpanded?: (expanded: boolean) => void;
}

export const StaticLocationMetrics: React.FC<StaticLocationMetricsProps> = ({ onAnyCardExpanded }) => {
  const { selectedZone } = useStaticBusiness();
  const [expandedCardCount, setExpandedCardCount] = useState(0);

  const handleCardExpandToggle = (expanded: boolean) => {
    setExpandedCardCount(prev => expanded ? prev + 1 : Math.max(0, prev - 1));
  };

  useEffect(() => {
    if (onAnyCardExpanded) {
      onAnyCardExpanded(expandedCardCount > 0);
    }
  }, [expandedCardCount, onAnyCardExpanded]);

  if (!selectedZone) {
    return (
      <div className="col-span-3 text-center text-gray-500 pt-10">
        Select a zone on the map to see details.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 h-full">
      <StaticChatBox className="col-span-1 h-full" onExpandToggle={handleCardExpandToggle} />
      <div className="col-span-2 overflow-y-auto pr-1" style={{ maxHeight: '100%' }}>
        <div className="grid grid-cols-2 gap-4">
          <MetricCard
            title="Daily Car Flow"
            value={selectedZone.carFlow?.toLocaleString() || "13,500"}
            icon={<Car size={18} />}
            vs="vehicles/day"
            onExpandToggle={handleCardExpandToggle}
          />
          <MetricCard
            title="Daily Foot Traffic"
            value={selectedZone.footTraffic?.toLocaleString() || "2,200"}
            icon={<Users size={18} />}
            vs="people/day"
            onExpandToggle={handleCardExpandToggle}
          />
          <MetricCard
            title="Avg. Parking Time"
            value={selectedZone.avgParkingTime?.toString() || "42"}
            icon={<Clock size={18} />}
            vs="minutes"
            onExpandToggle={handleCardExpandToggle}
          />
          <MetricCard
            title="Competition Nearby"
            value={selectedZone.competition || "None"}
            icon={<Ban size={18} />}
            onExpandToggle={handleCardExpandToggle}
          />
          <MetricCard
            title="Estimated Revenue Potential"
            value={`€${selectedZone.revenuePotential || "18k-27k"}`}
            icon={<EuroIcon size={18} />}
            vs="/month"
            onExpandToggle={handleCardExpandToggle}
          />
          <MetricCard
            title="Growth Index"
            value={selectedZone.growthIndex?.toString() || "8,7"}
            icon={<TrendingUp size={18} />}
            onExpandToggle={handleCardExpandToggle}
          />
        </div>
      </div>
    </div>
  );
}; 