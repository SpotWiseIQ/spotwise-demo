import React, { useState, useRef, useEffect } from "react";
import { useTampere } from "@/lib/TampereContext";
import { MessageSquare, Send } from "lucide-react";
import { fetchLLMSummary } from "@/lib/api";

export interface ChatBoxProps {
  className?: string;
  onExpandToggle?: (expanded: boolean) => void;
}

interface Message {
  id: number;
  text: string;
  sender: 'system' | 'user';
  timestamp: Date;
}

export const ChatBox: React.FC<ChatBoxProps> = ({ className, onExpandToggle }) => {
  const { selectedLocation, detailedMetrics, selectedBusiness } = useTampere();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messageIdCounter, setMessageIdCounter] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoadingLLM, setIsLoadingLLM] = useState(false);

  // Generate business opportunity summaries based on selected item
  const getBusinessOpportunitySummary = () => {
    if (!selectedLocation) {
      return "Select a hotspot or event to see business opportunities analysis.";
    }
    
    if (selectedLocation.type === 'natural') {
      return generateHotspotSummary(selectedLocation);
    } else if (selectedLocation.type === 'event') {
      return generateEventSummary(selectedLocation);
    }
    
    return "Select a hotspot or event to see business opportunities analysis.";
  };

  const generateHotspotSummary = (hotspot: any) => {
    // Extract metrics from different sources, with fallbacks
    const population = hotspot.population || detailedMetrics?.metrics?.population || "a significant population";
    const areaType = hotspot.areaType || detailedMetrics?.metrics?.areaType || "mixed-use area";
    const peakHour = hotspot.peakHour || detailedMetrics?.metrics?.peakHour || "17:00";
    const avgDailyTraffic = hotspot.avgDailyTraffic || detailedMetrics?.metrics?.avgDailyTraffic || "moderate";
    const demographics = hotspot.dominantDemographics || detailedMetrics?.metrics?.dominantDemographics || "diverse demographics";
    const nearbyBusinesses = hotspot.nearbyBusinesses || detailedMetrics?.metrics?.nearbyBusinesses || "various businesses";
    
    // Determine traffic level based on numbers or text
    let trafficDescription = "varying";
    if (typeof avgDailyTraffic === 'string') {
      if (avgDailyTraffic.includes('2,500') || avgDailyTraffic.includes('2500')) {
        trafficDescription = "significant";
      } else if (avgDailyTraffic.includes('1,') || avgDailyTraffic.includes('1000')) {
        trafficDescription = "moderate";
      } else if (avgDailyTraffic.toLowerCase().includes('high')) {
        trafficDescription = "high";
      } else if (avgDailyTraffic.toLowerCase().includes('low')) {
        trafficDescription = "lower";
      }
    }
    
    // Create a more concise summary
    return `${areaType} with ${trafficDescription} traffic (${avgDailyTraffic}/day). Peak time: ${peakHour}. ${demographics} demographic. ${nearbyBusinesses} nearby businesses.`;
  };

  const generateEventSummary = (event: any) => {
    // Extract metrics from different sources, with fallbacks
    const eventType = event.event_type || event.type_info || event.type || detailedMetrics?.metrics?.type || "event";
    const duration = event.duration || 
      (event.start_time && event.end_time ? calculateDuration(event.start_time, event.end_time) : null) || 
      detailedMetrics?.metrics?.duration || 
      "limited timeframe";
      
    const capacity = event.expected_attendance || event.capacity || detailedMetrics?.metrics?.capacity || "significant";
    const demographics = 
      (detailedMetrics?.detailed?.expected_crowd && detailedMetrics?.detailed?.expected_crowd.primary_demographic) ||
      event.demographics || 
      detailedMetrics?.metrics?.demographics || 
      "diverse";
      
    const peakImpact = event.peakTrafficImpact || detailedMetrics?.metrics?.peakTrafficImpact || "+40%";
    
    // Create a more concise summary
    return `${eventType} event. Expected attendance: ${capacity}. Duration: ${duration}. ${demographics} demographic. Traffic impact: ${peakImpact}.`;
  };
  
  // Helper functions for more specific recommendations
  const getBusinessRecommendation = (demographics: string) => {
    const demographicsLower = demographics.toLowerCase();
    
    if (demographicsLower.includes('young') || demographicsLower.includes('18-24') || demographicsLower.includes('student')) {
      return "coffee, fast food, and trendy food options";
    } else if (demographicsLower.includes('families') || demographicsLower.includes('35-44')) {
      return "family-friendly food options and refreshments";
    } else if (demographicsLower.includes('professional') || demographicsLower.includes('25-34')) {
      return "premium coffee, healthy options, and quick lunch solutions";
    } else if (demographicsLower.includes('senior') || demographicsLower.includes('45+') || demographicsLower.includes('elder')) {
      return "traditional food options and comfortable seating areas";
    } else if (demographicsLower.includes('tourist') || demographicsLower.includes('international')) {
      return "local specialties and easy grab-and-go options";
    }
    
    return "a variety of food and beverage options";
  };
  
  const getEventSpecificOffers = (eventType: string) => {
    const typeLower = eventType.toLowerCase();
    
    if (typeLower.includes('concert') || typeLower.includes('music')) {
      return "themed drinks and quick snacks that can be consumed while standing";
    } else if (typeLower.includes('sport')) {
      return "energy drinks, healthy snacks, and quick meal options";
    } else if (typeLower.includes('festival') || typeLower.includes('cultural')) {
      return "culturally relevant food items and specialty beverages";
    } else if (typeLower.includes('food')) {
      return "complementary food items that aren't competing directly with the event";
    } else if (typeLower.includes('market') || typeLower.includes('fair')) {
      return "hot beverages and sweet treats that complement shopping experiences";
    }
    
    return "a mix of quick snacks and beverages suited to the event atmosphere";
  };
  
  const calculateDuration = (startTime: string, endTime: string) => {
    try {
      // Parse times directly respecting timezone in the string
      // This prevents browser timezone conversion
      const start_parts = startTime.split(/[- :+]/);
      const end_parts = endTime.split(/[- :+]/);
      
      // Extract hours and minutes directly from the parts 
      const start_hour = parseInt(start_parts[3]);
      const start_minute = parseInt(start_parts[4]);
      const end_hour = parseInt(end_parts[3]);
      const end_minute = parseInt(end_parts[4]);
      
      // Calculate duration in minutes
      let duration_minutes = (end_hour * 60 + end_minute) - (start_hour * 60 + start_minute);
      if (duration_minutes < 0) duration_minutes += 24 * 60; // Handle overnight events
      
      // Convert to hours and minutes
      const diffH = Math.floor(duration_minutes / 60);
      const diffM = duration_minutes % 60;
      
      return `${diffH}h${diffM > 0 ? ` ${diffM}m` : ''}`;
    } catch (e) {
      return "multiple hours";
    }
  };

  // Helper to gather all relevant metrics for the LLM
  const gatherMetrics = () => {
    if (!selectedLocation) return {};
    const metrics = detailedMetrics?.metrics || {};
    return {
      population: selectedLocation.population || metrics.population,
      areaType: selectedLocation.areaType || metrics.areaType,
      peakHour: selectedLocation.peakHour || metrics.peakHour,
      avgDailyTraffic: selectedLocation.avgDailyTraffic || metrics.avgDailyTraffic,
      dominantDemographics: selectedLocation.dominantDemographics || metrics.dominantDemographics,
      nearbyBusinesses: selectedLocation.nearbyBusinesses || metrics.nearbyBusinesses,
      event_type: selectedLocation.event_type || metrics.type,
      duration: selectedLocation.duration || metrics.duration,
      expected_attendance: selectedLocation.expected_attendance || selectedLocation.capacity || metrics.capacity,
      demographics: metrics.demographics,
      peakTrafficImpact: selectedLocation.peakTrafficImpact || metrics.peakTrafficImpact,
      // Add more as needed
    };
  };

  // Fetch LLM summary when location or business changes
  useEffect(() => {
    let cancelled = false;
    const fetchSummary = async () => {
      if (!selectedLocation || !selectedBusiness) {
        setMessages([{
          id: 0,
          text: "Select a hotspot or event to see business opportunities analysis.",
          sender: 'system',
          timestamp: new Date()
        }]);
        setMessageIdCounter(1);
        return;
      }
      setIsLoadingLLM(true);
      const metrics = gatherMetrics();
      const payload = {
        business_requirement: selectedBusiness,
        metrics,
        location_type: selectedLocation.type,
        instructions: "Create a small summary of why this zone would be a good zone for the type of business the user is interested in.",
      };
      try {
        const summary = await fetchLLMSummary(payload);
        if (!cancelled) {
          setMessages([{
            id: 0,
            text: summary,
            sender: 'system',
            timestamp: new Date()
          }]);
          setMessageIdCounter(1);
        }
      } catch (e) {
        if (!cancelled) {
          // fallback to old summary
          const summary = getBusinessOpportunitySummary();
          setMessages([{
            id: 0,
            text: summary,
            sender: 'system',
            timestamp: new Date()
          }]);
          setMessageIdCounter(1);
        }
      } finally {
        if (!cancelled) setIsLoadingLLM(false);
      }
    };
    fetchSummary();
    return () => { cancelled = true; };
  }, [selectedLocation, detailedMetrics, selectedBusiness]);

  // Notify parent component when expanded state changes
  useEffect(() => {
    if (onExpandToggle) {
      onExpandToggle(isExpanded);
    }
  }, [isExpanded, onExpandToggle]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSendMessage = () => {
    if (inputValue.trim() === "") return;

    // Add user message
    const newUserMessage: Message = {
      id: messageIdCounter,
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newUserMessage]);
    setMessageIdCounter(prev => prev + 1);
    setInputValue("");
    
    // Simulate a response (placeholder for future LLM integration)
    setTimeout(() => {
      const responseMessage: Message = {
        id: messageIdCounter + 1,
        text: "Thanks for your question. This feature will be connected to an LLM in the future for more detailed analysis and recommendations.",
        sender: 'system',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, responseMessage]);
      setMessageIdCounter(prev => prev + 2);
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div 
      className={`bg-white rounded-lg shadow-sm border border-gray-100 flex flex-col transition-all duration-300 ease-in-out overflow-hidden h-full ${isExpanded ? 'ring-2 ring-blue-300' : ''} ${className}`}
    >
      <div 
        className="flex items-center justify-between p-3 border-b border-gray-100 bg-blue-50"
        style={{ cursor: 'pointer' }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <MessageSquare className="text-blue-500" size={18} />
          <h3 className="text-sm font-medium text-gray-700">Business Opportunity Analysis</h3>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {isLoadingLLM ? (
          <div className="text-xs text-center text-gray-400 py-6">Loading smart summary...</div>
        ) : (
          messages.map((message) => (
            <div 
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  message.sender === 'user' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <div>{message.text}</div>
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="border-t border-gray-100 p-3 bg-gray-50">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask about this location..."
            className="flex-1 text-sm border border-gray-200 rounded-md py-2 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button 
            onClick={handleSendMessage}
            className="p-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
            disabled={inputValue.trim() === ""}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}; 