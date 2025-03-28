import React, { createContext, useContext, useState, useEffect } from "react";
import { Event, Hotspot, TimelineRange } from "./types";
import { fetchHotspots, fetchEvents } from "./api";

// Debug logger function
const debugLog = (message: string, data?: any) => {
  console.log(`🌐 CONTEXT DEBUG: ${message}`, data || '');
};

interface TampereContextType {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  timelineRange: TimelineRange;
  setTimelineRange: (range: TimelineRange) => void;
  selectedHotspot: Hotspot | null;
  setSelectedHotspot: (hotspot: Hotspot | null) => void;
  selectedEvent: Event | null;
  setSelectedEvent: (event: Event | null) => void;
  pulse: boolean;
  setPulse: (pulse: boolean) => void;
  hotspots: Hotspot[];
  events: Event[];
  loading: boolean;
  error: string | null;
}

const TampereContext = createContext<TampereContextType | undefined>(undefined);

export const TampereProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  debugLog("TampereProvider initializing");
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date("2025-03-26"));
  const [timelineRange, setTimelineRange] = useState<TimelineRange>({ start: 50, end: 75 });
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [pulse, setPulse] = useState<boolean>(false);
  
  // State for API data
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Custom state setters with logging
  const loggedSetSelectedHotspot = (hotspot: Hotspot | null) => {
    debugLog("Setting selected hotspot", hotspot ? { id: hotspot.id, label: hotspot.label } : 'null');
    
    // If we're selecting a hotspot, clear any selected event
    if (hotspot !== null && selectedEvent !== null) {
      debugLog("Clearing selected event because a hotspot was selected");
      setSelectedEvent(null);
    }
    
    setSelectedHotspot(hotspot);
  };

  const loggedSetSelectedEvent = (event: Event | null) => {
    debugLog("Setting selected event", event ? { id: event.id, name: event.name } : 'null');
    
    // If we're selecting an event, clear any selected hotspot
    if (event !== null && selectedHotspot !== null) {
      debugLog("Clearing selected hotspot because an event was selected");
      setSelectedHotspot(null);
    }
    
    setSelectedEvent(event);
  };

  // Fetch hotspots
  useEffect(() => {
    debugLog("Fetching hotspots");
    const getHotspots = async () => {
      try {
        debugLog("API call: fetchHotspots");
        const data = await fetchHotspots();
        debugLog(`Fetched ${data.length} hotspots successfully`);
        setHotspots(data);
      } catch (err) {
        console.error("Failed to fetch hotspots:", err);
        debugLog("Error fetching hotspots", err);
        setError("Failed to fetch hotspots. Please try again later.");
      }
    };

    getHotspots();
  }, []);

  // Fetch events whenever selectedDate changes
  useEffect(() => {
    debugLog(`Fetching events for date: ${selectedDate.toISOString().split('T')[0]}`);
    const getEvents = async () => {
      setLoading(true);
      try {
        const formattedDate = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD format
        debugLog(`API call: fetchEvents(${formattedDate})`);
        const data = await fetchEvents(formattedDate);
        debugLog(`Fetched ${data.length} events successfully`);
        setEvents(data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch events:", err);
        debugLog("Error fetching events", err);
        setError("Failed to fetch events. Please try again later.");
        setEvents([]);
      } finally {
        setLoading(false);
        debugLog("Finished loading events, loading state set to false");
      }
    };

    getEvents();
  }, [selectedDate]);

  // Debug state changes
  useEffect(() => {
    debugLog("Context state updated", { 
      hotspotsCount: hotspots.length, 
      eventsCount: events.length,
      hasSelectedHotspot: !!selectedHotspot,
      hasSelectedEvent: !!selectedEvent,
      loading,
      error
    });
  }, [hotspots, events, selectedHotspot, selectedEvent, loading, error]);

  return (
    <TampereContext.Provider
      value={{
        selectedDate,
        setSelectedDate,
        timelineRange,
        setTimelineRange,
        selectedHotspot,
        setSelectedHotspot: loggedSetSelectedHotspot,
        selectedEvent,
        setSelectedEvent: loggedSetSelectedEvent,
        pulse,
        setPulse,
        hotspots,
        events,
        loading,
        error,
      }}
    >
      {children}
    </TampereContext.Provider>
  );
};

export const useTampere = () => {
  const context = useContext(TampereContext);
  if (context === undefined) {
    throw new Error("useTampere must be used within a TampereProvider");
  }
  return context;
};
