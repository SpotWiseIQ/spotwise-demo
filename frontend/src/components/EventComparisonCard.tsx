import React from 'react';
import { Calendar, Clock, Users, MapPin, Tag } from 'lucide-react';
import { Event } from '@/lib/types';
import { format, isValid } from 'date-fns';
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

type EventComparisonCardProps = {
  event: Event;
};

export const EventComparisonCard: React.FC<EventComparisonCardProps> = ({ event }) => {
  // Format date safely with validation
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    if (!isValid(date)) return 'Invalid date';
    
    try {
      return format(date, 'MMM d');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 w-[170px] flex-shrink-0 flex flex-col h-[330px]">
      <div className="p-2 border-b border-gray-200 flex flex-col justify-center min-h-[60px]">
        <div className="flex items-center mb-1">
          <Calendar className="w-4 h-4 text-tampere-red mr-1.5 flex-shrink-0" />
          <h3 className="text-sm font-medium truncate">{event.name}</h3>
        </div>
        <p className="text-xs text-gray-500 truncate">{event.venue || 'No location'}</p>
      </div>
      
      <div className="p-2 flex-grow flex flex-col">
        <div className="grid grid-cols-2 gap-2 text-xs py-2 border-b border-gray-100 h-[60px]">
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-gray-500 mb-0.5 whitespace-nowrap">Date</p>
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="font-medium w-full overflow-hidden text-ellipsis whitespace-nowrap text-center cursor-pointer">
                  {formatDate(event.date)}
                </p>
              </TooltipTrigger>
              <TooltipContent>{formatDate(event.date)}</TooltipContent>
            </Tooltip>
          </div>
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-gray-500 mb-0.5 whitespace-nowrap">Time</p>
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="font-medium w-full overflow-hidden text-ellipsis whitespace-nowrap text-center cursor-pointer">{event.time || 'TBD'}</p>
              </TooltipTrigger>
              <TooltipContent>{event.time || 'TBD'}</TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="flex-grow flex flex-col">
          <div className="flex items-center py-2 border-b border-gray-100 h-[40px]">
            <div className="w-4 h-4 mr-1.5 flex-shrink-0">
              <Users className="w-4 h-4 text-tampere-red" />
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="text-xs w-full overflow-hidden text-ellipsis whitespace-nowrap cursor-pointer">
                  <span className="text-gray-500 mr-1">Capacity:</span>
                  <span className="font-medium">{event.capacity || 'N/A'}</span>
                </p>
              </TooltipTrigger>
              <TooltipContent>{event.capacity || 'N/A'}</TooltipContent>
            </Tooltip>
          </div>
          
          <div className="flex items-center py-2 border-b border-gray-100 h-[40px]">
            <div className="w-4 h-4 mr-1.5 flex-shrink-0">
              <Clock className="w-4 h-4 text-tampere-red" />
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="text-xs w-full overflow-hidden text-ellipsis whitespace-nowrap cursor-pointer">
                  <span className="text-gray-500 mr-1">Duration:</span>
                  <span className="font-medium">{event.duration || 'N/A'}</span>
                </p>
              </TooltipTrigger>
              <TooltipContent>{event.duration || 'N/A'}</TooltipContent>
            </Tooltip>
          </div>
          
          <div className="flex items-center py-2 border-b border-gray-100 h-[40px]">
            <div className="w-4 h-4 mr-1.5 flex-shrink-0">
              <Users className="w-4 h-4 text-tampere-red" />
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="text-xs w-full overflow-hidden text-ellipsis whitespace-nowrap cursor-pointer">
                  <span className="text-gray-500 mr-1">Demographics:</span>
                  <span className="font-medium">{event.demographics || 'All ages'}</span>
                </p>
              </TooltipTrigger>
              <TooltipContent>{event.demographics || 'All ages'}</TooltipContent>
            </Tooltip>
          </div>
          
          <div className="flex items-center py-2 border-b border-gray-100 h-[40px]">
            <div className="w-4 h-4 mr-1.5 flex-shrink-0">
              <Tag className="w-4 h-4 text-tampere-red" />
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="text-xs w-full overflow-hidden text-ellipsis whitespace-nowrap cursor-pointer">
                  <span className="text-gray-500 mr-1">Type:</span>
                  <span className="font-medium">{event.type || 'N/A'}</span>
                </p>
              </TooltipTrigger>
              <TooltipContent>{event.type || 'N/A'}</TooltipContent>
            </Tooltip>
          </div>
          
          <div className="flex items-center py-2 h-[40px]">
            <div className="w-4 h-4 mr-1.5 flex-shrink-0">
              <MapPin className="w-4 h-4 text-tampere-red" />
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="text-xs w-full overflow-hidden text-ellipsis whitespace-nowrap cursor-pointer">
                  <span className="text-gray-500 mr-1">Address:</span>
                  <span className="font-medium">{event.venue_address || event.venue || 'N/A'}</span>
                </p>
              </TooltipTrigger>
              <TooltipContent>{event.venue_address || event.venue || 'N/A'}</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
}; 