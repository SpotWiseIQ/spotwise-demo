import React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { TimelineRange } from "@/lib/types";

type TimelineSliderProps = {
  value: TimelineRange;
  onChange: (value: TimelineRange) => void;
  label?: string;
  compact?: boolean;
};

export const TimelineSlider: React.FC<TimelineSliderProps> = ({
  value,
  onChange,
  label = "Timeline",
  compact = false,
}) => {
  const handleValueChange = (newValue: number[]) => {
    if (newValue && newValue.length > 0) {
      // Update only the start value of the TimelineRange
      onChange({
        ...value,
        start: newValue[0]
      });
    }
  };

  return (
    <div className={`${compact ? 'w-full max-w-xs' : 'w-full'}`}>
      <div className="space-y-2">
        <div className="text-center text-xs text-gray-600">Now</div>
        <SliderPrimitive.Root
          className="relative flex w-full touch-none select-none items-center"
          value={[value.start]}
          onValueChange={handleValueChange}
          max={100}
          step={1}
          aria-label={label}
        >
          <SliderPrimitive.Track className="relative h-1 w-full grow rounded-full bg-tampere-red">
            <SliderPrimitive.Range className="absolute h-full bg-tampere-red" />
          </SliderPrimitive.Track>
          <SliderPrimitive.Thumb 
            className="block h-4 w-1.5 rounded-none bg-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 cursor-pointer hover:bg-gray-700 transition-colors"
          />
        </SliderPrimitive.Root>
      </div>
    </div>
  );
};
