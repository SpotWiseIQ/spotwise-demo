import React, { useState } from "react";
import { Store, Building2, CircleDot, Search } from "lucide-react";
import { useTampere } from "@/lib/TampereContext";
import { Input } from "@/components/ui/input";
import { ZoneCard, Zone } from "./ZoneCard";

// Sample data for zones
const sampleZones: Zone[] = [
  {
    id: "1",
    name: "Keskusta",
    distance: 0.2,
    carFlow: 450,
    avgParkingTime: 45,
    footTraffic: 25000,
    coordinates: [23.7610, 61.4978],
    trafficData: [
      { time: "08:00", value: 150 },
      { time: "10:00", value: 280 },
      { time: "12:00", value: 400 },
      { time: "14:00", value: 320 },
      { time: "16:00", value: 500 },
      { time: "18:00", value: 450 },
    ],
  },
  {
    id: "2",
    name: "Tampella",
    distance: 0.8,
    carFlow: 280,
    avgParkingTime: 60,
    footTraffic: 15000,
    coordinates: [23.7710, 61.5018],
    trafficData: [
      { time: "08:00", value: 100 },
      { time: "10:00", value: 180 },
      { time: "12:00", value: 250 },
      { time: "14:00", value: 220 },
      { time: "16:00", value: 300 },
      { time: "18:00", value: 280 },
    ],
  },
  {
    id: "3",
    name: "Tammela",
    distance: 1.2,
    carFlow: 320,
    avgParkingTime: 30,
    footTraffic: 18000,
    coordinates: [23.7810, 61.5038],
    trafficData: [
      { time: "08:00", value: 120 },
      { time: "10:00", value: 200 },
      { time: "12:00", value: 280 },
      { time: "14:00", value: 250 },
      { time: "16:00", value: 350 },
      { time: "18:00", value: 300 },
    ],
  },
  {
    id: "4",
    name: "Kaleva",
    distance: 1.5,
    carFlow: 380,
    avgParkingTime: 40,
    footTraffic: 12000,
    coordinates: [23.7910, 61.5058],
    trafficData: [
      { time: "08:00", value: 80 },
      { time: "10:00", value: 150 },
      { time: "12:00", value: 200 },
      { time: "14:00", value: 180 },
      { time: "16:00", value: 250 },
      { time: "18:00", value: 220 },
    ],
  },
];

export const StaticBusinessLegend: React.FC = () => {
  const { pulse } = useTampere();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  
  const mapItems = [
    { icon: <Store className="text-orange-600" size={16} />, label: "Available Business" },
    { icon: <Building2 className="text-blue-800" size={16} />, label: "Occupied Space" },
    { icon: <CircleDot className="text-green-600" size={16} />, label: "Potential Location" }
  ];

  const trafficItems = [
    { color: "#4caf50", label: "Low traffic" },
    { color: "#ffc107", label: "Medium traffic" },
    { color: "#ea384c", label: "High traffic" },
  ];

  const filteredZones = sampleZones.filter(zone =>
    zone.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-md w-[300px]">
      <div className="space-y-4">
        {/* Legend */}
        <div className="space-y-1">
          {mapItems.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              {item.icon}
              <span className="text-xs">{item.label}</span>
            </div>
          ))}
        </div>
        
        {pulse && (
          <>
            <div className="border-t border-gray-200 my-2" />
            <div className="space-y-1">
              {trafficItems.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div
                    className="w-4 h-1 rounded"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs">{item.label}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <Input
            type="text"
            placeholder="Search zones..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>

        {/* Zone Cards */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {filteredZones.map((zone) => (
            <ZoneCard
              key={zone.id}
              zone={zone}
              selected={selectedZone === zone.id}
              onClick={() => setSelectedZone(zone.id === selectedZone ? null : zone.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}; 