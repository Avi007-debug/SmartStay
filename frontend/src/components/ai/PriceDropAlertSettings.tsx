import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { priceDropAlertsService } from "@/lib/supabase";
import { TrendingDown, Bell, Trash2, Loader2 } from "lucide-react";

interface PriceDropAlertSettingsProps {
  pgId: string;
  currentRent: number;
  pgName: string;
}

export const PriceDropAlertSettings = ({ pgId, currentRent, pgName }: PriceDropAlertSettingsProps) => {
  const [targetPrice, setTargetPrice] = useState<number>(currentRent - 1000);
  const [existingAlert, setExistingAlert] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadExistingAlert();
  }, [pgId]);

  const loadExistingAlert = async () => {
    try {
      const alert = await priceDropAlertsService.getByPGId(pgId);
      if (alert) {
        setExistingAlert(alert);
        setTargetPrice(alert.target_price);
      }
    } catch (error) {
      // No existing alert
    }
  };

  const handleCreateAlert = async () => {
    if (targetPrice >= currentRent) {
      toast({
        title: "Invalid Price",
        description: "Target price must be lower than current rent",
        variant: "destructive",
      });
      return;
    }

    if (targetPrice < 1000) {
      toast({
        title: "Invalid Price",
        description: "Target price must be at least ₹1000",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await priceDropAlertsService.create(pgId, targetPrice);
      toast({
        title: "Alert Created!",
        description: `You'll be notified when rent drops to ₹${targetPrice.toLocaleString()}`,
      });
      loadExistingAlert();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create alert",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (enabled: boolean) => {
    if (!existingAlert) return;
    
    setLoading(true);
    try {
      await priceDropAlertsService.toggle(existingAlert.id, enabled);
      toast({
        title: enabled ? "Alert Enabled" : "Alert Disabled",
        description: enabled 
          ? "You'll receive notifications for price drops" 
          : "Price drop notifications paused",
      });
      loadExistingAlert();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update alert",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!existingAlert) return;
    
    setLoading(true);
    try {
      await priceDropAlertsService.delete(existingAlert.id);
      toast({
        title: "Alert Deleted",
        description: "Price drop alert has been removed",
      });
      setExistingAlert(null);
      setTargetPrice(currentRent - 1000);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete alert",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-green-600" />
          Price Drop Alert
        </CardTitle>
        <CardDescription>
          Get notified when the rent drops to your target price
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground">Current Rent</p>
            <p className="text-2xl font-bold">₹{currentRent.toLocaleString()}/mo</p>
          </div>
          {existingAlert && existingAlert.triggered_at && (
            <Badge variant="default" className="bg-green-600">
              <Bell className="h-3 w-3 mr-1" />
              Triggered!
            </Badge>
          )}
        </div>

        {existingAlert ? (
          <>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Target Price</p>
                  <p className="text-xl font-semibold text-green-600">
                    ₹{existingAlert.target_price.toLocaleString()}/mo
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Save ₹{(currentRent - existingAlert.target_price).toLocaleString()}/month
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={existingAlert.is_enabled}
                    onCheckedChange={handleToggle}
                    disabled={loading}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDelete}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 text-destructive" />
                    )}
                  </Button>
                </div>
              </div>

              {existingAlert.triggered_at ? (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800 font-medium">
                    🎉 Great news! The rent has dropped to your target price!
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <Bell className="h-4 w-4 inline mr-1" />
                    You'll be notified when rent drops to ₹{existingAlert.target_price.toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="targetPrice">Your Target Price</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    ₹
                  </span>
                  <Input
                    id="targetPrice"
                    type="number"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(Number(e.target.value))}
                    className="pl-8"
                    min={1000}
                    max={currentRent - 100}
                  />
                </div>
                <Button onClick={handleCreateAlert} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Set Alert"}
                </Button>
              </div>
              {targetPrice < currentRent && (
                <p className="text-xs text-green-600">
                  You'll save ₹{(currentRent - targetPrice).toLocaleString()}/month
                </p>
              )}
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                💡 Set a realistic target price below the current rent. We'll notify you instantly when it drops!
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
