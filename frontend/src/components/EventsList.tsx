import React from "react";
import { useTampere } from "@/lib/TampereContext";
import { EventCard } from "./EventCard";

export const EventsList: React.FC = () => {
  const { events, selectedEvent, setSelectedEvent, setSelectedHotspot } = useTampere();

  const handleEventClick = (event: typeof events[0]) => {
    setSelectedHotspot(null);
    setSelectedEvent(event);
  };

  return (
    <div>
      <div className="mb-2 font-medium">Today's events</div>
      <div className="space-y-1.5 max-h-[290px] overflow-y-auto pr-2">
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            selected={selectedEvent?.id === event.id}
            onClick={() => handleEventClick(event)}
          />
        ))}
      </div>
    </div>
  );
};
