import { Footprints, CloudSun } from "lucide-react";

export function EventDetailsKeyInfoCard({
    primaryAudience,
    demographics = [],
    footTraffic,
    weather,
    highlights = [],
}) {
    // Filter out "Family" from groups if it's already shown as Audience Type
    const filteredGroups = demographics.filter(
        (d) => !(primaryAudience && d.toLowerCase() === primaryAudience.toLowerCase())
    );

    // If "Family" was the only group and is filtered out, show a default value
    const showDefaultGroup =
        demographics.length === 1 &&
        demographics[0].toLowerCase() === "family" &&
        filteredGroups.length === 0;

    return (
        <div className="p-4 bg-white rounded-lg shadow max-w-4xl w-full">
            {/* First row: Audience Type, Estimated Visitors, Weather */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* Audience Type */}
                <div className="bg-gray-50 rounded-lg p-3 flex flex-col items-start h-full">
                    <div className="font-semibold mb-1">Audience Type</div>
                    {primaryAudience ? (
                        <span className="bg-pink-50 rounded px-2 py-1 text-pink-700 font-semibold">
                            {primaryAudience}
                        </span>
                    ) : (
                        <span className="text-gray-400">-</span>
                    )}
                </div>
                {/* Estimated Visitors */}
                <div className="bg-gray-50 rounded-lg p-3 flex flex-col items-start h-full">
                    <div className="font-semibold mb-1">Estimated Visitors</div>
                    <div className="flex items-center text-green-700 font-semibold">
                        <Footprints className="w-4 h-4 mr-1" />
                        {footTraffic}
                    </div>
                </div>
                {/* Weather */}
                <div className="bg-gray-50 rounded-lg p-3 flex flex-col items-start h-full">
                    <div className="font-semibold mb-1">Weather</div>
                    <div className="flex items-center text-blue-700 font-semibold">
                        <CloudSun className="w-4 h-4 mr-1" />
                        {weather}
                    </div>
                </div>
            </div>
            {/* Second row: Audience Groups and Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Audience Groups */}
                <div className="bg-gray-50 rounded-lg p-3 flex flex-col items-start h-full">
                    <div className="font-semibold mb-1">Audience Groups</div>
                    <div className="flex flex-wrap gap-2">
                        {filteredGroups.length > 0 ? (
                            filteredGroups.map((d, i) => (
                                <span key={i} className="bg-green-50 rounded px-2 py-1 text-green-700 font-semibold">
                                    {d}
                                </span>
                            ))
                        ) : showDefaultGroup ? (
                            <span className="text-gray-400">No additional groups</span>
                        ) : (
                            <span className="text-gray-400">-</span>
                        )}
                    </div>
                </div>
                {/* Highlights */}
                <div className="bg-gray-50 rounded-lg p-3 flex flex-col items-start h-full">
                    <div className="font-semibold mb-1">Highlights</div>
                    <div className="flex flex-wrap gap-2">
                        {highlights.length > 0 ? highlights.map((h, i) => (
                            <span key={i} className="bg-gray-200 rounded px-2 py-1 text-gray-700 font-semibold">
                                {h}
                            </span>
                        )) : <span className="text-gray-400">-</span>}
                    </div>
                </div>
            </div>
        </div>
    );
}