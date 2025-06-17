import React from "react";
import { Star } from "lucide-react"; // Adjust import if you use a different icon library
import { scoreCategory, shortVenue, formatDuration } from "../../util/helper";

export function EventSidebar({ events, loading, error, selectedEvent, onSelect }) {
    return (
        <>
            {loading ? (
                <div className="text-gray-500">Loading events...</div>
            ) : error ? (
                <div className="text-red-500">Error: {error}</div>
            ) : (
                <ul className="space-y-6">
                    {events.map((e, i) => {
                        const isActive =
                            selectedEvent &&
                            selectedEvent.leftPanelData.eventName === e.leftPanelData.eventName &&
                            selectedEvent.leftPanelData.venue === e.leftPanelData.venue;
                        const scoreCat = scoreCategory(e.leftPanelData.score);
                        const weather =
                            e.leftPanelData.weather !== "N/A"
                                ? e.leftPanelData.weather
                                : "Sunny 22°C";
                        // Subtitle for hotspot type
                        let hotspotSubtitle = "";
                        if (e.fullEventData?.hotspotType === "Regular-hotspot") {
                            hotspotSubtitle = "Popular spot with regular daily foot traffic.";
                        } else if (e.fullEventData?.hotspotType === "Event-hotspot") {
                            hotspotSubtitle = "Spot is busy due to a specific event.";
                        }
                        return (
                            <li
                                key={i}
                                className={`bg-white rounded-lg shadow p-6 flex flex-col justify-between cursor-pointer transition ring-2 ${isActive ? "ring-blue-400" : "ring-transparent"
                                    }`}
                                onClick={() => onSelect && onSelect(e)}
                            >
                                {/* Top: Location Name & Score */}
                                <div className="flex items-center justify-between mb-2">
                                    <div className="font-semibold text-lg">
                                        {shortVenue(e.leftPanelData.venue)}
                                    </div>
                                    <span
                                        className={`flex items-center px-2 py-1 rounded ${scoreCat.color} ml-2`}
                                    >
                                        <Star className="w-4 h-4 mr-1" />
                                        <b>{scoreCat.label}</b>
                                    </span>
                                </div>

                                {/* Middle: Hotspot Type, Subtitle, Audience, Duration */}
                                <div className="flex flex-col gap-1 mb-2">
                                    {e.fullEventData?.hotspotType && (
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={`badge text-xs px-2 py-1 rounded ${e.fullEventData.hotspotType === "Regular-hotspot"
                                                        ? "bg-blue-100 text-blue-700"
                                                        : "bg-purple-100 text-purple-700"
                                                    }`}
                                                title={
                                                    e.fullEventData.hotspotType === "Regular-hotspot"
                                                        ? "Consistent daily visitors"
                                                        : "Crowd due to event"
                                                }
                                            >
                                                <span role="img" aria-label="hotspot" className="mr-1">📍</span>
                                                {e.fullEventData.hotspotType === "Regular-hotspot"
                                                    ? "Regular daily crowd"
                                                    : "Event-driven crowd"}
                                            </span>
                                        </div>
                                    )}
                                    <span
                                        className="text-gray-500 flex items-center text-sm"
                                        title="This is the duration of the event."
                                    >
                                        <span
                                            role="img"
                                            aria-label="duration"
                                            className="mr-1"
                                        >
                                            ⏰
                                        </span>
                                        Event duration:{" "}
                                        {e.leftPanelData.occurrenceCount > 1
                                            ? `${e.leftPanelData.occurrenceCount} days`
                                            : formatDuration(
                                                e.leftPanelData.startDate,
                                                e.leftPanelData.endDate
                                            )}
                                    </span>
                                    {e.leftPanelData.audienceType && (
                                        <span
                                            className="text-pink-600 flex items-center text-sm"
                                            title="This event/location is most popular with this audience."
                                        >
                                            <span
                                                role="img"
                                                aria-label="audience"
                                                className="mr-1"
                                            >
                                                👨‍👩‍👧
                                            </span>
                                            Audience: {e.leftPanelData.audienceType}
                                        </span>
                                    )}
                                </div>

                                {/* Bottom: Weather & Foot Traffic */}
                                <div className="flex items-center justify-between mt-2">
                                    <span className="text-blue-600 flex items-center text-sm">
                                        <span
                                            role="img"
                                            aria-label="weather"
                                            className="mr-1"
                                        >
                                            ☀️
                                        </span>
                                        {weather}
                                    </span>
                                    <span
                                        className="text-green-700 font-semibold flex items-center text-sm"
                                        title="Estimated number of people attending or passing by."
                                    >
                                        <span
                                            role="img"
                                            aria-label="foot traffic"
                                            className="mr-1"
                                        >
                                            👣
                                        </span>
                                        {e.leftPanelData.views}
                                    </span>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </>
    );
}