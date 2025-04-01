export type DangerLevel = 'high' | 'medium' | 'low';
export type WeatherType = 'sunny' | 'clouded' | 'rainy' | 'snowy';

export interface Hotspot {
  id: string;
  label: string;
  address: string;
  dangerLevel: DangerLevel;
  weather: WeatherType;
  coordinates: [number, number]; // [longitude, latitude]
  footTraffic?: {
    hour: number;
    value: number;
    type: 'past' | 'current' | 'predicted';
  }[];
}

export interface Event {
  id: string;
  name: string;
  time: string;
  place: string;
  address?: string;
  type?: string;
  duration?: string;
  capacity?: number;
  demographics?: string;
  coordinates: [number, number]; // [longitude, latitude]
  date: string;
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
