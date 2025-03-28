export type TrafficLevel = 'high' | 'medium' | 'low';
export type WeatherType = 'sunny' | 'clouded' | 'rainy' | 'snowy';
export type HotspotType = 'natural' | 'event';

export interface FootTrafficData {
  hour: number;
  value: number;
  type: 'past' | 'current' | 'predicted';
}

export interface Hotspot {
  id: string;
  label: string;
  name: string;
  trafficLevel: TrafficLevel;
  weather: WeatherType;
  coordinates: [number, number]; // [longitude, latitude]
  footTraffic?: FootTrafficData[];
  population?: string;
  areaType?: string;
  peakHour?: string;
  avgDailyTraffic?: string;
  dominantDemographics?: string;
  nearbyBusinesses?: string;
}

export interface Event {
  id: string;
  name: string;
  time?: string;
  coordinates: [number, number]; // [longitude, latitude]
  date?: string;
  type?: string;
  duration?: string;
  capacity?: string;
  demographics?: string;
  peakTrafficImpact?: string;
  ticketStatus?: string;
  
  location_id?: string;
  start_time?: string;
  end_time?: string;
  event_type?: string;
  expected_attendance?: number;
  description?: string;
  event_id?: string;
  event_name?: string;
  
  footTraffic?: FootTrafficData[];
  venue?: string;
  venue_address?: string;
}

export interface UnifiedHotspot {
  id: string;
  name: string;
  type: HotspotType;
  label: string;
  trafficLevel: TrafficLevel;
  weather: WeatherType;
  coordinates: [number, number]; // [longitude, latitude]
  footTraffic?: FootTrafficData[];
  
  // Natural-hotspot specific fields
  population?: string;
  areaType?: string;
  peakHour?: string;
  avgDailyTraffic?: string;
  dominantDemographics?: string;
  nearbyBusinesses?: string;
  
  // Event-hotspot specific fields
  time?: string;
  date?: string;
  type_info?: string;
  duration?: string;
  capacity?: string;
  demographics?: string;
  peakTrafficImpact?: string;
  ticketStatus?: string;
  event_id?: string;
  
  // New fields from updated model
  location_id?: string;
  start_time?: string;
  end_time?: string;
  event_type?: string;
  expected_attendance?: number;
  description?: string;
  event_name?: string;
  venue?: string;
  venue_address?: string;
  venue_coordinates?: [number, number]; // [longitude, latitude] for venue
  event_foot_traffic?: FootTrafficData[]; // Event-specific foot traffic data
}

export interface MapItem {
  type: 'event' | 'hotspot' | 'bus' | 'tram' | 'business' | 'parking' | 'available';
  id: string;
  coordinates: [number, number];
  label?: string;
}

export interface TimelineRange {
  start: number;
  end: number;
}
