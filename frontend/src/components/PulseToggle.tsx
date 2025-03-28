
import React from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface PulseToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
}

export const PulseToggle: React.FC<PulseToggleProps> = ({ value, onChange }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-full px-4 py-2 inline-flex items-center space-x-2">
      <Label htmlFor="pulse-toggle" className="text-sm font-medium">
        Pulse
      </Label>
      <Switch
        id="pulse-toggle"
        checked={value}
        onCheckedChange={onChange}
        className={value ? "bg-tampere-red" : ""}
      />
    </div>
  );
};
