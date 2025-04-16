import React, { useState, useEffect } from "react";
import { useTampere } from "@/lib/TampereContext";
import { Search, Building2, Home } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ZoneCard, Zone } from "./ZoneCard";

// Sample data for zones
export const sampleZones: Zone[] = [
  {
    id: "1",
    name: "Prisma Kaleva Zone",
    distance: 5.2,
    carFlow: 13500,
    avgParkingTime: 42,
    footTraffic: 2200,
    coordinates: [23.8214, 61.4911],
    trafficData: [
      { time: "08:00", value: 8000 },
      { time: "10:00", value: 10000 },
      { time: "12:00", value: 13500 },
      { time: "14:00", value: 12000 },
      { time: "16:00", value: 13000 },
      { time: "18:00", value: 11000 },
    ],
  },
  {
    id: "2",
    name: "Hervanta Bypass Area",
    distance: 3.1,
    carFlow: 11500,
    avgParkingTime: 36,
    footTraffic: 1600,
    coordinates: [23.8500, 61.4417],
    trafficData: [
      { time: "08:00", value: 7000 },
      { time: "10:00", value: 9000 },
      { time: "12:00", value: 11500 },
      { time: "14:00", value: 10000 },
      { time: "16:00", value: 11000 },
      { time: "18:00", value: 9500 },
    ],
  },
  {
    id: "3",
    name: "Lielahti Zone",
    distance: 5.2,
    carFlow: 8500,
    avgParkingTime: 62,
    footTraffic: 8200,
    coordinates: [23.6691, 61.5203],
    trafficData: [
      { time: "08:00", value: 5000 },
      { time: "10:00", value: 6500 },
      { time: "12:00", value: 8500 },
      { time: "14:00", value: 8000 },
      { time: "16:00", value: 7500 },
      { time: "18:00", value: 6000 },
    ],
  },
  {
    id: "4",
    name: "Ratina Mall Area",
    distance: 0.2,
    carFlow: 5500,
    avgParkingTime: 15,
    footTraffic: 9500, // Estimated value as it's not clearly visible in the image
    coordinates: [23.7667, 61.4936],
    trafficData: [
      { time: "08:00", value: 3000 },
      { time: "10:00", value: 4500 },
      { time: "12:00", value: 5500 },
      { time: "14:00", value: 5200 },
      { time: "16:00", value: 5000 },
      { time: "18:00", value: 4000 },
    ],
  },
];

interface StaticBusinessSidebarProps {
  onZoneSelect?: (zone: Zone | null) => void;
}

export const StaticBusinessSidebar: React.FC<StaticBusinessSidebarProps> = ({ onZoneSelect }) => {
  const { } = useTampere();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  const filteredZones = sampleZones.filter(zone =>
    zone.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Effect to notify parent component when zone selection changes
  useEffect(() => {
    if (onZoneSelect) {
      const zone = selectedZone ? sampleZones.find(z => z.id === selectedZone) || null : null;
      onZoneSelect(zone);
    }
  }, [selectedZone, onZoneSelect]);

  return (
    <div className="p-6 h-full overflow-y-auto overflow-x-hidden">
      <div className="mb-3">
        <div className="flex items-center gap-4 mb-2">
          <a href="/" className="cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0">
            <Home className="text-gray-600" size={20} />
          </a>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <a href="/static-business" className="cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-2">
              <Building2 className="text-tampere-red" />
              <span>Static Business Locations</span>
            </a>
          </h1>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-4">
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
      <div className="space-y-2 pr-2">
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
  );
}; 