import { Calendar, MapPin, Users, Clock, Sparkles, Star, CloudSun, Footprints, Mail, Link } from "lucide-react";

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
    const score =
        leftPanelData.score >= 150
            ? { label: "Top", color: "bg-purple-100 text-purple-700" }
            : leftPanelData.score >= 100
                ? { label: "High", color: "bg-green-100 text-green-700" }
                : leftPanelData.score >= 70
                    ? { label: "Medium", color: "bg-yellow-100 text-yellow-700" }
                    : { label: "Low", color: "bg-red-100 text-red-700" };

    return (
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-0 mt-8 overflow-hidden">
            {/* Banner Image */}
            {fullEventData.mainImage && (
                <img src={fullEventData.mainImage} alt={leftPanelData.eventName} className="w-full h-64 object-cover" />
            )}
            <div className="p-8">
                {/* Title and Score */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-3xl font-bold text-[#29549a]">{leftPanelData.eventName}</h2>
                    <span className={`flex items-center px-3 py-1 rounded ${score.color} text-base`}>
                        <Star className="w-5 h-5 mr-2" />
                        <b>{score.label}</b>
                    </span>
                </div>
                {/* Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <span className="flex items-center text-gray-600">
                        <MapPin className="w-5 h-5 mr-1 text-blue-400" />
                        {leftPanelData.venue}
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
                {/* Contact and Social */}
                <div className="flex flex-wrap gap-4 mb-4">
                    {fullEventData.contactEmail && (
                        <span className="flex items-center text-gray-500">
                            <Mail className="w-5 h-5 mr-1" />
                            <a href={`mailto:${fullEventData.contactEmail}`} className="underline">{fullEventData.contactEmail}</a>
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
                        <div className="text-gray-600">{fullEventData.description}</div>
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