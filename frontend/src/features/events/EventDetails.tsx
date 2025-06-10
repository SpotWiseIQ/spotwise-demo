import { Calendar, MapPin, Users, Clock, Sparkles, CloudSun, Footprints, Mail, Link } from "lucide-react";
import React, { useState } from "react";

const SAMPLE_IMAGE = "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80";

export function EventDetails({ event }) {
    if (!event) {
        return (
            <div className="flex items-center justify-center h-full text-gray-400 text-xl">
                Select an event to see details
            </div>
        );
    }
    const { leftPanelData, fullEventData } = event;
    const weather = leftPanelData.weather !== "N/A" ? leftPanelData.weather : "Sunny 22°C";

    // Map logic
    const lat = fullEventData.location?.lat;
    const lng = fullEventData.location?.lng;
    const mapUrl = lat && lng
        ? `https://www.google.com/maps?q=${lat},${lng}&z=15&output=embed`
        : "https://maps.google.com/maps?q=helsinki&t=&z=13&ie=UTF8&iwloc=&output=embed";

    // Website link logic
    const website = fullEventData.website || fullEventData.link || fullEventData.url;

    const [descExpanded, setDescExpanded] = useState(false);
    const MAX_DESC_LENGTH = 400;
    const hasLongDesc = fullEventData?.description && fullEventData.description.length > MAX_DESC_LENGTH;
    const shortDesc = hasLongDesc ? fullEventData.description.slice(0, MAX_DESC_LENGTH) + "..." : fullEventData.description;

    return (
        <div className="w-full bg-white rounded-xl shadow-lg mt-8 overflow-hidden flex flex-col">
            {/* Image */}
            {/* <img
                src={fullEventData.mainImage || SAMPLE_IMAGE}
                alt={leftPanelData.eventName}
                className="w-full h-72 md:h-96 object-cover"
            /> */}

            {/* Map */}
            <div className="w-full h-64 md:h-80 overflow-hidden">
                <iframe
                    title="Event Location"
                    src={mapUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                />
            </div>
            {/* Details */}
            <div className="p-8 flex flex-col">
                {/* Title */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-3xl font-bold text-[#29549a]">{leftPanelData.eventName}</h2>
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
                {/* Contact and Social */}
                <div className="flex flex-wrap gap-4 mb-4">
                    {fullEventData.contactEmail && (
                        <span className="flex items-center text-gray-500">
                            <Mail className="w-5 h-5 mr-1" />
                            <a href={`mailto:${fullEventData.contactEmail}`} className="underline">{fullEventData.contactEmail}</a>
                        </span>
                    )}
                    {website && (
                        <span className="flex items-center text-blue-500">
                            <Link className="w-5 h-5 mr-1" />
                            <a href={website} target="_blank" rel="noopener noreferrer" className="underline break-all">Website</a>
                        </span>
                    )}
                    {fullEventData.socialLinks?.twitter && (
                        <span className="flex items-center text-blue-500">
                            <Link className="w-5 h-5 mr-1" />
                            <a href={fullEventData.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="underline">Twitter</a>
                        </span>
                    )}
                </div>
                {/* Description */}
                {fullEventData?.description && (
                    <div className="mb-4">
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