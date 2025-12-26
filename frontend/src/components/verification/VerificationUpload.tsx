import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Shield,
  X 
} from "lucide-react";

interface Document {
  id: string;
  name: string;
  description: string;
  required: boolean;
  status: "pending" | "uploaded" | "verified" | "rejected";
}

export const VerificationUpload = () => {
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: "trade",
      name: "Trade License / Occupancy Certificate",
      description: "Proof of legal business operation",
      required: true,
      status: "pending",
    },
    {
      id: "establishment",
      name: "Shop & Establishment Registration",
      description: "Business registration certificate",
      required: true,
      status: "uploaded",
    },
    {
      id: "fire",
      name: "Fire Safety NOC",
      description: "Fire department approval (optional)",
      required: false,
      status: "pending",
    },
    {
      id: "identity",
      name: "Owner ID Proof",
      description: "Aadhar/PAN/Passport",
      required: true,
      status: "verified",
    },
  ]);

  const getStatusBadge = (status: Document["status"]) => {
    switch (status) {
      case "verified":
        return (
          <Badge className="bg-success">
            <CheckCircle className="h-3 w-3 mr-1" />
            Verified
          </Badge>
        );
      case "uploaded":
        return (
          <Badge variant="secondary" className="bg-warning/10 text-warning">
            <Clock className="h-3 w-3 mr-1" />
            Under Review
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Upload className="h-3 w-3 mr-1" />
            Upload Required
          </Badge>
        );
    }
  };

  const verifiedCount = documents.filter((d) => d.status === "verified").length;
  const requiredCount = documents.filter((d) => d.required).length;
  const progress = (verifiedCount / requiredCount) * 100;

  const handleUpload = (id: string) => {
    setDocuments(
      documents.map((doc) =>
        doc.id === id ? { ...doc, status: "uploaded" as const } : doc
      )
    );
  };

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Verification Documents
            </CardTitle>
            <CardDescription>
              Upload documents to get your verified owner badge
            </CardDescription>
          </div>
          {progress === 100 ? (
            <Badge className="bg-success">
              <Shield className="h-3 w-3 mr-1" />
              Fully Verified
            </Badge>
          ) : (
            <Badge variant="secondary">
              {verifiedCount}/{requiredCount} Complete
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Verification Progress</span>
            <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="space-y-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 shrink-0">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">
                    {doc.name}
                    {doc.required && <span className="text-destructive ml-1">*</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">{doc.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {getStatusBadge(doc.status)}
                {doc.status === "pending" && (
                  <Button size="sm" onClick={() => handleUpload(doc.id)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
                )}
                {doc.status === "uploaded" && (
                  <Button size="sm" variant="ghost">
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-primary/5 p-4 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Why get verified?</strong> Verified owners
            receive a badge on their listings, increasing tenant trust and inquiries by up to 3x.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
