import React from "react";
import { EventData } from "../types";
import { MapPin, Calendar, Star, Eye, Users, Clock } from "lucide-react";

export function EventSidebar({
    events,
    loading,
    error,
}: {
    events: EventData[];
    loading?: boolean;
    error?: string | null;
}) {
    return (
        <aside className="w-96 border-r border-gray-200 bg-gray-50 p-6">
            <h2 className="text-2xl font-bold mb-6 text-[#29549a]">Events</h2>
            {loading ? (
                <div className="text-gray-500">Loading events...</div>
            ) : error ? (
                <div className="text-red-500">Error: {error}</div>
            ) : (
                <ul className="space-y-4">
                    {events.map((e, i) => (
                        <li key={i} className="bg-white rounded-lg shadow p-4">
                            <div className="font-semibold text-lg mb-1">{e.leftPanelData.eventName}</div>
                            <div className="flex items-center text-gray-600 mb-1">
                                <MapPin className="w-4 h-4 mr-1" />
                                {e.leftPanelData.venue}
                            </div>
                            <div className="flex items-center text-gray-500 text-sm mb-1">
                                <Calendar className="w-4 h-4 mr-1" />
                                {new Date(e.leftPanelData.startDate).toLocaleString()} - {new Date(e.leftPanelData.endDate).toLocaleString()}
                            </div>
                            <div className="text-xs text-blue-700 mb-1">
                                {e.leftPanelData.eventType.join(", ")}
                            </div>
                            <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-1 items-center">
                                <span className="flex items-center">
                                    <Star className="w-4 h-4 mr-1 text-yellow-500" />
                                    <b>{e.leftPanelData.score}</b>
                                </span>
                                <span className="flex items-center">
                                    <Eye className="w-4 h-4 mr-1" />
                                    {e.leftPanelData.views}
                                </span>
                                <span className="flex items-center">
                                    <Clock className="w-4 h-4 mr-1" />
                                    {e.leftPanelData.dayType}, {e.leftPanelData.timeOfDay}
                                </span>
                                <span className="flex items-center">
                                    <Users className="w-4 h-4 mr-1" />
                                    {e.leftPanelData.audienceType}
                                </span>
                                <span className="flex items-center">
                                    <Calendar className="w-4 h-4 mr-1" />
                                    {e.leftPanelData.daysToEvent} days
                                </span>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </aside>
    );
}