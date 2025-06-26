import React, { useState } from "react";
import { Star, Footprints, Calendar as CalendarIcon, ArrowUpDown, MapPin } from "lucide-react";
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

export function EventSidebar({ events, loading, error, selectedEvent, onSelect, onEventsFiltered }) {
    // Default range: first to last day of current month
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    // Use the DateRange type from react-day-picker
    const [selectedRange, setSelectedRange] = useState<DateRange>({ from: firstDay, to: lastDay });
    const [sortBy, setSortBy] = useState("score");
    const [showCalendar, setShowCalendar] = useState(false);
    const calendarRef = React.useRef<HTMLDivElement>(null);

    // Filter events based on selectedRange
    const filteredEvents = selectedRange.from
        ? events.filter(e => {
            const eventDate = new Date(e.leftPanelData.startDate);
            let from = selectedRange.from;
            let to = selectedRange.to;
            // If only from is set or from == to, match only that day (ignore time)
            if (!to || from.getTime() === to.getTime()) {
                return (
                    eventDate.getFullYear() === from.getFullYear() &&
                    eventDate.getMonth() === from.getMonth() &&
                    eventDate.getDate() === from.getDate()
                );
            }
            // For a range, include all days in the range
            return eventDate >= from && eventDate <= to;
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

    // Notify parent about filtered events whenever they change
    React.useEffect(() => {
        if (onEventsFiltered) {
            onEventsFiltered(sortedEvents);
        }
    }, [sortedEvents, onEventsFiltered]);

    // Close calendar when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
                setShowCalendar(false);
            }
        };

        if (showCalendar) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showCalendar]);

    // Helper for improved range selection UX
    function handleRangeSelect(range: DateRange | undefined, day?: Date) {
        if (!range) {
            setSelectedRange({ from: undefined, to: undefined });
            // Clear selected event when range is cleared
            if (onSelect) onSelect(null);
            return;
        }
        // If only from is set and user clicks the same day, treat as single-day selection
        if (range.from && !range.to && day && range.from.getTime() === day.getTime()) {
            setSelectedRange({ from: day, to: day });
            // Clear selected event when range changes
            if (onSelect) onSelect(null);
            return;
        }
        // Otherwise, use the range as provided (normal range selection)
        setSelectedRange(range);
        // Clear selected event when range changes
        if (onSelect) onSelect(null);
    }

    return (
        <div className="text-selection-visible h-full flex flex-col" style={{
            '--selection-bg': '#3b82f6',
            '--selection-color': '#ffffff'
        } as React.CSSProperties}>
            <style>{`
                .text-selection-visible ::selection {
                    background-color: var(--selection-bg);
                    color: var(--selection-color);
                }
                .text-selection-visible ::-moz-selection {
                    background-color: var(--selection-bg);
                    color: var(--selection-color);
                }
            `}</style>

            {/* Fixed Date picker and sort dropdown */}
            <div className="mb-4 flex flex-col gap-3 flex-shrink-0">
                {/* Calendar and Sort - Side by Side */}
                <div className="flex gap-3">
                    {/* Calendar Button */}
                    <div className="flex-1 relative">
                        <button
                            className={"w-full border rounded-md px-3 py-2 text-left font-normal bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 flex items-center gap-2 transition-colors hover:bg-blue-50 hover:border-blue-300" + (selectedRange.from ? "" : " text-muted-foreground")}
                            onClick={() => setShowCalendar((v) => !v)}
                            type="button"
                        >
                            <CalendarIcon className="w-4 h-4 mr-2 text-blue-400" />
                            <span className="truncate">
                                {selectedRange.from && selectedRange.to && selectedRange.from.getTime() === selectedRange.to.getTime() ?
                                    `${selectedRange.from.toLocaleDateString()}` :
                                    selectedRange.from && selectedRange.to ?
                                        `${selectedRange.from.toLocaleDateString()} - ${selectedRange.to.toLocaleDateString()}` :
                                        selectedRange.from ?
                                            `${selectedRange.from.toLocaleDateString()}` :
                                            "Select date range"}
                            </span>
                        </button>
                        {showCalendar && (
                            <div
                                ref={calendarRef}
                                className="absolute left-0 top-full mt-2 z-30 bg-white rounded-md shadow-lg border p-2 flex flex-col items-center"
                            >
                                <Calendar
                                    mode="range"
                                    selected={selectedRange}
                                    onSelect={(range, day) => handleRangeSelect(range, day)}
                                    classNames={{
                                        day_selected: "bg-blue-500 text-white hover:bg-blue-600 focus:bg-blue-600",
                                        day_range_middle: "bg-blue-200 text-blue-900",
                                        day_range_start: "bg-blue-500 text-white rounded-l-full",
                                        day_range_end: "bg-blue-500 text-white rounded-r-full",
                                        day_today: "bg-blue-100 text-blue-700"
                                    }}
                                />
                                <button
                                    className="mt-2 px-3 py-1 rounded-full bg-blue-500 text-white text-sm font-semibold shadow-sm hover:bg-blue-600 focus:bg-blue-700 transition-all duration-150"
                                    onClick={() => {
                                        if (selectedRange.from && !selectedRange.to) {
                                            setSelectedRange({ from: selectedRange.from, to: selectedRange.from });
                                        }
                                        // Clear selected event when "Show Events" is clicked
                                        if (onSelect) onSelect(null);
                                        setShowCalendar(false);
                                    }}
                                >
                                    Close
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Sort Dropdown */}
                    <div className="flex-1">
                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="w-full">
                                <ArrowUpDown className="w-4 h-4 mr-2 text-blue-400" />
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="score">
                                    <div className="flex items-center gap-2">
                                        <Star className="w-4 h-4 text-yellow-500" />
                                        Best Score
                                    </div>
                                </SelectItem>
                                <SelectItem value="views">
                                    <div className="flex items-center gap-2">
                                        <Footprints className="w-4 h-4 text-green-600" />
                                        Most Foot Traffic
                                    </div>
                                </SelectItem>
                                <SelectItem value="start">
                                    <div className="flex items-center gap-2">
                                        <CalendarIcon className="w-4 h-4 text-blue-500" />
                                        Earliest Start
                                    </div>
                                </SelectItem>
                                <SelectItem value="weather">
                                    <div className="flex items-center gap-2">
                                        <span className="text-blue-500">☀️</span>
                                        Best Weather
                                    </div>
                                </SelectItem>
                                <SelectItem value="venue">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-600">📍</span>
                                        Venue Name
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Scrollable content area */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="text-gray-500">Loading events...</div>
                ) : error ? (
                    <div className="text-red-500">Error: {error}</div>
                ) : (
                    <ul className="space-y-6 p-1 pr-3">
                        {/* ...existing code... */}
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
                                    className={`relative bg-white rounded-lg shadow p-6 flex flex-col justify-between cursor-pointer transition-all duration-200 ${isActive ? "ring-2 ring-blue-400 ring-offset-2" : "hover:shadow-md"
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
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-5 h-5 text-gray-600" />
                                            <div className="font-semibold text-lg">{shortVenue(e.leftPanelData.venue)}</div>
                                        </div>
                                    </div>                                    {/* Middle: Event Info and Primary Audience - Side by Side */}
                                    <div className="flex flex-col gap-2 mb-2 mt-1">
                                        {/* Event crowd and Primary audience in one row */}
                                        <div className="flex items-center gap-3 flex-wrap">
                                            {/* Event crowd info */}
                                            {crowdType === "Event crowd" && (
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    {/* Event Category Icon (emoji) */}
                                                    <span style={{ fontSize: "1.2rem" }}>🎉</span>
                                                    <span
                                                        className={`inline-block text-sm font-semibold rounded px-2 py-1 ${crowdBadgeColor}`}
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

                                            {/* Primary audience */}
                                            {e.leftPanelData.audienceType && (
                                                <div className="text-pink-600 flex items-center text-sm flex-shrink-0" title="This event/location is most popular with this audience.">
                                                    <span role="img" aria-label="audience" className="mr-1">👨‍👩‍👧</span>
                                                    <span>Primary: {e.leftPanelData.audienceType}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Bottom: Weather & Foot Traffic */}
                                    <div className="flex items-center justify-between mt-4">
                                        <span className="text-blue-600 flex items-center font-bold">
                                            {weatherIcon}
                                            <span className="text-lg ml-1">
                                                {weatherData.temperature ?? "--"}°C
                                                {weatherData.rain > 0 && (
                                                    <span className="text-blue-500 font-normal text-sm ml-1">
                                                        {weatherData.rain}mm
                                                    </span>
                                                )}
                                            </span>
                                        </span>
                                        <span className="text-green-700 font-bold flex items-center">
                                            <Footprints className="w-5 h-5 mr-1" />
                                            <span className="text-lg">{e.leftPanelData.views}</span>
                                        </span>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}