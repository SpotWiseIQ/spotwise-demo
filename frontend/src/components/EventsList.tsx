import React, { useEffect, useRef } from "react";
import { useTampere } from "@/lib/TampereContext";
import { EventCard } from "./EventCard";

export const EventsList: React.FC = () => {
  const { events, selectedEvent, setSelectedEvent, setSelectedHotspot, loading, error, selectedDate } = useTampere();
  const renderCount = useRef(0);

  // Track component renders
  useEffect(() => {
    renderCount.current += 1;
    console.log(`📋 EVENTSLIST: Render #${renderCount.current}`);
  });

  // Debug log when events change
  useEffect(() => {
    // Create a fixed date for consistent display
    const dateToDisplay = new Date(selectedDate);
    dateToDisplay.setHours(12, 0, 0, 0);
    const formattedDate = dateToDisplay.toISOString().split('T')[0];
    
    console.log(`📋 EVENTSLIST: Events changed - now showing ${events.length} events for date ${formattedDate}`);
    console.log(`📋 EVENTSLIST: Loading state: ${loading}, Error state: ${error ? 'Error: ' + error : 'No error'}`);
    events.forEach((event, index) => {
      console.log(`  Event ${index+1}: id=${event.id}, name=${event.name}, date=${event.date}`);
    });
  }, [events, selectedDate, loading, error]);

  const handleEventClick = (event: typeof events[0]) => {
    console.log(`📋 EVENTSLIST: Event clicked - id=${event.id}, name=${event.name}`);
    setSelectedHotspot(null);
    setSelectedEvent(event);
  };

  return (
    <div className="mt-4">
      <div className="mb-2 font-medium">Today's events</div>
      <div className="space-y-1.5 max-h-[290px] overflow-y-auto pr-2">
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
