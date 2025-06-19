import React from "react";
import { Star, CloudSun, Footprints, Clock, Calendar } from "lucide-react";
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
                        // Badge for crowd type
                        let crowdType = "";
                        let crowdBadgeColor = "";
                        if (e.fullEventData?.hotspotType === "Regular-hotspot") {
                            crowdType = "Regular crowd";
                            crowdBadgeColor = "bg-blue-100 text-blue-700";
                        } else if (e.fullEventData?.hotspotType === "Event-hotspot") {
                            crowdType = "Event crowd";
                            crowdBadgeColor = "bg-purple-100 text-purple-700";
                        }
                        return (
                            <li
                                key={i}
                                className={`relative bg-white rounded-lg shadow p-6 flex flex-col justify-between cursor-pointer transition ring-2 ${isActive ? "ring-blue-400" : "ring-transparent"
                                    }`}
                                onClick={() => onSelect && onSelect(e)}
                            >
                                {/* Score Badge: Top Right */}
                                <span
                                    className={`absolute top-4 right-4 flex items-center px-2 py-1 rounded ${scoreCat.color} shadow font-bold text-xs`}
                                    style={{ zIndex: 2 }}
                                >
                                    <Star className="w-4 h-4 mr-1" />
                                    {scoreCat.label}
                                </span>

                                {/* Top: Location Name */}
                                <div className="flex items-center justify-between mb-2">
                                    <div className="font-semibold text-lg">{shortVenue(e.leftPanelData.venue)}</div>
                                </div>

                                {/* Middle: Primary Audience, Crowd Type with Duration */}
                                <div className="flex flex-col gap-1 mb-2 mt-1">
                                    {crowdType === "Event crowd" && (
                                        <div className="flex items-center gap-2" style={{ width: "fit-content" }}>
                                            {/* Event Category Icon (emoji) */}
                                            <span style={{ fontSize: "1.2rem" }}>🎉</span>
                                            <span
                                                className={`inline-block text-base font-semibold rounded px-2 py-1 ${crowdBadgeColor}`}
                                                style={{ width: "fit-content" }}
                                            >
                                                {e.leftPanelData.locations_type
                                                    ? `${e.leftPanelData.dayType.charAt(0).toUpperCase() + e.leftPanelData.dayType.slice(1)} `
                                                    : ""}
                                                {e.leftPanelData.eventType[0]
                                                    ? `${e.leftPanelData.eventType[0].toLowerCase()} `
                                                    : "event "}
                                                for {e.leftPanelData.occurrenceCount > 1
                                                    ? `${e.leftPanelData.occurrenceCount} days`
                                                    : formatDuration(e.leftPanelData.startDate, e.leftPanelData.endDate)}
                                            </span>
                                        </div>
                                    )}
                                    {e.leftPanelData.audienceType && (
                                        <span className="text-pink-600 flex items-center text-base" title="This event/location is most popular with this audience.">
                                            <span role="img" aria-label="audience" className="mr-1">👨‍👩‍👧</span>
                                            Primary Audience: {e.leftPanelData.audienceType}
                                        </span>
                                    )}
                                </div>

                                {/* Bottom: Weather & Foot Traffic */}
                                <div className="flex items-center justify-between mt-4">
                                    <span className="text-blue-600 flex items-center text-lg font-semibold">
                                        <CloudSun className="w-5 h-5 mr-2" />
                                        {weather}
                                    </span>
                                    <span className="text-green-700 font-semibold flex items-center text-lg">
                                        <Footprints className="w-5 h-5 mr-2" />
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