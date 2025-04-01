import { Event, Hotspot, MapItem } from "./types";

// Tampere coordinates: 61.4978, 23.7610
export const TAMPERE_CENTER: [number, number] = [23.7610, 61.4978];

export const mockHotspots: Hotspot[] = [
  {
    id: "1",
    label: "A",
    address: "Address 1",
    trafficLevel: "high",
    weather: "sunny",
    coordinates: [23.775, 61.4998],
  },
  {
    id: "2",
    label: "B",
    address: "Address 2",
    trafficLevel: "high",
    weather: "clouded",
    coordinates: [23.745, 61.4990],
  },
  {
    id: "3",
    label: "C",
    address: "Address 3",
    trafficLevel: "medium",
    weather: "clouded",
    coordinates: [23.755, 61.4960],
  },
  {
    id: "4",
    label: "D",
    address: "Address 4",
    trafficLevel: "medium",
    weather: "sunny",
    coordinates: [23.765, 61.4940],
  },
];

export const mockEvents: Event[] = [
  {
    id: "1",
    name: "Event 1",
    time: "15:00",
    place: "Place",
    coordinates: [23.760, 61.4988],
    date: "2025-03-26",
    address: "Hämeenkatu 12",
    type: "concert",
    duration: "2 h",
    capacity: 1000,
    demographics: "18-35",
  },
  {
    id: "2",
    name: "Event 2",
    time: "15:00",
    place: "Place",
    coordinates: [23.772, 61.4975],
    date: "2025-03-26",
  },
  {
    id: "3",
    name: "Event 3",
    time: "15:00",
    place: "Place",
    coordinates: [23.750, 61.4965],
    date: "2025-03-26",
  },
  {
    id: "4",
    name: "Event 4",
    time: "15:00",
    place: "Place",
    coordinates: [23.780, 61.4950],
    date: "2025-03-26",
  },
  {
    id: "5",
    name: "Event 5",
    time: "10:00",
    place: "Place",
    coordinates: [23.765, 61.4940],
    date: "2025-03-27",
  },
  {
    id: "6",
    name: "Event 6",
    time: "15:00",
    place: "Place",
    coordinates: [23.755, 61.4930],
    date: "2025-03-27",
  },
  {
    id: "7",
    name: "Event 7",
    time: "15:00",
    place: "Place",
    coordinates: [23.770, 61.4920],
    date: "2025-01-12",
  },
  {
    id: "8",
    name: "Event 8",
    time: "15:00",
    place: "Place",
    coordinates: [23.750, 61.4910],
    date: "2025-02-01",
  },
];

export const mockMapItems: MapItem[] = [
  { type: "bus", id: "bus1", coordinates: [23.780, 61.4970] },
  { type: "bus", id: "bus2", coordinates: [23.765, 61.4965] },
  { type: "tram", id: "tram1", coordinates: [23.770, 61.4960] },
  { type: "business", id: "business1", coordinates: [23.760, 61.4965] },
  { type: "business", id: "business2", coordinates: [23.768, 61.4968] },
  { type: "business", id: "business3", coordinates: [23.750, 61.4980] },
  { type: "parking", id: "parking1", coordinates: [23.778, 61.4975] },
  { type: "parking", id: "parking2", coordinates: [23.763, 61.4950] },
  { type: "available", id: "available1", coordinates: [23.755, 61.4985] },
  { type: "available", id: "available2", coordinates: [23.775, 61.4960] },
  { type: "available", id: "available3", coordinates: [23.740, 61.4970] },
  { type: "available", id: "available4", coordinates: [23.790, 61.4950] },
];

// Similar events for a specific event
export const getSimilarEvents = (eventId: string): Event[] => {
  const event = mockEvents.find((e) => e.id === eventId);
  if (!event) return [];

  // Filter events that are not the same as the current one
  return mockEvents
    .filter((e) => e.id !== eventId)
    .filter((e) => e.id === "5" || e.id === "6" || e.id === "7" || e.id === "8")
    .sort((a, b) => a.id.localeCompare(b.id))
    .slice(0, 4);
};
