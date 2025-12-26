import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { VerificationUpload } from "@/components/verification/VerificationUpload";
import { 
  Building2, Eye, MessageCircle, TrendingUp, Plus, Edit, Trash2, 
  ToggleRight, Bell, CheckCircle, Clock, Users, DollarSign, 
  BarChart3, Calendar, Shield, Phone, ExternalLink, HelpCircle
} from "lucide-react";
import { Link } from "react-router-dom";

const OwnerDashboard = () => {
  const [listings, setListings] = useState([
    { id: 1, name: "Sunshine PG", views: 234, inquiries: 12, status: "active", occupancy: "7/10", available: true, verified: true },
    { id: 2, name: "Green Valley Hostel", views: 189, inquiries: 8, status: "active", occupancy: "5/8", available: true, verified: false },
  ]);

  const inquiries = [
    { id: 1, name: "Anonymous User", pg: "Sunshine PG", message: "Is there a vacancy for single room?", time: "2h ago", replied: false },
    { id: 2, name: "Anonymous User", pg: "Sunshine PG", message: "What is the food menu like?", time: "5h ago", replied: true },
    { id: 3, name: "Anonymous User", pg: "Green Valley Hostel", message: "Is there curfew on weekends?", time: "1d ago", replied: false },
  ];

  const qnaItems = [
    { id: 1, pg: "Sunshine PG", question: "Is there a curfew time?", answer: "", time: "3h ago", answered: false },
    { id: 2, pg: "Green Valley Hostel", question: "Are guests allowed?", answer: "Yes, guests are allowed until 8 PM with prior notice.", time: "1d ago", answered: true },
    { id: 3, pg: "Sunshine PG", question: "What's included in the rent?", answer: "", time: "2d ago", answered: false },
  ];

  const toggleAvailability = (id: number) => {
    setListings(listings.map(l => 
      l.id === id ? { ...l, available: !l.available } : l
    ));
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
                      <p className="text-2xl font-bold">{listings.length}</p>
                    </div>
                    <Building2 className="h-8 w-8 text-primary/20" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Total Views</p>
                      <p className="text-2xl font-bold">423</p>
                    </div>
                    <Eye className="h-8 w-8 text-primary/20" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Inquiries</p>
                      <p className="text-2xl font-bold">20</p>
                    </div>
                    <MessageCircle className="h-8 w-8 text-primary/20" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Avg. Occupancy</p>
                      <p className="text-2xl font-bold">67%</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-primary/20" />
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

            <Tabs defaultValue="listings" className="w-full">
              <TabsList className="mb-6 flex-wrap h-auto gap-1">
                <TabsTrigger value="listings">My Listings</TabsTrigger>
                <TabsTrigger value="inquiries">
                  Inquiries
                  <Badge variant="secondary" className="ml-2">{inquiries.filter(i => !i.replied).length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="qna">
                  Q&A
                  <Badge variant="secondary" className="ml-2">{qnaItems.filter(q => !q.answered).length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="verification">Verification</TabsTrigger>
              </TabsList>

              {/* Listings Tab */}
              <TabsContent value="listings" className="space-y-4">
                {listings.map((listing) => (
                  <Card key={listing.id} className="border-2">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="h-20 w-20 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0">
                            <Building2 className="h-10 w-10 text-primary/40" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-lg">{listing.name}</h3>
                              {listing.verified && (
                                <Badge className="bg-success text-xs">
                                  <Shield className="h-3 w-3 mr-1" />
                                  Verified
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-2">
                              <span className="flex items-center gap-1">
                                <Eye className="h-4 w-4" />
                                {listing.views} views
                              </span>
                              <span className="flex items-center gap-1">
                                <MessageCircle className="h-4 w-4" />
                                {listing.inquiries} inquiries
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                Occupancy: {listing.occupancy}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge variant={listing.available ? "default" : "secondary"}>
                                {listing.available ? "Rooms Available" : "Full"}
                              </Badge>
                              <div className="flex items-center gap-2">
                                <span className="text-sm">Quick Toggle:</span>
                                <Switch
                                  checked={listing.available}
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
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
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
                          <Badge variant="secondary">Not Added</Badge>
                        </div>
                        <Button variant="outline" size="sm">
                          Add WhatsApp Group
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              {/* Inquiries Tab */}
              <TabsContent value="inquiries" className="space-y-4">
                {inquiries.map((inquiry) => (
                  <Card key={inquiry.id} className={`border-2 ${!inquiry.replied ? 'border-primary/50' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">{inquiry.name}</p>
                            <Badge variant="secondary" className="text-xs">{inquiry.pg}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{inquiry.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">{inquiry.time}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {inquiry.replied ? (
                            <Badge className="bg-success">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Replied
                            </Badge>
                          ) : (
                            <Badge variant="destructive">Pending</Badge>
                          )}
                        </div>
                      </div>
                      {!inquiry.replied && (
                        <div className="flex gap-2">
                          <Input placeholder="Type your reply..." className="flex-1" />
                          <Button>Reply</Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              {/* Q&A Tab */}
              <TabsContent value="qna" className="space-y-4">
                {qnaItems.map((item) => (
                  <Card key={item.id} className={`border-2 ${!item.answered ? 'border-warning/50' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <Badge variant="secondary" className="text-xs mb-2">{item.pg}</Badge>
                          <p className="font-medium flex items-center gap-2">
                            <HelpCircle className="h-4 w-4 text-primary" />
                            {item.question}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">{item.time}</p>
                        </div>
                        {item.answered ? (
                          <Badge className="bg-success">Answered</Badge>
                        ) : (
                          <Badge variant="outline" className="text-warning">Unanswered</Badge>
                        )}
                      </div>
                      {item.answered ? (
                        <div className="bg-secondary p-3 rounded-lg mt-2">
                          <p className="text-sm">{item.answer}</p>
                        </div>
                      ) : (
                        <div className="mt-3">
                          <Textarea placeholder="Type your answer..." className="mb-2" />
                          <Button size="sm">Post Answer</Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              {/* Analytics Tab */}
              <TabsContent value="analytics" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <BarChart3 className="h-5 w-5 text-primary" />
                        <span className="font-medium">Weekly Views</span>
                      </div>
                      <p className="text-3xl font-bold">1,247</p>
                      <p className="text-sm text-success">+12% from last week</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <MessageCircle className="h-5 w-5 text-primary" />
                        <span className="font-medium">Chat Requests</span>
                      </div>
                      <p className="text-3xl font-bold">48</p>
                      <p className="text-sm text-success">+8% from last week</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        <span className="font-medium">Visit Requests</span>
                      </div>
                      <p className="text-3xl font-bold">12</p>
                      <p className="text-sm text-muted-foreground">This month</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Performance Overview</CardTitle>
                    <CardDescription>Your listings performance over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center bg-muted/30 rounded-lg">
                      <p className="text-muted-foreground">Analytics charts will appear here</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Verification Tab */}
              <TabsContent value="verification">
                <VerificationUpload />
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
