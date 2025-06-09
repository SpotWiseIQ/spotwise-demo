import React, { useEffect, useState } from "react";
import { EventSidebar } from "./components/EventSidebar";
import { EventData } from "./types";

export default function EventsPage() {
    const [events, setEvents] = useState<EventData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch("/scored_events.json")
            .then(res => {
                if (!res.ok) throw new Error("Failed to fetch events");
                return res.json();
            })
            .then(setEvents)
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div>Loading events...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div style={{ display: "flex" }}>
            <EventSidebar events={events} />
            <main style={{ flex: 1, padding: 16 }}>
                <h1>Event Map Coming Soon</h1>
            </main>
        </div>
    );
}