import { GoldMedal, SilverMedal, BronzeMedal } from "../../features/events/components/icons/MedalIcons";

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


// Medal-style mapping with emoji
function scoreCategory(score) {
    if (score >= 150) {
        return { icon: <GoldMedal size={32} /> };
    } else if (score >= 100) {
        return { icon: <SilverMedal size={32} /> };
    } else if (score >= 70) {
        return { icon: <BronzeMedal size={32} /> };
    } else {
        return { icon: null };
    }
}

export {
    formatDuration,
    daysToEvent,
    formatDateRange,
    shortVenue,
    scoreCategory
};