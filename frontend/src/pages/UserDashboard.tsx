import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { authService, savedPGsService, storageService } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RecommendationCard } from "@/components/ai/RecommendationCard";
import { TravelTimeEstimator } from "@/components/ai/TravelTimeEstimator";
import { VacancyAlertSettings } from "@/components/ai/VacancyAlertSettings";
import { AnonymousChatInterface } from "@/components/chat/AnonymousChatInterface";
import { OnboardingTour, useOnboardingTour } from "@/components/OnboardingTour";
import { Heart, Clock, Star, Bell, MessageCircle, User, MapPin, Building2, Sparkles, Settings } from "lucide-react";
import { Link } from "react-router-dom";

const UserDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [budget, setBudget] = useState([5000, 15000]);
  const { shouldShowTour } = useOnboardingTour("user-dashboard");

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
      
      // Load saved PGs
      const saved = await savedPGsService.getAll();
      setSavedPGs(saved || []);
      
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const userDashboardTour = [
    {
      target: "[data-tour='stats']",
      title: "Your Activity Stats",
      description: "Quick overview of your saved PGs, recently viewed listings, and active notifications.",
      placement: "bottom" as const,
    },
    {
      target: "[data-tour='recommendations']",
      title: "AI-Powered Recommendations",
      description: "Get personalized PG suggestions based on your preferences and search history.",
      placement: "bottom" as const,
    },
    {
      target: "[data-tour='saved']",
      title: "Saved PGs",
      description: "Access all your bookmarked properties in one place.",
      placement: "top" as const,
    },
    {
      target: "[data-tour='chats']",
      title: "Anonymous Chat",
      description: "Communicate with owners without revealing your identity initially.",
      placement: "top" as const,
    },
    {
      target: "[data-tour='preferences']",
      title: "Set Your Preferences",
      description: "Customize your search criteria to get better recommendations.",
      placement: "top" as const,
    },
  ];
  
  const [savedPGs, setSavedPGs] = useState<any[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);

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
      
      <div className="flex flex-1">
        <DashboardSidebar role="user" />
        
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">My Dashboard</h1>
              <p className="text-muted-foreground">Manage your PG search and preferences</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8" data-tour="stats">
              <Card className="border-2">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Saved PGs</p>
                      <p className="text-2xl font-bold">{savedPGs.length}</p>
                    </div>
                    <Heart className="h-8 w-8 text-primary/20" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Recently Viewed</p>
                      <p className="text-2xl font-bold">{recentlyViewed.length}</p>
                    </div>
                    <Clock className="h-8 w-8 text-primary/20" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Notifications</p>
                      <p className="text-2xl font-bold">{notifications.filter(n => !n.read).length}</p>
                    </div>
                    <Bell className="h-8 w-8 text-primary/20" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Active Chats</p>
                      <p className="text-2xl font-bold">3</p>
                    </div>
                    <MessageCircle className="h-8 w-8 text-primary/20" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="recommendations" className="w-full">
              <TabsList className="mb-6 flex-wrap h-auto gap-1">
                <TabsTrigger value="recommendations" className="gap-2" data-tour="recommendations">
                  <Sparkles className="h-4 w-4" />
                  For You
                </TabsTrigger>
                <TabsTrigger value="saved" data-tour="saved">Saved PGs</TabsTrigger>
                <TabsTrigger value="recent">Recently Viewed</TabsTrigger>
                <TabsTrigger value="chats" data-tour="chats">Anonymous Chats</TabsTrigger>
                <TabsTrigger value="alerts">Vacancy Alerts</TabsTrigger>
                <TabsTrigger value="preferences" data-tour="preferences">Preferences</TabsTrigger>
                <TabsTrigger value="profile">Profile</TabsTrigger>
              </TabsList>

              {/* AI Recommendations Tab */}
              <TabsContent value="recommendations" className="space-y-6">
                <Card className="bg-accent/5 border-accent">
                  <CardContent className="p-4">
                    <p className="text-sm flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-accent" />
                      <span>
                        <strong>Personalized for you</strong> — Based on your preferences, search history, and behavior
                      </span>
                    </p>
                  </CardContent>
                </Card>
                
                <div className="space-y-4">
                  {recommendations.map((pg) => (
                    <RecommendationCard key={pg.id} {...pg} />
                  ))}
                </div>
              </TabsContent>

              {/* Saved PGs Tab */}
              <TabsContent value="saved" className="space-y-4">
                {savedPGs.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="p-12 text-center">
                      <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                      <p className="text-muted-foreground">No saved PGs yet</p>
                      <Button variant="outline" className="mt-4" asChild>
                        <Link to="/search">Browse PGs</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  savedPGs.map((saved) => {
                    const pg = saved.pg_listing;
                    return (
                      <Card key={saved.id} className="hover-lift border-2 hover:border-primary">
                        <div className="flex flex-col sm:flex-row">
                          <div className="sm:w-48 h-32 bg-muted relative shrink-0">
                            {pg.images && pg.images.length > 0 ? (
                              <img
                                src={storageService.getPublicUrl("pg-images", pg.images[0])}
                                alt={pg.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                                <Building2 className="h-12 w-12 text-primary/40" />
                              </div>
                            )}
                          </div>
                          <CardContent className="flex-1 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                              <h3 className="font-semibold text-lg mb-1">{pg.name}</h3>
                              <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                                <MapPin className="h-4 w-4" />
                                {pg.city}
                              </p>
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1">
                                  <Star className="h-4 w-4 fill-accent text-accent" />
                                  <span className="text-sm font-medium">{pg.rating || 'N/A'}</span>
                                </div>
                                <span className="text-lg font-bold text-primary">₹{pg.monthly_rent}/mo</span>
                              </div>
                            </div>
                            <Button asChild>
                              <Link to={`/pg/${pg.id}`}>View Details</Link>
                            </Button>
                          </CardContent>
                        </div>
                      </Card>
                    );
                  })
                )}
              </TabsContent>

              {/* Recently Viewed Tab */}
              <TabsContent value="recent" className="space-y-4">
                {recentlyViewed.map((pg) => (
                  <Card key={pg.id} className="hover-lift border-2 hover:border-primary">
                    <div className="flex flex-col sm:flex-row">
                      <div className="sm:w-48 h-32 bg-muted relative shrink-0">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                          <Building2 className="h-12 w-12 text-primary/40" />
                        </div>
                      </div>
                      <CardContent className="flex-1 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-lg mb-1">{pg.name}</h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                            <MapPin className="h-4 w-4" />
                            {pg.distance}
                          </p>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-accent text-accent" />
                              <span className="text-sm font-medium">{pg.rating}</span>
                            </div>
                            <span className="text-lg font-bold text-primary">₹{pg.price}/mo</span>
                          </div>
                        </div>
                        <Button asChild>
                          <Link to={`/pg/${pg.id}`}>View Details</Link>
                        </Button>
                      </CardContent>
                    </div>
                  </Card>
                ))}
              </TabsContent>

              {/* Anonymous Chats Tab */}
              <TabsContent value="chats">
                <AnonymousChatInterface />
              </TabsContent>

              {/* Vacancy Alerts Tab */}
              <TabsContent value="alerts" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <VacancyAlertSettings />
                <TravelTimeEstimator />
              </TabsContent>

              {/* Preferences Tab */}
              <TabsContent value="preferences" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Search Preferences
                    </CardTitle>
                    <CardDescription>Set your preferences to get better recommendations</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <Label className="mb-3 block">Monthly Budget</Label>
                          <Slider
                            value={budget}
                            onValueChange={setBudget}
                            min={2000}
                            max={30000}
                            step={500}
                            className="mb-2"
                          />
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>₹{budget[0].toLocaleString()}</span>
                            <span>₹{budget[1].toLocaleString()}</span>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="college">Your College/University</Label>
                          <Input id="college" placeholder="e.g., Delhi University" className="mt-2" />
                        </div>

                        <div>
                          <Label htmlFor="gender">Room Preference</Label>
                          <Select>
                            <SelectTrigger className="mt-2">
                              <SelectValue placeholder="Select preference" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="boys">Boys Only PG</SelectItem>
                              <SelectItem value="girls">Girls Only PG</SelectItem>
                              <SelectItem value="any">Any</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label className="mb-3 block">Strictness Tolerance</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select level" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="strict">Strict (early curfew OK)</SelectItem>
                              <SelectItem value="moderate">Moderate</SelectItem>
                              <SelectItem value="relaxed">Relaxed (late or no curfew)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="mb-3 block">Max Travel Time</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select time" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="10">Within 10 minutes</SelectItem>
                              <SelectItem value="20">Within 20 minutes</SelectItem>
                              <SelectItem value="30">Within 30 minutes</SelectItem>
                              <SelectItem value="any">Any distance</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center justify-between">
                          <Label htmlFor="food">Food Included Required</Label>
                          <Switch id="food" />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label htmlFor="verified">Verified PGs Only</Label>
                          <Switch id="verified" />
                        </div>
                      </div>
                    </div>

                    <Button className="w-full" variant="accent">Save Preferences</Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Profile Tab */}
              <TabsContent value="profile">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-10 w-10 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{currentUser?.profile?.full_name || 'User'}</h3>
                        <p className="text-sm text-muted-foreground">{currentUser?.email}</p>
                        <Badge variant="secondary" className="mt-2">{currentUser?.profile?.role || 'Student'}</Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" defaultValue={currentUser?.profile?.full_name || ''} className="mt-2" />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" defaultValue={currentUser?.email || ''} className="mt-2" />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input id="phone" defaultValue="+91 98765 43210" className="mt-2" />
                      </div>
                      <div>
                        <Label htmlFor="college-profile">College</Label>
                        <Input id="college-profile" defaultValue="Delhi University" className="mt-2" />
                      </div>
                    </div>

                    <Button className="w-full">Update Profile</Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      <Footer />

      {/* Onboarding Tour */}
      {shouldShowTour && (
        <OnboardingTour
          steps={userDashboardTour}
          tourKey="user-dashboard"
        />
      )}
    </div>
  );
};

export default UserDashboard;
