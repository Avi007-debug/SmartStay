import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MapPin, Shield, Sparkles, Heart, Building2 } from "lucide-react";
import { Link } from "react-router-dom";

interface RecommendationCardProps {
  id: number;
  name: string;
  price: number;
  rating: number;
  distance: string;
  verified: boolean;
  matchScore: number;
  matchReasons: string[];
}

export const RecommendationCard = ({
  id,
  name,
  price,
  rating,
  distance,
  verified,
  matchScore,
  matchReasons,
}: RecommendationCardProps) => {
  return (
    <Card className="overflow-hidden hover-lift border-2 hover:border-primary transition-all">
      <div className="flex flex-col md:flex-row">
        <div className="md:w-48 h-36 bg-muted relative shrink-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <Building2 className="h-12 w-12 text-primary/40" />
          </div>
          {verified && (
            <Badge className="absolute top-2 left-2 bg-success text-xs">
              <Shield className="h-3 w-3 mr-1" />
              Verified
            </Badge>
          )}
          <div className="absolute top-2 right-2 bg-accent text-accent-foreground px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            {matchScore}% Match
          </div>
        </div>
        
        <CardContent className="flex-1 p-4">
          <div className="flex items-start justify-between mb-2">
            <Link to={`/pg/${id}`}>
              <h3 className="font-semibold hover:text-primary transition-colors">{name}</h3>
            </Link>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-accent text-accent" />
              <span className="text-sm font-medium">{rating}</span>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
            <MapPin className="h-3 w-3" />
            {distance}
          </p>
          
          <div className="flex flex-wrap gap-1 mb-3">
            {matchReasons.map((reason, index) => (
              <Badge key={index} variant="secondary" className="text-xs bg-primary/10 text-primary">
                {reason}
              </Badge>
            ))}
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-primary">₹{price.toLocaleString()}/mo</span>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon">
                <Heart className="h-4 w-4" />
              </Button>
              <Button size="sm" asChild>
                <Link to={`/pg/${id}`}>View</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
};
