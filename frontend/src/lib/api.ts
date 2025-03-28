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
  const url = date ? `${API_BASE_URL}/events?date=${date}` : `${API_BASE_URL}/events`;
  debugLog(`GET ${url}`);
  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      debugLog(`Error fetching events: ${response.status} ${response.statusText}`, errorText);
      throw new Error('Failed to fetch events');
    }
    const data = await response.json();
    debugLog(`Events response received`, { count: data.length, date });
    return data;
  } catch (error) {
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
  debugLog(`GET ${API_BASE_URL}/events/${eventId}/similar`);
  try {
    const response = await fetch(`${API_BASE_URL}/events/${eventId}/similar`);
    if (!response.ok) {
      const errorText = await response.text();
      debugLog(`Error fetching similar events: ${response.status} ${response.statusText}`, errorText);
      throw new Error('Failed to fetch similar events');
    }
    const data = await response.json();
    debugLog(`Similar events response received`, { count: data.length, eventId });
    return data;
  } catch (error) {
    debugLog(`Exception in fetchSimilarEvents`, error);
    throw error;
  }
}; 