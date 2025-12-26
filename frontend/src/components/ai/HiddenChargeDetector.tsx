import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Info, Sparkles } from "lucide-react";

interface HiddenChargeDetectorProps {
  missingInfo?: string[];
  mentionedCharges?: string[];
  className?: string;
}

export const HiddenChargeDetector = ({
  missingInfo = [
    "Electricity charges not specified",
    "Maintenance fee details missing",
    "Food charges (if any) not mentioned",
    "Internet charges unclear",
  ],
  mentionedCharges = [
    "Monthly rent: ₹8,500",
    "Security deposit: ₹5,000",
  ],
  className,
}: HiddenChargeDetectorProps) => {
  return (
    <Card className={`border-accent ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-accent" />
          AI Hidden Charge Detector
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {missingInfo.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2 flex items-center gap-2 text-warning">
              <AlertTriangle className="h-4 w-4" />
              Missing Information ({missingInfo.length})
            </p>
            <div className="space-y-2">
              {missingInfo.map((info, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 text-sm text-muted-foreground bg-warning/5 p-2 rounded-lg"
                >
                  <Info className="h-4 w-4 shrink-0 mt-0.5 text-warning" />
                  <span>{info}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {mentionedCharges.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2 flex items-center gap-2 text-success">
              <CheckCircle className="h-4 w-4" />
              Mentioned Charges
            </p>
            <div className="flex flex-wrap gap-2">
              {mentionedCharges.map((charge, index) => (
                <Badge key={index} variant="secondary" className="bg-success/10 text-success">
                  {charge}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground italic">
          * AI analysis helps ensure pricing transparency. Ask the owner for clarification on missing details.
        </p>
      </CardContent>
    </Card>
  );
};
