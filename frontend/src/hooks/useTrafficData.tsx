import { useEffect, useRef, useState } from "react";
import { fetchTrafficData, fetchTrafficPoints } from "@/lib/api";
import { TimelineRange } from "@/lib/types";

interface TrafficDataResult {
  trafficData: any;
  trafficPoints: any;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

function getHourFromTimeline(timelineRange: TimelineRange): number {
  // Convert slider percentage to hour (0-23)
  return Math.floor((timelineRange.start / 100) * 24);
}

export function useTrafficData(
  timelineRange: TimelineRange,
  forceRefetch: boolean = false
): TrafficDataResult {
  const [trafficData, setTrafficData] = useState<any>(null);
  const [trafficPoints, setTrafficPoints] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Track last fetched hour
  const lastFetchedHourRef = useRef<number | null>(null);
  // Track last system hour
  const lastSystemHourRef = useRef<number>(new Date().getHours());

  // Helper to fetch and cache
  const fetchAndCache = async (hour: number) => {
    setLoading(true);
    setError(null);
    try {
      const [traffic, points] = await Promise.all([
        fetchTrafficData(),
        fetchTrafficPoints(),
      ]);
      setTrafficData(traffic);
      setTrafficPoints(points);
      lastFetchedHourRef.current = hour;
    } catch (err: any) {
      setError(err.message || "Failed to fetch traffic data");
    } finally {
      setLoading(false);
    }
  };

  // Manual refetch function
  const refetch = () => {
    const hour = getHourFromTimeline(timelineRange);
    fetchAndCache(hour);
  };

  // Effect: fetch on first load, slider hour change, or forceRefetch
  useEffect(() => {
    const sliderHour = getHourFromTimeline(timelineRange);
    if (
      lastFetchedHourRef.current === null ||
      lastFetchedHourRef.current !== sliderHour ||
      forceRefetch
    ) {
      fetchAndCache(sliderHour);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timelineRange, forceRefetch]);

  // Effect: poll system hour and refetch if it changes
  useEffect(() => {
    const interval = setInterval(() => {
      const currentHour = new Date().getHours();
      if (lastSystemHourRef.current !== currentHour) {
        lastSystemHourRef.current = currentHour;
        // Only refetch if slider is on the current hour
        const sliderHour = getHourFromTimeline(timelineRange);
        if (sliderHour === currentHour) {
          fetchAndCache(currentHour);
        }
      }
    }, 60000); // check every minute
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timelineRange]);

  return { trafficData, trafficPoints, loading, error, refetch };
} 