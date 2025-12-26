import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

const PGDetail = () => {
  const [currentImage, setCurrentImage] = useState(0);
  const totalImages = 5;

  const amenities = [
    { icon: Wifi, label: "High-Speed Wi-Fi" },
    { icon: UtensilsCrossed, label: "3 Meals Included" },
    { icon: Droplets, label: "24/7 Hot Water" },
    { icon: Home, label: "Laundry Service" },
  ];

  const reviews = [
    {
      id: 1,
      author: "Priya S.",
      rating: 5,
      date: "2 days ago",
      text: "Excellent PG with great facilities. The food is amazing and the staff is very helpful. Highly recommend for female students!",
      helpful: 12,
    },
    {
      id: 2,
      author: "Rahul M.",
      rating: 4,
      date: "1 week ago",
      text: "Good location and clean rooms. Wi-Fi speed could be better but overall a great place to stay.",
      helpful: 8,
    },
  ];

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
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
              <Building2 className="h-32 w-32 text-white/40" />
            </div>
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
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
              {currentImage + 1} / {totalImages}
            </div>
          </div>
          
          <div className="grid grid-cols-5 gap-2">
            {[...Array(5)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentImage(i)}
                className={`aspect-video bg-muted rounded-lg overflow-hidden border-2 transition-all ${
                  currentImage === i ? "border-primary" : "border-transparent"
                }`}
              >
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20"></div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold">Sunshine PG for Boys</h1>
                    <Badge className="bg-success">
                      <Shield className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  </div>
                  <p className="text-muted-foreground flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4" />
                    0.5 km from Delhi University, Kamla Nagar, Delhi
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Star className="h-5 w-5 fill-accent text-accent" />
                      <span className="font-semibold">4.8</span>
                      <span className="text-sm text-muted-foreground">(42 reviews)</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon">
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <Separator />

            {/* Tabs */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="amenities">Amenities</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
                <TabsTrigger value="qna">Q&A</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">About This PG</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Welcome to Sunshine PG, a well-maintained and comfortable accommodation for male students and working professionals. 
                      Located in the heart of Kamla Nagar, just walking distance from Delhi University. We provide a homely environment 
                      with all modern amenities including high-speed Wi-Fi, nutritious meals, and 24/7 security.
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
                          <p className="font-medium">Boys Only</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Bed className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">Available Beds</p>
                          <p className="font-medium">3 beds</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">Curfew Time</p>
                          <p className="font-medium">10:00 PM</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Home className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">Room Type</p>
                          <p className="font-medium">Sharing (2-3)</p>
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
                {reviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>{review.author[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">{review.author}</p>
                            <p className="text-sm text-muted-foreground">{review.date}</p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {[...Array(review.rating)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                          ))}
                        </div>
                      </div>
                      <p className="text-muted-foreground mb-4">{review.text}</p>
                      <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm">
                          <ThumbsUp className="h-4 w-4 mr-2" />
                          Helpful ({review.helpful})
                        </Button>
                        <Button variant="ghost" size="sm">
                          <ThumbsDown className="h-4 w-4 mr-2" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Flag className="h-4 w-4 mr-2" />
                          Report
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="qna" className="space-y-4">
                {qna.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-6">
                      <div className="mb-4">
                        <p className="font-semibold text-lg mb-2">{item.question}</p>
                        <p className="text-sm text-muted-foreground">Asked by {item.askedBy} • {item.date}</p>
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
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 border-2">
              <CardContent className="p-6 space-y-6">
                <div>
                  <p className="text-3xl font-bold text-primary mb-2">
                    ₹8,500<span className="text-base text-muted-foreground font-normal">/month</span>
                  </p>
                  <Badge variant="secondary" className="bg-success/10 text-success">
                    3 beds available
                  </Badge>
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
                      <AvatarFallback className="bg-primary text-primary-foreground">RK</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">Rajesh Kumar</p>
                      <Badge variant="secondary" className="text-xs">
                        <Shield className="h-3 w-3 mr-1" />
                        Verified Owner
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>+91 98765 43210</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span>rajesh@example.com</span>
                    </div>
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
