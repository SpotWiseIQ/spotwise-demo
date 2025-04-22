import React, { useState, useEffect } from "react";
import { Event, UnifiedHotspot } from "@/lib/types";
import { BarChart2, ChevronDown, ChevronUp, Clock, MapPin, Users, ArrowLeftRight, Footprints, Cloud, Sun, Wind, CloudRain } from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import { FootTrafficChart } from "./FootTrafficChart";
import { useTampere } from "@/lib/TampereContext";
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";

type EventHotspotCardProps = {
  event: Event | UnifiedHotspot;
  onClick?: () => void;
  selected?: boolean;
  showDate?: boolean;
  isCompareMode?: boolean;
  onCompareClick?: () => void;
};

export const EventHotspotCard: React.FC<EventHotspotCardProps> = ({
  event,
  onClick,
  selected,
  showDate = false,
  isCompareMode = false,
  onCompareClick,
}) => {
  const { loadEventFootTraffic } = useTampere();
  const [footTrafficData, setFootTrafficData] = useState<any[]>([]);
  const [isLoadingTraffic, setIsLoadingTraffic] = useState(false);
  const [isTrafficOpen, setIsTrafficOpen] = useState(false);
  
  // Get current hour to ensure proper alignment in the chart
  const currentHour = new Date().getHours();

  // Format display time from start_time and end_time
  const getFormattedTime = () => {
    if (typeof event.start_time === "string" && typeof event.end_time === "string") {
      try {
        console.log(`DEBUG: Original time strings - start: ${event.start_time}, end: ${event.end_time}`);
        
        // Direct string parsing to avoid timezone conversion
        const extractTime = (timeStr: string) => {
          // Split the string by spaces, colons, and other delimiters
          const parts = timeStr.split(/[- :+]/);
          console.log(`DEBUG: Time parts:`, parts);
          
          if (parts.length >= 5) {
            // Parts[3] should be hours, parts[4] should be minutes
            const hours = parts[3].padStart(2, '0');
            const minutes = parts[4].padStart(2, '0');
            const timeStr = `${hours}:${minutes}`;
            console.log(`DEBUG: Extracted time: ${timeStr}`);
            return timeStr;
          }
          return null;
        };
        
        const startTime = extractTime(event.start_time);
        const endTime = extractTime(event.end_time);
        
        if (startTime && endTime) {
          return `${startTime} - ${endTime}`;
        }
        
        // Fallback to Date parsing if direct extraction fails
        const startDate = parseISO(event.start_time);
        const endDate = parseISO(event.end_time);
        
        if (!isValid(startDate) || !isValid(endDate)) {
          return event.time || "Time not specified";
        }
        
        return `${format(startDate, "HH:mm")} - ${format(endDate, "HH:mm")}`;
      } catch (error) {
        console.error("Error parsing start/end time:", error);
        return event.time || "Time not specified";
      }
    } else if (event.time) {
      // Fallback to old time field if available
      return event.time;
    }
    return "Time not specified";
  };

  // Format display date from start_time
  const getFormattedDate = () => {
    if (typeof event.start_time === "string") {
      try {
        // Direct string parsing to avoid timezone conversion
        const extractDate = (timeStr: string) => {
          // Split the string by spaces, colons, and other delimiters
          const parts = timeStr.split(/[- :+]/);
          if (parts.length >= 3) {
            // parts[1] should be the month (1-indexed), parts[2] should be the day
            const year = parseInt(parts[0]);
            const month = parseInt(parts[1]) - 1; // Convert to 0-indexed for month names
            const day = parseInt(parts[2]);
            
            // Get month name abbreviation
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const monthName = monthNames[month];
            
            return `${monthName} ${day}`;
          }
          return null;
        };
        
        const dateStr = extractDate(event.start_time);
        if (dateStr) {
          return dateStr;
        }
        
        // Fallback to date-fns if direct extraction fails
        const startDate = parseISO(event.start_time);
        if (!isValid(startDate)) return "Date not specified";
        return format(startDate, "MMM d");
      } catch (error) {
        console.error("Error parsing start_time:", error);
        return "Date not specified";
      }
    } else if (typeof event.date === "string") {
      // Fallback to old date field if available
      try {
        const eventDate = new Date(event.date);
        if (!isValid(eventDate)) return "Date not specified";
        return format(eventDate, "MMM d");
      } catch (error) {
        console.error("Error formatting event.date:", error);
        return "Date not specified";
      }
    }
    return "Date not specified";
  };

  // Get the label from UnifiedHotspot
  const getEventLabel = () => {
    // Check if event is actually a UnifiedHotspot with a label
    if ('label' in event && typeof event.label === 'string') {
      return event.label;
    }
    // No label if not available
    return "";
  };

  useEffect(() => {
    // Always fetch foot traffic data regardless of selection
    const fetchData = async () => {
      setIsLoadingTraffic(true);
      try {
        // If event_foot_traffic is available, use it (for event hotspots)
        if ((event as any).event_foot_traffic) {
          setFootTrafficData((event as any).event_foot_traffic);
          setIsLoadingTraffic(false);
          return;
        }
        
        // If regular footTraffic is available, use it as fallback
        if (event.footTraffic) {
          setFootTrafficData(event.footTraffic);
          setIsLoadingTraffic(false);
          return;
        }
        
        // Otherwise, load it via the context (which now prioritizes pre-loaded data)
        // Pass the current hour to ensure data is correctly generated
        const data = await loadEventFootTraffic(event.id, currentHour);
        setFootTrafficData(data);
      } catch (error) {
        console.error("Error loading event foot traffic data:", error);
        setFootTrafficData([]);
      } finally {
        setIsLoadingTraffic(false);
      }
    };

    fetchData();
  }, [event.id, event.footTraffic, (event as any).event_foot_traffic, loadEventFootTraffic, currentHour]);

  // Reset traffic panel when deselected
  useEffect(() => {
    if (!selected) {
      setIsTrafficOpen(false);
    }
  }, [selected]);

  const handleCardClick = (e: React.MouseEvent) => {
    // If in compare mode or clicking on specific elements, don't handle the click
    if (isCompareMode || 
        (e.target as HTMLElement).closest('[data-collapsible-trigger]') || 
        (e.target as HTMLElement).closest('[data-compare-button]')) {
      return;
    }
    if (onClick) {
      onClick();
    }
  };
  
  const handleChartToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsTrafficOpen(!isTrafficOpen);
  };

  const handleCompareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCompareClick) {
      onCompareClick();
    }
  };

  // Add weather icon logic
  const getWeatherIcon = (weather: string) => {
    switch (weather) {
      case "sunny":
        return { icon: Sun, color: "bg-yellow-500", label: "sunny" };
      case "cloudy":
        return { icon: Cloud, color: "bg-gray-500", label: "cloudy" };
      case "windy":
        return { icon: Wind, color: "bg-blue-400", label: "windy" };
      case "rainy":
        return { icon: CloudRain, color: "bg-blue-600", label: "rainy" };
      default:
        return { icon: Cloud, color: "bg-gray-500", label: "unknown" };
    }
  };
  const weatherInfo = getWeatherIcon((event as any).weather?.toLowerCase() || "unknown");
  const WeatherIcon = weatherInfo.icon;

  const displayTime = getFormattedTime();
  const displayDate = getFormattedDate();

  return (
    <div
      className={`flex flex-col my-1 bg-gray-50 rounded-lg border transition-all duration-200 ease-in-out ${
        selected ? "ring-2 ring-tampere-red border-tampere-red shadow-md" : "border-gray-200 hover:shadow-sm"
      }`}
    >
      <div
        className={`flex items-center p-2 ${selected ? 'pb-1' : 'pb-0'} cursor-pointer`}
        onClick={handleCardClick}
      >
        <div
          className="event-hotspot-card !h-6 !w-6 !text-xs !flex !items-center !justify-center"
        >
          {getEventLabel()}
        </div>
        <div className="ml-3 flex-grow h-[20px] flex items-center overflow-hidden">
          <p className="text-sm font-medium truncate" title={event.event_name || event.name}>
            {event.event_name || event.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isCompareMode && (
            <Button
              variant={selected ? "secondary" : "ghost"}
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={handleCompareClick}
              data-compare-button
            >
              <ArrowLeftRight className="w-3 h-3" />
            </Button>
          )}
          <div className="flex flex-col min-w-[110px]">
            <div className="grid grid-cols-2 gap-x-5">
              <div className="flex flex-col items-center">
                <div className="w-6 h-6 bg-orange-500 rounded-md flex items-center justify-center text-white">
                  <Footprints className="w-4 h-4" />
                </div>
                <span className="text-[10px] mt-0.5 text-gray-500 text-center w-10">traffic</span>
              </div>
              <div className="flex flex-col items-center">
                <div className={`w-6 h-6 ${weatherInfo.color} rounded-md flex items-center justify-center text-white`}>
                  <WeatherIcon className="w-4 h-4" />
                </div>
                <span className="text-[10px] mt-0.5 text-gray-500 text-center w-10">{weatherInfo.label}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-500 px-2 pb-1 -mt-1">
        <span className="font-medium text-tampere-red">{displayTime}</span>
        {/* Only show venue if it's different from the event name */}
        {event.venue && event.venue !== event.name && (
          <span> &middot; {event.venue}</span>
        )}
        {(!event.venue || event.venue === event.name) && event.venue_address && (
          <span> &middot; {event.venue_address}</span>
        )}
        {(!event.venue || event.venue === event.name) && !event.venue_address && (
          <span> &middot; Location not specified</span>
        )}
      </div>

      {showDate && (
        <div className="text-right px-2 pb-1">
          <p className="text-xs text-gray-500">
            {displayDate}
          </p>
        </div>
      )}

      {selected && !isCompareMode && (
        <div className="border-t border-gray-200 mx-2 mt-1 mb-2 pt-3 px-1 space-y-4">
           <div>
             <h4 className="text-xs font-semibold mb-1.5 text-gray-600">Event Details</h4>
             <div className="space-y-1.5 text-sm">
               {event.venue_address && (
                 <p className="flex items-start">
                   <MapPin size={14} className="mr-1.5 mt-0.5 text-gray-500 flex-shrink-0" />
                   <span>{event.venue_address}</span>
                 </p>
               )}
               <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                 {(event.event_type || event.type) && (
                   <div className="flex items-center">
                     <span className="text-gray-500 text-xs mr-1">Type:</span>
                     <span>{event.event_type || event.type || "Event Hotspot"}</span>
                   </div>
                 )}
                 {(event.start_time && event.end_time) && (
                   <div className="flex items-center">
                     <Clock size={14} className="mr-1.5 text-gray-500 flex-shrink-0" />
                     <span className="text-gray-500 text-xs mr-1">Duration:</span>
                     <span>{displayTime}</span>
                   </div>
                 )}
                 {event.duration && !event.start_time && (
                   <div className="flex items-center">
                     <Clock size={14} className="mr-1.5 text-gray-500 flex-shrink-0" />
                     <span className="text-gray-500 text-xs mr-1">Duration:</span>
                     <span>{event.duration}</span>
                   </div>
                 )}
                 {(event.expected_attendance || event.capacity) && (
                   <div className="flex items-center">
                     <Users size={14} className="mr-1.5 text-gray-500 flex-shrink-0" />
                     <span className="text-gray-500 text-xs mr-1">Expected Attendance:</span>
                     <span>{event.expected_attendance || event.capacity}</span>
                   </div>
                 )}
                 {event.demographics && (
                   <div className="flex items-center">
                     <Users size={14} className="mr-1.5 text-gray-500 flex-shrink-0" />
                     <span className="text-gray-500 text-xs mr-1">Crowd:</span>
                     <span>{event.demographics}</span>
                   </div>
                 )}
               </div>
               {event.description && (
                 <div className="mt-2 text-xs text-gray-600">
                   <p>{event.description}</p>
                 </div>
               )}
             </div>
           </div>
        </div>
      )}
      
      <Collapsible
        open={isTrafficOpen && !isCompareMode}
        onOpenChange={(open) => !isCompareMode && setIsTrafficOpen(open)}
      >
        {isLoadingTraffic && (
          <div className="h-3 w-full flex items-center justify-center border-t mt-1.5 px-2 py-0.5">
            <div className="animate-pulse text-[9px] text-gray-400">Loading traffic...</div>
          </div>
        )}
        {!isLoadingTraffic && footTrafficData.length > 0 && (
          <CollapsibleTrigger asChild onClick={handleChartToggle} data-collapsible-trigger>
            <div className="flex items-center justify-between border-t mt-1.5 px-2 py-0.5 cursor-pointer hover:bg-gray-100 rounded-b-sm">
              <div className="flex items-center text-[9px] text-gray-500">
                <BarChart2 size={10} className="mr-1" />
                Foot Traffic
              </div>
              <div className="text-gray-400">
                {isTrafficOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </div>
            </div>
          </CollapsibleTrigger>
        )}
        <CollapsibleContent>
          <div className="px-2 pt-1 pb-2">
            <div className="text-[10px] text-gray-500 mb-0.5 flex justify-end">
              <span className="text-tampere-red">Live + Forecast</span>
            </div>
            <FootTrafficChart data={footTrafficData} currentHour={currentHour} />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
