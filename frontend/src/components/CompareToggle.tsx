import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeftRight } from "lucide-react";

interface CompareToggleProps {
  isCompareMode: boolean;
  onToggle: () => void;
}

export const CompareToggle: React.FC<CompareToggleProps> = ({ isCompareMode, onToggle }) => {
  return (
    <Button
      variant={isCompareMode ? "secondary" : "ghost"}
      size="sm"
      className="h-6 px-2 text-xs"
      onClick={onToggle}
    >
      <ArrowLeftRight className="w-3 h-3 mr-1" />
      Compare
    </Button>
  );
}; 