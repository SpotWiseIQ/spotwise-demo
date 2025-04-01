import React, { useState, useEffect } from "react";
import { Event } from "@/lib/types";
import { Calendar, BarChart2, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { FootTrafficChart } from "./FootTrafficChart";
import { useTampere } from "@/lib/TampereContext";
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible";

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
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Load foot traffic data when component mounts or event changes
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await loadEventFootTraffic(event.id);
        setFootTrafficData(data);
      } catch (error) {
        console.error("Error loading event foot traffic data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [event.id, loadEventFootTraffic]);

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    }
  };
  
  const handleChartToggle = (e: React.MouseEvent) => {
    // Prevent the card click from firing
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={`bg-gray-50 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
        selected ? "ring-2 ring-tampere-red border-tampere-red" : "border-gray-200"
      }`}
    >
      <div
        className="flex items-center p-2 pb-0 min-h-[40px]"
        onClick={handleCardClick}
      >
        <div className="text-tampere-red">
          <Calendar size={18} />
        </div>
        <div className="ml-3 flex-grow h-[20px] flex items-center">
          <p className="text-sm font-medium truncate">{event.name}</p>
        </div>
        <div className="text-sm text-right">
          {showDate && (
            <p className="text-xs text-gray-500">
              {format(new Date(event.date), "MMM d")}
            </p>
          )}
          <p className="font-medium text-tampere-red text-xs">{event.time}</p>
          <p className="text-xs text-gray-500">{event.place}</p>
        </div>
      </div>

      {(!isLoading && footTrafficData.length > 0) && (
        <CollapsibleTrigger asChild onClick={handleChartToggle}>
          <div className="flex items-center justify-between border-t mt-1.5 px-2 py-0.5 cursor-pointer hover:bg-gray-100 rounded-b-sm">
            <div className="flex items-center text-[9px] text-gray-500">
              <BarChart2 size={10} className="mr-1" />
              Foot Traffic
            </div>
            <div className="text-gray-400">
              {isOpen ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>
      )}
      
      {isLoading && (
        <div className="h-3 w-full flex items-center justify-center border-t mt-1.5 px-2 py-0.5">
          <div className="animate-pulse text-[9px] text-gray-400">Loading...</div>
        </div>
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
  );
};
