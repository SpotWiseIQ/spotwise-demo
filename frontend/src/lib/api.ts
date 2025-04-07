import { Event, Hotspot, MapItem } from './types';

// Debug logger function
const debugLog = (message: string, data?: any) => {
  console.log(`🔄 API DEBUG: ${message}`, data || '');
};

export const fetchHotspots = async (): Promise<Hotspot[]> => {
  debugLog(`GET /api/hotspots`);
  try {
    const response = await fetch(`/api/hotspots`);
    if (!response.ok) {
      const errorText = await response.text();
      debugLog(`Error fetching hotspots: ${response.status} ${response.statusText}`, errorText);
      throw new Error('Failed to fetch hotspots');
    }
    const data = await response.json();
    debugLog(`Hotspots response received`, { count: data.length });
    return data;
  } catch (error) {
    debugLog(`Exception in fetchHotspots`, error);
    throw error;
  }
};

export const fetchEvents = async (date?: string): Promise<Event[]> => {
  // Ensure date is properly formatted and add a cache-busting timestamp
  const timestamp = new Date().getTime();
  const url = date 
    ? `/api/events?date=${encodeURIComponent(date)}&_=${timestamp}` 
    : `/api/events?_=${timestamp}`;
    
  console.log(`🔌 API: FETCH_EVENTS START for date=${date || 'all'}`);
  debugLog(`GET ${url}`);
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      debugLog(`Error fetching events: ${response.status} ${response.statusText}`, errorText);
      throw new Error('Failed to fetch events');
    }
    
    const data = await response.json();
    console.log(`🔌 API: FETCH_EVENTS COMPLETED for date=${date || 'all'}, received ${data.length} events:`);
    data.forEach((event: Event, index: number) => {
      console.log(`  API Event ${index+1}: id=${event.id}, name=${event.name}, date=${event.date}`);
    });
    
    debugLog(`Events response received`, { count: data.length, date, data });
    
    // Additional validation to ensure we got events
    if (!Array.isArray(data)) {
      debugLog(`Invalid events data received`, data);
      throw new Error('Invalid events data format');
    }
    
    return data;
  } catch (error) {
    console.log(`🔌 API: FETCH_EVENTS ERROR for date=${date || 'all'}`, error);
    debugLog(`Exception in fetchEvents`, error);
    throw error;
  }
};

export const fetchMapItems = async (lat: number, lng: number, radius: number = 500, types?: string[]): Promise<MapItem[]> => {
  debugLog(`Fetching map items for area: lat=${lat}, lng=${lng}, radius=${radius}m`);
  
  const params = new URLSearchParams({
    lat: lat.toString(),
    lng: lng.toString(),
    radius: radius.toString()
  });
  
  if (types && types.length > 0) {
    types.forEach(type => params.append('types', type));
  }

  try {
    const response = await fetch(`/api/map-items?${params}`);
    if (!response.ok) {
      throw new Error('Failed to fetch map items');
    }
    const data = await response.json();
    debugLog(`Received ${data.length} map items`);
    return data;
  } catch (error) {
    console.error('Error fetching map items:', error);
    debugLog('Error fetching map items');
    return [];
  }
};

export const fetchTrafficData = async () => {
  debugLog(`GET /api/traffic`);
  try {
    const response = await fetch(`/api/traffic`);
    if (!response.ok) {
      const errorText = await response.text();
      debugLog(`Error fetching traffic data: ${response.status} ${response.statusText}`, errorText);
      throw new Error('Failed to fetch traffic data');
    }
    const data = await response.json();
    debugLog(`Traffic data response received`);
    return data;
  } catch (error) {
    debugLog(`Exception in fetchTrafficData`, error);
    throw error;
  }
};

export const fetchTampereCenter = async (): Promise<[number, number]> => {
  debugLog(`GET /api/tampere-center`);
  try {
    const response = await fetch(`/api/tampere-center`);
    if (!response.ok) {
      const errorText = await response.text();
      debugLog(`Error fetching Tampere center: ${response.status} ${response.statusText}`, errorText);
      throw new Error('Failed to fetch Tampere center coordinates');
    }
    const data = await response.json();
    debugLog(`Tampere center response received`, data);
    return [data[0], data[1]];
  } catch (error) {
    debugLog(`Exception in fetchTampereCenter`, error);
    throw error;
  }
};

// Function to fetch foot traffic data for a hotspot
export const fetchHotspotFootTraffic = async (hotspotId: string) => {
  const timestamp = new Date().getTime();
  const url = `/api/hotspots/${hotspotId}/foot-traffic?_=${timestamp}`;
  
  console.log(`🔌 API: FETCH_FOOT_TRAFFIC START for hotspotId=${hotspotId}`);
  debugLog(`GET ${url}`);
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      debugLog(`Error fetching foot traffic: ${response.status} ${response.statusText}`, errorText);
      throw new Error('Failed to fetch foot traffic data');
    }
    
    const data = await response.json();
    console.log(`🔌 API: FETCH_FOOT_TRAFFIC COMPLETED for hotspotId=${hotspotId}`);
    
    debugLog(`Foot traffic data received`, { hotspotId, dataPoints: data.length });
    return data;
  } catch (error) {
    console.log(`🔌 API: FETCH_FOOT_TRAFFIC ERROR for hotspotId=${hotspotId}`, error);
    debugLog(`Exception in fetchHotspotFootTraffic`, error);
    throw error;
  }
};

// Function to fetch foot traffic data for an event
export const fetchEventFootTraffic = async (eventId: string) => {
  const timestamp = new Date().getTime();
  const url = `/api/events/${eventId}/foot-traffic?_=${timestamp}`;
  
  console.log(`🔌 API: FETCH_EVENT_FOOT_TRAFFIC START for eventId=${eventId}`);
  debugLog(`GET ${url}`);
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      debugLog(`Error fetching event foot traffic: ${response.status} ${response.statusText}`, errorText);
      throw new Error('Failed to fetch event foot traffic data');
    }
    
    const data = await response.json();
    console.log(`🔌 API: FETCH_EVENT_FOOT_TRAFFIC COMPLETED for eventId=${eventId}`);
    
    debugLog(`Event foot traffic data received`, { eventId, dataPoints: data.length });
    return data;
  } catch (error) {
    console.log(`🔌 API: FETCH_EVENT_FOOT_TRAFFIC ERROR for eventId=${eventId}`, error);
    debugLog(`Exception in fetchEventFootTraffic`, error);
    throw error;
  }
}; 