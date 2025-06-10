import React, { useState, useEffect } from "react";
import { EventSidebar } from "./components/EventSidebar";
import { EventData } from "./types";
import { EventDetails } from "./EventDetails";

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
        <div className="flex min-h-screen h-screen bg-white overflow-hidden">
            <aside className="w-[28rem] border-r border-gray-200 bg-gray-50 p-6 h-screen overflow-y-auto">
                <EventSidebar
                    events={events}
                    loading={loading}
                    error={error}
                    onSelect={setSelectedEvent}
                    selectedEvent={selectedEvent}
                />
            </aside>
            <main className="flex-1 p-4 h-screen overflow-y-auto">
                <EventDetails event={selectedEvent} events={events} />
            </main>
        </div>
    );
}