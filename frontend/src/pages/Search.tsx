import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Star, Shield, Wifi, UtensilsCrossed, Droplets, Home, SlidersHorizontal, MessageCircle, Heart, Building2, Clock, Sparkles, Bell, SearchX } from "lucide-react";
import { Link } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const Search = () => {
  const [budget, setBudget] = useState([5000, 15000]);
  const [maxDistance, setMaxDistance] = useState([5]);
  const [showFilters, setShowFilters] = useState(false);

  const amenities = [
    { id: "wifi", label: "Wi-Fi", icon: Wifi },
    { id: "food", label: "Food Included", icon: UtensilsCrossed },
    { id: "water", label: "Hot Water", icon: Droplets },
    { id: "laundry", label: "Laundry", icon: Home },
  ];

  const pgListings = [
    { id: 1, name: "Sunshine PG for Boys", distance: "0.5 km from Delhi University", travelTime: "6 min walk", price: 8500, rating: 4.8, reviews: 42, verified: true, available: true, bedsAvailable: 3, amenities: ["Wi-Fi", "Food", "Hot Water"], matchScore: 95 },
    { id: 2, name: "Green Valley Ladies Hostel", distance: "1.2 km from Delhi University", travelTime: "15 min walk", price: 9500, rating: 4.6, reviews: 38, verified: true, available: true, bedsAvailable: 2, amenities: ["Wi-Fi", "Food", "Laundry"], matchScore: 88 },
    { id: 3, name: "Campus View PG", distance: "0.8 km from Delhi University", travelTime: "10 min walk", price: 7500, rating: 4.5, reviews: 56, verified: false, available: false, bedsAvailable: 0, amenities: ["Wi-Fi", "Hot Water"], matchScore: 75 },
  ];

  const FiltersContent = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-3">Budget Range</h3>
        <Slider value={budget} onValueChange={setBudget} min={2000} max={30000} step={500} className="mb-2" />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>₹{budget[0].toLocaleString()}</span>
          <span>₹{budget[1].toLocaleString()}</span>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Max Distance from College</h3>
        <Slider value={maxDistance} onValueChange={setMaxDistance} min={0.5} max={10} step={0.5} className="mb-2" />
        <p className="text-sm text-muted-foreground text-center">{maxDistance[0]} km</p>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Amenities</h3>
        <div className="space-y-2">
          {amenities.map((amenity) => (
            <div key={amenity.id} className="flex items-center space-x-2">
              <Checkbox id={amenity.id} />
              <Label htmlFor={amenity.id} className="flex items-center gap-2 cursor-pointer">
                <amenity.icon className="h-4 w-4" />
                {amenity.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Cleanliness Rating</h3>
        <Select><SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any</SelectItem>
            <SelectItem value="4">4+ Stars</SelectItem>
            <SelectItem value="4.5">4.5+ Stars</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Strictness / Curfew</h3>
        <Select><SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any</SelectItem>
            <SelectItem value="relaxed">Relaxed (No curfew)</SelectItem>
            <SelectItem value="moderate">Moderate (10-11 PM)</SelectItem>
            <SelectItem value="strict">Strict (Before 10 PM)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Gender Preference</h3>
        <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any</SelectItem>
            <SelectItem value="boys">Boys Only</SelectItem>
            <SelectItem value="girls">Girls Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Other Filters</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="verified">Verified Only</Label>
            <Switch id="verified" />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="available">Available Now</Label>
            <Switch id="available" />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-4">Find Your Perfect PG</h1>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input placeholder="Search by location, college, or area..." className="pl-10 h-12" />
            </div>
            <Select><SelectTrigger className="w-full md:w-[200px] h-12"><SelectValue placeholder="Sort by" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="match">Best Match</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="distance">Nearest First</SelectItem>
              </SelectContent>
            </Select>
            
            <Sheet open={showFilters} onOpenChange={setShowFilters}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="outline" size="lg"><SlidersHorizontal className="h-5 w-5 mr-2" />Filters</Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] overflow-y-auto">
                <SheetHeader><SheetTitle>Filters</SheetTitle></SheetHeader>
                <div className="mt-6"><FiltersContent /></div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="flex gap-6">
          <aside className="hidden md:block w-80 shrink-0">
            <Card className="sticky top-24 border-2">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Filters</h2>
                  <Button variant="ghost" size="sm">Clear All</Button>
                </div>
                <FiltersContent />
              </CardContent>
            </Card>
          </aside>

          <div className="flex-1">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-muted-foreground">{pgListings.length} properties found</p>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Bell className="h-4 w-4 mr-2" />
                    Set Alert
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Get notified when new PGs match your criteria</TooltipContent>
              </Tooltip>
            </div>
            
            <div className="space-y-4">
              {pgListings.length === 0 ? (
                /* Empty State */
                <Card className="border-dashed">
                  <CardContent className="p-12 text-center">
                    <SearchX className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
                    <h3 className="text-xl font-semibold mb-2">No PGs Found</h3>
                    <p className="text-muted-foreground mb-6">
                      Try adjusting your filters or search criteria to find more options
                    </p>
                    <div className="flex gap-3 justify-center">
                      <Button variant="outline">Clear Filters</Button>
                      <Button variant="default">Browse All PGs</Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                pgListings.map((pg) => (
                <Card key={pg.id} className={`overflow-hidden hover-lift border-2 transition-all ${pg.available ? 'hover:border-primary' : 'opacity-75'}`}>
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-72 h-48 md:h-auto bg-muted relative shrink-0">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                        <Building2 className="h-16 w-16 text-primary/40" />
                      </div>
                      {pg.verified && <Badge className="absolute top-4 left-4 bg-success"><Shield className="h-3 w-3 mr-1" />Verified</Badge>}
                      {pg.matchScore >= 90 && <Badge className="absolute top-4 right-12 bg-accent"><Sparkles className="h-3 w-3 mr-1" />{pg.matchScore}%</Badge>}
                      <Button variant="ghost" size="icon" className="absolute top-4 right-4 bg-white/80 hover:bg-white"><Heart className="h-4 w-4" /></Button>
                      {!pg.available && <div className="absolute inset-0 bg-background/60 flex items-center justify-center"><Badge variant="secondary">Currently Full</Badge></div>}
                    </div>
                    
                    <div className="flex-1 p-5">
                      <div className="flex items-start justify-between mb-2">
                        <Link to={`/pg/${pg.id}`}><h3 className="text-xl font-semibold hover:text-primary transition-colors">{pg.name}</h3></Link>
                        <div className="flex items-center gap-1">
                          <Star className="h-5 w-5 fill-accent text-accent" />
                          <span className="font-semibold">{pg.rating}</span>
                          <span className="text-sm text-muted-foreground">({pg.reviews})</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{pg.distance}</span>
                        <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{pg.travelTime}</span>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {pg.amenities.map((amenity) => <Badge key={amenity} variant="secondary">{amenity}</Badge>)}
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t">
                        <div>
                          <span className="text-2xl font-bold text-primary">₹{pg.price.toLocaleString()}</span>
                          <span className="text-sm text-muted-foreground">/month</span>
                          {pg.available && <Badge variant="secondary" className="ml-2 bg-success/10 text-success">{pg.bedsAvailable} beds</Badge>}
                        </div>
                        <div className="flex gap-2">
                          <Tooltip><TooltipTrigger asChild><Button variant="outline" size="sm"><MessageCircle className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Chat Anonymously</TooltipContent></Tooltip>
                          <Button size="sm" asChild><Link to={`/pg/${pg.id}`}>View Details</Link></Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Search;
