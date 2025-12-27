import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Mail, Lock, User, Phone, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { authService } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const [userType, setUserType] = useState<"user" | "owner" | "admin">("user");
  const [activeTab, setActiveTab] = useState("signin");
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { user } = await authService.signIn(email, password);
      
      if (!user) {
        throw new Error("No user returned from sign in");
      }

      // Get user profile to check role
      const currentUser = await authService.getCurrentUser();
      
      if (!currentUser?.profile) {
        throw new Error("Profile not found");
      }

      const role = currentUser.profile.role;

      // Verify the role matches what they selected
      if (userType === "admin" && role !== "admin") {
        toast({
          title: "Access Denied",
          description: "You do not have admin privileges.",
          variant: "destructive",
        });
        await authService.signOut();
        return;
      }

      toast({
        title: "Welcome back!",
        description: "Successfully signed in.",
      });

      // Navigate based on role
      if (role === "admin") {
        navigate("/admin-dashboard");
      } else if (role === "owner") {
        navigate("/owner-dashboard");
      } else {
        navigate("/user-dashboard");
      }
      
      // Reload to refresh Navbar auth state
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Sign In Failed",
        description: error.message || "Invalid email or password.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validation
    if (password.length < 6) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      // Sign up with metadata (role, full_name, and phone will be used by trigger)
      await authService.signUp(email, password, fullName, userType, phone);

      toast({
        title: "Account Created!",
        description: "Please check your email to verify your account.",
      });

      // Switch to sign in tab and clear form
      setActiveTab("signin");
      setEmail("");
      setPassword("");
      setFullName("");
      setPhone("");
    } catch (error: any) {
      toast({
        title: "Sign Up Failed",
        description: error.message || "Could not create account.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-subtle">
      <Navbar />
      
      <div className="container mx-auto px-4 py-16 flex-1 flex items-center justify-center">
        <div className="w-full max-w-4xl animate-fade-in-up">
          <div className="text-center mb-8">
            <img src="/image.png" alt="SmartStay" className="h-16 w-16 rounded-2xl mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">Welcome to SmartStay</h1>
            <p className="text-muted-foreground">Find your perfect accommodation today</p>
          </div>

          <Card className="border-2 shadow-xl">
            <CardHeader>
              <div className="flex justify-center gap-3 mb-4 flex-wrap">
                <Button
                  variant={userType === "user" ? "default" : "outline"}
                  onClick={() => setUserType("user")}
                  className="flex-1 min-w-[120px] max-w-[140px]"
                >
                  <User className="h-4 w-4 mr-2" />
                  Student
                </Button>
                <Button
                  variant={userType === "owner" ? "default" : "outline"}
                  onClick={() => setUserType("owner")}
                  className="flex-1 min-w-[120px] max-w-[140px]"
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  Owner
                </Button>
                <Button
                  variant={userType === "admin" ? "default" : "outline"}
                  onClick={() => setUserType("admin")}
                  className="flex-1 min-w-[120px] max-w-[140px]"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Admin
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className={`grid w-full ${userType === 'admin' ? 'grid-cols-1' : 'grid-cols-2'} mb-6`}>
                  <TabsTrigger value="signin">Sign In</TabsTrigger>
                  {userType !== 'admin' && <TabsTrigger value="signup">Sign Up</TabsTrigger>}
                </TabsList>

                <TabsContent value="signin" className="space-y-4">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signin-email"
                          type="email"
                          placeholder="your@email.com"
                          className="pl-10"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signin-password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signin-password"
                          type="password"
                          placeholder="••••••••"
                          className="pl-10"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                    <Button 
                      type="submit"
                      className="w-full" 
                      size="lg"
                      disabled={isLoading}
                    >
                      {isLoading ? "Signing in..." : `Sign In as ${userType === "admin" ? "Admin" : userType === "owner" ? "Owner" : "Student"}`}
                    </Button>
                    <div className="text-center text-sm text-muted-foreground">
                      <a href="#" className="text-primary hover:underline">Forgot password?</a>
                    </div>
                  </form>
                </TabsContent>

                <TabsContent value="signup" className="space-y-4">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-name"
                          type="text"
                          placeholder="John Doe"
                          className="pl-10"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                          disabled={isLoading}
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
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-phone">Phone Number (Optional)</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-phone"
                          type="tel"
                          placeholder="+91 98765 43210"
                          className="pl-10"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          disabled={isLoading}
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
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          disabled={isLoading}
                          minLength={6}
                        />
                      </div>
                    </div>
                    <Button 
                      type="submit"
                      variant="accent" 
                      className="w-full" 
                      size="lg"
                      disabled={isLoading}
                    >
                      {isLoading ? "Creating account..." : `Create ${userType === "owner" ? "Owner" : "Student"} Account`}
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      By signing up, you agree to our Terms of Service and Privacy Policy
                    </p>
                  </form>
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
