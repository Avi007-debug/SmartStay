import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Info, Sparkles, Loader2, Shield } from "lucide-react";
import { useEffect, useState } from "react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

interface HiddenChargeDetectorProps {
  pgData: {
    description?: string;
    rent?: number;
    deposit?: number;
    amenities?: string[];
    rules?: string;
  };
  className?: string;
}

interface HiddenChargeData {
  risk_level: "low" | "medium" | "high";
  potential_hidden_charges: Array<{ charge: string; reason: string }>;
  missing_information: string[];
  questions_to_ask: string[];
  transparency_score: number;
}

export const HiddenChargeDetector = ({
  pgData,
  className,
}: HiddenChargeDetectorProps) => {
  const [loading, setLoading] = useState(true);
  const [chargeData, setChargeData] = useState<HiddenChargeData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const detectCharges = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${BACKEND_URL}/api/ai/hidden-charges`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pgData),
        });

        if (!response.ok) throw new Error('Failed to detect hidden charges');
        
        const data = await response.json();
        setChargeData(data);
      } catch (err) {
        console.error('Hidden charge detection error:', err);
        setError('Unable to analyze charges');
      } finally {
        setLoading(false);
      }
    };

    detectCharges();
  }, [pgData]);

  if (loading) {
    return (
      <Card className={`border-accent ${className}`}>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </CardContent>
      </Card>
    );
  }

  if (error || !chargeData) {
    return null;
  }

  const riskConfig = {
    low: { color: "text-success", bgColor: "bg-success/10", label: "Low Risk" },
    medium: { color: "text-warning", bgColor: "bg-warning/10", label: "Medium Risk" },
    high: { color: "text-destructive", bgColor: "bg-destructive/10", label: "High Risk" },
  };

  const config = riskConfig[chargeData.risk_level];

  return (
    <Card className={`border-accent ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-accent" />
            AI Hidden Charge Detector
          </CardTitle>
          <div className="flex items-center gap-2">
            <Shield className={`h-4 w-4 ${config.color}`} />
            <Badge className={`${config.bgColor} ${config.color}`}>
              {config.label}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Transparency Score */}
        <div className="flex items-center justify-between p-3 bg-accent/5 rounded-lg">
          <span className="text-sm font-medium">Transparency Score</span>
          <span className="text-2xl font-bold text-primary">{chargeData.transparency_score}/100</span>
        </div>

        {/* Potential Hidden Charges */}
        {chargeData.potential_hidden_charges.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2 flex items-center gap-2 text-warning">
              <AlertTriangle className="h-4 w-4" />
              Potential Hidden Charges ({chargeData.potential_hidden_charges.length})
            </p>
            <div className="space-y-2">
              {chargeData.potential_hidden_charges.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 text-sm bg-warning/5 p-2 rounded-lg"
                >
                  <Info className="h-4 w-4 shrink-0 mt-0.5 text-warning" />
                  <div>
                    <p className="font-medium">{item.charge}</p>
                    <p className="text-xs text-muted-foreground">{item.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Missing Information */}
        {chargeData.missing_information.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2 flex items-center gap-2">
              <Info className="h-4 w-4" />
              Missing Information
            </p>
            <div className="flex flex-wrap gap-2">
              {chargeData.missing_information.map((info, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {info}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Questions to Ask */}
        {chargeData.questions_to_ask.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2 flex items-center gap-2 text-primary">
              <CheckCircle className="h-4 w-4" />
              Questions to Ask Owner
            </p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {chargeData.questions_to_ask.map((question, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>{question}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-xs text-muted-foreground italic">
          * AI analysis helps ensure pricing transparency. Always verify costs before booking.
        </p>
      </CardContent>
    </Card>
  );
};
