
import React from "react";
import { Event } from "@/lib/types";
import { Calendar } from "lucide-react";
import { format } from "date-fns";

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
  return (
    <div
      className={`flex items-center p-3 my-2 bg-white rounded-lg border cursor-pointer transition-all hover:shadow-md ${
        selected ? "ring-2 ring-tampere-red border-tampere-red" : "border-gray-200"
      }`}
      onClick={onClick}
    >
      <div className="text-tampere-red">
        <Calendar size={20} />
      </div>
      <div className="ml-3 flex-grow">
        <p className="text-sm font-medium">{event.name}</p>
      </div>
      <div className="text-sm text-right">
        {showDate && (
          <p className="text-xs text-gray-500">
            {format(new Date(event.date), "MMM d")}
          </p>
        )}
        <p className="font-medium text-tampere-red">{event.time}</p>
        <p className="text-xs text-gray-500">{event.place}</p>
      </div>
    </div>
  );
};
