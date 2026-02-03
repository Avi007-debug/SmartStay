import { useState, useEffect } from "react";
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
import { pgService, storageService } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { PGCardSkeleton } from "@/components/SkeletonLoaders";

const Search = () => {
  const { toast } = useToast();
  const [budget, setBudget] = useState([5000, 15000]);
  const [maxDistance, setMaxDistance] = useState([5]);
  const [showFilters, setShowFilters] = useState(false);
  const [pgListings, setPgListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchCity, setSearchCity] = useState("");
  const [selectedGender, setSelectedGender] = useState<string>("any");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>("match");
  const [cleanlinessRating, setCleanlinessRating] = useState<string>("any");
  const [strictnessLevel, setStrictnessLevel] = useState<string>("any");

  const amenities = [
    { id: "Wi-Fi", label: "Wi-Fi", icon: Wifi },
    { id: "Food", label: "Food Included", icon: UtensilsCrossed },
    { id: "Hot Water", label: "Hot Water", icon: Droplets },
    { id: "Laundry", label: "Laundry", icon: Home },
  ];

  useEffect(() => {
    loadPGListings();
  }, [budget, selectedGender, verifiedOnly, availableOnly, selectedAmenities, searchCity, maxDistance, cleanlinessRating, strictnessLevel]);

  const loadPGListings = async () => {
    try {
      setLoading(true);
      const filters: any = {
        minRent: budget[0],
        maxRent: budget[1],
      };

      if (searchCity) {
        filters.city = searchCity;
      }

      if (selectedGender !== "any") {
        // Map frontend values to database values
        const genderMap: { [key: string]: string } = {
          'male': 'boys',
          'female': 'girls',
          'boys': 'boys',
          'girls': 'girls'
        };
        filters.gender = genderMap[selectedGender] || selectedGender;
      }

      if (verifiedOnly) {
        filters.verified = true;
      }

      if (availableOnly) {
        filters.available = true;
      }

      if (selectedAmenities.length > 0) {
        filters.amenities = selectedAmenities;
      }

      if (maxDistance[0] < 10) {
        filters.maxDistance = maxDistance[0];
      }

      if (cleanlinessRating !== "any") {
        filters.minCleanlinessRating = parseFloat(cleanlinessRating);
      }

      if (strictnessLevel !== "any") {
        filters.strictnessLevel = strictnessLevel;
      }

      // Fetch all listings, including inactive ones to show as 'Not Available'
      const data = await pgService.getAll({ ...filters, status: null as any });
      setPgListings(data);
    } catch (error) {
      console.error('Error loading PG listings:', error);
      toast({
        title: "Error",
        description: "Failed to load PG listings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadPGListings();
  };

  const handleClearFilters = () => {
    setBudget([5000, 15000]);
    setMaxDistance([5]);
    setSelectedGender("any");
    setVerifiedOnly(false);
    setAvailableOnly(false);
    setSelectedAmenities([]);
    setSearchCity("");
    setCleanlinessRating("any");
    setStrictnessLevel("any");
  };

  const toggleAmenity = (amenityId: string) => {
    setSelectedAmenities(prev => 
      prev.includes(amenityId) 
        ? prev.filter(id => id !== amenityId)
        : [...prev, amenityId]
    );
  };

  const getSortedListings = () => {
    const sorted = [...pgListings];
    
    switch (sortBy) {
      case "price-low":
        return sorted.sort((a, b) => (a.rent || 0) - (b.rent || 0));
      case "price-high":
        return sorted.sort((a, b) => (b.rent || 0) - (a.rent || 0));
      case "rating":
        return sorted.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
      case "distance":
        return sorted.sort((a, b) => (a.distance_from_college || 999) - (b.distance_from_college || 999));
      case "match":
      default:
        return sorted;
    }
  };

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
              <Checkbox 
                id={amenity.id} 
                checked={selectedAmenities.includes(amenity.id)}
                onCheckedChange={() => toggleAmenity(amenity.id)}
              />
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
        <Select value={cleanlinessRating} onValueChange={setCleanlinessRating}>
          <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any</SelectItem>
            <SelectItem value="4">4+ Stars</SelectItem>
            <SelectItem value="5">5 Stars</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Strictness / Curfew</h3>
        <Select value={strictnessLevel} onValueChange={setStrictnessLevel}>
          <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
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
        <Select value={selectedGender} onValueChange={setSelectedGender}>
          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any</SelectItem>
            <SelectItem value="male">Boys Only</SelectItem>
            <SelectItem value="female">Girls Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Other Filters</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="verified">Verified Only</Label>
            <Switch id="verified" checked={verifiedOnly} onCheckedChange={setVerifiedOnly} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="available">Available Now</Label>
            <Switch id="available" checked={availableOnly} onCheckedChange={setAvailableOnly} />
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
              <Input 
                placeholder="Search by location, college, or area..." 
                className="pl-10 h-12" 
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-[200px] h-12">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
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
                  <Button variant="ghost" size="sm" onClick={handleClearFilters}>Clear All</Button>
                </div>
                <FiltersContent />
              </CardContent>
            </Card>
          </aside>

          <div className="flex-1">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-muted-foreground">
                {loading ? "Loading..." : `${pgListings.length} properties found`}
              </p>
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
            
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <PGCardSkeleton key={i} />
                ))}
              </div>
            ) : (
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
                      <Button variant="outline" onClick={handleClearFilters}>Clear Filters</Button>
                      <Button variant="default" asChild><Link to="/">Browse All PGs</Link></Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                getSortedListings().map((pg) => (
                <Card key={pg.id} className={`overflow-hidden hover-lift border-2 transition-all ${(pg.is_available && pg.status === 'active') ? 'hover:border-primary' : 'opacity-75'}`}>
                  <div className="flex flex-col md:flex-row">
                    {/* Fixed-size image container: 240px × 180px */}
                    <div className="w-full md:w-60 h-45 md:h-45 bg-gray-100 relative shrink-0 overflow-hidden rounded-l-lg">
                      {/* Image - will be hidden if it fails to load */}
                      {pg.images && pg.images.length > 0 && (
                        <img
                          src={pg.images[0].startsWith('http') 
                            ? pg.images[0] 
                            : storageService.getPublicUrl("pg-images", pg.images[0])}
                          alt={pg.name}
                          className="absolute inset-0 w-full h-full object-cover z-10"
                          onError={(e) => {
                            // Hide broken image to reveal placeholder
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                      {/* Fallback placeholder - always rendered behind the image */}
                      <div className="absolute inset-0 bg-gray-100 flex flex-col items-center justify-center gap-2 z-0">
                        <Building2 className="h-12 w-12 text-gray-300" />
                        <span className="text-xs text-gray-400">No Image</span>
                      </div>
                      {pg.is_verified && <Badge className="absolute top-3 left-3 bg-success shadow-sm z-20"><Shield className="h-3 w-3 mr-1" />Verified</Badge>}
                      <Button variant="ghost" size="icon" className="absolute top-3 right-3 bg-white/90 hover:bg-white shadow-sm z-20"><Heart className="h-4 w-4" /></Button>
                      {(pg.status !== 'active' || !pg.is_available) && (
                        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center z-30">
                          <Badge variant="secondary" className="bg-destructive/80 text-white">
                            {pg.status !== 'active' ? 'Not Available' : 'Currently Full'}
                          </Badge>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 p-5">
                      <div className="flex items-start justify-between mb-2">
                        <Link to={`/pg/${pg.id}`}><h3 className="text-xl font-semibold hover:text-primary transition-colors">{pg.name}</h3></Link>
                        <div className="flex items-center gap-1">
                          <Star className="h-5 w-5 fill-accent text-accent" />
                          <span className="font-semibold">{pg.average_rating?.toFixed(1) || 'N/A'}</span>
                          <span className="text-sm text-muted-foreground">({pg.total_reviews || 0})</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {pg.address?.city || 'Location'}, {pg.address?.area || ''}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {pg.amenities?.slice(0, 4).map((amenity: string) => <Badge key={amenity} variant="secondary">{amenity}</Badge>)}
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t">
                        <div>
                          <span className="text-2xl font-bold text-primary">₹{pg.rent?.toLocaleString()}</span>
                          <span className="text-sm text-muted-foreground">/month</span>
                          {pg.is_available && <Badge variant="secondary" className="ml-2 bg-success/10 text-success">{pg.available_beds} beds</Badge>}
                        </div>
                        <div className="flex gap-2">
                          <Tooltip><TooltipTrigger asChild><Button variant="outline" size="sm"><MessageCircle className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Chat with Owner</TooltipContent></Tooltip>
                          <Button size="sm" asChild><Link to={`/pg/${pg.id}`}>View Details</Link></Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
              )}
            </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Search;
