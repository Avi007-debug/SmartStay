import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, DollarSign, Shield, Star, TrendingUp, CheckCircle, Users, Building2 } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  const features = [
    {
      icon: Shield,
      title: "Verified Listings",
      description: "All PGs are verified with proper documentation and badges",
    },
    {
      icon: Star,
      title: "Honest Reviews",
      description: "Real reviews from students with sentiment-based summaries",
    },
    {
      icon: DollarSign,
      title: "Transparent Pricing",
      description: "No hidden charges detector ensures complete transparency",
    },
    {
      icon: MapPin,
      title: "Location Based",
      description: "Find PGs near your college with accurate distance calculations",
    },
  ];

  const testimonials = [
    {
      name: "Priya Sharma",
      college: "Delhi University",
      rating: 5,
      text: "Found the perfect PG within a day! The verified badge gave me confidence.",
    },
    {
      name: "Rahul Kumar",
      college: "IIT Bombay",
      rating: 5,
      text: "Anonymous chat feature helped me ask all my questions before visiting.",
    },
    {
      name: "Aisha Khan",
      college: "BITS Pilani",
      rating: 5,
      text: "The hidden charge detector saved me from a bad deal. Highly recommend!",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden gradient-hero py-20 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center text-white animate-fade-in-up">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Find Your Perfect PG
              <br />
              <span className="text-accent-foreground">Near Your College</span>
            </h1>
            <p className="text-lg md:text-xl mb-8 text-white/90">
              Verified listings, transparent pricing, and honest reviews from real students
            </p>
            
            {/* Search Bar */}
            <div className="bg-white rounded-2xl shadow-2xl p-4 md:p-6 max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                  <Input
                    placeholder="College or Location"
                    className="pl-10 h-12 border-2 text-foreground"
                  />
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                  <Input
                    placeholder="PG Name or Area"
                    className="pl-10 h-12 border-2 text-foreground"
                  />
                </div>
                <Button variant="accent" size="lg" className="h-12 w-full" asChild>
                  <Link to="/search">Search PGs</Link>
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <Badge variant="secondary" className="bg-white/20 text-white border-0 hover:bg-white/30 px-4 py-2">
                <CheckCircle className="h-4 w-4 mr-2" />
                500+ Verified PGs
              </Badge>
              <Badge variant="secondary" className="bg-white/20 text-white border-0 hover:bg-white/30 px-4 py-2">
                <Users className="h-4 w-4 mr-2" />
                10,000+ Happy Students
              </Badge>
              <Badge variant="secondary" className="bg-white/20 text-white border-0 hover:bg-white/30 px-4 py-2">
                <TrendingUp className="h-4 w-4 mr-2" />
                95% Satisfaction Rate
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-subtle">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose SmartStay?</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              We make finding accommodation easy, safe, and transparent
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="hover-lift border-2 hover:border-primary animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-6 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full gradient-hero mx-auto mb-4">
                    <feature.icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured PGs Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-2">Featured PGs</h2>
              <p className="text-muted-foreground">Handpicked accommodations for you</p>
            </div>
            <Button variant="outline" asChild>
              <Link to="/search">View All</Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((item) => (
              <Link key={item} to="/pg/1">
                <Card className="overflow-hidden hover-lift border-2 hover:border-primary cursor-pointer">
                  <div className="aspect-video bg-muted relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      <Building2 className="h-16 w-16 text-primary/40" />
                    </div>
                    <Badge className="absolute top-4 right-4 bg-success">
                      <Shield className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  </div>
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg">Sunshine PG for Boys</h3>
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="h-4 w-4 fill-accent text-accent" />
                        <span className="font-semibold">4.8</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3 flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      0.5 km from Delhi University
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold text-primary">₹8,500<span className="text-sm text-muted-foreground font-normal">/month</span></span>
                      <Badge variant="secondary">Available</Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gradient-subtle">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What Students Say</h2>
            <p className="text-muted-foreground text-lg">Real experiences from real students</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-2 hover:border-primary transition-colors">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-accent text-accent" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4 italic">"{testimonial.text}"</p>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.college}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-transparent"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Find Your Perfect Stay?</h2>
            <p className="text-lg mb-8 text-white/90">
              Join thousands of students who found their ideal accommodation
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="accent" size="xl" asChild>
                <Link to="/search">Browse PGs</Link>
              </Button>
              <Button variant="outline" size="xl" className="bg-white/10 border-white text-white hover:bg-white hover:text-primary" asChild>
                <Link to="/post-room">List Your Property</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
