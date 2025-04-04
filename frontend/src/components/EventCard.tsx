import React, { useState, useEffect } from "react";
import { Event } from "@/lib/types";
import { Calendar, BarChart2, ChevronDown, ChevronUp, Clock, MapPin, Users } from "lucide-react";
import { format } from "date-fns";
import { FootTrafficChart } from "./FootTrafficChart";
import { useTampere } from "@/lib/TampereContext";
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";

type EventCardProps = {
  event: Event;
  onClick?: () => void;
  selected?: boolean;
  showDate?: boolean;
};

export const EventCard: React.FC<EventCardProps> = ({
  event,
  onClick,
  selected,
  showDate = false,
}) => {
  const { loadEventFootTraffic } = useTampere();
  const [footTrafficData, setFootTrafficData] = useState<any[]>([]);
  const [isLoadingTraffic, setIsLoadingTraffic] = useState(false);
  const [isTrafficOpen, setIsTrafficOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingTraffic(true);
      try {
        const data = await loadEventFootTraffic(event.id);
        setFootTrafficData(data);
      } catch (error) {
        console.error("Error loading event foot traffic data:", error);
        setFootTrafficData([]);
      } finally {
        setIsLoadingTraffic(false);
      }
    };

    fetchData();
  }, [event.id, loadEventFootTraffic]);

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-collapsible-trigger]')) {
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

  return (
    <div
      className={`flex flex-col my-1 bg-gray-50 rounded-lg border transition-all duration-200 ease-in-out ${
        selected ? "ring-2 ring-tampere-red border-tampere-red shadow-md" : "border-gray-200 hover:shadow-sm"
      }`}
    >
      <div
        className={`flex items-start p-2 ${selected ? 'pb-1' : 'pb-0'} cursor-pointer`}
        onClick={handleCardClick}
      >
        <div className="text-tampere-red mt-1">
          <Calendar size={18} />
        </div>
        <div className="ml-3 flex-grow min-w-0">
          <p className="text-sm font-medium truncate" title={event.name}>{event.name}</p>
          <p className="text-xs text-gray-500 truncate">{event.place || 'Location not specified'}</p>
        </div>
        <div className="text-sm text-right pl-2 flex-shrink-0 min-w-[60px]">
          {showDate && (
            <p className="text-xs text-gray-500">
              {format(new Date(event.date), "MMM d")}
            </p>
          )}
          <p className="font-medium text-tampere-red text-xs">{event.time}</p>
        </div>
      </div>

      {selected && (
        <div className="border-t border-gray-200 mx-2 mt-1 mb-2 pt-3 px-1 space-y-4">
           <div>
             <h4 className="text-xs font-semibold mb-1.5 text-gray-600">Details</h4>
             <div className="space-y-1.5 text-sm">
               {event.address && (
                 <p className="flex items-start">
                   <MapPin size={14} className="mr-1.5 mt-0.5 text-gray-500 flex-shrink-0" />
                   <span>{event.address}</span>
                 </p>
               )}
               <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                 {event.type && (
                   <div className="flex items-center">
                     <span className="text-gray-500 text-xs mr-1">Type:</span>
                     <span>{event.type}</span>
                   </div>
                 )}
                 {event.duration && (
                   <div className="flex items-center">
                     <Clock size={14} className="mr-1.5 text-gray-500 flex-shrink-0" />
                     <span className="text-gray-500 text-xs mr-1">Duration:</span>
                     <span>{event.duration}</span>
                   </div>
                 )}
                 {event.time && (
                   <div className="flex items-center">
                     <Clock size={14} className="mr-1.5 text-gray-500 flex-shrink-0" />
                     <span className="text-gray-500 text-xs mr-1">Time:</span>
                     <span>{event.time}</span>
                   </div>
                 )}
                 {event.capacity && (
                   <div className="flex items-center">
                     <Users size={14} className="mr-1.5 text-gray-500 flex-shrink-0" />
                     <span className="text-gray-500 text-xs mr-1">Capacity:</span>
                     <span>{event.capacity}</span>
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
             </div>
           </div>
        </div>
      )}
      
      <Collapsible
        open={isTrafficOpen}
        onOpenChange={setIsTrafficOpen}
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
            <FootTrafficChart data={footTrafficData} />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
