export interface EventLeftPanelData {
    eventName: string;
    venue: string;
    startDate: string;
    endDate: string;
    eventType: string[];
    score: number;
    normalizedScore: number;
    dayType: string;
    timeOfDay: string;
    views: number;
    audienceType: string;
    daysToEvent: number;
    peakFootTraffic: string;
    weather: string;
}

export interface EventData {
    leftPanelData: EventLeftPanelData;
    fullEventData: any; // You can refine this as needed
}