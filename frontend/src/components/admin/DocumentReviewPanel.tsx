import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { FileText, CheckCircle, XCircle, Loader2, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { API_CONFIG } from '@/lib/api-config';
import { supabase } from '@/lib/supabase';

interface VerificationDocument {
  id: string;
  owner_id: string;
  owner: {
    full_name: string;
  };
  document_type: string;
  file_url: string;
  file_name: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export function DocumentReviewPanel({ adminId }: { adminId: string }) {
  const [documents, setDocuments] = useState<VerificationDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewingDoc, setReviewingDoc] = useState<VerificationDocument | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  const getSignedUrl = async (filePath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('verification-docs')
        .createSignedUrl(filePath, 3600); // 1 hour expiry
      
      if (error) throw error;
      return data.signedUrl;
    } catch (error) {
      console.error('Error generating signed URL:', error);
      return filePath; // Fallback to original path
    }
  };

  const handleViewDocument = async (filePath: string) => {
    const signedUrl = await getSignedUrl(filePath);
    window.open(signedUrl, '_blank');
  };

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_CONFIG.BACKEND_URL}/api/verification/documents?status=pending`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
      toast({
        title: 'Error',
        description: 'Failed to load documents',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (status: 'approved' | 'rejected') => {
    if (!reviewingDoc) return;

    try {
      setSubmitting(true);
      const response = await fetch(`${API_CONFIG.BACKEND_URL}/api/verification/documents/${reviewingDoc.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_id: adminId,
          status,
          review_notes: reviewNotes,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: `Document ${status}`,
        });
        setReviewingDoc(null);
        setReviewNotes('');
        loadDocuments();
      } else {
        throw new Error('Failed to review document');
      }
    } catch (error) {
      console.error('Error reviewing document:', error);
      toast({
        title: 'Error',
        description: 'Failed to review document',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Document Verification</h2>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : documents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No pending documents to review
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {documents.map((doc) => (
            <Card key={doc.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <Badge variant="outline">
                        {doc.document_type.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <Badge className="bg-yellow-500">Pending</Badge>
                    </div>

                    <div>
                      <p className="font-medium">{doc.owner.full_name}</p>
                      <p className="text-sm text-muted-foreground">{doc.file_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Uploaded: {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <Button
                      variant="link"
                      className="p-0 h-auto"
                      onClick={() => handleViewDocument(doc.file_url)}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Document
                    </Button>
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setReviewingDoc(doc)}
                      >
                        Review
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Review Document</DialogTitle>
                        <DialogDescription>
                          Review the uploaded verification document and approve or reject it.
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-medium mb-1">Owner:</p>
                          <p className="text-sm">{doc.owner.full_name}</p>
                        </div>

                        <div>
                          <p className="text-sm font-medium mb-1">Document Type:</p>
                          <Badge variant="outline">
                            {doc.document_type.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>

                        <div>
                          <p className="text-sm font-medium mb-1">File:</p>
                          <Button
                            variant="link"
                            className="p-0 h-auto"
                            onClick={() => handleViewDocument(doc.file_url)}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            {doc.file_name}
                          </Button>
                        </div>

                        <div>
                          <label className="text-sm font-medium">Review Notes</label>
                          <Textarea
                            value={reviewNotes}
                            onChange={(e) => setReviewNotes(e.target.value)}
                            placeholder="Add notes about your decision..."
                            rows={3}
                          />
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleReview('approved')}
                            disabled={submitting}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                          >
                            {submitting ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <CheckCircle className="h-4 w-4 mr-2" />
                            )}
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleReview('rejected')}
                            disabled={submitting}
                            variant="destructive"
                            className="flex-1"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
