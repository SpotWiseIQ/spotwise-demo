import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Returns a cache key for traffic data in the format 'YYYY-MM-DD-HH'.
 * Always uses UTC noon for the date to avoid timezone issues.
 */
export function getTrafficCacheKey(date: Date, timelineRange: { start: number }) {
  const d = new Date(date);
  d.setUTCHours(12, 0, 0, 0);
  const dateKey = d.toISOString().split('T')[0];
  const sliderHour = Math.round((timelineRange?.start ?? 0) / 100 * 24);
  return `${dateKey}-${sliderHour}`;
}
