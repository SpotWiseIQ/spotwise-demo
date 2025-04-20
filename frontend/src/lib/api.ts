import { Event, Hotspot, MapItem, TimelineRange, UnifiedHotspot } from './types';
import { API_BASE_URL } from '../config';

// Debug logger function
const debugLog = (message: string, data?: any) => {
  console.log(`🔄 API DEBUG: ${message}`, data || '');
};

// Helper to build URLs with the base URL
const buildUrl = (path: string) => `${API_BASE_URL}${path.startsWith('/api/') ? path : `/api${path}`}`;

// New function to fetch all locations (unified hotspots)
export const fetchLocations = async (
  timePeriod?: string,
  date?: string,
  timelineRange?: TimelineRange
): Promise<UnifiedHotspot[]> => {
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
  
  const url = buildUrl(`/locations?${params}`);
  debugLog(`GET ${url}`);
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      debugLog(`Error fetching locations: ${response.status} ${response.statusText}`, errorText);
      throw new Error('Failed to fetch locations');
    }
    const data = await response.json();
    debugLog(`Locations response received`, { 
      count: data.length,
      natural: data.filter((h: UnifiedHotspot) => h.type === 'natural').length,
      event: data.filter((h: UnifiedHotspot) => h.type === 'event').length,
      timePeriod,
      date,
      selectedTime: timelineRange ? Math.round(timelineRange.start / 100 * 24) : undefined
    });
    return data;
  } catch (error) {
    debugLog(`Exception in fetchLocations`, error);
    throw error;
  }
};

export const fetchHotspots = async (
  timePeriod?: string,
  date?: string,
  timelineRange?: TimelineRange
): Promise<UnifiedHotspot[]> => {
  try {
    // Use the locations endpoint with filtering on the client side
    const allLocations = await fetchLocations(timePeriod, date, timelineRange);
    const naturalHotspots = allLocations.filter(location => location.type === 'natural');
    
    debugLog(`Filtered ${naturalHotspots.length} natural hotspots from ${allLocations.length} locations`);
    return naturalHotspots;
  } catch (error) {
    debugLog(`Exception in fetchHotspots`, error);
    throw error;
  }
};

export const fetchEvents = async (date?: string): Promise<UnifiedHotspot[]> => {
  try {
    // Use the locations endpoint with filtering on the client side
    const allLocations = await fetchLocations('real-time', date);
    const eventHotspots = allLocations.filter(location => location.type === 'event');
    
    debugLog(`Filtered ${eventHotspots.length} event hotspots from ${allLocations.length} locations`);
    return eventHotspots;
  } catch (error) {
    debugLog(`Exception in fetchEvents`, error);
    throw error;
  }
};

export const fetchMapItems = async (
  lat: number,
  lng: number,
  radius: number,
  types?: string[]
): Promise<MapItem[]> => {
  // Build query parameters
  const params = new URLSearchParams();
  params.append('lat', lat.toString());
  params.append('lng', lng.toString());
  params.append('radius', radius.toString());
  
  // Add cache-busting timestamp
  const timestamp = new Date().getTime();
  params.append('_', timestamp.toString());
  
  // Add types if provided
  if (types && types.length > 0) {
    types.forEach(type => params.append('types', type));
  }
  
  const url = buildUrl(`/map-items?${params}`);
  debugLog(`GET ${url}`);
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      debugLog(`Error fetching map items: ${response.status} ${response.statusText}`, errorText);
      throw new Error('Failed to fetch map items');
    }
    const data = await response.json();
    debugLog(`Map items response received`, { count: data.length, types });
    return data;
  } catch (error) {
    debugLog(`Exception in fetchMapItems`, error);
    throw error;
  }
};

// Function to fetch foot traffic data for a hotspot
// Now deprecated - foot traffic is included in the hotspot data
// Keeping for backward compatibility
export const fetchHotspotFootTraffic = async (hotspotId: string, timeHour?: number) => {
  debugLog(`DEPRECATED: Using fetchHotspotFootTraffic is no longer needed as foot traffic data is included in the hotspot data`);
  const timestamp = new Date().getTime();
  
  // Add the time parameter if provided
  const timeParam = timeHour !== undefined ? `&time=${timeHour}` : '';
  const url = buildUrl(`/locations/${hotspotId}/foot-traffic?_=${timestamp}${timeParam}`);
  
  console.log(`🔌 API: FETCH_FOOT_TRAFFIC START for hotspotId=${hotspotId}${timeHour !== undefined ? `, hour=${timeHour}` : ''}`);
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

// Function to fetch foot traffic data for a specific event
// Now deprecated - foot traffic is included in the event data
// Keeping for backward compatibility
export const fetchEventFootTraffic = async (eventId: string, timeHour?: number) => {
  debugLog(`DEPRECATED: Using fetchEventFootTraffic is no longer needed as foot traffic data is included in the event data`);
  const timestamp = new Date().getTime();
  
  // Add the time parameter if provided
  const timeParam = timeHour !== undefined ? `&time=${timeHour}` : '';
  const url = buildUrl(`/events/${eventId}/foot-traffic?_=${timestamp}${timeParam}`);
  
  console.log(`🔌 API: FETCH_EVENT_FOOT_TRAFFIC START for eventId=${eventId}${timeHour !== undefined ? `, hour=${timeHour}` : ''}`);
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

// Function to fetch traffic data
export const fetchTrafficData = async (useHotspots: boolean = true) => {
  const timestamp = new Date().getTime();
  const url = buildUrl(`/traffic?use_hotspots=${useHotspots}&_=${timestamp}`);
  
  console.log(`🔌 API: FETCH_TRAFFIC_DATA START with useHotspots=${useHotspots}`);
  debugLog(`GET ${url}`);
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      debugLog(`Error fetching traffic data: ${response.status} ${response.statusText}`, errorText);
      throw new Error('Failed to fetch traffic data');
    }
    
    const data = await response.json();
    console.log(`🔌 API: FETCH_TRAFFIC_DATA COMPLETED`);
    
    debugLog(`Traffic data received`, { featureCount: data.features.length });
    return data;
  } catch (error) {
    console.log(`🔌 API: FETCH_TRAFFIC_DATA ERROR`, error);
    debugLog(`Exception in fetchTrafficData`, error);
    throw error;
  }
};

// Function to fetch traffic points data
export const fetchTrafficPoints = async (useHotspots: boolean = true) => {
  const timestamp = new Date().getTime();
  const url = buildUrl(`/traffic/points?use_hotspots=${useHotspots}&_=${timestamp}`);
  
  console.log(`🔌 API: FETCH_TRAFFIC_POINTS START with useHotspots=${useHotspots}`);
  debugLog(`GET ${url}`);
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      debugLog(`Error fetching traffic points: ${response.status} ${response.statusText}`, errorText);
      throw new Error('Failed to fetch traffic points');
    }
    
    const data = await response.json();
    console.log(`🔌 API: FETCH_TRAFFIC_POINTS COMPLETED`);
    
    debugLog(`Traffic points received`, { points: data.length });
    return data;
  } catch (error) {
    console.log(`🔌 API: FETCH_TRAFFIC_POINTS ERROR`, error);
    debugLog(`Exception in fetchTrafficPoints`, error);
    throw error;
  }
};

// Function to fetch detailed metrics for a specific hotspot
export const fetchHotspotDetailedMetrics = async (hotspotId: string) => {
  const timestamp = new Date().getTime();
  const url = buildUrl(`/locations/${hotspotId}/detailed-metrics?_=${timestamp}`);
  
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

// Function to fetch detailed metrics for a specific event
export const fetchEventDetailedMetrics = async (eventId: string) => {
  const timestamp = new Date().getTime();
  const url = buildUrl(`/events/${eventId}/detailed-metrics?_=${timestamp}`);
  
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

export const fetchBusinessLocations = async (): Promise<any[]> => {
  debugLog(`Fetching static business locations`);
  
  try {
    const response = await fetch(buildUrl(`/api/business-locations`));
    if (!response.ok) {
      throw new Error('Failed to fetch business locations');
    }
    const data = await response.json();
    debugLog(`Received ${data.length} business locations`);
    return data;
  } catch (error) {
    console.error('Error fetching business locations:', error);
    debugLog('Error fetching business locations, returning mock data');
    
    // Return mock business locations as fallback
    return [
      // Prisma Kaleva Zone businesses
      { id: "kaleva-1", name: "Prisma Supermarket", coordinates: [23.8010, 61.5050], type: "business" },
      { id: "kaleva-2", name: "Kaleva Electronics", coordinates: [23.8030, 61.5055], type: "business" },
      { id: "kaleva-3", name: "Health & Beauty Shop", coordinates: [23.7995, 61.5045], type: "business" },
      
      // Hervanta Bypass Area businesses
      { id: "hervanta-1", name: "Tech Campus Café", coordinates: [23.8450, 61.4450], type: "business" },
      { id: "hervanta-2", name: "Innovation Hub", coordinates: [23.8470, 61.4455], type: "business" },
      { id: "hervanta-3", name: "Student Restaurant", coordinates: [23.8430, 61.4440], type: "business" },
      
      // Lielahti Zone businesses
      { id: "lielahti-1", name: "Furniture Outlet", coordinates: [23.6950, 61.5150], type: "business" },
      { id: "lielahti-2", name: "Home Improvement Store", coordinates: [23.6970, 61.5155], type: "business" },
      { id: "lielahti-3", name: "Garden Center", coordinates: [23.6935, 61.5145], type: "business" },
      
      // Ratina Mall Area businesses
      { id: "ratina-1", name: "Ratina Shopping Center", coordinates: [23.7670, 61.4930], type: "business" },
      { id: "ratina-2", name: "Waterfront Restaurant", coordinates: [23.7690, 61.4935], type: "business" },
      { id: "ratina-3", name: "Fashion Boutique", coordinates: [23.7655, 61.4925], type: "business" },
      { id: "ratina-4", name: "Sports Equipment Store", coordinates: [23.7665, 61.4920], type: "business" }
    ];
  }
};

/**
 * Fetches the center coordinates of Tampere for map initialization
 * @returns {Promise<[number, number]>} The longitude and latitude coordinates for Tampere's center
 */
export const fetchTampereCenter = async (): Promise<[number, number]> => {
  debugLog(`Fetching Tampere center coordinates`);
  
  // Default Tampere coordinates (longitude, latitude) as a fallback
  const defaultCoordinates: [number, number] = [23.7609, 61.4978];
  
  try {
    // Try to fetch from the API if it's implemented server-side
    const response = await fetch(buildUrl(`/api/tampere-center`));
    if (response.ok) {
      const data = await response.json();
      debugLog(`Received Tampere center coordinates from API`, data);
      
      // Validate the coordinates
      if (data && 
          typeof data.longitude === 'number' && !isNaN(data.longitude) && 
          typeof data.latitude === 'number' && !isNaN(data.latitude)) {
        return [data.longitude, data.latitude];
      } else {
        debugLog('Invalid coordinates received from API, using default', defaultCoordinates);
        return defaultCoordinates;
      }
    } else {
      throw new Error('API endpoint not available');
    }
  } catch (error) {
    // Fallback to hardcoded coordinates for Tampere center
    debugLog('Error fetching Tampere center, using default coordinates', error);
    return defaultCoordinates;
  }
};

/**
 * Analyzes business requirements text and returns business preferences
 * @param {string} text - The business requirements text to analyze
 * @returns {Promise<any>} Business preferences object
 */
export const analyzeBusiness = async (text: string): Promise<any> => {
  debugLog(`Analyzing business requirements: ${text.substring(0, 50)}...`);
  
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
      debugLog(`Error analyzing business requirements: ${response.status} ${response.statusText}`, errorText);
      throw new Error('Failed to analyze business requirements');
    }
    
    const data = await response.json();
    debugLog(`Business requirements analysis completed`, data);
    return data;
  } catch (error) {
    debugLog(`Exception in analyzeBusiness`, error);
    // Fallback to mock data
    return {
      business_type: "Static",
      business: "Coffee Shop",
      location: "Tampere Center",
      intent: "Research"
    };
  }
};