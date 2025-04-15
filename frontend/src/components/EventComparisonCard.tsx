import React from 'react';
import { Calendar, Clock, Users, MapPin, Tag } from 'lucide-react';
import { Event } from '@/lib/types';
import { format } from 'date-fns';

type EventComparisonCardProps = {
  event: Event;
};

export const EventComparisonCard: React.FC<EventComparisonCardProps> = ({ event }) => {
  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 w-[170px] flex-shrink-0 flex flex-col h-[330px]">
      <div className="p-2 border-b border-gray-200 h-[50px]">
        <div className="flex items-center mb-1">
          <Calendar className="w-3 h-3 text-tampere-red mr-1.5" />
          <h3 className="text-xs font-medium truncate">{event.name}</h3>
        </div>
        <p className="text-[10px] text-gray-500 truncate">{event.place || 'No location'}</p>
      </div>
      
      <div className="p-2 flex-grow flex flex-col">
        <div className="grid grid-cols-2 gap-2 text-[10px] py-2 border-b border-gray-100 h-[60px]">
          <div className="flex flex-col items-center">
            <p className="text-gray-500 mb-0.5">Date</p>
            <p className="font-medium">{format(new Date(event.date), 'MMM d')}</p>
          </div>
          <div className="flex flex-col items-center">
            <p className="text-gray-500 mb-0.5">Time</p>
            <p className="font-medium">{event.time || 'TBD'}</p>
          </div>
        </div>

        <div className="flex-grow flex flex-col">
          <div className="flex items-center py-2 border-b border-gray-100 h-[40px]">
            <div className="w-3 h-3 mr-1 flex-shrink-0">
              <Users className="w-3 h-3 text-tampere-red" />
            </div>
            <p className="text-[10px]">
              <span className="text-gray-500 mr-1">Capacity:</span>
              <span className="font-medium">{event.capacity || 'N/A'}</span>
            </p>
          </div>
          
          <div className="flex items-center py-2 border-b border-gray-100 h-[40px]">
            <div className="w-3 h-3 mr-1 flex-shrink-0">
              <Clock className="w-3 h-3 text-tampere-red" />
            </div>
            <p className="text-[10px]">
              <span className="text-gray-500 mr-1">Duration:</span>
              <span className="font-medium">{event.duration || 'N/A'}</span>
            </p>
          </div>
          
          <div className="flex items-center py-2 border-b border-gray-100 h-[40px]">
            <div className="w-3 h-3 mr-1 flex-shrink-0">
              <Users className="w-3 h-3 text-tampere-red" />
            </div>
            <p className="text-[10px]">
              <span className="text-gray-500 mr-1">Demographics:</span>
              <span className="font-medium">{event.demographics || 'All ages'}</span>
            </p>
          </div>
          
          <div className="flex items-center py-2 border-b border-gray-100 h-[40px]">
            <div className="w-3 h-3 mr-1 flex-shrink-0">
              <Tag className="w-3 h-3 text-tampere-red" />
            </div>
            <p className="text-[10px]">
              <span className="text-gray-500 mr-1">Type:</span>
              <span className="font-medium">{event.type || 'N/A'}</span>
            </p>
          </div>
          
          <div className="flex items-center py-2 h-[40px]">
            <div className="w-3 h-3 mr-1 flex-shrink-0">
              <MapPin className="w-3 h-3 text-tampere-red" />
            </div>
            <p className="text-[10px]">
              <span className="text-gray-500 mr-1">Address:</span>
              <span className="font-medium text-ellipsis overflow-hidden">{event.address || event.place || 'N/A'}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}; 