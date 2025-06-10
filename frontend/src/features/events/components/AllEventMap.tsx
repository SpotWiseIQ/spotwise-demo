import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Create a custom icon instance
const customIcon = new L.Icon({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

export function AllEventsMap({ events }) {
    const eventLocations = events
        .map(e => ({
            lat: e.fullEventData.location?.lat,
            lng: e.fullEventData.location?.lng,
            name: e.leftPanelData.eventName,
            venue: e.leftPanelData.venue,
        }))
        .filter(e => typeof e.lat === "number" && typeof e.lng === "number");

    const center: [number, number] = eventLocations.length
        ? [eventLocations[0].lat as number, eventLocations[0].lng as number]
        : [60.1699, 24.9384];

    return (
        <div className="w-full h-[500px]">
            <MapContainer center={center} zoom={12} style={{ height: "100%", width: "100%" }}>
                <TileLayer
                    attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {eventLocations.map((e, idx) => (
                    <Marker
                        key={idx}
                        position={[e.lat, e.lng] as [number, number]}
                        icon={customIcon}
                    >
                        <Popup>
                            <b>{e.name}</b>
                            <br />
                            {e.venue}
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}