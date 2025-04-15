import React, { useEffect } from "react";
import { useTampere } from "@/lib/TampereContext";
import { DateSelector } from "./DateSelector";
import { TimelineSlider } from "./TimelineSlider";
import { HotspotsList } from "./HotspotsList";
import { EventsList } from "./EventsList";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Truck, Home } from "lucide-react";

export const MobileBusinessSidebar: React.FC = () => {
  const { 
    selectedDate, 
    setSelectedDate, 
    timelineRange, 
    setTimelineRange,
    selectedEvent,
    setSelectedEvent,
    selectedHotspot,
    setSelectedHotspot,
    timePeriod,
    setTimePeriod
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
      <div className="mb-3">
        <div className="flex items-center gap-4 mb-2">
          <a href="/" className="cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0">
            <Home className="text-gray-600" size={20} />
          </a>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <a href="/mobile-business" className="cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-2">
              <Truck className="text-tampere-red" />
              <span>Mobile Business Spots</span>
            </a>
          </h1>
        </div>
        <div className="mb-2">
          <Select value={timePeriod} onValueChange={(value) => setTimePeriod(value as 'real-time' | 'daily' | 'weekly' | 'monthly')}>
            <SelectTrigger className="w-full py-1 h-8 text-xs">
              <SelectValue placeholder="Select time period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="real-time">Real-time</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {timePeriod === 'real-time' ? (
          <div className="flex gap-2">
            <div className="flex-none translate-y-[15px]">
              <DateSelector date={selectedDate} onSelect={setSelectedDate} />
            </div>
            <div className="flex-1 min-w-0">
              <TimelineSlider
                value={timelineRange}
                onChange={setTimelineRange}
                label=""
              />
            </div>
          </div>
        ) : (
          <DateSelector date={selectedDate} onSelect={setSelectedDate} />
        )}
      </div>

      {/* Always render the lists and potentially the timeline based on timePeriod */}
      {timePeriod !== 'real-time' && (
        <div className="mb-4 pr-2">
          <TimelineSlider
            value={timelineRange}
            onChange={setTimelineRange}
            label="Timeline"
            compact={true}
          />
        </div>
      )}
      <HotspotsList />
      <EventsList />
    </div>
  );
}; 