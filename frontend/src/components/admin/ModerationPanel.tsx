import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Flag, CheckCircle, XCircle, Eye, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { API_CONFIG } from '@/lib/api-config';

interface ContentReport {
  id: string;
  reporter_id: string;
  content_type: 'listing' | 'review' | 'user' | 'message';
  content_id: string;
  reason: string;
  description: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  created_at: string;
  reporter: {
    full_name: string;
  };
}

export function ModerationPanel({ adminId }: { adminId: string }) {
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('pending');
  const [reviewingReport, setReviewingReport] = useState<ContentReport | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [contentAction, setContentAction] = useState<'none' | 'warn' | 'remove'>('none');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadReports();
  }, [filterStatus]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus && filterStatus !== 'all') {
        params.append('status', filterStatus);
      }

      const response = await fetch(`${API_CONFIG.BACKEND_URL}/api/reports?${params}`);
      if (response.ok) {
        const data = await response.json();
        setReports(data);
      }
    } catch (error) {
      console.error('Error loading reports:', error);
      toast({
        title: 'Error',
        description: 'Failed to load reports',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (action: 'resolve' | 'dismiss') => {
    if (!reviewingReport) return;

    try {
      setSubmitting(true);
      const response = await fetch(`${API_CONFIG.BACKEND_URL}/api/reports/${reviewingReport.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_id: adminId,
          action,
          resolution_notes: resolutionNotes,
          content_action: contentAction,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: `Report ${action}d successfully`,
        });
        setReviewingReport(null);
        setResolutionNotes('');
        setContentAction('none');
        loadReports();
      } else {
        throw new Error('Failed to review report');
      }
    } catch (error) {
      console.error('Error reviewing report:', error);
      toast({
        title: 'Error',
        description: 'Failed to review report',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getReasonBadgeColor = (reason: string) => {
    switch (reason) {
      case 'spam': return 'bg-yellow-500';
      case 'fraud': return 'bg-red-600';
      case 'harassment': return 'bg-red-500';
      case 'misleading_info': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Content Moderation</h2>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Reports</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="reviewing">Under Review</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="dismissed">Dismissed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : reports.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No reports found
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <Card key={report.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <Flag className="h-4 w-4 text-red-500" />
                      <Badge className={getReasonBadgeColor(report.reason)}>
                        {report.reason.replace('_', ' ')}
                      </Badge>
                      <Badge variant="outline">{report.content_type}</Badge>
                      <Badge variant={
                        report.status === 'pending' ? 'destructive' :
                        report.status === 'resolved' ? 'default' : 'secondary'
                      }>
                        {report.status}
                      </Badge>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">
                        Reported by: {report.reporter.full_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(report.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <p className="text-sm">{report.description}</p>
                  </div>

                  {report.status === 'pending' && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setReviewingReport(report)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Review
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Review Report</DialogTitle>
                          <DialogDescription>
                            Take action on this content report
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                          <div>
                            <p className="text-sm font-medium mb-1">Reason:</p>
                            <Badge className={getReasonBadgeColor(report.reason)}>
                              {report.reason.replace('_', ' ')}
                            </Badge>
                          </div>

                          <div>
                            <p className="text-sm font-medium mb-1">Description:</p>
                            <p className="text-sm text-muted-foreground">{report.description}</p>
                          </div>

                          <div>
                            <label className="text-sm font-medium">Content Action</label>
                            <Select value={contentAction} onValueChange={(v) => setContentAction(v as any)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">No Action</SelectItem>
                                <SelectItem value="warn">Warn User</SelectItem>
                                <SelectItem value="remove">Remove Content</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <label className="text-sm font-medium">Resolution Notes</label>
                            <Textarea
                              value={resolutionNotes}
                              onChange={(e) => setResolutionNotes(e.target.value)}
                              placeholder="Add notes about your decision..."
                              rows={3}
                            />
                          </div>

                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleReview('resolve')}
                              disabled={submitting}
                              className="flex-1"
                            >
                              {submitting ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <CheckCircle className="h-4 w-4 mr-2" />
                              )}
                              Resolve
                            </Button>
                            <Button
                              onClick={() => handleReview('dismiss')}
                              disabled={submitting}
                              variant="outline"
                              className="flex-1"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Dismiss
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
