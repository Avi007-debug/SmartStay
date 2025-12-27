import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Car, Bike, PersonStanding, Train, Loader2 } from "lucide-react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

interface TravelTimeEstimatorProps {
  pgLocation?: string;
  pgCoordinates?: { lat: number; lng: number };
  className?: string;
}

interface TravelMode {
  mode: string;
  duration: number;
  distance: number;
}

export const TravelTimeEstimator = ({
  pgLocation = "Kamla Nagar, Delhi",
  pgCoordinates,
  className,
}: TravelTimeEstimatorProps) => {
  const [destination, setDestination] = useState("");
  const [loading, setLoading] = useState(false);
  const [travelModes, setTravelModes] = useState<TravelMode[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleEstimate = async () => {
    if (!destination.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // For demo, using estimated data
      // In production, this would call backend API with OpenRouteService
      const response = await fetch(`${BACKEND_URL}/api/ai/travel-time`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: pgCoordinates || { lat: 28.6139, lng: 77.2090 },
          to: destination,
          modes: ['foot-walking', 'cycling-regular', 'driving-car']
        }),
      });

      if (!response.ok) {
        // Fallback to estimated data if backend fails
        setTravelModes([
          { mode: "walking", duration: 15, distance: 1200 },
          { mode: "cycling", duration: 8, distance: 1500 },
          { mode: "driving", duration: 12, distance: 2100 },
        ]);
      } else {
        const data = await response.json();
        setTravelModes(data.modes || []);
      }
    } catch (err) {
      console.error('Travel time estimation error:', err);
      // Use fallback data
      setTravelModes([
        { mode: "walking", duration: 15, distance: 1200 },
        { mode: "cycling", duration: 8, distance: 1500 },
        { mode: "driving", duration: 12, distance: 2100 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getModeIcon = (mode: string) => {
    if (mode.includes('walk')) return PersonStanding;
    if (mode.includes('cycl')) return Bike;
    if (mode.includes('driv')) return Car;
    return Train;
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5 text-primary" />
          Travel Time Estimator
          <Badge variant="secondary" className="ml-auto text-xs">OpenRouteService</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>From: {pgLocation}</span>
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Enter your college or destination"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleEstimate()}
            className="flex-1"
            disabled={loading}
          />
          <Button onClick={handleEstimate} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Estimate'}
          </Button>
        </div>

        {travelModes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            {travelModes.map((mode, index) => {
              const Icon = getModeIcon(mode.mode);
              return (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-secondary rounded-lg"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm capitalize">{mode.mode}</p>
                    <p className="text-xs text-muted-foreground">{mode.duration} min</p>
                    <p className="text-xs text-muted-foreground">{(mode.distance / 1000).toFixed(1)} km</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {travelModes.length === 0 && !loading && (
          <p className="text-xs text-muted-foreground text-center py-4">
            Enter a destination to see estimated travel times
          </p>
        )}

        {error && (
          <p className="text-xs text-destructive text-center py-2">{error}</p>
        )}
      </CardContent>
    </Card>
  );
};
