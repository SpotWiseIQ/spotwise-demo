from enum import Enum
from typing import List, Optional, Tuple, Literal
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


class FootTrafficData(BaseModel):
    hour: int
    value: int
    type: FootTrafficType


class Hotspot(BaseModel):
    id: str
    label: str
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


class Event(BaseModel):
    id: str
    name: str
    time: str
    place: str
    coordinates: Tuple[float, float]  # [longitude, latitude]
    date: str
    address: Optional[str] = None
    type: Optional[str] = None
    duration: Optional[str] = None
    capacity: Optional[int] = None
    demographics: Optional[str] = None
    peakTrafficImpact: Optional[str] = None
    ticketStatus: Optional[str] = None


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
