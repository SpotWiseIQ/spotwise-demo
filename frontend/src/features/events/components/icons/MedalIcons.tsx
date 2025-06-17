import React from "react";

export const GoldMedal = ({ size = 32 }) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="12" fill="url(#gold-gradient)" stroke="#FFD700" strokeWidth="2" />
        <defs>
            <radialGradient id="gold-gradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FFF9C4" />
                <stop offset="60%" stopColor="#FFD700" />
                <stop offset="100%" stopColor="#B8860B" />
            </radialGradient>
        </defs>
    </svg>
);

export const SilverMedal = ({ size = 32 }) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="12" fill="url(#silver-gradient)" stroke="#C0C0C0" strokeWidth="2" />
        <defs>
            <radialGradient id="silver-gradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#F8F8FF" />
                <stop offset="60%" stopColor="#C0C0C0" />
                <stop offset="100%" stopColor="#888" />
            </radialGradient>
        </defs>
    </svg>
);

export const BronzeMedal = ({ size = 32 }) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="12" fill="url(#bronze-gradient)" stroke="#cd7f32" strokeWidth="2" />
        <defs>
            <radialGradient id="bronze-gradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FFE4B5" />
                <stop offset="60%" stopColor="#cd7f32" />
                <stop offset="100%" stopColor="#8B4513" />
            </radialGradient>
        </defs>
    </svg>
);