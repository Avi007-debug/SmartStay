import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { AnonymousChatInterface } from "@/components/chat/AnonymousChatInterface";
import { authService, pgService, qnaService } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { VerificationUpload } from "@/components/verification/VerificationUpload";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
import { DocumentVerification } from "@/components/owner/DocumentVerification";
import { 
  Building2, Eye, MessageCircle, TrendingUp, Plus, Edit, Trash2, 
  ToggleRight, Bell, CheckCircle, Clock, Users, DollarSign, 
  BarChart3, Calendar, Shield, Phone, ExternalLink, HelpCircle, User
} from "lucide-react";
import { Link } from "react-router-dom";

const OwnerDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("listings");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [qnaItems, setQnaItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOwnerData();
  }, []);

  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (hash && ['listings', 'inquiries', 'qna', 'analytics', 'verification', 'profile'].includes(hash)) {
      setActiveTab(hash);
    }
  }, [location.hash]);

  const loadOwnerData = async () => {
    try {
      const user = await authService.getCurrentUser();
      setCurrentUser(user);
      
      if (user?.id) {
        // Load owner's PG listings
        const allPGs = await pgService.getAll();
        const ownerPGs = allPGs?.filter((pg: any) => pg.owner_id === user.id) || [];
        setListings(ownerPGs);

        // Load owner's Q&As
        const ownerQnAs = await qnaService.getOwnerQnAs(user.id);
        setQnaItems(ownerQnAs || []);
      }
    } catch (error) {
      console.error("Error loading owner data:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async (id: string) => {
    try {
      const listing = listings.find(l => l.id === id);
      if (!listing) return;
      
      const newStatus = listing.status === 'active' ? 'inactive' : 'active';
      
      // Update in database
      await pgService.update(id, { status: newStatus });
      
      // Update local state
      setListings(listings.map(l => 
        l.id === id ? { ...l, status: newStatus } : l
      ));
    } catch (error) {
      console.error("Error toggling availability:", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="flex flex-1">
        <DashboardSidebar role="owner" />
        
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold mb-2">Owner Dashboard</h1>
                <p className="text-muted-foreground">Manage your property listings</p>
              </div>
              <Button variant="accent" size="lg" asChild>
                <Link to="/post-room">
                  <Plus className="h-5 w-5 mr-2" />
                  Add New Listing
                </Link>
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card className="border-2">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Total Listings</p>
                      <p className="text-2xl font-bold">{loading ? '...' : listings.length}</p>
                    </div>
                    <Building2 className="h-8 w-8 text-primary/20" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Active Listings</p>
                      <p className="text-2xl font-bold">
                        {loading ? '...' : listings.filter(l => l.status === 'active').length}
                      </p>
                    </div>
                    <Eye className="h-8 w-8 text-primary/20" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Verified</p>
                      <p className="text-2xl font-bold">
                        {loading ? '...' : listings.filter(l => l.is_verified).length}
                      </p>
                    </div>
                    <Shield className="h-8 w-8 text-primary/20" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Avg. Rent</p>
                      <p className="text-2xl font-bold">
                        {loading ? '...' : listings.length > 0 
                          ? `₹${Math.round(listings.reduce((sum, l) => sum + (l.rent || 0), 0) / listings.length)}`
                          : '₹0'}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-primary/20" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Availability Reminder */}
            <Card className="mb-6 border-warning bg-warning/5">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-warning" />
                  <div>
                    <p className="font-medium">Confirm your availability</p>
                    <p className="text-sm text-muted-foreground">Please update room availability to help students find accurate information</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Confirm Now</Button>
              </CardContent>
            </Card>

            <Tabs value={activeTab} onValueChange={(value) => navigate(`/owner-dashboard#${value}`)} className="w-full">
              <TabsList className="mb-6 flex-wrap h-auto gap-1">
                <TabsTrigger value="listings">My Listings</TabsTrigger>
                <TabsTrigger value="inquiries">Inquiries</TabsTrigger>
                <TabsTrigger value="qna">Q&A</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="verification">Verification</TabsTrigger>
                <TabsTrigger value="profile">Profile</TabsTrigger>
              </TabsList>

              {/* Listings Tab */}
              <TabsContent value="listings" className="space-y-4">
                {loading ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <p className="text-muted-foreground">Loading your listings...</p>
                    </CardContent>
                  </Card>
                ) : listings.length > 0 ? (
                  listings.map((listing) => (
                    <Card key={listing.id} className="border-2">
                      <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                          <div className="flex items-start gap-4">
                            {listing.images && listing.images.length > 0 ? (
                              <img 
                                src={listing.images[0]} 
                                alt={listing.name}
                                className="h-20 w-20 rounded-lg object-cover shrink-0"
                              />
                            ) : (
                              <div className="h-20 w-20 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0">
                                <Building2 className="h-10 w-10 text-primary/40" />
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-lg">{listing.name}</h3>
                                {listing.is_verified && (
                                  <Badge className="bg-success text-xs">
                                    <Shield className="h-3 w-3 mr-1" />
                                    Verified
                                  </Badge>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-2">
                                <span>₹{listing.rent}/month</span>
                                <span>{listing.gender} PG</span>
                                <span>{listing.address?.city || listing.city}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <Badge variant={listing.status === 'active' ? "default" : "secondary"}>
                                  {listing.status === 'active' ? "Active" : "Inactive"}
                                </Badge>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm">Toggle Status:</span>
                                  <Switch
                                    checked={listing.status === 'active'}
                                    onCheckedChange={() => toggleAvailability(listing.id)}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        <div className="flex flex-wrap gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/pg/${listing.id}`}>
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/post-room/${listing.id}`}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* WhatsApp Group Option */}
                      <div className="mt-4 pt-4 border-t flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-success" />
                          <span className="text-sm">WhatsApp Group:</span>
                          {listing.whatsapp_group_link ? (
                            <Badge className="bg-success">Added</Badge>
                          ) : (
                            <Badge variant="secondary">Not Added</Badge>
                          )}
                        </div>
                        {listing.whatsapp_group_link ? (
                          <Button variant="outline" size="sm" asChild>
                            <a href={listing.whatsapp_group_link} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Open Group
                            </a>
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/post-room/${listing.id}`}>
                              Add WhatsApp Group
                            </Link>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
                ) : (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                      <p className="text-muted-foreground mb-4">You haven't added any listings yet</p>
                      <Button asChild>
                        <Link to="/post-room">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Your First Listing
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Inquiries/Chats Tab */}
              <TabsContent value="inquiries">
                <Card>
                  <CardHeader>
                    <CardTitle>Customer Inquiries & Chats</CardTitle>
                    <CardDescription>Respond to customer messages and inquiries</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AnonymousChatInterface />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Q&A Tab */}
              <TabsContent value="qna" className="space-y-4">
                {loading ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <p className="text-muted-foreground">Loading Q&As...</p>
                    </CardContent>
                  </Card>
                ) : qnaItems.length > 0 ? (
                  qnaItems.map((item) => (
                    <Card key={item.id} className={`border-2 ${!item.answer ? 'border-warning/50' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <Badge variant="secondary" className="text-xs mb-2">
                              {item.pg_listing?.name || 'Unknown PG'}
                            </Badge>
                            <p className="font-medium flex items-center gap-2">
                              <HelpCircle className="h-4 w-4 text-primary" />
                              {item.question}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Asked by {item.user?.full_name || 'Anonymous'} · {new Date(item.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          {item.answer ? (
                            <Badge className="bg-success">Answered</Badge>
                          ) : (
                            <Badge variant="outline" className="text-warning">Unanswered</Badge>
                          )}
                        </div>
                        {item.answer ? (
                          <div className="bg-secondary p-3 rounded-lg mt-2">
                            <p className="text-sm">{item.answer}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Answered {new Date(item.answered_at).toLocaleDateString()}
                            </p>
                          </div>
                        ) : (
                          <div className="mt-3">
                            <p className="text-sm text-muted-foreground mb-2">
                              Visit the PG listing page to answer this question
                            </p>
                            <Button variant="outline" size="sm" asChild>
                              <Link to={`/pg/${item.pg_id}`}>
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Answer on PG Page
                              </Link>
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <HelpCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                      <p className="text-muted-foreground">No questions yet on your listings</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Analytics Tab */}
              <TabsContent value="analytics" className="space-y-6">
                {currentUser && <AnalyticsDashboard ownerId={currentUser.id} />}
              </TabsContent>

              {/* Verification Tab */}
              <TabsContent value="verification">
                {currentUser && <DocumentVerification ownerId={currentUser.id} />}
              </TabsContent>

              {/* Profile Tab */}
              <TabsContent value="profile">
                <Card>
                  <CardHeader>
                    <CardTitle>Owner Profile</CardTitle>
                    <CardDescription>Your account information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-10 w-10 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{currentUser?.profile?.full_name || 'Owner'}</h3>
                        <p className="text-sm text-muted-foreground">{currentUser?.email}</p>
                        <Badge variant="secondary" className="mt-2 capitalize">{currentUser?.profile?.role || 'owner'}</Badge>
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
                        <Label>Total Listings</Label>
                        <p className="mt-2 text-sm font-medium">{listings.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default OwnerDashboard;
