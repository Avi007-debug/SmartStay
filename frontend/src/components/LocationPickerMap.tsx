import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, Crosshair, Check, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

// Fix standard Leaflet pin icon asset paths in Vite
const customIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface LocationPickerProps {
  latitude?: number | null;
  longitude?: number | null;
  onChange: (lat: number, lng: number) => void;
  defaultCenter?: [number, number];
}

// Inner helper to handle clicks on the map
function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Inner helper to fly the camera when coordinates change
function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 15, { duration: 1.2 });
  }, [lat, lng, map]);
  return null;
}

export const LocationPickerMap: React.FC<LocationPickerProps> = ({
  latitude,
  longitude,
  onChange,
  defaultCenter = [12.9240, 77.4982], // Default around RVCE / Bangalore
}) => {
  const [gpsLoading, setGpsLoading] = useState(false);
  const currentLat = latitude || defaultCenter[0];
  const currentLng = longitude || defaultCenter[1];
  const hasSelected = !!(latitude && longitude);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "GPS Not Supported",
        description: "Your browser does not support geolocation.",
        variant: "destructive",
      });
      return;
    }

    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsLoading(false);
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        onChange(lat, lng);
        toast({
          title: "Location Detected! 📍",
          description: `Pinned at ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        });
      },
      (error) => {
        setGpsLoading(false);
        console.error("GPS Error:", error);
        toast({
          title: "GPS Error",
          description: "Could not access location. Please click on the map directly.",
          variant: "destructive",
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Property Map Location</span>
          {hasSelected && (
            <Badge variant="secondary" className="bg-success/15 text-success border-success/30 gap-1 text-xs">
              <Check className="h-3 w-3" />
              {latitude?.toFixed(4)}, {longitude?.toFixed(4)}
            </Badge>
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleGetCurrentLocation}
          disabled={gpsLoading}
          className="gap-2 border-primary/40 text-primary hover:bg-primary/10 h-8"
        >
          {gpsLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Navigation className="h-3.5 w-3.5" />}
          Use My Current GPS Location
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Click anywhere on the map or use your device GPS to place an accurate pin for students.
      </p>

      {/* Leaflet Map Card */}
      <div className="relative w-full h-64 rounded-xl overflow-hidden border-2 border-border shadow-inner z-0">
        <MapContainer
          center={[currentLat, currentLng]}
          zoom={14}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onLocationSelect={onChange} />
          {hasSelected && (
            <>
              <Marker position={[currentLat, currentLng]} icon={customIcon} />
              <RecenterMap lat={currentLat} lng={currentLng} />
            </>
          )}
        </MapContainer>

        {/* Overlay helper instruction */}
        <div className="absolute bottom-2 left-2 z-[400] bg-background/85 backdrop-blur-sm border px-2.5 py-1 rounded-md text-[11px] shadow-sm flex items-center gap-1.5 text-muted-foreground">
          <Crosshair className="h-3 w-3 text-primary" />
          Click on map to reposition pin
        </div>
      </div>
    </div>
  );
};

