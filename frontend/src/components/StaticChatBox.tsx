import React, { useState, useRef, useEffect } from "react";
import { useStaticBusiness } from '@/lib/StaticBusinessContext';
import { MessageSquare, Send } from "lucide-react";

interface StaticChatBoxProps {
  className?: string;
  onExpandToggle?: (expanded: boolean) => void;
}

interface Message {
  id: number;
  text: string;
  sender: 'system' | 'user';
  timestamp: Date;
}

export const StaticChatBox: React.FC<StaticChatBoxProps> = ({ 
  className = '',
  onExpandToggle
}) => {
  const { selectedZone } = useStaticBusiness();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messageIdCounter, setMessageIdCounter] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  // Generate business opportunity summaries based on selected zone
  const generateZoneSummary = (zone: any) => {
    return `This area has ${zone.carFlow} daily vehicles and ${zone.footTraffic} pedestrians, making it ${
      zone.footTraffic > 2000 ? 'highly attractive' : 'potentially interesting'
    } for mobile businesses. With an average parking time of ${zone.avgParkingTime} minutes and ${
      zone.competition === 'None' ? 'no direct competition' : 'some competition'
    } nearby, it offers a strategic location to capture customer flow. The revenue potential of €${
      zone.revenuePotential || '18k-27k'
    } per month and growth index of ${zone.growthIndex || '8,7'} suggest strong business opportunities.`;
  };

  // Reset messages when selected zone changes
  useEffect(() => {
    if (selectedZone) {
      const summary = generateZoneSummary(selectedZone);
      setMessages([{
        id: 0,
        text: summary,
        sender: 'system',
        timestamp: new Date()
      }]);
      setMessageIdCounter(1);
    }
  }, [selectedZone]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  if (!selectedZone) return null;

  return (
    <div 
      className={`bg-white rounded-lg shadow-sm border border-gray-100 flex flex-col transition-all duration-300 ease-in-out overflow-hidden h-full ${isExpanded ? 'ring-2 ring-blue-300' : ''} ${className}`}
    >
      <div 
        className="flex items-center justify-between p-2 border-b border-gray-100 bg-blue-50"
        style={{ cursor: 'pointer' }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-1.5">
          <MessageSquare className="text-blue-500" size={14} />
          <h3 className="text-xs font-medium text-gray-700">Business Opportunity Analysis</h3>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {messages.map((message) => (
          <div 
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[85%] rounded-lg px-2 py-1.5 text-xs ${
                message.sender === 'user' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <div>{message.text}</div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="border-t border-gray-100 p-2 bg-gray-50">
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask about this location..."
            className="flex-1 text-xs border border-gray-200 rounded-md py-1.5 px-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button 
            onClick={handleSendMessage}
            className="p-1.5 rounded-md bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
            disabled={inputValue.trim() === ""}
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}; 