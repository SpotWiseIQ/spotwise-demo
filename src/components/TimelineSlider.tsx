
import React, { useState } from "react";
import { TimelineRange } from "@/lib/types";

type TimelineSliderProps = {
  value: TimelineRange;
  onChange: (range: TimelineRange) => void;
  label?: string;
};

export const TimelineSlider: React.FC<TimelineSliderProps> = ({
  value,
  onChange,
  label = "Timeline",
}) => {
  const [dragging, setDragging] = useState<"start" | "end" | null>(null);

  const handleMouseDown = (thumb: "start" | "end") => {
    setDragging(thumb);
  };

  const handleMouseUp = () => {
    setDragging(null);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragging) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const offsetX = e.clientX - rect.left;
    
    // Calculate new position in percentage
    let newPos = Math.max(0, Math.min(100, (offsetX / width) * 100));
    
    if (dragging === "start") {
      // Ensure start is always less than end
      newPos = Math.min(newPos, value.end - 5);
      onChange({ ...value, start: newPos });
    } else {
      // Ensure end is always greater than start
      newPos = Math.max(newPos, value.start + 5);
      onChange({ ...value, end: newPos });
    }
  };

  React.useEffect(() => {
    const handleMouseUpGlobal = () => {
      setDragging(null);
    };

    document.addEventListener("mouseup", handleMouseUpGlobal);
    return () => {
      document.removeEventListener("mouseup", handleMouseUpGlobal);
    };
  }, []);

  return (
    <div className="w-full mb-4">
      {label && <div className="mb-2 text-sm font-medium">{label}</div>}
      <div
        className="timeline-slider"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <div className="slider-track"></div>
        <div
          className="slider-track-red"
          style={{
            left: `${value.start}%`,
            width: `${value.end - value.start}%`,
          }}
        ></div>
        <div
          className="slider-thumb"
          style={{ left: `${value.start}%` }}
          onMouseDown={() => handleMouseDown("start")}
        ></div>
        <div
          className="slider-thumb"
          style={{ left: `${value.end}%` }}
          onMouseDown={() => handleMouseDown("end")}
        ></div>
        <div
          className="slider-label"
          style={{ left: "50%" }}
        >
          Now
        </div>
      </div>
    </div>
  );
};
