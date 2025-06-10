import { MapPin, Calendar, Star, Users, Clock, CloudSun, Footprints, Sparkles } from "lucide-react";

function formatDateRange(start: string, end: string) {
    const s = new Date(start);
    const e = new Date(end);
    return `${s.toLocaleDateString("en-GB", { weekday: "short" })}, ${s.getDate().toString().padStart(2, "0")}/${(s.getMonth() + 1).toString().padStart(2, "0")} ${s.getHours().toString().padStart(2, "0")}:${s.getMinutes().toString().padStart(2, "0")} - ${e.getDate().toString().padStart(2, "0")}/${(e.getMonth() + 1).toString().padStart(2, "0")} ${e.getHours().toString().padStart(2, "0")}:${e.getMinutes().toString().padStart(2, "0")}`;
}

function shortVenue(venue: string) {
    return venue.split(",")[0];
}

function scoreCategory(score: number) {
    if (score >= 150) return { label: "Top", color: "bg-purple-100 text-purple-700" };
    if (score >= 100) return { label: "High", color: "bg-green-100 text-green-700" };
    if (score >= 70) return { label: "Medium", color: "bg-yellow-100 text-yellow-700" };
    return { label: "Low", color: "bg-red-100 text-red-700" };
}

export function EventSidebar({ events, loading, error, selectedEvent, onSelect }) {
    return (
        <>
            <h2 className="text-2xl font-bold mb-6 text-[#29549a]">Events</h2>
            {loading ? (
                <div className="text-gray-500">Loading events...</div>
            ) : error ? (
                <div className="text-red-500">Error: {error}</div>
            ) : (
                <ul className="space-y-6">
                    {events.map((e, i) => {
                        const isActive = selectedEvent && selectedEvent.leftPanelData.eventName === e.leftPanelData.eventName;
                        const scoreCat = scoreCategory(e.leftPanelData.score);
                        const weather = e.leftPanelData.weather !== "N/A" ? e.leftPanelData.weather : "Sunny 22°C";
                        const categoryClass = "text-orange-600 font-semibold";
                        const categoryIconClass = "text-orange-400";
                        return (
                            <li
                                key={i}
                                className={`bg-white rounded-lg shadow p-6 flex flex-col justify-between cursor-pointer transition ring-2 ${isActive ? "ring-blue-400" : "ring-transparent"}`}
                                onClick={() => onSelect && onSelect(e)}
                            >
                                {/* Event Name and Score */}
                                <div className="flex items-start justify-between mb-2">
                                    <div className="font-semibold text-lg">{e.leftPanelData.eventName}</div>
                                    <span className={`flex items-center px-2 py-1 rounded ${scoreCat.color} ml-2`}>
                                        <Star className="w-4 h-4 mr-1" />
                                        <b>{scoreCat.label}</b>
                                    </span>
                                </div>
                                {/* Venue */}
                                <div className="flex items-center text-gray-600 mb-2">
                                    <MapPin className="w-4 h-4 mr-1 text-blue-400" />
                                    <span className="truncate">{shortVenue(e.leftPanelData.venue)}</span>
                                </div>
                                {/* Date Range */}
                                <div className="flex items-center text-gray-500 text-sm mb-2">
                                    <Calendar className="w-4 h-4 mr-1 text-green-400" />
                                    {formatDateRange(e.leftPanelData.startDate, e.leftPanelData.endDate)}
                                </div>
                                {/* Event Type with Icon */}
                                <div className={`flex items-center text-xs mb-2 ${categoryClass}`}>
                                    <Sparkles className={`w-4 h-4 mr-1 ${categoryIconClass}`} />
                                    {e.leftPanelData.eventType.join(", ")}
                                </div>
                                {/* Details Row */}
                                <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-2 items-center">
                                    <span className="flex items-center">
                                        <Clock className="w-4 h-4 mr-1 text-indigo-400" />
                                        {e.leftPanelData.dayType && e.leftPanelData.timeOfDay
                                            ? `${e.leftPanelData.dayType.charAt(0).toUpperCase() + e.leftPanelData.dayType.slice(1)}, ${e.leftPanelData.timeOfDay.charAt(0).toUpperCase() + e.leftPanelData.timeOfDay.slice(1)}`
                                            : "-"}
                                    </span>
                                    <span className="flex items-center">
                                        <Users className="w-4 h-4 mr-1 text-pink-400" />
                                        {e.leftPanelData.audienceType}
                                    </span>
                                </div>
                                {/* Bottom row: Weather and Footprints */}
                                <div className="flex items-center justify-between mt-4">
                                    <span className="flex items-center">
                                        <CloudSun className="w-6 h-6 mr-2 text-sky-400" />
                                        <span className="text-sm text-sky-700 font-medium">
                                            {weather}
                                        </span>
                                    </span>
                                    <span className="flex items-center">
                                        <Footprints className="w-6 h-6 mr-2 text-green-500" />
                                        <span className="text-sm text-green-700 font-medium">
                                            {e.leftPanelData.views ?? "-"}
                                        </span>
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