from enum import Enum
from typing import List, Optional, Tuple, Literal, Dict, Any
from pydantic import BaseModel


class TrafficLevel(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class WeatherType(str, Enum):
    SUNNY = "sunny"
    CLOUDED = "clouded"
    RAINY = "rainy"
    SNOWY = "snowy"


class FootTrafficType(str, Enum):
    PAST = "past"
    CURRENT = "current"
    PREDICTED = "predicted"


class HotspotType(str, Enum):
    NATURAL = "natural"
    EVENT = "event"


class FootTrafficData(BaseModel):
    hour: int
    value: int
    type: FootTrafficType


class Hotspot(BaseModel):
    id: str
    name: str  # Fixed zone name
    label: str  # A, B, C, D based on current traffic
    address: str
    trafficLevel: TrafficLevel
    weather: WeatherType
    coordinates: Tuple[float, float]  # [longitude, latitude]
    population: Optional[str] = None
    areaType: Optional[str] = None
    peakHour: Optional[str] = None
    avgDailyTraffic: Optional[str] = None
    dominantDemographics: Optional[str] = None
    nearbyBusinesses: Optional[str] = None
    footTraffic: Optional[List[FootTrafficData]] = None


class Event(BaseModel):
    id: str
    name: str
    coordinates: Tuple[float, float]  # [longitude, latitude]

    # Original fields (some made optional)
    time: Optional[str] = None
    place: Optional[str] = None
    date: Optional[str] = None
    address: Optional[str] = None
    type: Optional[str] = None
    duration: Optional[str] = None
    capacity: Optional[int] = None
    demographics: Optional[str] = None
    peakTrafficImpact: Optional[str] = None
    ticketStatus: Optional[str] = None

    # New fields from updated model
    location_id: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    event_type: Optional[str] = None
    expected_attendance: Optional[int] = None
    description: Optional[str] = None
    event_id: Optional[str] = None

    footTraffic: Optional[List[FootTrafficData]] = None


class Location(BaseModel):
    id: str
    name: str
    type: HotspotType  # natural-hotspot or event-hotspot
    label: str  # A, B, C, etc. based on traffic
    trafficLevel: TrafficLevel
    weather: WeatherType
    coordinates: Tuple[float, float]  # [longitude, latitude]

    # Common fields for both types
    footTraffic: Optional[List[FootTrafficData]] = None

    # Natural-hotspot specific fields
    population: Optional[str] = None
    areaType: Optional[str] = None
    peakHour: Optional[str] = None
    avgDailyTraffic: Optional[str] = None
    dominantDemographics: Optional[str] = None
    nearbyBusinesses: Optional[str] = None

    # Event-hotspot specific fields
    location_id: Optional[str] = None
    event_name: Optional[str] = None  # Event name, different from location name
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    event_type: Optional[str] = None
    expected_attendance: Optional[int] = None
    description: Optional[str] = None
    event_id: Optional[str] = None  # Reference to the original event
    venue: Optional[str] = None  # Venue name for event-hotspots
    venue_address: Optional[str] = None  # Venue address for event-hotspots
    venue_coordinates: Optional[Tuple[float, float]] = (
        None  # [longitude, latitude] for venue
    )
    event_foot_traffic: Optional[List[FootTrafficData]] = (
        None  # Event-specific foot traffic data
    )


class MapItemType(str, Enum):
    EVENT = "event"
    HOTSPOT = "hotspot"
    BUS = "bus"
    TRAM = "tram"
    BUSINESS = "business"
    PARKING = "parking"
    AVAILABLE = "available"


class MapItem(BaseModel):
    type: MapItemType
    id: str
    coordinates: Tuple[float, float]
    label: Optional[str] = None


class TimelineRange(BaseModel):
    start: int
    end: int


class TrafficStatus(str, Enum):
    AVAILABLE = "available"
    MODERATE = "moderate"
    CONGESTED = "congested"


class TrafficFeatureProperties(BaseModel):
    status: TrafficStatus


class TrafficLineCoordinates(BaseModel):
    type: Literal["LineString"]
    coordinates: List[List[float]]


class TrafficFeature(BaseModel):
    type: Literal["Feature"]
    properties: TrafficFeatureProperties
    geometry: TrafficLineCoordinates


class TrafficData(BaseModel):
    type: Literal["FeatureCollection"]
    features: List[TrafficFeature]


# Business requirement models
class BusinessType(str, Enum):
    STATIC = "Static"
    MOBILE = "Mobile"


class BusinessIntent(str, Enum):
    SETUP = "Setup"
    RESEARCH = "Research"


class BusinessRequirementRequest(BaseModel):
    text: str


class BusinessPreferences(BaseModel):
    business_type: BusinessType
    business: str
    location: str
    intent: BusinessIntent


class BusinessRequirementNotSupported(BaseModel):
    supported: bool = False
    message: str
    input_text: Optional[str] = None


class LocationsResponse(BaseModel):
    locations: List[Location]
    traffic_data: Optional[TrafficData] = None
    traffic_points: Optional[Dict[str, Any]] = None


class LocationResponse(BaseModel):
    location: Location
    traffic_data: Optional[TrafficData] = None
    traffic_points: Optional[Dict[str, Any]] = None
