import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { User, Bell, Heart, MapPin, DollarSign, Sliders, Loader2 } from "lucide-react";
import { preferencesService, authService } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";

const UserPreferences = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [preferences, setPreferences] = useState({
    budget_min: 5000,
    budget_max: 15000,
    preferred_location: "",
    room_type: "any",
    gender_preference: "any",
    amenities: [] as string[],
    notifications_enabled: true,
    email_alerts: true,
    whatsapp_alerts: false,
  });

  const amenitiesList = [
    "Wi-Fi", "Food Included", "Hot Water", "Laundry", "AC", "Parking",
    "TV", "Fridge", "Gym", "CCTV", "Power Backup", "Attached Bathroom"
  ];

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      setCurrentUser(user);

      // Load preferences
      const result = await preferencesService.get();
      if (result?.preferences) {
        const userPrefs = result.preferences;
        setPreferences({
          budget_min: userPrefs.budget_min || 5000,
          budget_max: userPrefs.budget_max || 15000,
          preferred_location: userPrefs.preferred_location || "",
          room_type: userPrefs.room_type || "any",
          gender_preference: userPrefs.gender_preference || "any",
          amenities: userPrefs.amenities || [],
          notifications_enabled: userPrefs.notifications_enabled ?? true,
          email_alerts: userPrefs.email_alerts ?? true,
          whatsapp_alerts: userPrefs.whatsapp_alerts ?? false,
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      toast({
        title: "Error",
        description: "Failed to load preferences",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await preferencesService.update(preferences);
      
      toast({
        title: "Success",
        description: "Your preferences have been saved",
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: "Error",
        description: "Failed to save preferences",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleAmenity = (amenity: string) => {
    setPreferences(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold">Your Preferences</h1>
            <p className="text-muted-foreground mt-2">
              Customize your search experience and receive personalized recommendations
            </p>
          </div>

          {/* Budget Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Budget Range
              </CardTitle>
              <CardDescription>Set your preferred monthly rent budget</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Slider
                  value={[preferences.budget_min, preferences.budget_max]}
                  onValueChange={(v) => setPreferences(prev => ({ ...prev, budget_min: v[0], budget_max: v[1] }))}
                  min={2000}
                  max={50000}
                  step={500}
                  className="mb-2"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>₹{preferences.budget_min.toLocaleString()}</span>
                  <span>₹{preferences.budget_max.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location & Room Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location & Room Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Preferred Location</Label>
                  <Input
                    id="location"
                    placeholder="e.g., Delhi, Bangalore"
                    value={preferences.preferred_location}
                    onChange={(e) => setPreferences(prev => ({ ...prev, preferred_location: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="room-type">Room Type</Label>
                  <Select 
                    value={preferences.room_type}
                    onValueChange={(v) => setPreferences(prev => ({ ...prev, room_type: v }))}
                  >
                    <SelectTrigger id="room-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="double">Double</SelectItem>
                      <SelectItem value="triple">Triple</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender Preference</Label>
                  <Select
                    value={preferences.gender_preference}
                    onValueChange={(v) => setPreferences(prev => ({ ...prev, gender_preference: v }))}
                  >
                    <SelectTrigger id="gender">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      <SelectItem value="male">Male Only</SelectItem>
                      <SelectItem value="female">Female Only</SelectItem>
                      <SelectItem value="unisex">Unisex</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Amenities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sliders className="h-5 w-5" />
                Preferred Amenities
              </CardTitle>
              <CardDescription>Select amenities that matter to you</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {amenitiesList.map((amenity) => (
                  <div key={amenity} className="flex items-center space-x-2">
                    <Checkbox
                      id={`pref-${amenity}`}
                      checked={preferences.amenities.includes(amenity)}
                      onCheckedChange={() => toggleAmenity(amenity)}
                    />
                    <Label htmlFor={`pref-${amenity}`} className="cursor-pointer text-sm">
                      {amenity}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Notification Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>Choose how you want to be notified</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notifications">Enable Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive updates about new listings and alerts</p>
                </div>
                <Switch
                  id="notifications"
                  checked={preferences.notifications_enabled}
                  onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, notifications_enabled: checked }))}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email">Email Alerts</Label>
                  <p className="text-sm text-muted-foreground">Get notified via email</p>
                </div>
                <Switch
                  id="email"
                  checked={preferences.email_alerts}
                  onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, email_alerts: checked }))}
                  disabled={!preferences.notifications_enabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="whatsapp">WhatsApp Alerts</Label>
                  <p className="text-sm text-muted-foreground">Get notified via WhatsApp</p>
                </div>
                <Switch
                  id="whatsapp"
                  checked={preferences.whatsapp_alerts}
                  onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, whatsapp_alerts: checked }))}
                  disabled={!preferences.notifications_enabled}
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Preferences'
              )}
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default UserPreferences;
