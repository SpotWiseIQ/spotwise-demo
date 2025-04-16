import React from "react";
import { Button } from "@/components/ui/button";

interface LanguageSelectorProps {
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ className = "" }) => {
  const [language, setLanguage] = React.useState("EN");

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <Button
        variant={language === "FI" ? "secondary" : "ghost"}
        size="sm"
        className="px-2 py-1 h-7"
        onClick={() => setLanguage("FI")}
      >
        FI
      </Button>
      <span className="text-gray-400">|</span>
      <Button
        variant={language === "EN" ? "secondary" : "ghost"}
        size="sm"
        className="px-2 py-1 h-7"
        onClick={() => setLanguage("EN")}
      >
        EN
      </Button>
    </div>
  );
}; 