import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Info, Sparkles, Loader2, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { API_CONFIG } from "@/lib/api-config";

interface HiddenChargeDetectorProps {
  pgData: {
    description?: string;
    rent?: number;
    deposit?: number;
    amenities?: string[];
    rules?: string | object;
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
      // Validate input data
      if (!pgData.rent || pgData.rent <= 0) {
        setChargeData({
          risk_level: "low",
          transparency_score: 0,
          potential_hidden_charges: [],
          missing_information: ["Rent not specified"],
          questions_to_ask: ["What is the monthly rent?"]
        });
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Prepare data with proper formatting
        const requestData = {
          description: pgData.description?.trim() || '',
          rent: Number(pgData.rent) || 0,
          deposit: Number(pgData.deposit) || 0,
          amenities: Array.isArray(pgData.amenities) ? pgData.amenities : [],
          rules: typeof pgData.rules === 'string' 
            ? pgData.rules 
            : typeof pgData.rules === 'object' 
              ? JSON.stringify(pgData.rules) 
              : ''
        };

        const response = await fetch(`${API_CONFIG.BACKEND_URL}/api/ai/hidden-charges`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestData),
        });

        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Validate response data
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid response format');
        }

        // Ensure all required fields with defaults
        const validatedData: HiddenChargeData = {
          risk_level: ['low', 'medium', 'high'].includes(data.risk_level) ? data.risk_level : 'medium',
          transparency_score: Math.min(100, Math.max(0, Number(data.transparency_score) || 50)),
          potential_hidden_charges: Array.isArray(data.potential_hidden_charges) 
            ? data.potential_hidden_charges.filter((c: any) => c.charge && c.reason)
            : [],
          missing_information: Array.isArray(data.missing_information) ? data.missing_information : [],
          questions_to_ask: Array.isArray(data.questions_to_ask) && data.questions_to_ask.length > 0
            ? data.questions_to_ask
            : ["Are electricity charges included?", "Are there any maintenance fees?"]
        };

        setChargeData(validatedData);
      } catch (err) {
        console.error('Hidden charge detection error:', err);
        setError('Unable to analyze charges');
      } finally {
        setLoading(false);
      }
    };

    detectCharges();
  }, [pgData.description, pgData.rent, pgData.deposit, pgData.amenities, pgData.rules]);

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
