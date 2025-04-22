// Utility functions for debugging

/**
 * Helper function to identify which foot traffic data source is being used
 * @param location - The location object to check
 * @returns A string indicating which data source is being used
 */
export const debugFootTrafficSource = (location: any): string => {
  const hasRegular = location?.footTraffic && location.footTraffic.length > 0;
  const hasEvent = location?.event_foot_traffic && location.event_foot_traffic.length > 0;
  
  if (hasEvent && hasRegular) {
    // Compare the first few values to see if they're different
    const regularSample = location.footTraffic.slice(0, 3).map((ft: any) => ft.value).join(',');
    const eventSample = location.event_foot_traffic.slice(0, 3).map((ft: any) => ft.value).join(',');
    
    return `Both regular (${regularSample}...) and event (${eventSample}...) foot traffic available. ${location.footTraffic.length} vs ${location.event_foot_traffic.length} items.`;
  } else if (hasEvent) {
    return `Only event_foot_traffic available with ${location.event_foot_traffic.length} items.`;
  } else if (hasRegular) {
    return `Only regular footTraffic available with ${location.footTraffic.length} items.`;
  } else {
    return 'No foot traffic data available.';
  }
};

/**
 * Logs the detected foot traffic source for a location to the console
 * @param location - The location object to check
 * @param componentName - Name of the component for logging purposes
 */
export const logFootTrafficSource = (location: any, componentName: string): void => {
  if (!location) {
    console.log(`[${componentName}] No location provided.`);
    return;
  }
  
  console.log(`[${componentName}] ${location.name} (${location.type}): ${debugFootTrafficSource(location)}`);
}; 