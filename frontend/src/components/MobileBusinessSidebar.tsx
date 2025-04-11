import React from "react";
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
import { Truck } from "lucide-react";

export const MobileBusinessSidebar: React.FC = () => {
  const { 
    selectedDate, 
    setSelectedDate, 
    timelineRange, 
    setTimelineRange,
    timePeriod,
    setTimePeriod
  } = useTampere();

  return (
    <div className="p-6 h-full overflow-y-auto overflow-x-hidden">
      <div className="mb-3">
        <h1 className="text-xl font-bold mb-2 flex items-center gap-2">
          <Truck className="text-tampere-red" />
          <a href="/" className="cursor-pointer hover:opacity-80 transition-opacity">
            Mobile Business Spots
          </a>
        </h1>
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

      {/* Timeline for non-real-time periods */}
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

      {/* Mobile business specific content */}
      <HotspotsList />
      <EventsList />
    </div>
  );
}; 