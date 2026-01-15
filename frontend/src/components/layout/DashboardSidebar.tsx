import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { authService, savedPGsService, chatService } from "@/lib/supabase";
import {
  Home,
  Heart,
  Bell,
  MessageCircle,
  User,
  Settings,
  Building2,
  Plus,
  Eye,
  TrendingUp,
  Shield,
  HelpCircle,
  FileText,
  Users,
  Flag,
  CheckCircle,
  Sparkles,
} from "lucide-react";

interface SidebarProps {
  role: "user" | "owner" | "admin";
}

export const DashboardSidebar = ({ role }: SidebarProps) => {
  const location = useLocation();
  const [userName, setUserName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [savedCount, setSavedCount] = useState(0);
  const [chatCount, setChatCount] = useState(0);

  useEffect(() => {
    if (role === "user") {
      loadUserData();
    } else if (role === "owner") {
      loadOwnerData();
    }
  }, [role]);

  const loadUserData = async () => {
    try {
      const user = await authService.getCurrentUser();
      if (user?.profile) {
        setUserName(user.profile.full_name || "User");
        
        // Load saved PGs count
        const saved = await savedPGsService.getAll();
        setSavedCount(saved?.length || 0);
        
        // Load active chats count
        const chats = await chatService.getAll();
        setChatCount(chats?.length || 0);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const loadOwnerData = async () => {
    try {
      const user = await authService.getCurrentUser();
      if (user?.profile) {
        setOwnerName(user.profile.full_name || "Owner");
      }
    } catch (error) {
      console.error("Error loading owner data:", error);
    }
  };

  const userLinks = [
    { to: "/user-dashboard", label: "Dashboard", icon: Home },
    { to: "/user-dashboard#recommendations", label: "AI Recommendations", icon: Sparkles },
    { to: "/user-dashboard#saved", label: "Saved PGs", icon: Heart, badge: savedCount > 0 ? savedCount.toString() : undefined },
    { to: "/user-dashboard#recently-viewed", label: "Recently Viewed", icon: Eye },
    { to: "/user-dashboard#chats", label: "Anonymous Chats", icon: MessageCircle, badge: chatCount > 0 ? chatCount.toString() : undefined },
    { to: "/user-dashboard#alerts", label: "Vacancy Alerts", icon: Bell },
    { to: "/user-dashboard#profile", label: "My Profile", icon: User },
    { to: "/preferences", label: "Preferences", icon: Settings },
  ];

  const ownerLinks = [
    { to: "/owner-dashboard", label: "Dashboard", icon: Home },
    { to: "/post-room", label: "New Listing", icon: Plus },
    { to: "/owner-dashboard#listings", label: "My Listings", icon: Building2 },
    { to: "/owner-dashboard#inquiries", label: "Inquiries", icon: MessageCircle },
    { to: "/owner-dashboard#qna", label: "Q&A Responses", icon: HelpCircle },
    { to: "/owner-dashboard#verification", label: "Verification", icon: CheckCircle },
    { to: "/owner-dashboard#analytics", label: "Analytics", icon: TrendingUp },
    { to: "/notifications", label: "Notifications", icon: Bell },
    { to: "/owner-dashboard#profile", label: "My Profile", icon: User },
  ];

  const adminLinks = [
    { to: "/admin-dashboard", label: "Dashboard", icon: Home },
    { to: "/admin-dashboard/users", label: "Manage Users", icon: Users },
    { to: "/admin-dashboard/owners", label: "Manage Owners", icon: Building2 },
    { to: "/admin-dashboard/listings", label: "Listings", icon: FileText },
    { to: "/admin-dashboard/verification", label: "Verification Queue", icon: CheckCircle, badge: "12" },
    { to: "/admin-dashboard/reports", label: "Flagged Content", icon: Flag, badge: "5" },
    { to: "/admin-dashboard/analytics", label: "Platform Analytics", icon: TrendingUp },
  ];

  const links = role === "user" ? userLinks : role === "owner" ? ownerLinks : adminLinks;

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r bg-card h-[calc(100vh-4rem)] sticky top-16">
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-sm">
              {role === "user" ? userName || "User" : role === "owner" ? (ownerName || "Owner") : "Admin User"}
            </p>
            <Badge variant="secondary" className="text-xs capitalize">{role}</Badge>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const isActive = location.pathname === link.to;
          return (
            <Link key={link.to} to={link.to}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3",
                  isActive && "bg-primary/10 text-primary"
                )}
              >
                <link.icon className="h-4 w-4" />
                <span className="flex-1 text-left">{link.label}</span>
                {link.badge && (
                  <Badge variant="secondary" className="ml-auto h-5 px-1.5 text-xs">
                    {link.badge}
                  </Badge>
                )}
              </Button>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t">
        <Button variant="outline" className="w-full justify-start gap-2" asChild>
          <Link to="/">
            <Home className="h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </div>
    </aside>
  );
};
