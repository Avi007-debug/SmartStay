import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Users, Building2, Shield, Flag, Search, CheckCircle, XCircle } from "lucide-react";

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
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Review and manage reported listings and users.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="verification" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Verification Queue</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Review pending verification requests from property owners.</p>
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
