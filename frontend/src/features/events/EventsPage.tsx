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

    return (
        <div className="flex min-h-screen bg-white">
            <EventSidebar events={events} loading={loading} error={error} />
            <main className="flex-1 p-8 flex items-center justify-center">
                {/* Placeholder for map or event details */}
                <div className="text-gray-400 text-xl">Event Map Coming Soon</div>
            </main>
        </div>
    );
}