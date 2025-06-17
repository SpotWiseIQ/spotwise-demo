import { MapPin, Star, Users, Clock, CloudSun, Footprints } from "lucide-react";
import { scoreCategory, formatDuration, shortVenue } from "../../util/helper";

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
                        const isActive = selectedEvent && selectedEvent.leftPanelData.eventName === e.leftPanelData.eventName && selectedEvent.leftPanelData.venue === e.leftPanelData.venue;
                        const scoreCat = scoreCategory(e.leftPanelData.score);
                        const weather = e.leftPanelData.weather !== "N/A" ? e.leftPanelData.weather : "Sunny 22°C";
                        return (
                            <li
                                key={i}
                                className={`bg-white rounded-lg shadow p-6 flex flex-col justify-between cursor-pointer transition ring-2 ${isActive ? "ring-blue-400" : "ring-transparent"}`}
                                onClick={() => onSelect && onSelect(e)}
                            >
                                {/* Top: Location Name & Score */}
                                <div className="flex items-center justify-between mb-3">
                                    <div className="font-semibold text-lg">{shortVenue(e.leftPanelData.venue)}</div>
                                    <span className={`flex items-center px-2 py-1 rounded ${scoreCat.color} ml-2`}>
                                        <Star className="w-5 h-5 mr-1" />
                                        <b>{scoreCat.label}</b>
                                    </span>
                                </div>

                                {/* Middle: Hotspot Type & Duration */}
                                <div className="flex flex-wrap gap-3 items-center mb-1">
                                    {e.fullEventData?.hotspotType && (
                                        <span className={`badge text-xs px-3 py-1 rounded flex items-center ${e.fullEventData.hotspotType === "Regular-hotspot" ? "bg-blue-100 text-blue-700" : "bg-pink-100 text-pink-700"}`}>
                                            <MapPin className="w-5 h-5 mr-1" />
                                            {e.fullEventData.hotspotType.replace("-", " ")}
                                        </span>
                                    )}
                                    <span className="text-gray-500 flex items-center text-sm">
                                        <Clock className="w-5 h-5 mr-1" />
                                        {e.leftPanelData.occurrenceCount > 1
                                            ? `${e.leftPanelData.occurrenceCount} days`
                                            : formatDuration(e.leftPanelData.startDate, e.leftPanelData.endDate)}
                                    </span>
                                </div>

                                {/* Primary Audience with extra spacing */}
                                {e.leftPanelData.audienceType && (
                                    <div className="flex items-center text-pink-600 text-sm my-3">
                                        <Users className="w-5 h-5 mr-1" />
                                        {e.leftPanelData.audienceType}
                                    </div>
                                )}

                                {/* Labels */}
                                {e.fullEventData?.labels?.length > 0 && (
                                    <div className="flex flex-wrap gap-3 items-center mb-2">
                                        {e.fullEventData.labels.map(label => (
                                            <span key={label} className="bg-gray-100 text-gray-600 rounded px-3 py-1 text-xs">{label}</span>
                                        ))}
                                    </div>
                                )}

                                {/* Bottom: Weather & Foot Traffic */}
                                <div className="flex items-center justify-between mt-4">
                                    <span className="text-blue-600 flex items-center text-base">
                                        <CloudSun className="w-5 h-5 mr-1" />
                                        {weather}
                                    </span>
                                    <span className="text-green-700 font-semibold flex items-center text-base">
                                        <Footprints className="w-5 h-5 mr-1" />
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