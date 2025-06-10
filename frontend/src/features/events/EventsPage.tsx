import React, { useState, useEffect } from "react";
import { EventSidebar } from "./components/EventSidebar";
import { EventData } from "./types";

export default function EventsPage() {
    const [events, setEvents] = useState<EventData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);

    useEffect(() => {
        fetch("/scored_events.json")
            .then(res => res.json())
            .then(setEvents)
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="flex min-h-screen bg-white">
            <EventSidebar
                events={events}
                loading={loading}
                error={error}
                onSelect={setSelectedEvent}
                selectedEvent={selectedEvent}
            />
            <main className="flex-1 p-8">
                {selectedEvent ? (
                    <div className="max-w-xl mx-auto bg-white rounded-lg shadow p-6">
                        <h2 className="text-2xl font-bold mb-2">{selectedEvent.leftPanelData.eventName}</h2>
                        <div className="mb-2 text-gray-600">{selectedEvent.leftPanelData.venue}</div>
                        <div className="mb-2 text-gray-500">
                            {selectedEvent.leftPanelData.startDate} - {selectedEvent.leftPanelData.endDate}
                        </div>
                        <div className="mb-2">{selectedEvent.leftPanelData.eventType.join(", ")}</div>
                        {/* Add more details as needed */}
                        <pre className="text-xs bg-gray-100 p-2 rounded">{JSON.stringify(selectedEvent.fullEventData, null, 2)}</pre>
                    </div>
                ) : (
                    <div className="text-gray-400 text-xl flex items-center justify-center h-full">
                        Select an event to see details
                    </div>
                )}
            </main>
        </div>
    );
}