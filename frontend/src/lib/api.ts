import { Event, Hotspot, MapItem } from './types';

const API_BASE_URL = 'http://127.0.0.1:8000';

// Debug logger function
const debugLog = (message: string, data?: any) => {
  console.log(`🔄 API DEBUG: ${message}`, data || '');
};

export const fetchHotspots = async (): Promise<Hotspot[]> => {
  debugLog(`GET ${API_BASE_URL}/hotspots`);
  try {
    const response = await fetch(`${API_BASE_URL}/hotspots`);
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
    ? `${API_BASE_URL}/events?date=${encodeURIComponent(date)}&_=${timestamp}` 
    : `${API_BASE_URL}/events?_=${timestamp}`;
    
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

export const fetchMapItems = async (): Promise<MapItem[]> => {
  debugLog(`GET ${API_BASE_URL}/map-items`);
  try {
    const response = await fetch(`${API_BASE_URL}/map-items`);
    if (!response.ok) {
      const errorText = await response.text();
      debugLog(`Error fetching map items: ${response.status} ${response.statusText}`, errorText);
      throw new Error('Failed to fetch map items');
    }
    const data = await response.json();
    debugLog(`Map items response received`, { count: data.length });
    return data;
  } catch (error) {
    debugLog(`Exception in fetchMapItems`, error);
    throw error;
  }
};

export const fetchTrafficData = async () => {
  debugLog(`GET ${API_BASE_URL}/traffic`);
  try {
    const response = await fetch(`${API_BASE_URL}/traffic`);
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
  debugLog(`GET ${API_BASE_URL}/tampere-center`);
  try {
    const response = await fetch(`${API_BASE_URL}/tampere-center`);
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

export const fetchSimilarEvents = async (eventId: string): Promise<Event[]> => {
  const timestamp = new Date().getTime();
  const url = `${API_BASE_URL}/events/${eventId}/similar?_=${timestamp}`;
  
  console.log(`🔌 API: FETCH_SIMILAR_EVENTS START for eventId=${eventId}`);
  debugLog(`GET ${url}`);
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      debugLog(`Error fetching similar events: ${response.status} ${response.statusText}`, errorText);
      throw new Error('Failed to fetch similar events');
    }
    
    const data = await response.json();
    console.log(`🔌 API: FETCH_SIMILAR_EVENTS COMPLETED for eventId=${eventId}, received ${data.length} events:`);
    data.forEach((event: Event, index: number) => {
      console.log(`  API Similar Event ${index+1}: id=${event.id}, name=${event.name}, date=${event.date}`);
    });
    
    debugLog(`Similar events response received`, { count: data.length, eventId, data });
    return data;
  } catch (error) {
    console.log(`🔌 API: FETCH_SIMILAR_EVENTS ERROR for eventId=${eventId}`, error);
    debugLog(`Exception in fetchSimilarEvents`, error);
    throw error;
  }
};

export const fetchSimilarHotspots = async (hotspotId: string): Promise<Hotspot[]> => {
  const timestamp = new Date().getTime();
  const url = `${API_BASE_URL}/hotspots/${hotspotId}/similar?_=${timestamp}`;
  
  console.log(`🔌 API: FETCH_SIMILAR_HOTSPOTS START for hotspotId=${hotspotId}`);
  debugLog(`GET ${url}`);
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      debugLog(`Error fetching similar hotspots: ${response.status} ${response.statusText}`, errorText);
      throw new Error('Failed to fetch similar hotspots');
    }
    
    const data = await response.json();
    console.log(`🔌 API: FETCH_SIMILAR_HOTSPOTS COMPLETED for hotspotId=${hotspotId}, received ${data.length} hotspots:`);
    data.forEach((hotspot: Hotspot, index: number) => {
      console.log(`  API Similar Hotspot ${index+1}: id=${hotspot.id}, label=${hotspot.label}, address=${hotspot.address}`);
    });
    
    debugLog(`Similar hotspots response received`, { count: data.length, hotspotId, data });
    return data;
  } catch (error) {
    console.log(`🔌 API: FETCH_SIMILAR_HOTSPOTS ERROR for hotspotId=${hotspotId}`, error);
    debugLog(`Exception in fetchSimilarHotspots`, error);
    throw error;
  }
};

// Mock data for foot traffic
const generateFootTrafficData = (hotspotId: string) => {
  const currentHour = new Date().getHours();
  const data = [];
  
  // Generate past data (0 to current hour)
  for (let hour = 0; hour <= currentHour; hour++) {
    const baseValue = Math.floor(Math.random() * 50) + 10; // Random value between 10-60
    const timeMultiplier = hour >= 8 && hour <= 18 ? 2 : 1; // More traffic during day
    
    data.push({
      hour,
      value: baseValue * timeMultiplier,
      type: 'past' as const
    });
  }
  
  // Generate predicted data (current hour to 24)
  for (let hour = currentHour + 1; hour < 24; hour++) {
    const baseValue = Math.floor(Math.random() * 50) + 10;
    const timeMultiplier = hour >= 8 && hour <= 18 ? 2 : 1;
    
    data.push({
      hour,
      value: baseValue * timeMultiplier,
      type: 'predicted' as const
    });
  }
  
  return data;
};

// Function to fetch foot traffic data for a hotspot
export const fetchHotspotFootTraffic = async (hotspotId: string) => {
  // For now we're using mock data, but in a real app this would be a fetch call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(generateFootTrafficData(hotspotId));
    }, 300); // Add a small delay to simulate network request
  });
}; 