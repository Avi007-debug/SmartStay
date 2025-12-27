import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TravelTimeEstimator } from "@/components/ai/TravelTimeEstimator";
import { toast } from "@/hooks/use-toast";
import {
  MapPin,
  Star,
  Shield,
  Wifi,
  UtensilsCrossed,
  Droplets,
  Home,
  Share2,
  Heart,
  MessageCircle,
  Phone,
  Mail,
  Clock,
  Users,
  Bed,
  ThumbsUp,
  ThumbsDown,
  Flag,
  Building2,
  ChevronLeft,
  ChevronRight,
  Bell,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { pgService, reviewsService, storageService, savedPGsService } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

const PGDetail = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [pgData, setPgData] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [currentImage, setCurrentImage] = useState(0);
  const [vacancyAlertEnabled, setVacancyAlertEnabled] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    loadPGData();
  }, [id]);

  const loadPGData = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const pg = await pgService.getById(id);
      if (pg) {
        setPgData(pg);
        
        // Load reviews
        const pgReviews = await reviewsService.getByPGId(id);
        setReviews(pgReviews || []);
        
        // Check if saved
        const saved = await savedPGsService.isSaved(id);
        setIsSaved(saved);
      }
    } catch (error) {
      console.error("Error loading PG:", error);
      toast({
        title: "Error",
        description: "Failed to load PG details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const totalImages = pgData?.images?.length || 1;

  const handleVacancyAlertToggle = () => {
    setVacancyAlertEnabled(!vacancyAlertEnabled);
    toast({
      title: vacancyAlertEnabled ? "Alert Disabled" : "Alert Enabled",
      description: vacancyAlertEnabled 
        ? "You will no longer receive vacancy alerts for this PG" 
        : "You'll be notified when a room becomes available",
    });
  };

  const handleSave = async () => {
    if (!id) return;
    
    try {
      if (isSaved) {
        await savedPGsService.remove(id);
        setIsSaved(false);
        toast({
          title: "Removed from Saved",
          description: "This PG has been removed from your saved list",
        });
      } else {
        await savedPGsService.save(id);
        setIsSaved(true);
        toast({
          title: "Saved Successfully",
          description: "You can view this PG anytime in your dashboard",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update saved PGs",
        variant: "destructive",
      });
    }
  };

  const handleReport = () => {
    toast({
      title: "Report Submitted",
      description: "Thank you for reporting. We'll review this listing shortly.",
    });
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

  if (!pgData) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-xl text-muted-foreground">PG not found</p>
            <Button className="mt-4" asChild>
              <Link to="/search">Back to Search</Link>
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Parse amenities from pgData
  const amenities = [
    { icon: Wifi, label: "Wi-Fi", enabled: pgData.amenities?.includes("wifi") },
    { icon: UtensilsCrossed, label: "Food", enabled: pgData.amenities?.includes("food") },
    { icon: Droplets, label: "Hot Water", enabled: pgData.amenities?.includes("hot_water") },
    { icon: Home, label: "Laundry", enabled: pgData.amenities?.includes("laundry") },
  ].filter(a => a.enabled);

  const qna = [
    {
      id: 1,
      question: "Is there a curfew time?",
      answer: "Yes, the curfew is at 10:00 PM on weekdays and 11:00 PM on weekends.",
      askedBy: "Anonymous",
      answeredBy: "Owner",
      date: "3 days ago",
    },
    {
      id: 2,
      question: "Are guests allowed?",
      answer: "Yes, guests are allowed in the common area until 8:00 PM with prior notice.",
      askedBy: "Anonymous",
      answeredBy: "Owner",
      date: "1 week ago",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 flex-1">
        {/* Image Gallery */}
        <div className="mb-8">
          <div className="relative aspect-video bg-muted rounded-2xl overflow-hidden mb-4">
            {pgData.images && pgData.images.length > 0 ? (
              <img
                src={storageService.getPublicUrl("pg-images", pgData.images[currentImage])}
                alt={`${pgData.name} - Image ${currentImage + 1}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
                <Building2 className="h-32 w-32 text-white/40" />
              </div>
            )}
            {totalImages > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                  onClick={() => setCurrentImage(Math.max(0, currentImage - 1))}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                  onClick={() => setCurrentImage(Math.min(totalImages - 1, currentImage + 1))}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
              {currentImage + 1} / {totalImages}
            </div>
          </div>
          
          {pgData.images && pgData.images.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {pgData.images.slice(0, 5).map((image: string, i: number) => (
                <button
                  key={i}
                  onClick={() => setCurrentImage(i)}
                  className={`aspect-video bg-muted rounded-lg overflow-hidden border-2 transition-all ${
                    currentImage === i ? "border-primary" : "border-transparent"
                  }`}
                >
                  <img
                    src={storageService.getPublicUrl("pg-images", image)}
                    alt={`Thumbnail ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold">{pgData.name}</h1>
                    {pgData.is_verified && (
                      <Badge className="bg-success">
                        <Shield className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4" />
                    {typeof pgData.address === 'string' ? pgData.address : pgData.address?.full || pgData.address?.street}, {pgData.city}
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Star className="h-5 w-5 fill-accent text-accent" />
                      <span className="font-semibold">{pgData.rating || 'N/A'}</span>
                      <span className="text-sm text-muted-foreground">({reviews.length} reviews)</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon">
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Share this PG</TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={handleSave}
                        className={isSaved ? "text-red-500" : ""}
                      >
                        <Heart className={`h-4 w-4 ${isSaved ? "fill-red-500" : ""}`} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{isSaved ? "Remove from Saved" : "Save this PG"}</TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" onClick={handleReport}>
                        <Flag className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Report an issue</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>

            <Separator />

            {/* Tabs */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="amenities">Amenities</TabsTrigger>
                <TabsTrigger value="availability">Availability</TabsTrigger>
                <TabsTrigger value="travel">Travel Time</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
                <TabsTrigger value="qna">Q&A</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">About This PG</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {pgData.description || 'No description available'}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Key Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">Gender</p>
                          <p className="font-medium capitalize">{pgData.gender_preference}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Bed className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">Available Beds</p>
                          <p className="font-medium">{pgData.available_beds || 0} beds</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Home className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">Room Type</p>
                          <p className="font-medium capitalize">{pgData.room_type?.replace('_', ' ')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">Deposit</p>
                          <p className="font-medium">₹{pgData.deposit}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-accent/5 border-accent">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Shield className="h-5 w-5 text-accent" />
                      AI Sentiment Summary
                    </h3>
                    <p className="text-muted-foreground">
                      Based on 42 reviews, students highly appreciate the <strong>food quality</strong> and <strong>cleanliness</strong>. 
                      Some concerns mentioned about <strong>Wi-Fi speed</strong> during evening hours. Overall sentiment: <strong className="text-success">Very Positive</strong>
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="availability" className="space-y-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <h3 className="font-semibold text-lg mb-2">Room Availability</h3>
                        <p className="text-muted-foreground">Get notified when a room becomes available</p>
                      </div>
                      <Badge className="bg-success text-success-foreground">3 Beds Available</Badge>
                    </div>

                    <div className="space-y-4">
                      <div className="p-4 bg-accent/10 border border-accent rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Bell className="h-5 w-5 text-accent" />
                            <Label htmlFor="vacancy-alert" className="font-medium cursor-pointer">
                              Vacancy Alert
                            </Label>
                          </div>
                          <Switch 
                            id="vacancy-alert" 
                            checked={vacancyAlertEnabled}
                            onCheckedChange={handleVacancyAlertToggle}
                          />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {vacancyAlertEnabled 
                            ? "You'll receive instant notifications when rooms become available" 
                            : "Enable to get notified about new vacancies"}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 border rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Room Type</p>
                          <p className="font-semibold">2-3 Sharing</p>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Total Capacity</p>
                          <p className="font-semibold">10 Beds</p>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Occupied</p>
                          <p className="font-semibold">7 Beds</p>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Available</p>
                          <p className="font-semibold text-success">3 Beds</p>
                        </div>
                      </div>

                      {!vacancyAlertEnabled && (
                        <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                          <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div className="text-sm text-muted-foreground">
                            <p className="font-medium mb-1">Don't miss out!</p>
                            <p>Enable vacancy alerts to be the first to know when rooms become available at this PG.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="travel" className="space-y-4">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Travel Time Estimator</h3>
                    <TravelTimeEstimator pgLocation={`${pgData.address}, ${pgData.city}`} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="amenities" className="space-y-4">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Included Amenities</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {amenities.map((amenity, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                            <amenity.icon className="h-5 w-5 text-primary" />
                          </div>
                          <span className="font-medium">{amenity.label}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reviews" className="space-y-4">
                {reviews.length > 0 ? (
                  reviews.map((review) => (
                    <Card key={review.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>{review.user?.profile?.full_name?.[0] || 'U'}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold">{review.user?.profile?.full_name || 'Anonymous'}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(review.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            {[...Array(review.rating)].map((_, i) => (
                              <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                            ))}
                          </div>
                        </div>
                        <p className="text-muted-foreground mb-4">{review.comment}</p>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-muted-foreground">
                            {review.helpful_count || 0} found this helpful
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                      <p className="text-muted-foreground">No reviews yet</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="qna" className="space-y-4">
                {qna.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-6">
                      <div className="mb-4">
                        <div className="flex items-start gap-3 mb-2">
                          <MessageCircle className="h-5 w-5 text-primary mt-1" />
                          <div>
                            <p className="font-semibold">{item.question}</p>
                            <p className="text-sm text-muted-foreground">Asked by {item.askedBy} · {item.date}</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-secondary p-4 rounded-lg">
                        <p className="text-muted-foreground mb-2">{item.answer}</p>
                        <p className="text-sm text-muted-foreground">— {item.answeredBy}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <Button variant="outline" className="w-full">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Ask a Question
                </Button>
              </TabsContent>
            </Tabs>

            {/* WhatsApp Community Section */}
            <Card className="mt-6 border-2 border-green-500/20 bg-green-500/5">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10 shrink-0">
                    <MessageCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">Join WhatsApp Community</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Connect with current and prospective residents. Get instant updates, share experiences, and ask questions directly in the community group.
                    </p>
                    <Button variant="outline" className="border-green-500 text-green-700 hover:bg-green-50">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Join WhatsApp Group
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 border-2">
              <CardContent className="p-6 space-y-6">
                <div>
                  <p className="text-3xl font-bold text-primary mb-2">
                    ₹{pgData.monthly_rent}<span className="text-base text-muted-foreground font-normal">/month</span>
                  </p>
                  {pgData.available_beds > 0 ? (
                    <Badge variant="secondary" className="bg-success/10 text-success">
                      {pgData.available_beds} beds available
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-destructive/10 text-destructive">
                      No beds available
                    </Badge>
                  )}
                </div>

                <Separator />

                <div className="space-y-3">
                  <Button className="w-full" size="lg" variant="accent">
                    <Phone className="h-4 w-4 mr-2" />
                    Contact Owner
                  </Button>
                  <Button className="w-full" size="lg" variant="outline">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Chat Anonymously
                  </Button>
                  <Button className="w-full" size="lg" variant="outline">
                    Book a Visit
                  </Button>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-3">Owner Details</h4>
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {pgData.owner?.full_name?.[0] || 'O'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{pgData.owner?.full_name || 'Owner'}</p>
                      {pgData.owner?.is_verified && (
                        <Badge variant="secondary" className="text-xs">
                          <Shield className="h-3 w-3 mr-1" />
                          Verified Owner
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    {pgData.owner?.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{pgData.owner.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default PGDetail;
