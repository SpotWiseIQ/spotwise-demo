import React, { useState } from "react";
import { CloudSun, Footprints, Calendar, MapPin, Link, Facebook, Instagram, Twitter } from "lucide-react";
import { MapContainer, TileLayer } from "react-leaflet";
import { SelectedEventMarker } from "./components/SelectedEventMarker";
import { shortVenue, daysToEvent } from "../util/helper";
import { AllEventsMap } from "./components/AllEventMap";
import { EventDetailsKeyInfoCard } from "./components/EventDetailsKeyInfoCard";

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

    // Helper functions
    const formatDate = (dateStr) =>
        dateStr ? new Date(dateStr).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "N/A";

    const formatDuration = (start, end) => {
        if (!start || !end) return "N/A";
        const ms = new Date(end).getTime() - new Date(start).getTime();
        const h = Math.floor(ms / 1000 / 60 / 60);
        if (h < 24) return `${h}h`;
        const d = Math.round(h / 24);
        return `${d} days`;
    };

    // Data extraction with fallbacks
    const { leftPanelData, fullEventData } = event;
    const weather = leftPanelData.weather !== "N/A" ? leftPanelData.weather : "Sunny 22°C";
    const name = leftPanelData?.eventName || fullEventData?.eventName || "Event";
    const venue = leftPanelData?.venue || fullEventData?.venue || "";
    const mapLink = fullEventData?.venue_url || "#";
    const category = fullEventData?.globalContentCategories?.[0] || "";
    const locationType = fullEventData?.locations_type
        ? fullEventData.locations_type.charAt(0).toUpperCase() + fullEventData.locations_type.slice(1)
        : "";
    const numOfDaysToEvent = daysToEvent(leftPanelData.startDate) || "ongoing";
    const startDate = leftPanelData?.startDate || fullEventData?.startDate;
    const endDate = leftPanelData?.endDate || fullEventData?.endDate;
    const duration = formatDuration(startDate, endDate);
    const bestTime = fullEventData?.timeOfDay || "";
    const dayType = fullEventData?.dayType || "";
    const footTraffic = leftPanelData?.views || fullEventData?.views || "N/A";
    const primaryAudience = leftPanelData?.audienceType || fullEventData?.audienceType || "";
    const demographics = fullEventData?.demographics || [];
    const labels = fullEventData?.labels || [];
    const description = fullEventData?.description || "";
    const contactName = fullEventData?.contactName || "";
    const contactEmail = fullEventData?.contactEmail || "";
    const officeAddress = fullEventData?.officeAddress || "";
    const bookingLink = fullEventData?.bookingLink || "#";
    const availableSpots = fullEventData?.availableSpotsNearby ?? null;
    const lat = fullEventData?.location?.lat || fullEventData?.latitude;
    const lng = fullEventData?.location?.lng || fullEventData?.longitude;
    const address = fullEventData?.location?.address || venue;
    const website = fullEventData?.website || fullEventData?.link || fullEventData?.url;
    const social = fullEventData?.socialLinks || {};
    const ages = fullEventData?.ages || [];
    const occurrenceCount = leftPanelData?.occurrenceCount;

    // Description expand/collapse
    const [descExpanded, setDescExpanded] = useState(false);
    const [showContact, setShowContact] = useState(false);
    const [showMoreInfo, setShowMoreInfo] = useState(false);

    const MAX_DESC_LENGTH = 400;
    const hasLongDesc = description && description.length > MAX_DESC_LENGTH;
    const shortDesc = hasLongDesc ? description.slice(0, MAX_DESC_LENGTH) + "..." : description;

    return (
        <div className="p-6 bg-white rounded-lg shadow w-full max-w-6xl mx-auto overflow-hidden flex flex-col">
            {/* Map Section */}
            {lat && lng && (
                <div className="w-full h-64 md:h-80 overflow-hidden mb-4 rounded-lg">
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
                        <SelectedEventMarker lat={lat} lng={lng} name={name} venue={venue} />
                    </MapContainer>
                </div>
            )}

            {/* Top Section */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold">{name}</h1>
                <div className="flex flex-wrap items-center gap-3 mt-2">
                    {category && (
                        <span className="flex items-center px-3 py-1 rounded bg-orange-200 text-orange-900 text-sm font-bold">
                            <Calendar className="w-5 h-5 mr-1" />
                            {category}
                        </span>
                    )}
                    {locationType && (
                        <span className="px-3 py-1 rounded bg-blue-200 text-blue-900 text-sm font-bold">
                            {locationType}
                        </span>
                    )}
                    {numOfDaysToEvent && (
                        <span className="px-2 py-1 rounded bg-gray-100 text-gray-700 text-sm font-semibold capitalize">
                            {numOfDaysToEvent}
                        </span>
                    )}
                    {venue && (
                        <span className="flex items-center px-2 py-1 rounded bg-gray-100 text-gray-700 text-sm">
                            <MapPin className="w-4 h-4 mr-1" />
                            {shortVenue(venue)}
                        </span>
                    )}
                </div>
            </div>

            {/* Date & Time */}
            <div className="mb-6">
                <div className="flex items-center gap-3">
                    <span className="text-base">
                        <Calendar className="inline w-4 h-4 mr-2" />
                        {formatDate(startDate)} – {formatDate(endDate)}
                    </span>
                    <span className="ml-2 px-2 py-1 rounded bg-gray-100 text-gray-700 font-semibold">
                        {/* Use occurrenceCount constant here */}
                        {occurrenceCount > 1
                            ? `${occurrenceCount} days`
                            : `${duration}`}
                    </span>
                    {(dayType || bestTime) && (
                        <span className="ml-2 px-2 py-1 rounded bg-purple-100 text-purple-700 font-semibold">
                            {[dayType, bestTime].filter(Boolean).join(", ")}
                        </span>
                    )}
                </div>
            </div>

            <EventDetailsKeyInfoCard
                primaryAudience={primaryAudience}
                demographics={demographics}
                footTraffic={footTraffic}
                weather={weather}
                highlights={labels}
            />

            {/* Audience & Demographics
            <div className="mb-6">
                <div className="text-gray-700 mb-1 font-semibold text-sm">Audience Type & Groups:</div>
                <div className="ml-4 flex items-center gap-3">
                    {primaryAudience && (
                        <span className="flex items-center px-2 py-1 rounded bg-pink-100 text-pink-700 font-semibold">
                            <span role="img" aria-label="audience" className="mr-1">👨‍👩‍👧</span>
                            {primaryAudience}
                        </span>
                    )}
                    {demographics.length > 0 && demographics.map((d, i) => (
                        <span key={i} className="px-2 py-1 rounded bg-green-100 text-green-700 font-semibold">
                            {d}
                        </span>
                    ))}
                </div>
            </div> */}

            {/* Foot Traffic & Weather */}
            {/* <div className="mb-6">
                <div className="text-gray-700 mb-1 font-semibold text-sm">Estimated Visitors & Weather:</div>
                <div className="ml-4 flex items-center gap-4">
                    <span className="flex items-center text-green-700 font-semibold text-base">
                        <Footprints className="w-5 h-5 mr-1" />
                        {footTraffic}
                    </span>
                    <span className="flex items-center text-blue-600 font-semibold text-base">
                        <CloudSun className="w-5 h-5 mr-1" />
                        {weather}
                    </span>
                </div>
            </div> */}

            {/* Tags/Labels */}
            {/* {labels.length > 0 && (
                <div className="mb-6">
                    <div className="text-gray-700 mb-1 font-semibold text-sm">Highlights:</div>
                    <div className="ml-4 flex flex-wrap gap-2">
                        {labels.map((l, i) => (
                            <span key={i} className="px-2 py-1 rounded bg-gray-200 text-gray-700 font-semibold">
                                {l}
                            </span>
                        ))}
                    </div>
                </div>
            )} */}

            {/* Expandable Sections */}
            {/* Book the spot contact info */}
            <div className="mt-6 mb-6">
                <button
                    className="font-semibold text-blue-700 flex items-center gap-2"
                    onClick={() => setShowContact(v => !v)}
                >
                    📍 Book This Spot & Contact Info
                    <span>{showContact ? "▲" : "▼"}</span>
                </button>
                {showContact && (
                    <div className="mt-2 ml-4 space-y-1 text-base text-gray-800">
                        <div>
                            <span className="font-semibold">Name:</span> {contactName || "-"}
                        </div>
                        <div>
                            <span className="font-semibold">Email:</span> {contactEmail
                                ? <a href={`mailto:${contactEmail}`} className="underline">{contactEmail}</a>
                                : "-"}
                        </div>
                        <div>
                            <span className="font-semibold">Office:</span> {officeAddress || address || "-"}
                        </div>
                        {bookingLink && bookingLink !== "#" && (
                            <div>
                                <a href={bookingLink} className="inline-block mt-2 px-4 py-2 bg-blue-600 text-white rounded font-semibold" target="_blank" rel="noopener noreferrer">
                                    Book the Spot
                                </a>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* More info about the event */}
            <div className="mb-6">
                <button
                    className="font-semibold text-blue-700 flex items-center gap-2"
                    onClick={() => setShowMoreInfo(v => !v)}
                >
                    📣 More About This Event
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
                        {description && (
                            <div>
                                <div className="font-semibold mb-1 text-gray-700">Description</div>
                                <p className="text-base text-gray-800 leading-relaxed whitespace-pre-line">
                                    {descExpanded || !hasLongDesc ? description : shortDesc}
                                </p>
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
            <div className="mb-6 text-sm text-gray-500">
                {ages && ages.length > 0 && (
                    <div>Ages: {ages.join(", ")}</div>
                )}
                {typeof availableSpots === "number" && (
                    <div>Available spots nearby: {availableSpots}</div>
                )}
            </div>
        </div>
    );
}