
import React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateSelectorProps {
  date: Date;
  onSelect: (date: Date) => void;
}

export const DateSelector: React.FC<DateSelectorProps> = ({ date, onSelect }) => {
  return (
    <div className="flex items-center space-x-4">
      <div className="font-medium">{format(date, "EEEE")}</div>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-[140px] justify-start text-left font-normal border border-gray-300",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {format(date, "dd.MM.yyyy")}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 z-50 bg-white" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(date) => date && onSelect(date)}
            initialFocus
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};
