import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Car, Bike, PersonStanding, Train } from "lucide-react";

interface TravelTimeEstimatorProps {
  pgLocation?: string;
  className?: string;
}

export const TravelTimeEstimator = ({
  pgLocation = "Kamla Nagar, Delhi",
  className,
}: TravelTimeEstimatorProps) => {
  const [destination, setDestination] = useState("");
  const [showResults, setShowResults] = useState(false);

  const travelModes = [
    { icon: PersonStanding, label: "Walk", time: "15 min", distance: "1.2 km" },
    { icon: Bike, label: "Bike", time: "8 min", distance: "1.5 km" },
    { icon: Car, label: "Car", time: "12 min", distance: "2.1 km" },
    { icon: Train, label: "Metro", time: "20 min", distance: "via Vishwavidyalaya" },
  ];

  const handleEstimate = () => {
    if (destination.trim()) {
      setShowResults(true);
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5 text-primary" />
          Travel Time Estimator
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
            className="flex-1"
          />
          <Button onClick={handleEstimate}>Estimate</Button>
        </div>

        {showResults && (
          <div className="grid grid-cols-2 gap-3 pt-2">
            {travelModes.map((mode, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-secondary rounded-lg"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <mode.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">{mode.label}</p>
                  <p className="text-xs text-muted-foreground">{mode.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {!showResults && (
          <p className="text-xs text-muted-foreground text-center py-4">
            Enter a destination to see estimated travel times
          </p>
        )}
      </CardContent>
    </Card>
  );
};
