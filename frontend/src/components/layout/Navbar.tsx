import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Home, Search, User, Bell, Menu, Building2, LogOut, LayoutDashboard } from "lucide-react";
import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { authService, notificationsService } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    checkAuth();
    loadNotifications();

    // Subscribe to realtime notifications if authenticated
    let subscription: any;
    const setupRealtimeNotifications = async () => {
      const user = await authService.getCurrentUser();
      if (user) {
        subscription = await notificationsService.subscribeToNotifications((newNotif) => {
          setNotifications(prev => [newNotif, ...prev]);
        });
      }
    };
    setupRealtimeNotifications();

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const checkAuth = async () => {
    const user = await authService.getCurrentUser();
    setIsAuthenticated(!!user);
    setCurrentUser(user);
  };

  const loadNotifications = async () => {
    try {
      const notifs = await notificationsService.getAll();
      setNotifications(notifs || []);
    } catch (error) {
      // User not authenticated or error loading notifications
      setNotifications([]);
    }
  };

  const handleSignOut = async () => {
    try {
      await authService.signOut();
      setIsAuthenticated(false);
      setCurrentUser(null);
      setNotifications([]);
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
      navigate('/');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Filter nav links based on user role - only owners can post rooms (NOT admins)
  const allNavLinks = [
    { to: "/", label: "Home", icon: Home, roles: ["user", "owner", "admin"] },
    { to: "/search", label: "Search PGs", icon: Search, roles: ["user", "owner", "admin"] },
    { 
      to: currentUser ? `/${currentUser?.profile?.role || 'user'}-dashboard` : "/auth", 
      label: "Dashboard", 
      icon: LayoutDashboard, 
      roles: ["user", "owner", "admin"],
      requiresAuth: true
    },
    { to: "/post-room", label: "Post Room", icon: Building2, roles: ["owner"] },
  ];

  const navLinks = allNavLinks.filter(link => {
    // If link requires auth, only show when authenticated
    if (link.requiresAuth && !isAuthenticated) {
      return false;
    }
    return !currentUser || link.roles.includes(currentUser?.profile?.role || "user");
  });

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <img src="/image.png" alt="SmartStay" className="h-10 w-10 rounded-lg" />
            <span className="text-xl font-bold text-foreground">SmartStay</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to}>
                <Button
                  variant={isActive(link.to) ? "secondary" : "ghost"}
                  className="gap-2"
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Button>
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center space-x-3">
            {/* Notification Dropdown - Only show when authenticated */}
            {isAuthenticated && (
              <Popover open={notificationOpen} onOpenChange={setNotificationOpen}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                      >
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                  <h3 className="font-semibold">Notifications</h3>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/notifications">View All</Link>
                  </Button>
                </div>
                <ScrollArea className="h-[300px]">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No notifications yet</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {notifications.map((notification) => (
                        <Link
                          key={notification.id}
                          to="/notifications"
                          className="block p-4 hover:bg-muted/50 transition-colors"
                          onClick={() => setNotificationOpen(false)}
                        >
                          <div className="flex gap-3">
                            <div className="flex-1">
                              <p className={`text-sm ${!notification.is_read ? "font-semibold" : "font-normal"}`}>
                                {notification.title}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                            </div>
                            {!notification.is_read && (
                              <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </PopoverContent>
            </Popover>
            )}

            {/* User Profile Dropdown - Only show when authenticated */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div>
                      <p className="font-semibold">{currentUser?.profile?.full_name || 'User'}</p>
                      <p className="text-xs text-muted-foreground font-normal">{currentUser?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={`/${currentUser?.profile?.role || 'user'}-dashboard`}>Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/preferences">Preferences</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/notifications">Notifications</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="accent" asChild>
                <Link to="/auth">Sign In</Link>
              </Button>
            )}
          </div>

          {/* Mobile Navigation */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <div className="flex flex-col space-y-4 mt-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setIsOpen(false)}
                  >
                    <Button
                      variant={isActive(link.to) ? "secondary" : "ghost"}
                      className="w-full justify-start gap-2"
                    >
                      <link.icon className="h-4 w-4" />
                      {link.label}
                    </Button>
                  </Link>
                ))}
                <div className="pt-4 border-t space-y-2">
                  {isAuthenticated ? (
                    <>
                      <Button variant="outline" className="w-full" asChild>
                        <Link to={`/${currentUser?.profile?.role || 'user'}-dashboard`} onClick={() => setIsOpen(false)}>
                          Dashboard
                        </Link>
                      </Button>
                      <Button variant="destructive" className="w-full" onClick={() => { handleSignOut(); setIsOpen(false); }}>
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </Button>
                    </>
                  ) : (
                    <Button variant="accent" className="w-full" asChild>
                      <Link to="/auth" onClick={() => setIsOpen(false)}>Sign In</Link>
                    </Button>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};
