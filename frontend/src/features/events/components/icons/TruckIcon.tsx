import React from "react";

export function TruckIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg width="36" height="36" viewBox="0 0 32 32" fill="none" {...props}>
            {/* Truck body */}
            <rect x="3" y="12" width="15" height="10" rx="2" fill="#fff" stroke="#F43F5E" strokeWidth="2" />
            {/* Truck cabin */}
            <rect x="18" y="15" width="7" height="7" rx="1.5" fill="#fff" stroke="#F43F5E" strokeWidth="2" />
            {/* Wheels */}
            <circle cx="8" cy="24" r="2" fill="#F43F5E" />
            <circle cx="22" cy="24" r="2" fill="#F43F5E" />
            {/* Motion lines */}
            <line x1="0" y1="18" x2="5" y2="18" stroke="#F43F5E" strokeWidth="2" strokeLinecap="round" />
            <line x1="0" y1="22" x2="5" y2="22" stroke="#F43F5E" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}