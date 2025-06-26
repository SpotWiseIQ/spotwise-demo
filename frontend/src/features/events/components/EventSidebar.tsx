import React, { useState } from "react";
import { Star, Footprints, Calendar as CalendarIcon } from "lucide-react";
import { scoreCategory, shortVenue, formatDuration, getWeatherIcon } from "../../util/helper";
import { Calendar } from "@/components/ui/calendar";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem
} from "@/components/ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { DateRange } from "react-day-picker";

export function EventSidebar({ events, loading, error, selectedEvent, onSelect }) {
    // Default range: first to last day of current month
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    // Use the DateRange type from react-day-picker
    const [selectedRange, setSelectedRange] = useState<DateRange>({ from: firstDay, to: lastDay });
    const [sortBy, setSortBy] = useState("score");
    const [showCalendar, setShowCalendar] = useState(false);

    // Filter events based on selectedRange
    const filteredEvents = selectedRange.from
        ? events.filter(e => {
            const eventDate = new Date(e.leftPanelData.startDate);
            if (selectedRange.to) {
                return eventDate >= selectedRange.from && eventDate <= selectedRange.to;
            }
            return eventDate >= selectedRange.from;
        })
        : events;

    // Sorting logic
    const sortedEvents = [...filteredEvents].sort((a, b) => {
        if (sortBy === "score") return b.leftPanelData.score - a.leftPanelData.score;
        if (sortBy === "views") return b.leftPanelData.views - a.leftPanelData.views;
        if (sortBy === "start") return new Date(a.leftPanelData.startDate).getTime() - new Date(b.leftPanelData.startDate).getTime();
        if (sortBy === "weather") return (a.leftPanelData.weather?.rain ?? 0) - (b.leftPanelData.weather?.rain ?? 0);
        if (sortBy === "venue") return a.leftPanelData.venue.localeCompare(b.leftPanelData.venue);
        return 0;
    });

    // Helper for improved range selection UX
    function handleRangeSelect(range: DateRange | undefined, day?: Date) {
        if (!range) {
            setSelectedRange({ from: undefined, to: undefined });
            return;
        }
        // If both from and to are set, and user clicks a new day, start a new range from that day
        if (range.from && range.to && day && (day < range.from || day > range.to)) {
            setSelectedRange({ from: day, to: undefined });
        } else {
            setSelectedRange(range);
        }
    }

    return (
        <>
            {/* Date picker and sort dropdown */}
            <div className="mb-4 flex flex-col gap-2">
                <div className="flex items-center gap-2 relative">
                    <button
                        className={"w-56 border rounded-md px-3 py-2 text-left font-normal bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 flex items-center gap-2 transition-colors hover:bg-blue-50 hover:border-blue-300" + (selectedRange.from ? "" : " text-muted-foreground")}
                        onClick={() => setShowCalendar((v) => !v)}
                        type="button"
                    >
                        <CalendarIcon className="w-4 h-4 mr-2 text-blue-400" />
                        {selectedRange.from && selectedRange.to
                            ? `${selectedRange.from.toLocaleDateString()} - ${selectedRange.to.toLocaleDateString()}`
                            : selectedRange.from
                                ? `${selectedRange.from.toLocaleDateString()} - ...`
                                : "Select date range"}
                    </button>
                    {showCalendar && (
                        <div className="absolute left-0 top-full mt-2 z-30 bg-white rounded-md shadow-lg border p-2 flex flex-col items-center">
                            <Calendar
                                mode="range"
                                selected={selectedRange}
                                onSelect={(range, day) => handleRangeSelect(range, day)}
                                className="rounded-md border"
                                classNames={{
                                    day_selected: "bg-blue-500 text-white hover:bg-blue-600 focus:bg-blue-600",
                                    day_range_middle: "bg-blue-200 text-blue-900",
                                    day_range_start: "bg-blue-500 text-white rounded-l-full",
                                    day_range_end: "bg-blue-500 text-white rounded-r-full",
                                    day_today: "bg-blue-100 text-blue-700"
                                }}
                            />
                            <button
                                className="mt-2 px-4 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
                                onClick={() => setShowCalendar(false)}
                            >
                                Done
                            </button>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <span className="font-semibold">Sort by:</span>
                    <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-44">
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="score">Best Score</SelectItem>
                            <SelectItem value="views">Most Foot Traffic</SelectItem>
                            <SelectItem value="start">Earliest Start</SelectItem>
                            <SelectItem value="weather">Best Weather</SelectItem>
                            <SelectItem value="venue">Venue Name</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {loading ? (
                <div className="text-gray-500">Loading events...</div>
            ) : error ? (
                <div className="text-red-500">Error: {error}</div>
            ) : (
                <ul className="space-y-6">
                    {sortedEvents.map((e, i) => {
                        const isActive =
                            selectedEvent &&
                            selectedEvent.leftPanelData.eventName === e.leftPanelData.eventName &&
                            selectedEvent.leftPanelData.venue === e.leftPanelData.venue;

                        // Weather display logic
                        const scoreCat = scoreCategory(e.leftPanelData.score);
                        const weatherData = e.leftPanelData.weather && e.leftPanelData.weather !== "N/A"
                            ? e.leftPanelData.weather
                            : { condition: "Sunny", temperature: 22, rain: 0 };

                        const weatherIcon = getWeatherIcon(weatherData.condition, weatherData.rain);
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
                                    <span className="text-blue-600 flex items-center font-semibold">
                                        {weatherIcon}
                                        <span>
                                            {weatherData.temperature ?? "--"}°C
                                            {weatherData.rain > 0 && (
                                                <span className="text-blue-500 font-normal">
                                                    , {weatherData.rain}mm
                                                </span>
                                            )}
                                        </span>
                                    </span>
                                    <span className="text-green-700 font-semibold flex items-center">
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