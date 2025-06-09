import React from "react";
import { EventData } from "../types";

export function EventSidebar({ events }: { events: EventData[] }) {
    return (
        <aside style={{ width: 320, borderRight: "1px solid #eee", padding: 16 }}>
            <h2>Events</h2>
            <ul style={{ listStyle: "none", padding: 0 }}>
                {events.map((e, i) => (
                    <li key={i} style={{ marginBottom: 18 }}>
                        <strong>{e.leftPanelData.eventName}</strong>
                        <br />
                        <span>{e.leftPanelData.venue}</span>
                        <br />
                        <span>
                            {new Date(e.leftPanelData.startDate).toLocaleDateString()} -{" "}
                            {new Date(e.leftPanelData.endDate).toLocaleDateString()}
                        </span>
                        <br />
                        <span>Score: {e.leftPanelData.score}</span>
                    </li>
                ))}
            </ul>
        </aside>
    );
}