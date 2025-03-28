import React from "react";

export function HomeIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" {...props}>
            <defs>
                <linearGradient id="homeGradient" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#3B82F6" /> {/* blue-500 */}
                    <stop offset="1" stopColor="#EC4899" /> {/* pink-500 */}
                </linearGradient>
            </defs>
            <path d="M3 12L12 5l9 7" stroke="url(#homeGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9 21V13h6v8" stroke="url(#homeGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M21 21H3" stroke="url(#homeGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}