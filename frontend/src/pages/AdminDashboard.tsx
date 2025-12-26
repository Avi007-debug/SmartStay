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
  Eye, MoreHorizontal, FileText, AlertTriangle, ExternalLink, Download
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

const AdminDashboard = () => {
  const users = [
    { id: 1, name: "John Doe", email: "john@example.com", type: "Student", verified: true },
    { id: 2, name: "Jane Smith", email: "jane@example.com", type: "Owner", verified: true },
  ];

  const listings = [
    { id: 1, name: "Sunshine PG", owner: "Rajesh Kumar", status: "active", verified: true },
    { id: 2, name: "Green Valley Hostel", owner: "Priya Sharma", status: "pending", verified: false },
  ];

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
                  <p className="text-3xl font-bold">1,247</p>
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
                  <p className="text-3xl font-bold">342</p>
                </div>
                <Building2 className="h-10 w-10 text-primary/20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Verified Listings</p>
                  <p className="text-3xl font-bold">287</p>
                </div>
                <Shield className="h-10 w-10 text-primary/20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Reports</p>
                  <p className="text-3xl font-bold">12</p>
                </div>
                <Flag className="h-10 w-10 text-primary/20" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="listings">Listings</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="verification">Verification Queue</TabsTrigger>
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
                      <th className="text-left p-4 font-semibold">Type</th>
                      <th className="text-left p-4 font-semibold">Status</th>
                      <th className="text-right p-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b hover:bg-muted/50">
                        <td className="p-4">{user.name}</td>
                        <td className="p-4 text-muted-foreground">{user.email}</td>
                        <td className="p-4">
                          <Badge variant="secondary">{user.type}</Badge>
                        </td>
                        <td className="p-4">
                          {user.verified ? (
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
                    ))}
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
                    {listings.map((listing) => (
                      <tr key={listing.id} className="border-b hover:bg-muted/50">
                        <td className="p-4">{listing.name}</td>
                        <td className="p-4 text-muted-foreground">{listing.owner}</td>
                        <td className="p-4">
                          <Badge variant={listing.status === "active" ? "default" : "secondary"}>
                            {listing.status}
                          </Badge>
                        </td>
                        <td className="p-4">
                          {listing.verified ? (
                            <CheckCircle className="h-5 w-5 text-success" />
                          ) : (
                            <XCircle className="h-5 w-5 text-muted-foreground" />
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <Button variant="ghost" size="sm">View</Button>
                          <Button variant="ghost" size="sm">Verify</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="mt-6">
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
                {[
                  { 
                    id: 1, 
                    ownerName: "Rajesh Kumar", 
                    property: "Sunshine PG", 
                    submittedDate: "1 day ago",
                    documents: ["Trade License", "Occupancy Certificate", "Fire NOC"],
                    status: "pending"
                  },
                  { 
                    id: 2, 
                    ownerName: "Priya Sharma", 
                    property: "Green Valley Hostel", 
                    submittedDate: "3 days ago",
                    documents: ["Trade License", "Shop Registration"],
                    status: "pending"
                  },
                ].map((request) => (
                  <Card key={request.id} className="border-2">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex items-start gap-3 flex-1">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback>{request.ownerName[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg">{request.ownerName}</h4>
                            <p className="text-sm text-muted-foreground mb-1">{request.property}</p>
                            <p className="text-xs text-muted-foreground">Submitted {request.submittedDate}</p>
                          </div>
                        </div>
                        <Badge variant="secondary">{request.status}</Badge>
                      </div>

                      <Separator className="my-4" />

                      <div className="space-y-3 mb-4">
                        <h5 className="font-medium text-sm">Submitted Documents:</h5>
                        {request.documents.map((doc, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-primary" />
                              <span className="text-sm font-medium">{doc}</span>
                            </div>
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4 mr-2" />
                              View
                            </Button>
                          </div>
                        ))}
                      </div>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="w-full mb-2">
                            <Eye className="h-4 w-4 mr-2" />
                            Review Documents
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Verification Review</DialogTitle>
                            <DialogDescription>
                              Review submitted documents and approve or reject the verification request
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 my-4">
                            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                              <FileText className="h-16 w-16 text-muted-foreground" />
                            </div>
                            <Textarea placeholder="Add notes or reasons for decision..." rows={3} />
                          </div>
                          <DialogFooter>
                            <Button variant="outline">
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                            <Button variant="default" onClick={() => toast({ title: "Verification approved!" })}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <div className="flex gap-2">
                        <Button 
                          variant="default" 
                          className="flex-1"
                          onClick={() => toast({ title: "Verification approved", description: "Owner has been notified" })}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button 
                          variant="destructive" 
                          className="flex-1"
                          onClick={() => toast({ title: "Verification rejected", variant: "destructive" })}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

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
