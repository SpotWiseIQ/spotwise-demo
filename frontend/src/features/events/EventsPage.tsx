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
        <div className="flex min-h-screen bg-white">
            <EventSidebar
                events={events}
                loading={loading}
                error={error}
                onSelect={setSelectedEvent}
                selectedEvent={selectedEvent}
            />
            <main className="flex-1 p-8">
                <EventDetails event={selectedEvent} />
            </main>
        </div>
    );
}