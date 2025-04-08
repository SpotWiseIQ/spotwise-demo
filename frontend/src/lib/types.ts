export type TrafficLevel = 'high' | 'medium' | 'low';
export type WeatherType = 'sunny' | 'clouded' | 'rainy' | 'snowy';

export interface FootTrafficData {
  hour: number;
  value: number;
  type: 'past' | 'current' | 'predicted';
}

export interface Hotspot {
  id: string;
  label: string;
  address: string;
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
  time: string;
  place: string;
  coordinates: [number, number]; // [longitude, latitude]
  date: string;
  footTraffic?: FootTrafficData[];
  address?: string;
  type?: string;
  duration?: string;
  capacity?: string;
  demographics?: string;
  peakTrafficImpact?: string;
  ticketStatus?: string;
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
