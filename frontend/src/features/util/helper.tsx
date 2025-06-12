
function formatDuration(start: string, end: string) {
    const s = new Date(start);
    const e = new Date(end);
    let diffMs = e.getTime() - s.getTime();

    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffYears >= 1) {
        return `${diffYears} year${diffYears !== 1 ? "s" : ""}`;
    } else if (diffMonths >= 1) {
        return `${diffMonths} month${diffMonths !== 1 ? "s" : ""}`;
    } else if (diffDays >= 1) {
        return `${diffDays} day${diffDays !== 1 ? "s" : ""}`;
    } else if (diffHrs >= 1) {
        const mins = diffMins % 60;
        return `${diffHrs}h${mins > 0 ? ` ${mins}m` : ""}`;
    } else {
        return `${diffMins}m`;
    }
}

// Helper to calculate days to event
function daysToEvent(start: string) {
    const now = new Date();
    const s = new Date(start);
    const diffDays = Math.ceil((s.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 ? `${diffDays} day${diffDays !== 1 ? "s" : ""} left` : "ongoing";
}

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

// function isOutdoorEvent(event) {
//     const outdoorKeywords = [
//         "park", "outdoor", "puisto", "square", "stage", "field", "stadium", "beach", "garden", "market", "aukio", "piha", "rant"
//     ];
//     const indoorKeywords = [
//         "museum", "hall", "house", "kirjasto", "library", "center", "keskus", "palatsi", "indoor", "sali", "teatteri", "theatre"
//     ];

//     // 1. Check address/venue
//     const address = (event.fullEventData?.location?.address ||
//         event.leftPanelData?.venue ||
//         event.locations?.[0]?.address ||
//         "").toLowerCase();

//     const isOutdoor = outdoorKeywords.some(word => address.includes(word));
//     const isIndoor = indoorKeywords.some(word => address.includes(word));

//     // 2. Check description
//     const desc = (event.fullEventData?.description || event.description || "").toLowerCase();
//     const descOutdoor = outdoorKeywords.some(word => desc.includes(word));
//     const descIndoor = indoorKeywords.some(word => desc.includes(word));

//     // 3. Check event type/category
//     const categories = event.leftPanelData?.eventType || event.fullEventData?.globalContentCategories || [];
//     const catOutdoor = Array.isArray(categories) && categories.some(cat =>
//         ["festival", "market", "parade", "outdoor", "fair", "excursion", "guided tour"].some(word => (cat || "").toLowerCase().includes(word))
//     );
//     const catIndoor = Array.isArray(categories) && categories.some(cat =>
//         ["theatre", "exhibition", "museum", "indoor", "concert", "gig"].some(word => (cat || "").toLowerCase().includes(word))
//     );

//     // Decision logic
//     if ((isOutdoor || descOutdoor || catOutdoor) && (isIndoor || descIndoor || catIndoor)) {
//         return "mixed";
//     }
//     if (isOutdoor || descOutdoor || catOutdoor) {
//         return "outdoor";
//     }
//     if (isIndoor || descIndoor || catIndoor) {
//         return "indoor";
//     }
//     return "unknown";
// }

export {
    formatDuration,
    daysToEvent,
    formatDateRange,
    shortVenue,
    scoreCategory
};