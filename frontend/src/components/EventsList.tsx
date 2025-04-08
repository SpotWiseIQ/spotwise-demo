import React, { useEffect, useRef } from "react";
import { useTampere } from "@/lib/TampereContext";
import { EventCard } from "./EventCard";

export const EventsList: React.FC = () => {
  const { events, selectedEvent, setSelectedEvent, setSelectedHotspot, loading, error, selectedDate } = useTampere();
  const renderCount = useRef(0);

  // Track component renders
  useEffect(() => {
    renderCount.current += 1;
    console.log(`%c📋 EVENTSLIST: Render #${renderCount.current}`, 'color: #666; font-style: italic;');
  });

  // Debug log when events change
  useEffect(() => {
    // Create a fixed date for consistent display
    const dateToDisplay = new Date(selectedDate);
    dateToDisplay.setHours(12, 0, 0, 0);
    const formattedDate = dateToDisplay.toISOString().split('T')[0];
    
    console.log(`%c📋 EVENTS DATA: ${events.length} events for ${formattedDate}`, 'background: #4caf50; color: white; font-weight: bold; padding: 2px 5px; border-radius: 3px;');
    console.log(`Loading: ${loading}, Error: ${error ? error : 'none'}`);
    
    if (events.length > 0) {
      console.group('Events list');
      events.forEach((event, index) => {
        console.log(`  Event ${index+1}: id=${event.id}, name=${event.name}`);
      });
      console.groupEnd();
    }
  }, [events, selectedDate, loading, error]);

  const handleEventClick = (event: typeof events[0]) => {
    // Enhanced logging with colors
    console.log(
      `%c📅 CLICK EVENT: Event clicked - id=${event.id}, name=${event.name}`, 
      'background: #ff9800; color: black; font-weight: bold; padding: 3px 5px; border-radius: 3px;'
    );
    
    // Log the action being taken
    console.log(
      `%c👉 ACTION: ${selectedEvent?.id === event.id ? 'Deselecting' : 'Selecting'} event`,
      'background: #2196f3; color: white; font-weight: bold; padding: 2px 5px; border-radius: 3px;'
    );
    
    setSelectedHotspot(null);
    // Toggle selection: if already selected, deselect (set to null)
    setSelectedEvent(selectedEvent?.id === event.id ? null : event);
  };

  return (
    <div className="mt-4">
      <div className="mb-2 font-medium">Today's events</div>
      <div className="space-y-1.5 pr-2">
        {loading ? (
          <div className="text-gray-500 text-sm py-2">Loading events...</div>
        ) : error ? (
          <div className="text-red-500 text-sm py-2">{error}</div>
        ) : events.length === 0 ? (
          <div className="text-gray-500 text-sm py-2">No events for this date</div>
        ) : (
          events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              selected={selectedEvent?.id === event.id}
              onClick={() => handleEventClick(event)}
            />
          ))
        )}
      </div>
    </div>
  );
};
