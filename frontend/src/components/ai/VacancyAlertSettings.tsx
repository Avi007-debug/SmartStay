import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, MapPin, DollarSign, Building2, Sparkles } from "lucide-react";

interface VacancyAlertSettingsProps {
  className?: string;
}

export const VacancyAlertSettings = ({ className }: VacancyAlertSettingsProps) => {
  const [alerts, setAlerts] = useState({
    newVacancy: true,
    priceDrops: true,
    newListings: false,
    matchingPGs: true,
  });
  const [budget, setBudget] = useState([5000, 12000]);
  const [maxDistance, setMaxDistance] = useState([3]);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-accent" />
          Smart Vacancy Alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-4 w-4 text-primary" />
              <Label htmlFor="new-vacancy">New Vacancy Alerts</Label>
            </div>
            <Switch
              id="new-vacancy"
              checked={alerts.newVacancy}
              onCheckedChange={(checked) => setAlerts({ ...alerts, newVacancy: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DollarSign className="h-4 w-4 text-primary" />
              <Label htmlFor="price-drops">Price Drop Notifications</Label>
            </div>
            <Switch
              id="price-drops"
              checked={alerts.priceDrops}
              onCheckedChange={(checked) => setAlerts({ ...alerts, priceDrops: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4 text-primary" />
              <Label htmlFor="new-listings">New Listings in Area</Label>
            </div>
            <Switch
              id="new-listings"
              checked={alerts.newListings}
              onCheckedChange={(checked) => setAlerts({ ...alerts, newListings: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="h-4 w-4 text-accent" />
              <Label htmlFor="matching-pgs">AI-Matched PGs</Label>
            </div>
            <Switch
              id="matching-pgs"
              checked={alerts.matchingPGs}
              onCheckedChange={(checked) => setAlerts({ ...alerts, matchingPGs: checked })}
            />
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t">
          <div>
            <Label className="text-sm font-medium mb-3 block">Budget Range</Label>
            <Slider
              value={budget}
              onValueChange={setBudget}
              min={2000}
              max={25000}
              step={500}
              className="mb-2"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>₹{budget[0].toLocaleString()}</span>
              <span>₹{budget[1].toLocaleString()}</span>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium mb-3 block flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Max Distance from College
            </Label>
            <Slider
              value={maxDistance}
              onValueChange={setMaxDistance}
              min={0.5}
              max={10}
              step={0.5}
              className="mb-2"
            />
            <p className="text-sm text-muted-foreground text-center">
              {maxDistance[0]} km
            </p>
          </div>
        </div>

        <Button className="w-full" variant="accent">
          Save Alert Settings
        </Button>
      </CardContent>
    </Card>
  );
};
