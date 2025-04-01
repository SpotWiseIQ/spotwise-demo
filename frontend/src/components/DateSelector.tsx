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
  const handleDateSelect = (newDate: Date | undefined) => {
    if (!newDate) return;
    
    // Fix timezone issue by setting time to noon to avoid date shifts
    const fixedDate = new Date(newDate);
    fixedDate.setHours(12, 0, 0, 0);
    
    console.log(`📅 DATE SELECTOR: Selected date ${format(newDate, "yyyy-MM-dd")}`);
    console.log(`📅 DATE SELECTOR: Current state date is ${format(date, "yyyy-MM-dd")}`);
    console.log(`📅 DATE SELECTOR: Fixed date is ${format(fixedDate, "yyyy-MM-dd")}`);
    
    onSelect(fixedDate);
  };
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-[120px] justify-center text-center font-normal border border-gray-300 px-1 py-1 h-8 text-xs",
          )}
        >
          <CalendarIcon className="mr-1 h-3 w-3" />
          {format(date, "dd.MM.yy")}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 z-50 bg-white" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateSelect}
          initialFocus
          className="p-3 pointer-events-auto"
        />
      </PopoverContent>
    </Popover>
  );
};
