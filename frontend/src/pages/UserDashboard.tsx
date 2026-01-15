import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { authService, savedPGsService, storageService, notificationsService, chatService } from "@/lib/supabase";
import { useNavigate, useLocation } from "react-router-dom";
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
import { PersonalizedRecommendations } from "@/components/ai/PersonalizedRecommendations";
import { VacancyAlertSettings } from "@/components/ai/VacancyAlertSettings";
import { AnonymousChatInterface } from "@/components/chat/AnonymousChatInterface";
import { OnboardingTour, useOnboardingTour } from "@/components/OnboardingTour";
import { useRecentlyViewed } from "@/hooks/use-recently-viewed";
import { Heart, Clock, Star, Bell, MessageCircle, User, MapPin, Building2, Sparkles, Settings } from "lucide-react";
import { Link } from "react-router-dom";

const UserDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [budget, setBudget] = useState([5000, 15000]);
  const [chatCount, setChatCount] = useState(0);
  const [activeTab, setActiveTab] = useState("recommendations");
  const { shouldShowTour } = useOnboardingTour("user-dashboard");
  const { getRecentlyViewed } = useRecentlyViewed();
  const [recentlyViewedPGs, setRecentlyViewedPGs] = useState<any[]>([]);

  useEffect(() => {
    loadUserData();
    
    // Load recently viewed PGs
    const recentPGs = getRecentlyViewed();
    setRecentlyViewedPGs(recentPGs);
  }, []);

  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (hash && ['recommendations', 'saved', 'recently-viewed', 'chats', 'alerts', 'profile'].includes(hash)) {
      setActiveTab(hash);
    } else {
      setActiveTab('recommendations');
    }
  }, [location.hash]);

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
      
      // Load notifications
      const notifs = await notificationsService.getAll();
      setNotifications(notifs || []);
      
      // Load chats count
      const chats = await chatService.getAll();
      setChatCount(chats?.length || 0);
      
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
      description: "Quick overview of your saved PGs and active notifications.",
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
  const [notifications, setNotifications] = useState<any[]>([]);

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
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8" data-tour="stats">
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
                      <p className="text-2xl font-bold">{chatCount}</p>
                    </div>
                    <MessageCircle className="h-8 w-8 text-primary/20" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-6 flex-wrap h-auto gap-1">
                <TabsTrigger value="recommendations" className="gap-2" data-tour="recommendations">
                  <Sparkles className="h-4 w-4" />
                  AI Recommendations
                </TabsTrigger>
                <TabsTrigger value="saved" data-tour="saved">Saved PGs</TabsTrigger>
                <TabsTrigger value="recently-viewed">
                  <Clock className="h-4 w-4 mr-2" />
                  Recently Viewed
                </TabsTrigger>
                <TabsTrigger value="chats" data-tour="chats">Anonymous Chats</TabsTrigger>
                <TabsTrigger value="alerts">Vacancy Alerts</TabsTrigger>
                <TabsTrigger value="profile">My Profile</TabsTrigger>
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
                
                {/* AI-Powered Personalized Recommendations */}
                <PersonalizedRecommendations />
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
                            {pg.images && pg.images.length > 0 && pg.images[0] ? (
                              <img
                                src={pg.images[0]}
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
              <TabsContent value="recently-viewed" className="space-y-4">
                {recentlyViewedPGs.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="p-12 text-center">
                      <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                      <p className="text-muted-foreground">No recently viewed PGs</p>
                      <Button variant="outline" className="mt-4" asChild>
                        <Link to="/search">Browse PGs</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  recentlyViewedPGs.map((pg) => (
                    <Card key={pg.id} className="hover-lift border-2 hover:border-primary">
                      <div className="flex flex-col sm:flex-row">
                        <div className="sm:w-48 h-32 bg-muted relative shrink-0">
                          {pg.image ? (
                            <img
                              src={pg.image}
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
                              <span className="text-lg font-bold text-primary">₹{pg.rent}/mo</span>
                              <span className="text-xs text-muted-foreground">
                                <Clock className="h-3 w-3 inline mr-1" />
                                {new Date(pg.viewedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <Button asChild>
                            <Link to={`/pg/${pg.id}`}>View Again</Link>
                          </Button>
                        </CardContent>
                      </div>
                    </Card>
                  ))
                )}
              </TabsContent>

              {/* Anonymous Chats Tab */}
              <TabsContent value="chats">
                <AnonymousChatInterface />
              </TabsContent>

              {/* Vacancy Alerts Tab */}
              <TabsContent value="alerts">
                <VacancyAlertSettings />
              </TabsContent>

              {/* Profile Tab */}
              <TabsContent value="profile">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>View and manage your profile</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-10 w-10 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{currentUser?.profile?.full_name || 'User'}</h3>
                        <p className="text-sm text-muted-foreground">{currentUser?.email}</p>
                        <Badge variant="secondary" className="mt-2 capitalize">{currentUser?.profile?.role || 'user'}</Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Full Name</Label>
                        <p className="mt-2 text-sm font-medium">{currentUser?.profile?.full_name || 'Not set'}</p>
                      </div>
                      <div>
                        <Label>Email</Label>
                        <p className="mt-2 text-sm font-medium">{currentUser?.email || 'Not set'}</p>
                      </div>
                      <div>
                        <Label>Phone Number</Label>
                        <p className="mt-2 text-sm font-medium">
                          {currentUser?.profile?.phone && currentUser.profile.phone.trim() !== '' 
                            ? currentUser.profile.phone 
                            : 'Not set'}
                        </p>
                      </div>
                      <div>
                        <Label>Role</Label>
                        <p className="mt-2 text-sm font-medium capitalize">{currentUser?.profile?.role || 'user'}</p>
                      </div>
                    </div>

                    <Button className="w-full" variant="outline" asChild>
                      <Link to="/preferences">Edit Preferences</Link>
                    </Button>
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
