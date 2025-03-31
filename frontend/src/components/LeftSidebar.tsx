import React, { useEffect } from "react";
import { useTampere } from "@/lib/TampereContext";
import { DateSelector } from "./DateSelector";
import { TimelineSlider } from "./TimelineSlider";
import { HotspotsList } from "./HotspotsList";
import { EventsList } from "./EventsList";
import { EventDetail } from "./EventDetail";
import { HotspotDetail } from "./HotspotDetail";

export const LeftSidebar: React.FC = () => {
  const { 
    selectedDate, 
    setSelectedDate, 
    timelineRange, 
    setTimelineRange,
    selectedEvent,
    setSelectedEvent,
    selectedHotspot,
    setSelectedHotspot
  } = useTampere();

  // Track view changes
  useEffect(() => {
    // Create a fixed date for consistent display
    const dateToDisplay = new Date(selectedDate);
    dateToDisplay.setHours(12, 0, 0, 0);
    const formattedDate = dateToDisplay.toISOString().split('T')[0];
    
    if (selectedEvent) {
      console.log(`🧩 SIDEBAR: Showing EVENT DETAIL view for event id=${selectedEvent.id}, name=${selectedEvent.name}, date=${selectedEvent.date}`);
    } else if (selectedHotspot) {
      console.log(`🧩 SIDEBAR: Showing HOTSPOT DETAIL view for hotspot id=${selectedHotspot.id}, label=${selectedHotspot.label}, address=${selectedHotspot.address}`);
    } else {
      console.log(`🧩 SIDEBAR: Showing EVENTS LIST view for date ${formattedDate}`);
    }
  }, [selectedEvent, selectedHotspot, selectedDate]);

  // Show timeline slider only when an event or hotspot is selected
  const showTimelineSlider = selectedEvent !== null || selectedHotspot !== null;

  return (
    <div className="p-6 h-full overflow-y-auto overflow-x-hidden">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-6">
          <a href="/" className="cursor-pointer hover:opacity-80 transition-opacity">
            <span className="text-tampere-red">Tampere</span> hot spots
          </a>
        </h1>
        <DateSelector date={selectedDate} onSelect={setSelectedDate} />
      </div>

      {selectedEvent ? (
        <EventDetail 
          event={selectedEvent} 
          onEventClick={(event) => {
            console.log(`🧩 SIDEBAR: EventDetail called onEventClick with event id=${event.id}, name=${event.name}, date=${event.date}`);
            setSelectedEvent(event);
          }} 
        />
      ) : selectedHotspot ? (
        <HotspotDetail
          hotspot={selectedHotspot}
          onHotspotClick={(hotspot) => {
            console.log(`🧩 SIDEBAR: HotspotDetail called onHotspotClick with hotspot id=${hotspot.id}, label=${hotspot.label}, address=${hotspot.address}`);
            setSelectedHotspot(hotspot);
          }}
        />
      ) : (
        <>
          <div className="mb-6 pr-2">
            <TimelineSlider
              value={timelineRange}
              onChange={setTimelineRange}
              label="Timeline"
            />
          </div>
          <HotspotsList />
          <EventsList />
        </>
      )}
    </div>
  );
};
