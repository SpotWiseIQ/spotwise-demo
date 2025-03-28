import { MapContainer, TileLayer } from "react-leaflet";
import { SelectedEventMarker } from "./components/SelectedEventMarker";
import { Calendar, MapPin, Users, Clock, Sparkles, CloudSun, Footprints, Mail, Link, Facebook, Instagram, Twitter } from "lucide-react";
import React, { useState } from "react";
import { scoreCategory, formatDateRange, formatDuration, daysToEvent, shortVenue } from "../util/helper";
import { AllEventsMap } from "./components/AllEventMap";

const SAMPLE_IMAGE = "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80";

export function EventDetails({ event, events }) {
    if (!event) {
        if (!events || events.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center h-full w-full">
                    <div className="mb-4 text-gray-500 text-lg">Loading events...</div>
                </div>
            );
        }
        return (
            <div className="flex flex-col items-center justify-center h-full w-full">
                <div className="mb-4 text-gray-500 text-lg">Select an event to see details</div>
                <AllEventsMap events={events} />
            </div>
        );
    }
    const { leftPanelData, fullEventData } = event;
    const weather = leftPanelData.weather !== "N/A" ? leftPanelData.weather : "Sunny 22°C";

    // Map logic
    const lat = fullEventData.location?.lat;
    const lng = fullEventData.location?.lng;

    // Website link logic
    const website = fullEventData.website || fullEventData.link || fullEventData.url;

    const [descExpanded, setDescExpanded] = useState(false);
    const [showInfoGridMore, setShowInfoGridMore] = useState(false);
    const [showContact, setShowContact] = useState(false);
    const [showMoreInfo, setShowMoreInfo] = useState(false);
    const [showBasicInfo, setShowBasicInfo] = useState(false);

    const MAX_DESC_LENGTH = 400;
    const hasLongDesc = fullEventData?.description && fullEventData.description.length > MAX_DESC_LENGTH;
    const shortDesc = hasLongDesc ? fullEventData.description.slice(0, MAX_DESC_LENGTH) + "..." : fullEventData.description;

    // Social links
    const social = fullEventData.socialLinks || {};

    return (
        <div className="w-full max-w-6xl bg-white rounded-xl shadow-lg mt-8 overflow-hidden flex flex-col">
            {/* Map */}
            {lat && lng && (
                <div className="w-full h-64 md:h-80 overflow-hidden">
                    <MapContainer
                        center={[lat, lng]}
                        zoom={15}
                        style={{ height: "100%", width: "100%" }}
                        scrollWheelZoom={false}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <SelectedEventMarker lat={lat} lng={lng} name={leftPanelData.eventName} venue={leftPanelData.venue} />
                    </MapContainer>
                </div>
            )}
            {/* Details */}
            <div className="p-8 flex flex-col">
                {/* Title */}
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    {/* Venue/Spot Name as Main Title */}
                    <h2 className="text-3xl font-bold text-[#29549a]">{shortVenue(leftPanelData.venue)}</h2>
                    {/* Event Name as Subtitle */}
                    <div className="text-lg text-gray-700 font-medium flex items-center gap-2 flex-wrap">
                        {/* Event Name, truncated if too long */}
                        <span className="truncate max-w-xs" title={leftPanelData.eventName}>
                            {leftPanelData.eventName}
                        </span>
                        {/* Location type in brackets, capitalized */}
                        {fullEventData.locations_type && (
                            <span className="text-sm text-gray-500 whitespace-nowrap">
                                ({fullEventData.locations_type.charAt(0).toUpperCase() + fullEventData.locations_type.slice(1)})
                            </span>
                        )}
                    </div>
                    {/* Days left badge */}
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm font-semibold">
                        {daysToEvent(leftPanelData.startDate)}
                    </span>
                </div>
                {/* Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <span className="flex items-center text-gray-600">
                        <MapPin className="w-5 h-5 mr-1 text-blue-400" />
                        {fullEventData.location && (fullEventData.location.lat && fullEventData.location.lng) ? (
                            <a
                                href={`https://www.google.com/maps/search/?api=1&query=${fullEventData.location.lat},${fullEventData.location.lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline text-blue-700 hover:text-blue-900"
                            >
                                {fullEventData.location.address}
                            </a>
                        ) : (
                            fullEventData.location?.address || leftPanelData.venue
                        )}
                    </span>
                    <span className="flex items-center text-gray-500">
                        <Calendar className="w-5 h-5 mr-1 text-green-400" />
                        {leftPanelData.startDate && leftPanelData.endDate
                            ? `${new Date(leftPanelData.startDate).toLocaleString("en-GB", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })} - ${new Date(leftPanelData.endDate).toLocaleString("en-GB", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}`
                            : "-"}
                        {/* Duration */}
                        {leftPanelData.startDate && leftPanelData.endDate && (
                            <span className="ml-2 text-xs text-gray-400">
                                {leftPanelData.occurrenceCount > 1
                                    ? `(${leftPanelData.occurrenceCount} days)`
                                    : `(${formatDuration(leftPanelData.startDate, leftPanelData.endDate)})`}
                            </span>
                        )}
                    </span>
                    <span className="flex items-center text-orange-600 font-semibold">
                        <Sparkles className="w-5 h-5 mr-2 text-orange-400" />
                        {leftPanelData.eventType.join(", ")}
                    </span>
                    <span className="flex items-center text-gray-500">
                        <Users className="w-5 h-5 mr-1 text-pink-400" />
                        {leftPanelData.audienceType}
                    </span>
                    <span className="flex items-center text-gray-500">
                        <Clock className="w-5 h-5 mr-1 text-indigo-400" />
                        {leftPanelData.dayType && leftPanelData.timeOfDay
                            ? `${leftPanelData.dayType.charAt(0).toUpperCase() + leftPanelData.dayType.slice(1)}, ${leftPanelData.timeOfDay.charAt(0).toUpperCase() + leftPanelData.timeOfDay.slice(1)}`
                            : "-"}
                    </span>
                    <span className="flex items-center text-sky-700">
                        <CloudSun className="w-5 h-5 mr-1 text-sky-400" />
                        {weather}
                    </span>
                    <span className="flex items-center text-green-700">
                        <Footprints className="w-5 h-5 mr-1 text-green-500" />
                        {leftPanelData.views ?? "-"}
                    </span>
                </div>
                {/* Tags or Categories */}
                {fullEventData.tags && fullEventData.tags.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-2">
                        {fullEventData.tags.map((tag, idx) => (
                            <span key={idx} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">{tag}</span>
                        ))}
                    </div>
                )}

                {/* Expandable Sections */}
                {/* Book the spot contact info */}
                <div className="mb-4">
                    <button
                        className="font-semibold text-blue-700 flex items-center gap-2"
                        onClick={() => setShowContact(v => !v)}
                    >
                        📍 Book the Spot – Contact Info
                        <span>{showContact ? "▲" : "▼"}</span>
                    </button>
                    {showContact && (
                        <div className="mt-2 ml-4 space-y-1">
                            <div>
                                Name: {fullEventData.ownerName || "-"}
                            </div>
                            <div>
                                Email: {fullEventData.contactEmail
                                    ? <a href={`mailto:${fullEventData.contactEmail}`} className="underline">{fullEventData.contactEmail}</a>
                                    : "-"}
                            </div>
                            <div>
                                Office: {fullEventData.location?.address || leftPanelData.venue || "-"}
                            </div>
                        </div>
                    )}
                </div>

                {/* More info about the event */}
                <div className="mb-4">
                    <button
                        className="font-semibold text-blue-700 flex items-center gap-2"
                        onClick={() => setShowMoreInfo(v => !v)}
                    >
                        📣 More Info About the Event
                        <span>{showMoreInfo ? "▲" : "▼"}</span>
                    </button>
                    {showMoreInfo && (
                        <div className="mt-2 ml-4 space-y-2">
                            {/* Social and website */}
                            <div className="flex flex-wrap gap-4">
                                {website && (
                                    <span className="flex items-center text-blue-500">
                                        <Link className="w-5 h-5 mr-1" />
                                        <a href={website} target="_blank" rel="noopener noreferrer" className="underline break-all">Website</a>
                                    </span>
                                )}
                                {social.facebook && (
                                    <span className="flex items-center text-blue-700">
                                        <Facebook className="w-5 h-5 mr-1" />
                                        <a href={social.facebook} target="_blank" rel="noopener noreferrer" className="underline">Facebook</a>
                                    </span>
                                )}
                                {social.instagram && (
                                    <span className="flex items-center text-pink-500">
                                        <Instagram className="w-5 h-5 mr-1" />
                                        <a href={social.instagram} target="_blank" rel="noopener noreferrer" className="underline">Instagram</a>
                                    </span>
                                )}
                                {social.twitter && (
                                    <span className="flex items-center text-blue-500">
                                        <Twitter className="w-5 h-5 mr-1" />
                                        <a href={social.twitter} target="_blank" rel="noopener noreferrer" className="underline">Twitter</a>
                                    </span>
                                )}
                            </div>
                            {/* Description */}
                            {fullEventData?.description && (
                                <div>
                                    <div className="font-semibold mb-1 text-gray-700">Description</div>
                                    <div className="text-gray-600 whitespace-pre-line">
                                        {descExpanded || !hasLongDesc ? fullEventData.description : shortDesc}
                                    </div>
                                    {hasLongDesc && (
                                        <button
                                            className="mt-2 text-blue-600 underline text-sm"
                                            onClick={() => setDescExpanded(v => !v)}
                                        >
                                            {descExpanded ? "Show less" : "Show more"}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Extra Details */}
                <div className="text-xs text-gray-400">
                    {fullEventData.ages && fullEventData.ages.length > 0 && (
                        <div>Ages: {fullEventData.ages.join(", ")}</div>
                    )}
                    {typeof fullEventData.availableSpotsNearby === "number" && (
                        <div>Available spots nearby: {fullEventData.availableSpotsNearby}</div>
                    )}
                </div>
            </div>
        </div>
    );
}