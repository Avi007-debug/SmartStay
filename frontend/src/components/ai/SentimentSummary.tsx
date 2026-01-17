import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sparkles, ThumbsUp, ThumbsDown, TrendingUp, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { API_CONFIG } from "@/lib/api-config";

interface SentimentSummaryProps {
  reviews: any[];
  pgName?: string;
  className?: string;
}

interface SentimentData {
  overall_sentiment: "positive" | "neutral" | "negative";
  positive_count: number;
  negative_count: number;
  neutral_count: number;
  insights: string;
  keywords: {
    positive: string[];
    negative: string[];
  };
}

export const SentimentSummary = ({
  reviews = [],
  pgName = "this property",
  className,
}: SentimentSummaryProps) => {
  const [loading, setLoading] = useState(true);
  const [sentimentData, setSentimentData] = useState<SentimentData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSentiment = async () => {
      if (!reviews || reviews.length === 0) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`${API_CONFIG.BACKEND_URL}/api/ai/sentiment-analysis`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reviews, pg_name: pgName }),
        });

        if (!response.ok) throw new Error('Failed to analyze sentiment');
        
        const data = await response.json();
        setSentimentData(data);
      } catch (err) {
        console.error('Sentiment analysis error:', err);
        setError('Unable to analyze reviews');
      } finally {
        setLoading(false);
      }
    };

    fetchSentiment();
  }, [reviews, pgName]);

  if (loading) {
    return (
      <Card className={`border-accent/50 bg-accent/5 ${className}`}>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </CardContent>
      </Card>
    );
  }

  if (error || !sentimentData) {
    return null;
  }

  const totalReviews = reviews.length;
  const sentimentScore = Math.round((sentimentData.positive_count / totalReviews) * 100);
  const sentimentConfig = {
    positive: { label: "Very Positive", color: "text-success", bgColor: "bg-success/10" },
    neutral: { label: "Neutral", color: "text-warning", bgColor: "bg-warning/10" },
    negative: { label: "Needs Improvement", color: "text-destructive", bgColor: "bg-destructive/10" },
  };

  const config = sentimentConfig[sentimentData.overall_sentiment];
  const highlights = sentimentData.keywords.positive;
  const concerns = sentimentData.keywords.negative;

  return (
    <Card className={`border-accent/50 bg-accent/5 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-accent" />
          AI Sentiment Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Based on {totalReviews} reviews</p>
            <p className={`text-lg font-semibold ${config.color}`}>{config.label}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-primary">{sentimentScore}%</p>
            <p className="text-xs text-muted-foreground">Satisfaction Score</p>
          </div>
        </div>

        <Progress value={sentimentScore} className="h-2" />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium mb-2 flex items-center gap-2 text-success">
              <ThumbsUp className="h-4 w-4" />
              Highlights
            </p>
            <div className="space-y-1">
              {highlights.map((item, index) => (
                <Badge key={index} variant="secondary" className="bg-success/10 text-success block w-fit">
                  {item}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium mb-2 flex items-center gap-2 text-warning">
              <TrendingUp className="h-4 w-4" />
              Areas to Improve
            </p>
            <div className="space-y-1">
              {concerns.map((item, index) => (
                <Badge key={index} variant="secondary" className="bg-warning/10 text-warning block w-fit">
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
