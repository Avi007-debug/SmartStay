import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Mail, Lock, User, Phone } from "lucide-react";

const Auth = () => {
  const [userType, setUserType] = useState<"student" | "owner">("student");

  return (
    <div className="min-h-screen flex flex-col bg-gradient-subtle">
      <Navbar />
      
      <div className="container mx-auto px-4 py-16 flex-1 flex items-center justify-center">
        <div className="w-full max-w-4xl animate-fade-in-up">
          <div className="text-center mb-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-hero mx-auto mb-4">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Welcome to StayFinder</h1>
            <p className="text-muted-foreground">Find your perfect accommodation today</p>
          </div>

          <Card className="border-2 shadow-xl">
            <CardHeader>
              <div className="flex justify-center gap-4 mb-4">
                <Button
                  variant={userType === "student" ? "default" : "outline"}
                  onClick={() => setUserType("student")}
                  className="flex-1 max-w-[150px]"
                >
                  Student
                </Button>
                <Button
                  variant={userType === "owner" ? "default" : "outline"}
                  onClick={() => setUserType("owner")}
                  className="flex-1 max-w-[150px]"
                >
                  Owner
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="your@email.com"
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="login-password"
                          type="password"
                          placeholder="••••••••"
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <Button className="w-full" size="lg">
                      Login
                    </Button>
                    <div className="text-center text-sm text-muted-foreground">
                      <a href="#" className="text-primary hover:underline">Forgot password?</a>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="signup" className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-name"
                          type="text"
                          placeholder="John Doe"
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="your@email.com"
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-phone">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-phone"
                          type="tel"
                          placeholder="+91 98765 43210"
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="••••••••"
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <Button variant="accent" className="w-full" size="lg">
                      Create Account
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      By signing up, you agree to our Terms of Service and Privacy Policy
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;
