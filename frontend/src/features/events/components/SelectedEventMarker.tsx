import { Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const customIcon = new L.Icon({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

export function SelectedEventMarker({ lat, lng, name, venue }) {
    const map = useMap();

    useEffect(() => {
        if (lat && lng) {
            const current = map.getCenter();
            // Only fly if the center is not already at the marker (with a small threshold)
            if (
                Math.abs(current.lat - lat) > 0.0001 ||
                Math.abs(current.lng - lng) > 0.0001
            ) {
                map.flyTo([lat, lng], 15, { duration: 1.2 });
            }
        }
    }, [lat, lng, map]);

    return (
        <Marker
            position={[lat, lng]}
            icon={customIcon}
        >
            <Popup>
                <b>{name}</b>
                <br />
                {venue}
            </Popup>
        </Marker>
    );
}