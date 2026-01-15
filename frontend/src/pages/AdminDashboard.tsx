import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  Users, Building2, Shield, Flag, Search, CheckCircle, XCircle, 
  Eye, MoreHorizontal, FileText, AlertTriangle, ExternalLink, Download, Loader2
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService, adminService, verificationService } from "@/lib/supabase";
import { ModerationPanel } from "@/components/admin/ModerationPanel";
import { DocumentReviewPanel } from "@/components/admin/DocumentReviewPanel";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOwners: 0,
    totalListings: 0,
    pendingVerifications: 0,
    flaggedContent: 0,
  });
  const [users, setUsers] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [reviewNotes, setReviewNotes] = useState("");
  const [processingVerification, setProcessingVerification] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const user = await authService.getCurrentUser();
      
      if (!user || user.profile?.role !== 'admin') {
        toast({
          title: "Access Denied",
          description: "You do not have admin privileges. Please contact support.",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      setCurrentUser(user);
      
      // Load all admin data
      await loadAdminData();
    } catch (error) {
      console.error("Error checking admin access:", error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const loadAdminData = async () => {
    try {
      // Load stats
      const statsData = await adminService.getStats();
      setStats(statsData);

      // Load users
      const usersData = await adminService.getAllUsers();
      setUsers(usersData || []);

      // Load listings
      const listingsData = await adminService.getAllListings();
      setListings(listingsData || []);

      // Load pending verifications
      const verificationsData = await verificationService.getPendingVerifications();
      setVerifications(verificationsData || []);
    } catch (error) {
      console.error("Error loading admin data:", error);
      toast({
        title: "Error",
        description: "Failed to load admin data",
        variant: "destructive",
      });
    }
  };

  const handleApproveVerification = async (documentId: string) => {
    setProcessingVerification(true);
    try {
      await verificationService.approveVerification(documentId, reviewNotes);
      toast({
        title: "Verification Approved",
        description: "Owner has been notified and marked as verified",
      });
      setReviewNotes("");
      // Reload data
      await loadAdminData();
    } catch (error) {
      console.error("Error approving verification:", error);
      toast({
        title: "Error",
        description: "Failed to approve verification",
        variant: "destructive",
      });
    } finally {
      setProcessingVerification(false);
    }
  };

  const handleRejectVerification = async (documentId: string) => {
    setProcessingVerification(true);
    try {
      await verificationService.rejectVerification(documentId, reviewNotes);
      toast({
        title: "Verification Rejected",
        description: "Owner has been notified",
        variant: "destructive",
      });
      setReviewNotes("");
      // Reload data
      await loadAdminData();
    } catch (error) {
      console.error("Error rejecting verification:", error);
      toast({
        title: "Error",
        description: "Failed to reject verification",
        variant: "destructive",
      });
    } finally {
      setProcessingVerification(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage users, listings, and platform content</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-2">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-3xl font-bold">{stats.totalUsers}</p>
                </div>
                <Users className="h-10 w-10 text-primary/20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Listings</p>
                  <p className="text-3xl font-bold">{stats.totalListings}</p>
                </div>
                <Building2 className="h-10 w-10 text-primary/20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Owners</p>
                  <p className="text-3xl font-bold">{stats.totalOwners}</p>
                </div>
                <Shield className="h-10 w-10 text-primary/20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-200 bg-orange-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-700">Pending Verifications</p>
                  <p className="text-3xl font-bold text-orange-700">{stats.pendingVerifications}</p>
                </div>
                <FileText className="h-10 w-10 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="listings">Listings</TabsTrigger>
            <TabsTrigger value="reports">Moderation</TabsTrigger>
            <TabsTrigger value="verification">Document Verification</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4 mt-6">
            <div className="flex gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search users..." className="pl-10" />
              </div>
              <Button variant="outline">Filter</Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left p-4 font-semibold">Name</th>
                      <th className="text-left p-4 font-semibold">Email</th>
                      <th className="text-left p-4 font-semibold">Phone</th>
                      <th className="text-left p-4 font-semibold">Type</th>
                      <th className="text-left p-4 font-semibold">Status</th>
                      <th className="text-right p-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                          No users found
                        </td>
                      </tr>
                    ) : (
                      users.map((user) => (
                        <tr key={user.id} className="border-b hover:bg-muted/50">
                          <td className="p-4">{user.full_name || 'N/A'}</td>
                          <td className="p-4 text-muted-foreground">{user.email || 'N/A'}</td>
                          <td className="p-4 text-muted-foreground">{user.phone || 'N/A'}</td>
                          <td className="p-4">
                            <Badge variant="secondary" className="capitalize">{user.role}</Badge>
                          </td>
                          <td className="p-4">
                            {user.is_verified ? (
                              <Badge className="bg-success">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Unverified</Badge>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <Button variant="ghost" size="sm">View</Button>
                            <Button variant="ghost" size="sm">Edit</Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="listings" className="space-y-4 mt-6">
            <div className="flex gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search listings..." className="pl-10" />
              </div>
              <Button variant="outline">Filter</Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left p-4 font-semibold">Property Name</th>
                      <th className="text-left p-4 font-semibold">Owner</th>
                      <th className="text-left p-4 font-semibold">Status</th>
                      <th className="text-left p-4 font-semibold">Verified</th>
                      <th className="text-right p-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listings.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-muted-foreground">
                          No listings found
                        </td>
                      </tr>
                    ) : (
                      listings.map((listing) => (
                        <tr key={listing.id} className="border-b hover:bg-muted/50">
                          <td className="p-4">{listing.name}</td>
                          <td className="p-4 text-muted-foreground">{listing.owner?.full_name || 'Unknown'}</td>
                          <td className="p-4">
                            <Badge variant={listing.status === "active" ? "default" : "secondary"}>
                              {listing.status}
                            </Badge>
                          </td>
                          <td className="p-4">
                            {listing.is_verified ? (
                              <CheckCircle className="h-5 w-5 text-success" />
                            ) : (
                              <XCircle className="h-5 w-5 text-muted-foreground" />
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <Button variant="ghost" size="sm" asChild>
                              <a href={`/pg/${listing.id}`} target="_blank" rel="noopener noreferrer">
                                View
                              </a>
                            </Button>
                            <Button variant="ghost" size="sm">Verify</Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="mt-6">
            {currentUser && <ModerationPanel adminId={currentUser.id} />}
          </TabsContent>

          <TabsContent value="verification" className="mt-6">
            {currentUser && <DocumentReviewPanel adminId={currentUser.id} />}
          </TabsContent>
            <Card>
              <CardHeader>
                <CardTitle>Flagged Content</CardTitle>
                <CardDescription>Review and manage reported listings and users</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { id: 1, type: "Listing", title: "Sunshine PG", reason: "Misleading information", reporter: "User #1234", date: "2 hours ago", status: "pending" },
                  { id: 2, type: "Review", title: "Inappropriate language in review", reason: "Spam/Abuse", reporter: "User #5678", date: "1 day ago", status: "pending" },
                  { id: 3, type: "User", title: "Suspicious owner activity", reason: "Fraudulent behavior", reporter: "User #9012", date: "2 days ago", status: "resolved" },
                ].map((report) => (
                  <Card key={report.id} className="border-2">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary">{report.type}</Badge>
                            <Badge variant={report.status === "pending" ? "destructive" : "default"}>
                              {report.status}
                            </Badge>
                          </div>
                          <h4 className="font-semibold mb-1">{report.title}</h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            <strong>Reason:</strong> {report.reason}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Reported by {report.reporter} • {report.date}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            Review
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => toast({ title: "Report dismissed" })}>
                                Dismiss Report
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toast({ title: "Warning sent" })}>
                                Warn User
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                Remove Content
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="verification" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Verification Queue</CardTitle>
                <CardDescription>Review pending verification requests from property owners</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {verifications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No pending verification requests</p>
                  </div>
                ) : (
                  verifications.map((verification) => (
                    <Card key={verification.id} className="border-2">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="flex items-start gap-3 flex-1">
                            <Avatar className="h-12 w-12">
                              <AvatarFallback>{verification.owner?.full_name?.[0] || 'U'}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h4 className="font-semibold text-lg">{verification.owner?.full_name || 'Unknown Owner'}</h4>
                              <p className="text-sm text-muted-foreground mb-1">{verification.pg?.name || 'Property'}</p>
                              <p className="text-xs text-muted-foreground">
                                Submitted {new Date(verification.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Badge variant="secondary">{verification.status}</Badge>
                        </div>

                        <Separator className="my-4" />

                        <div className="space-y-3 mb-4">
                          <h5 className="font-medium text-sm">Document Type:</h5>
                          <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-primary" />
                              <span className="text-sm font-medium capitalize">{verification.document_type.replace('_', ' ')}</span>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => window.open(verification.file_url, '_blank')}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              View
                            </Button>
                          </div>
                        </div>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" className="w-full mb-2">
                              <Eye className="h-4 w-4 mr-2" />
                              Review Document
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Verification Review</DialogTitle>
                              <DialogDescription>
                                Review submitted document and approve or reject the verification request
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 my-4">
                              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                                <FileText className="h-16 w-16 text-muted-foreground" />
                              </div>
                              <Textarea 
                                placeholder="Add notes or reasons for decision..." 
                                rows={3}
                                value={reviewNotes}
                                onChange={(e) => setReviewNotes(e.target.value)}
                              />
                            </div>
                            <DialogFooter>
                              <Button 
                                variant="outline"
                                disabled={processingVerification}
                                onClick={() => handleRejectVerification(verification.id)}
                              >
                                {processingVerification ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <XCircle className="h-4 w-4 mr-2" />
                                )}
                                Reject
                              </Button>
                              <Button 
                                variant="default" 
                                disabled={processingVerification}
                                onClick={() => handleApproveVerification(verification.id)}
                              >
                                {processingVerification ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                )}
                                Approve
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>

                        <div className="flex gap-2">
                          <Button 
                            variant="default" 
                            className="flex-1"
                            disabled={processingVerification}
                            onClick={() => handleApproveVerification(verification.id)}
                          >
                            {processingVerification ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <CheckCircle className="h-4 w-4 mr-2" />
                            )}
                            Approve
                          </Button>
                          <Button 
                            variant="destructive" 
                            className="flex-1"
                            disabled={processingVerification}
                            onClick={() => handleRejectVerification(verification.id)}
                          >
                            {processingVerification ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <XCircle className="h-4 w-4 mr-2" />
                            )}
                            Reject
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}

                {/* Empty State */}
                {false && (
                  <div className="text-center py-12">
                    <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                    <p className="text-muted-foreground">No pending verification requests</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
};

export default AdminDashboard;
