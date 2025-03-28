
import React, { createContext, useContext, useState } from "react";
import { Event, Hotspot, TimelineRange } from "./types";
import { mockEvents, mockHotspots } from "./mockData";

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
}

const TampereContext = createContext<TampereContextType | undefined>(undefined);

export const TampereProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date("2025-03-26"));
  const [timelineRange, setTimelineRange] = useState<TimelineRange>({ start: 25, end: 75 });
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [pulse, setPulse] = useState<boolean>(false);
  
  // For now, we'll use mock data
  const hotspots = mockHotspots;
  const events = mockEvents.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate.toDateString() === selectedDate.toDateString();
  });

  return (
    <TampereContext.Provider
      value={{
        selectedDate,
        setSelectedDate,
        timelineRange,
        setTimelineRange,
        selectedHotspot,
        setSelectedHotspot,
        selectedEvent,
        setSelectedEvent,
        pulse,
        setPulse,
        hotspots,
        events,
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
