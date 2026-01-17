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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TravelTimeEstimator } from "@/components/ai/TravelTimeEstimator";
import { HiddenChargeDetector } from "@/components/ai/HiddenChargeDetector";
import { SentimentSummary } from "@/components/ai/SentimentSummary";
import { PriceDropAlertSettings } from "@/components/ai/PriceDropAlertSettings";
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
  Sparkles,
} from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { pgService, reviewsService, storageService, savedPGsService, authService, qnaService, chatService } from "@/lib/supabase";
import { Loader2, Edit, Trash2, Pencil } from "lucide-react";
import { useRecentlyViewed } from "@/hooks/use-recently-viewed";
import { API_CONFIG } from "@/lib/api-config";

// Helper function to track analytics
const trackMetric = async (pgId: string, metric: 'views' | 'inquiries' | 'saves' | 'clicks') => {
  try {
    await fetch(`${API_CONFIG.BACKEND_URL}/api/analytics/increment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pg_id: pgId, metric })
    });
  } catch (error) {
    console.error('Error tracking metric:', error);
  }
};

const PGDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToRecentlyViewed } = useRecentlyViewed();
  const [loading, setLoading] = useState(true);
  const [pgData, setPgData] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [qna, setQna] = useState<any[]>([]);
  const [currentImage, setCurrentImage] = useState(0);
  const [vacancyAlertEnabled, setVacancyAlertEnabled] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Review form state
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [reviewAnonymous, setReviewAnonymous] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [editingReview, setEditingReview] = useState<any>(null);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
  
  // Q&A form state
  const [qnaDialogOpen, setQnaDialogOpen] = useState(false);
  const [questionText, setQuestionText] = useState("");
  const [submittingQuestion, setSubmittingQuestion] = useState(false);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyingToQuestion, setReplyingToQuestion] = useState<any>(null);
  const [submittingReply, setSubmittingReply] = useState(false);

  const handleChatWithOwner = async (prefilledMessage?: string) => {
    if (!currentUser) {
      toast({
        title: "Login Required",
        description: "Please login to chat with the owner",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    try {
      // Track inquiry
      if (id) {
        trackMetric(id, 'inquiries');
      }
      
      // Create or get existing chat
      const chat = await chatService.createOrGet(pgData.id, pgData.owner_id, true);
      
      // If there's a prefilled message, send it
      if (prefilledMessage && chat.id) {
        await chatService.sendMessage(chat.id, prefilledMessage);
      }
      
      // Navigate to dashboard chats tab
      navigate('/user-dashboard#chats');
      
      toast({
        title: "Chat Opened",
        description: prefilledMessage ? "Message sent to owner" : "Start chatting with the owner",
      });
    } catch (error) {
      console.error('Error opening chat:', error);
      toast({
        title: "Error",
        description: "Failed to open chat. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadPGData();
    loadCurrentUser();
  }, [id]);

  const loadCurrentUser = async () => {
    const user = await authService.getCurrentUser();
    setCurrentUser(user);
  };

  const handleSubmitReview = async () => {
    if (!currentUser) {
      toast({
        title: "Login Required",
        description: "Please login to submit a review",
        variant: "destructive",
      });
      return;
    }

    if (!reviewText.trim()) {
      toast({
        title: "Review Required",
        description: "Please write a review before submitting",
        variant: "destructive",
      });
      return;
    }

    setSubmittingReview(true);
    try {
      if (editingReview) {
        // Update existing review
        await reviewsService.update(editingReview.id, {
          rating: reviewRating,
          review_text: reviewText,
        });

        toast({
          title: "Review Updated",
          description: "Your review has been updated successfully!",
        });
      } else {
        // Create new review
        await reviewsService.create(id!, {
          rating: reviewRating,
          review_text: reviewText,
          is_anonymous: reviewAnonymous,
        });

        toast({
          title: "Review Submitted",
          description: "Thank you for your feedback!",
        });
      }

      // Reset form and close dialog
      setReviewText("");
      setReviewRating(5);
      setReviewAnonymous(false);
      setEditingReview(null);
      setReviewDialogOpen(false);

      // Reload reviews
      const pgReviews = await reviewsService.getByPGId(id!);
      setReviews(pgReviews || []);
    } catch (error: any) {
      console.error("Error submitting review:", error);
      
      // Check for duplicate review error
      if (error?.code === '23505' || error?.message?.includes('duplicate key')) {
        toast({
          title: "Already Reviewed",
          description: "You have already submitted a review for this PG. You can only review once.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error?.message || "Failed to submit review. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleEditReview = (review: any) => {
    setEditingReview(review);
    setReviewRating(review.rating);
    setReviewText(review.review_text);
    setReviewDialogOpen(true);
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this review?")) {
      return;
    }

    setDeletingReviewId(reviewId);
    try {
      await reviewsService.delete(reviewId);

      toast({
        title: "Review Deleted",
        description: "Your review has been removed.",
      });

      // Reload reviews
      const pgReviews = await reviewsService.getByPGId(id!);
      setReviews(pgReviews || []);
    } catch (error) {
      console.error("Error deleting review:", error);
      toast({
        title: "Error",
        description: "Failed to delete review. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingReviewId(null);
    }
  };

  const handleSubmitQuestion = async () => {
    if (!currentUser) {
      toast({
        title: "Login Required",
        description: "Please login to ask a question",
        variant: "destructive",
      });
      return;
    }

    if (!questionText.trim()) {
      toast({
        title: "Question Required",
        description: "Please enter a question before submitting",
        variant: "destructive",
      });
      return;
    }

    setSubmittingQuestion(true);
    try {
      await qnaService.askQuestion(id!, questionText);

      toast({
        title: "Question Submitted",
        description: "The property owner will be notified of your question!",
      });

      setQuestionText("");
      setQnaDialogOpen(false);

      // Reload Q&A
      const pgQna = await qnaService.getByPGId(id!);
      setQna(pgQna || []);
    } catch (error) {
      console.error("Error submitting question:", error);
      toast({
        title: "Error",
        description: "Failed to submit question. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmittingQuestion(false);
    }
  };

  const handleSubmitReply = async () => {
    if (!replyText.trim()) {
      toast({
        title: "Answer Required",
        description: "Please enter an answer before submitting",
        variant: "destructive",
      });
      return;
    }

    setSubmittingReply(true);
    try {
      await qnaService.answerQuestion(replyingToQuestion.id, replyText);

      toast({
        title: "Answer Posted",
        description: "Your answer has been posted successfully!",
      });

      setReplyText("");
      setReplyDialogOpen(false);
      setReplyingToQuestion(null);

      // Reload Q&A
      const pgQna = await qnaService.getByPGId(id!);
      setQna(pgQna || []);
    } catch (error) {
      console.error("Error submitting reply:", error);
      toast({
        title: "Error",
        description: "Failed to submit answer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleVote = async (reviewId: string, voteType: 'up' | 'down') => {
    if (!currentUser) {
      toast({
        title: "Login Required",
        description: "Please login to vote on reviews",
        variant: "destructive",
      });
      return;
    }

    try {
      await reviewsService.vote(reviewId, voteType);
      
      // Reload reviews to show updated vote counts
      const pgReviews = await reviewsService.getByPGId(id!);
      setReviews(pgReviews || []);
      
      toast({
        title: "Vote Recorded",
        description: `You ${voteType === 'up' ? 'upvoted' : 'downvoted'} this review`,
      });
    } catch (error) {
      console.error("Error voting:", error);
      toast({
        title: "Error",
        description: "Failed to record your vote. Please try again.",
        variant: "destructive",
      });
    }
  };

  const loadPGData = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const pg = await pgService.getById(id);
      if (pg) {
        setPgData(pg);
        
        // Track view
        trackMetric(id, 'views');
        
        // Get current user to check if they're the owner
        const user = await authService.getCurrentUser();
        
        // Add to recently viewed (only if user is not the owner)
        if (!user || user.id !== pg.owner_id) {
          addToRecentlyViewed({
            id: pg.id,
            name: pg.name,
            city: pg.city || pg.address?.city || '',
            rent: pg.rent,
            image: pg.images?.[0]
          });
        }
        
        // Load reviews
        const pgReviews = await reviewsService.getByPGId(id);
        setReviews(pgReviews || []);
        
        // Load Q&A
        const pgQna = await qnaService.getByPGId(id);
        setQna(pgQna || []);
        
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

  // Check if current user has already reviewed this PG
  const userHasReviewed = reviews.some(review => review.user_id === currentUser?.id);

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
        // Track save
        trackMetric(id, 'saves');
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

  // Parse amenities from pgData with color categories
  const getAmenityCategory = (amenity: string) => {
    const key = amenity.toLowerCase().replace(/ /g, '_');
    
    // Connectivity & Entertainment
    if (['wifi', 'wi-fi', 'tv', 'cable'].includes(key)) return 'connectivity';
    
    // Food & Kitchen
    if (['food', 'food_included', 'kitchen', 'fridge', 'mess'].includes(key)) return 'food';
    
    // Utilities
    if (['hot_water', 'water', 'electricity', 'power_backup', 'geyser'].includes(key)) return 'utilities';
    
    // Safety & Security
    if (['cctv', 'security', 'fire_safety', 'biometric'].includes(key)) return 'security';
    
    // Comfort
    if (['ac', 'cooler', 'fan', 'heater', 'ventilation'].includes(key)) return 'comfort';
    
    // Facilities
    if (['parking', 'gym', 'laundry', 'washing_machine', 'lift', 'elevator'].includes(key)) return 'facilities';
    
    // Room Features
    if (['attached_bathroom', 'balcony', 'cupboard', 'bed', 'table', 'chair'].includes(key)) return 'room';
    
    return 'other';
  };

  const getCategoryStyle = (category: string) => {
    const styles: Record<string, string> = {
      connectivity: 'bg-blue-100 text-blue-700 border-blue-200',
      food: 'bg-orange-100 text-orange-700 border-orange-200',
      utilities: 'bg-cyan-100 text-cyan-700 border-cyan-200',
      security: 'bg-red-100 text-red-700 border-red-200',
      comfort: 'bg-green-100 text-green-700 border-green-200',
      facilities: 'bg-purple-100 text-purple-700 border-purple-200',
      room: 'bg-pink-100 text-pink-700 border-pink-200',
      other: 'bg-gray-100 text-gray-700 border-gray-200',
    };
    return styles[category] || styles.other;
  };

  const amenities = (pgData.amenities || []).map((amenity: string) => {
    const label = amenity.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
    const category = getAmenityCategory(amenity);
    return { label, category, style: getCategoryStyle(category) };
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 flex-1">
        {/* Image Gallery */}
        <div className="mb-8">
          <div className="relative aspect-video bg-muted rounded-2xl overflow-hidden mb-4">
            {pgData.images && pgData.images.length > 0 ? (
              <img
                src={pgData.images[currentImage]?.startsWith('http') 
                  ? pgData.images[currentImage] 
                  : storageService.getPublicUrl("pg-images", pgData.images[currentImage])}
                alt={`${pgData.name} - Image ${currentImage + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
                }}
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
                    src={image?.startsWith('http') 
                      ? image 
                      : storageService.getPublicUrl("pg-images", image)}
                    alt={`Thumbnail ${i + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
                    }}
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
                  {currentUser?.id === pgData?.owner_id && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="default" 
                          size="icon"
                          onClick={() => navigate(`/edit-post/${id}`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Edit this PG</TooltipContent>
                    </Tooltip>
                  )}
                  
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
                <TabsTrigger value="charges">Hidden Charges</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
                <TabsTrigger value="qna">Q&A</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-lg">About This PG</h3>
                      {pgData.description && (
                        <Badge variant="secondary" className="gap-1">
                          <Sparkles className="h-3 w-3" />
                          AI Enhanced
                        </Badge>
                      )}
                    </div>
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
                          <p className="font-medium capitalize">
                            {pgData.gender_preference === 'male' ? 'Boys Only' : 
                             pgData.gender_preference === 'female' ? 'Girls Only' : 
                             pgData.gender_preference === 'both' ? 'Co-ed' : 
                             pgData.gender_preference || 'Any'}
                          </p>
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
                    {pgData && (
                      <TravelTimeEstimator 
                        pgLocation={
                          typeof pgData.address === 'string' 
                            ? pgData.address 
                            : (pgData.address?.street || pgData.address?.full || `${pgData.city}, ${pgData.state}`)
                        } 
                      />
                    )}
                    {!pgData && <p className="text-muted-foreground">Loading...</p>}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="charges" className="space-y-4">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Hidden Charges Analysis</h3>
                    <HiddenChargeDetector 
                      pgData={{
                        description: pgData.description || '',
                        rent: pgData.rent || 0,
                        deposit: pgData.deposit || 0,
                        amenities: pgData.amenities || [],
                        rules: typeof pgData.rules === 'object' 
                          ? (pgData.rules.customRules || '') 
                          : (pgData.rules || '')
                      }}
                    />
                  </CardContent>
                </Card>

                {/* Price Drop Alert */}
                {pgData && (
                  <PriceDropAlertSettings 
                    pgId={pgData.id}
                    currentRent={pgData.rent}
                    pgName={pgData.name}
                  />
                )}
              </TabsContent>

              <TabsContent value="amenities" className="space-y-4">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Included Amenities</h3>
                    {amenities.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {amenities.map((amenity, index) => (
                          <div
                            key={`${amenity.label}-${index}`}
                            className={`px-4 py-2 rounded-full border font-medium text-sm ${amenity.style}`}
                          >
                            {amenity.label}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">No amenities listed</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reviews" className="space-y-4">
                <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      className="w-full mb-4" 
                      disabled={!currentUser || userHasReviewed}
                    >
                      <Star className="h-4 w-4 mr-2" />
                      {userHasReviewed ? "You've Already Reviewed" : "Write a Review"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Write a Review</DialogTitle>
                      <DialogDescription>
                        Share your experience to help others make informed decisions
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Rating</Label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <button
                              key={rating}
                              type="button"
                              onClick={() => setReviewRating(rating)}
                              className="focus:outline-none"
                            >
                              <Star
                                className={`h-8 w-8 ${
                                  rating <= reviewRating
                                    ? "fill-accent text-accent"
                                    : "text-gray-300"
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="review">Your Review</Label>
                        <Textarea
                          id="review"
                          placeholder="Share your experience..."
                          value={reviewText}
                          onChange={(e) => setReviewText(e.target.value)}
                          rows={5}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="anonymous"
                          checked={reviewAnonymous}
                          onCheckedChange={setReviewAnonymous}
                        />
                        <Label htmlFor="anonymous">Post anonymously</Label>
                      </div>
                      <Button
                        onClick={handleSubmitReview}
                        disabled={submittingReview}
                        className="w-full"
                      >
                        {submittingReview ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {editingReview ? "Updating..." : "Submitting..."}
                          </>
                        ) : (
                          editingReview ? "Update Review" : "Submit Review"
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                {reviews.length > 0 && (
                  <SentimentSummary reviews={reviews} pgName={pgData?.name} />
                )}

                {reviews.length > 0 ? (
                  reviews.map((review) => (
                    <Card key={review.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>
                                {review.is_anonymous ? 'A' : (review.user?.full_name?.[0] || 'U')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold">
                                {review.is_anonymous ? 'Anonymous' : (review.user?.full_name || 'Anonymous')}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(review.created_at).toLocaleDateString()}
                                {review.updated_at && review.updated_at !== review.created_at && (
                                  <span className="ml-2">(edited)</span>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                              {[...Array(review.rating)].map((_, i) => (
                                <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                              ))}
                            </div>
                            {currentUser?.id === review.user_id && (
                              <div className="flex gap-1 ml-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleEditReview(review)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive"
                                  disabled={deletingReviewId === review.id}
                                  onClick={() => handleDeleteReview(review.id)}
                                >
                                  {deletingReviewId === review.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="text-muted-foreground mb-4">{review.review_text || review.comment}</p>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1"
                              onClick={() => handleVote(review.id, 'up')}
                            >
                              <ThumbsUp className="h-4 w-4" />
                              <span>{review.upvotes || 0}</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1"
                              onClick={() => handleVote(review.id, 'down')}
                            >
                              <ThumbsDown className="h-4 w-4" />
                              <span>{review.downvotes || 0}</span>
                            </Button>
                          </div>
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
                {qna.length > 0 ? (
                  qna.map((item) => (
                    <Card key={item.id}>
                      <CardContent className="p-6">
                        <div className="mb-4">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex items-start gap-3 flex-1">
                              <MessageCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="font-semibold">{item.question}</p>
                                <p className="text-sm text-muted-foreground">
                                  Asked by {item.user?.full_name || 'Anonymous'} · {new Date(item.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            {/* Show Reply button only to owner if not answered yet */}
                            {!item.answer && currentUser?.id === pgData.owner_id && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setReplyingToQuestion(item);
                                  setReplyDialogOpen(true);
                                }}
                              >
                                Reply
                              </Button>
                            )}
                          </div>
                        </div>
                        {item.answer && (
                          <div className="bg-secondary p-4 rounded-lg">
                            <p className="text-muted-foreground mb-2">{item.answer}</p>
                            <p className="text-sm text-muted-foreground">
                              — {item.answerer?.full_name || 'Owner'} · {new Date(item.answered_at).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                      <p className="text-muted-foreground">No questions yet. Be the first to ask!</p>
                    </CardContent>
                  </Card>
                )}
                
                <Dialog open={qnaDialogOpen} onOpenChange={setQnaDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Ask a Question
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Ask a Question</DialogTitle>
                      <DialogDescription>
                        Get answers from the property owner or community
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="question">Your Question</Label>
                        <Textarea
                          id="question"
                          placeholder="What would you like to know about this property?"
                          value={questionText}
                          onChange={(e) => setQuestionText(e.target.value)}
                          rows={4}
                        />
                      </div>
                      <Button
                        onClick={handleSubmitQuestion}
                        disabled={submittingQuestion}
                        className="w-full"
                      >
                        {submittingQuestion ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          "Submit Question"
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Reply Dialog for Owner */}
                <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Answer Question</DialogTitle>
                      <DialogDescription>
                        Provide an answer to help potential tenants
                      </DialogDescription>
                    </DialogHeader>
                    {replyingToQuestion && (
                      <div className="py-4 space-y-4">
                        <div className="bg-muted p-3 rounded-lg">
                          <p className="text-sm font-medium text-muted-foreground mb-1">Question:</p>
                          <p className="font-semibold">{replyingToQuestion.question}</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="answer">Your Answer</Label>
                          <Textarea
                            id="answer"
                            placeholder="Type your answer here..."
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            rows={4}
                          />
                        </div>
                        <Button
                          onClick={handleSubmitReply}
                          disabled={submittingReply}
                          className="w-full"
                        >
                          {submittingReply ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Posting Answer...
                            </>
                          ) : (
                            "Post Answer"
                          )}
                        </Button>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </TabsContent>
            </Tabs>

            {/* WhatsApp Community Section */}
            {pgData.whatsapp_group_link && (
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
                      <Button 
                        variant="outline" 
                        className="border-green-500 text-green-700 hover:bg-green-50"
                        onClick={() => {
                          let url = pgData.whatsapp_group_link;
                          // Ensure URL has proper protocol
                          if (!url.startsWith('http://') && !url.startsWith('https://')) {
                            url = 'https://' + url;
                          }
                          window.open(url, '_blank');
                        }}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Join WhatsApp Group
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 border-2">
              <CardContent className="p-6 space-y-6">
                <div>
                  <p className="text-3xl font-bold text-primary mb-2">
                    ₹{pgData.rent}<span className="text-base text-muted-foreground font-normal">/month</span>
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
                  <Button 
                    className="w-full" 
                    size="lg" 
                    variant="accent"
                    onClick={() => {
                      if (pgData?.owner?.phone) {
                        toast({
                          title: "Owner Contact",
                          description: `Phone: ${pgData.owner.phone}`,
                        });
                      } else {
                        toast({
                          title: "Contact Information",
                          description: "Contact details not available. Please use Chat Anonymously.",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Contact Owner
                  </Button>
                  <Button 
                    className="w-full" 
                    size="lg" 
                    variant="outline"
                    onClick={() => handleChatWithOwner()}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Chat Anonymously
                  </Button>
                  <Button 
                    className="w-full" 
                    size="lg" 
                    variant="outline"
                    onClick={() => handleChatWithOwner(`Hi! I'm interested in visiting ${pgData.name}. When would be a good time to schedule a visit?`)}
                  >
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
                    {pgData?.owner?.phone && (
                      <button
                        className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors cursor-pointer w-full"
                        onClick={() => {
                          navigator.clipboard.writeText(pgData.owner.phone);
                          toast({
                            title: "Copied!",
                            description: "Phone number copied to clipboard",
                          });
                        }}
                      >
                        <Phone className="h-4 w-4" />
                        <span className="hover:underline">{pgData.owner.phone}</span>
                      </button>
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
