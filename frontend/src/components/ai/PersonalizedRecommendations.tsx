import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RecommendationCard } from "./RecommendationCard";
import { Loader2, Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { pgService, authService, supabase } from "@/lib/supabase";
import { API_CONFIG } from "@/lib/api-config";

interface Recommendation {
  pg_id: string;
  match_score: number;
  match_reasons: string[];
}

export const PersonalizedRecommendations = () => {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      
      // Get user profile with preferences
      const user = await authService.getCurrentUser();
      if (!user) {
        throw new Error("Please log in to see recommendations");
      }

      // Get user profile data (includes preferences)
      const { data: profile } = await supabase
        .from('profiles')
        .select('preferences')
        .eq('id', user.id)
        .single();

      // Get available PGs
      const allPGs = await pgService.getAll();
      
      // Get user's saved PGs and recently viewed (for history)
      // This would come from your backend in a real implementation
      const userHistory = {
        recently_viewed: [], // Could track this in localStorage or backend
        saved_pgs: [],
        search_patterns: []
      };

      // Call AI recommendations endpoint
      const response = await axios.post(`${API_CONFIG.BACKEND_URL}/api/ai/personalized-recommendations`, {
        user_preferences: profile?.preferences || {
          budget: { min: 5000, max: 15000 },
          amenities: [],
          gender: "any",
          strictnessTolerance: "moderate"
        },
        available_pgs: allPGs.slice(0, 50), // Limit to avoid token overload
        user_history: userHistory
      });

      if (response.data.recommendations) {
        // Match recommendations with full PG data
        const recommendedPGs = response.data.recommendations
          .map((rec: Recommendation) => {
            const pg = allPGs.find(p => p.id === rec.pg_id);
            if (!pg) return null;
            
            return {
              id: pg.id,
              name: pg.name,
              price: pg.rent,
              rating: pg.average_rating || 4.0,
              distance: `${Math.random() * 5 + 0.5}km`, // Would come from actual distance calculation
              verified: pg.is_verified || false,
              matchScore: rec.match_score,
              matchReasons: rec.match_reasons
            };
          })
          .filter(Boolean); // Remove nulls

        setRecommendations(recommendedPGs);
      }
    } catch (error: any) {
      console.error("Error loading recommendations:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load recommendations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadRecommendations();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            AI-Powered Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            AI-Powered Recommendations
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {recommendations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>No recommendations available yet.</p>
            <p className="text-sm">Update your preferences to get personalized suggestions!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recommendations.map((rec) => (
              <RecommendationCard key={rec.id} {...rec} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
