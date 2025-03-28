import React, { useEffect, useState } from "react";
import { Event } from "@/lib/types";
import { Calendar, Clock, MapPin, Users } from "lucide-react";
import { format } from "date-fns";
import { EventCard } from "./EventCard";
import { fetchSimilarEvents } from "@/lib/api";

interface EventDetailProps {
  event: Event;
  onEventClick: (event: Event) => void;
}

export const EventDetail: React.FC<EventDetailProps> = ({ event, onEventClick }) => {
  const [similarEvents, setSimilarEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const getSimilarEvents = async () => {
      setLoading(true);
      try {
        const events = await fetchSimilarEvents(event.id);
        setSimilarEvents(events);
      } catch (error) {
        console.error("Failed to fetch similar events:", error);
        setSimilarEvents([]);
      } finally {
        setLoading(false);
      }
    };

    getSimilarEvents();
  }, [event.id]);

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-start">
          <div className="text-tampere-red mr-3">
            <Calendar size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold flex items-center">
              {event.name}
              <span className="ml-2 text-sm text-tampere-red font-normal">
                {format(new Date(event.date), "EEEE")} · {event.time}
              </span>
            </h3>
            {event.address && (
              <p className="text-sm flex items-center mt-2">
                <MapPin size={16} className="mr-1 text-gray-500" />
                {event.address}
              </p>
            )}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4">
              {event.type && (
                <div className="text-sm">
                  <span className="text-gray-500">Type:</span> {event.type}
                </div>
              )}
              {event.duration && (
                <div className="text-sm flex items-center">
                  <Clock size={14} className="mr-1 text-gray-500" />
                  <span>{event.duration}</span>
                </div>
              )}
              {event.capacity && (
                <div className="text-sm">
                  <span className="text-gray-500">Capacity:</span> {event.capacity}
                </div>
              )}
              {event.demographics && (
                <div className="text-sm flex items-center">
                  <Users size={14} className="mr-1 text-gray-500" />
                  <span>{event.demographics}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-4 text-gray-500">Loading similar events...</div>
      ) : similarEvents.length > 0 ? (
        <div>
          <h3 className="text-lg font-medium mb-3">Similar events</h3>
          <div className="space-y-1.5">
            {similarEvents.map(event => (
              <EventCard 
                key={event.id} 
                event={event} 
                onClick={() => onEventClick(event)}
                showDate={true}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};
