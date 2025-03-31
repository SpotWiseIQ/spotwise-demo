import React, { useEffect, useState } from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { TimelineRange } from "@/lib/types";

export type TimelineSliderProps = {
  value: TimelineRange;
  onChange: (value: TimelineRange) => void;
  label?: string;
  compact?: boolean;
  loading?: boolean;
};

export const TimelineSlider: React.FC<TimelineSliderProps> = ({
  value,
  onChange,
  label = "Timeline",
  compact = false,
  loading = false,
}) => {
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    // Set initial current time
    updateCurrentTime();
    
    // Update current time every minute
    const interval = setInterval(updateCurrentTime, 60000);
    
    // Initialize slider position to current time if not already set
    if (value.start === 0) {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      // Convert current time to slider position (0-100 scale)
      const timeAsPercentage = ((hours * 60 + minutes) / (24 * 60)) * 100;
      handleValueChange([timeAsPercentage]);
    }
    
    return () => clearInterval(interval);
  }, []);
  
  const updateCurrentTime = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    setCurrentTime(`${hours}:${minutes}`);
  };

  const handleValueChange = (newValue: number[]) => {
    if (newValue && newValue.length > 0) {
      // Update only the start value of the TimelineRange
      onChange({
        ...value,
        start: newValue[0]
      });
      
      // Update current time based on slider position
      const totalMinutes = Math.floor((newValue[0] / 100) * 24 * 60);
      const hours = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
      const minutes = (totalMinutes % 60).toString().padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
    }
  };

  return (
    <div className={`${compact ? 'w-full max-w-xs' : 'w-full'}`}>
      <div className="space-y-2">
        <div className="text-center text-xs text-gray-600">{currentTime}</div>
        <div className="flex items-center">
          <div className="text-xs text-gray-500 mr-2">00:00</div>
          <SliderPrimitive.Root
            className="relative flex w-full touch-none select-none items-center"
            value={[value.start]}
            onValueChange={handleValueChange}
            max={100}
            step={0.069} // 1 minute steps (100/1440 minutes in a day)
            aria-label={label}
          >
            <SliderPrimitive.Track className="relative h-1 w-full grow rounded-full bg-tampere-red">
              <SliderPrimitive.Range className="absolute h-full bg-tampere-red" />
            </SliderPrimitive.Track>
            <SliderPrimitive.Thumb 
              className="block h-4 w-1.5 rounded-none bg-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 cursor-pointer hover:bg-gray-700 transition-colors"
            />
          </SliderPrimitive.Root>
          <div className="text-xs text-gray-500 ml-2">23:59</div>
        </div>
      </div>
    </div>
  );
};
