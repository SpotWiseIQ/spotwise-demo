import { Event, Hotspot, MapItem, TimelineRange } from './types';
import { API_BASE_URL } from '../config';

// Debug logger function
const debugLog = (message: string, data?: any) => {
  console.log(`🔄 API DEBUG: ${message}`, data || '');
};

// Helper function to build API URLs
const buildUrl = (path: string) => `${API_BASE_URL}${path}`;

export const fetchHotspots = async (
  timePeriod?: string,
  date?: string,
  timelineRange?: TimelineRange
): Promise<Hotspot[]> => {
  // Build query parameters
  const params = new URLSearchParams();
  
  // Add cache-busting timestamp
  const timestamp = new Date().getTime();
  params.append('_', timestamp.toString());
  
  // Add filtering parameters if provided
  if (timePeriod) {
    params.append('time_period', timePeriod);
  }
  
  // Only send date and time for real-time mode
  if (timePeriod === 'real-time') {
    if (date) {
      params.append('date', date);
    }
    
    if (timelineRange) {
      // Convert slider value to an hour (0-23)
      const selectedTime = Math.round(timelineRange.start / 100 * 24);
      params.append('time', selectedTime.toString());
    }
  } else {
    // For other time periods, just send the date
    if (date) {
      params.append('date', date);
    }
  }
  
  const url = buildUrl(`/api/hotspots?${params}`);
  debugLog(`GET ${url}`);
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      debugLog(`Error fetching hotspots: ${response.status} ${response.statusText}`, errorText);
      throw new Error('Failed to fetch hotspots');
    }
    const data = await response.json();
    debugLog(`Hotspots response received`, { 
      count: data.length,
      timePeriod,
      date,
      selectedTime: timelineRange ? Math.round(timelineRange.start / 100 * 24) : undefined
    });
    return data;
  } catch (error) {
    debugLog(`Exception in fetchHotspots`, error);
    throw error;
  }
};

export const fetchEvents = async (
  date?: string,
  currentTime?: number
): Promise<Event[]> => {
  // Build query parameters
  const params = new URLSearchParams();
  
  // Add cache-busting timestamp
  const timestamp = new Date().getTime();
  params.append('_', timestamp.toString());
  
  // Add filtering parameters if provided
  if (date) {
    params.append('date', date);
  }
  
  if (currentTime !== undefined) {
    params.append('current_time', currentTime.toString());
  }
  
  const url = buildUrl(`/api/events?${params}`);
  console.log(`🔌 API: FETCH_EVENTS START for date=${date || 'all'}, currentTime=${currentTime}`);
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
    
    debugLog(`Events response received`, { 
      count: data.length, 
      date, 
      currentTime,
      data 
    });
    
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
    const response = await fetch(buildUrl(`/api/map-items?${params}`));
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

export const fetchTrafficData = async (useHotspots: boolean = true) => {
  debugLog(`GET /api/traffic?use_hotspots=${useHotspots}`);
  try {
    const response = await fetch(buildUrl(`/api/traffic?use_hotspots=${useHotspots}`));
    if (!response.ok) {
      const errorText = await response.text();
      debugLog(`Error fetching traffic data: ${response.status} ${response.statusText}`, errorText);
      throw new Error('Failed to fetch traffic data');
    }
    const data = await response.json();
    debugLog(`Traffic data response received with useHotspots=${useHotspots}`);
    return data;
  } catch (error) {
    debugLog(`Exception in fetchTrafficData`, error);
    throw error;
  }
};

export const fetchTrafficPoints = async (useHotspots: boolean = true) => {
  debugLog(`GET /api/traffic/points?use_hotspots=${useHotspots}`);
  try {
    const response = await fetch(buildUrl(`/api/traffic/points?use_hotspots=${useHotspots}`));
    if (!response.ok) {
      const errorText = await response.text();
      debugLog(`Error fetching traffic points data: ${response.status} ${response.statusText}`, errorText);
      throw new Error('Failed to fetch traffic points data');
    }
    const data = await response.json();
    debugLog(`Traffic points data response received with useHotspots=${useHotspots}`);
    return data;
  } catch (error) {
    debugLog(`Exception in fetchTrafficPoints`, error);
    throw error;
  }
};

export const fetchTampereCenter = async (): Promise<[number, number]> => {
  debugLog(`GET /api/tampere-center`);
  try {
    const response = await fetch(buildUrl(`/api/tampere-center`));
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
// Now deprecated - foot traffic is included in the hotspot data
// Keeping for backward compatibility
export const fetchHotspotFootTraffic = async (hotspotId: string) => {
  debugLog(`DEPRECATED: Using fetchHotspotFootTraffic is no longer needed as foot traffic data is included in the hotspot data`);
  const timestamp = new Date().getTime();
  const url = buildUrl(`/api/hotspots/${hotspotId}/foot-traffic?_=${timestamp}`);
  
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
// Now deprecated - foot traffic is included in the event data
// Keeping for backward compatibility
export const fetchEventFootTraffic = async (eventId: string) => {
  debugLog(`DEPRECATED: Using fetchEventFootTraffic is no longer needed as foot traffic data is included in the event data`);
  const timestamp = new Date().getTime();
  const url = buildUrl(`/api/events/${eventId}/foot-traffic?_=${timestamp}`);
  
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

export interface BusinessPreferences {
  business_type: string;
  business: string;
  location: string;
  intent: string;
}

export const analyzeBusiness = async (text: string): Promise<BusinessPreferences> => {
  debugLog(`POST /api/analyze-business`);
  try {
    const response = await fetch(buildUrl(`/api/analyze-business`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      debugLog(`Error analyzing business: ${response.status} ${response.statusText}`, errorText);
      throw new Error('Failed to analyze business requirement');
    }
    
    const data = await response.json();
    debugLog(`Business analysis response received`, data);
    return data;
  } catch (error) {
    debugLog(`Exception in analyzeBusiness`, error);
    throw error;
  }
};

// Function to fetch detailed metrics data for a hotspot
export const fetchHotspotDetailedMetrics = async (hotspotId: string) => {
  const timestamp = new Date().getTime();
  const url = buildUrl(`/api/hotspots/${hotspotId}/detailed-metrics?_=${timestamp}`);
  
  console.log(`🔌 API: FETCH_HOTSPOT_DETAILED_METRICS START for hotspotId=${hotspotId}`);
  debugLog(`GET ${url}`);
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      debugLog(`Error fetching hotspot detailed metrics: ${response.status} ${response.statusText}`, errorText);
      throw new Error('Failed to fetch hotspot detailed metrics');
    }
    
    const data = await response.json();
    console.log(`🔌 API: FETCH_HOTSPOT_DETAILED_METRICS COMPLETED for hotspotId=${hotspotId}`);
    
    debugLog(`Hotspot detailed metrics received`, { hotspotId });
    return data;
  } catch (error) {
    console.log(`🔌 API: FETCH_HOTSPOT_DETAILED_METRICS ERROR for hotspotId=${hotspotId}`, error);
    debugLog(`Exception in fetchHotspotDetailedMetrics`, error);
    throw error;
  }
};

// Function to fetch detailed metrics data for an event
export const fetchEventDetailedMetrics = async (eventId: string) => {
  const timestamp = new Date().getTime();
  const url = buildUrl(`/api/events/${eventId}/detailed-metrics?_=${timestamp}`);
  
  console.log(`🔌 API: FETCH_EVENT_DETAILED_METRICS START for eventId=${eventId}`);
  debugLog(`GET ${url}`);
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      debugLog(`Error fetching event detailed metrics: ${response.status} ${response.statusText}`, errorText);
      throw new Error('Failed to fetch event detailed metrics');
    }
    
    const data = await response.json();
    console.log(`🔌 API: FETCH_EVENT_DETAILED_METRICS COMPLETED for eventId=${eventId}`);
    
    debugLog(`Event detailed metrics received`, { eventId });
    return data;
  } catch (error) {
    console.log(`🔌 API: FETCH_EVENT_DETAILED_METRICS ERROR for eventId=${eventId}`, error);
    debugLog(`Exception in fetchEventDetailedMetrics`, error);
    throw error;
  }
};