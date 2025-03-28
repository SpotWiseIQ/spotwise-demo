
import React from "react";
import { useTampere } from "@/lib/TampereContext";
import { DateSelector } from "./DateSelector";
import { TimelineSlider } from "./TimelineSlider";
import { HotspotsList } from "./HotspotsList";
import { EventsList } from "./EventsList";
import { EventDetail } from "./EventDetail";

export const LeftSidebar: React.FC = () => {
  const { 
    selectedDate, 
    setSelectedDate, 
    timelineRange, 
    setTimelineRange,
    selectedEvent,
    setSelectedEvent,
    selectedHotspot
  } = useTampere();

  // Show timeline slider only when an event or hotspot is selected
  const showTimelineSlider = selectedEvent !== null || selectedHotspot !== null;

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-6">
          <span className="text-tampere-red">Tampere</span> hot spots
        </h1>
        <DateSelector date={selectedDate} onSelect={setSelectedDate} />
      </div>

      {!selectedEvent ? (
        <>
          {showTimelineSlider && (
            <TimelineSlider
              value={timelineRange}
              onChange={setTimelineRange}
            />
          )}
          <HotspotsList />
          <EventsList />
        </>
      ) : (
        <EventDetail event={selectedEvent} onEventClick={setSelectedEvent} />
      )}
    </div>
  );
};
