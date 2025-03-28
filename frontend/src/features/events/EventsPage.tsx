import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { EventSidebar } from "./components/EventSidebar";
import { EventData } from "./types";
import { EventDetails } from "./EventDetails";
import { HomeIcon } from "./components/icons/HomeIcon";
import { TruckIcon } from "./components/icons/TruckIcon";
import { Link } from "react-router-dom";

export default function EventsPage() {
    const [events, setEvents] = useState<EventData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);

    // Get business and location from URL query params
    const [searchParams] = useSearchParams();
    const business = searchParams.get("business") || "Food Stall";
    const location = searchParams.get("location") || "Tampere";

    useEffect(() => {
        fetch("/scored_events.json")
            .then(res => res.json())
            .then(setEvents)
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="min-h-screen h-screen bg-white overflow-hidden flex flex-col">
            {/* Header */}
            <header className="flex items-center justify-between px-8 pt-8 pb-2">
                {/* Left: Colorful Home icon with border and shadow */}
                <Link to="/" className="rounded-full bg-white border-1 border-blue-200 shadow-lg p-2 flex items-center justify-center hover:scale-105 transition">
                    <HomeIcon className="w-10 h-10" />
                </Link>
                {/* Center: Truck icon and title */}
                <div className="flex items-center gap-3 justify-center flex-1">
                    <TruckIcon className="w-12 h-12" />
                    <h1 className="text-3xl font-bold text-[#111827]">Mobile Business Spots</h1>
                </div>
                {/* Right: Language switcher or other controls */}
                <div className="flex items-center gap-2">
                    <span className="text-gray-500 font-medium">FI</span>
                    <span className="mx-1 text-gray-300">|</span>
                    <span className="bg-blue-700 text-white px-3 py-1 rounded-lg font-bold">EN</span>
                </div>
            </header>
            {/* Subheading */}
            <div className="px-8 pb-4">
                <div className="bg-gray-50 rounded-lg px-6 py-3 text-xl font-medium text-gray-600 border-blue-200 shadow-lg p-1">
                    Displaying spots for <span className="text-pink-500 font-semibold">{business}</span> in <span className="text-pink-500 font-semibold">{location}</span>
                </div>
            </div>
            {/* Main content */}
            <div className="flex flex-1 overflow-hidden">
                <aside className="w-[28rem] border-r border-gray-200 bg-gray-50 p-6 h-full overflow-y-auto">
                    <EventSidebar
                        events={events}
                        loading={loading}
                        error={error}
                        onSelect={setSelectedEvent}
                        selectedEvent={selectedEvent}
                    />
                </aside>
                <main className="flex-1 p-4 h-full overflow-y-auto">
                    <EventDetails event={selectedEvent} events={events} />
                </main>
            </div>
        </div>
    );
}