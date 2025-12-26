import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sparkles, ThumbsUp, ThumbsDown, TrendingUp } from "lucide-react";

interface SentimentSummaryProps {
  overallSentiment: "positive" | "neutral" | "negative";
  sentimentScore: number;
  totalReviews: number;
  highlights: string[];
  concerns: string[];
  className?: string;
}

export const SentimentSummary = ({
  overallSentiment = "positive",
  sentimentScore = 85,
  totalReviews = 42,
  highlights = ["Food quality", "Cleanliness", "Staff behavior"],
  concerns = ["Wi-Fi speed during peak hours"],
  className,
}: SentimentSummaryProps) => {
  const sentimentConfig = {
    positive: { label: "Very Positive", color: "text-success", bgColor: "bg-success/10" },
    neutral: { label: "Neutral", color: "text-warning", bgColor: "bg-warning/10" },
    negative: { label: "Needs Improvement", color: "text-destructive", bgColor: "bg-destructive/10" },
  };

  const config = sentimentConfig[overallSentiment];

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
