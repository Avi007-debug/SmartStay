import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Home, Search, User, Bell, Menu, Building2 } from "lucide-react";
import { useState } from "react";
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

export const Navbar = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);

  const notifications = [
    { id: 1, title: "New vacancy at Sunshine PG", time: "2 hours ago", read: false, type: "vacancy" },
    { id: 2, title: "Owner responded to your inquiry", time: "1 day ago", read: false, type: "message" },
    { id: 3, title: "Price dropped at Green Valley", time: "2 days ago", read: true, type: "price" },
    { id: 4, title: "Your listing was approved", time: "3 days ago", read: true, type: "success" },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  const navLinks = [
    { to: "/", label: "Home", icon: Home },
    { to: "/search", label: "Search PGs", icon: Search },
    { to: "/post-room", label: "Post Room", icon: Building2 },
  ];

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
            {/* Notification Dropdown */}
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
                              <p className={`text-sm ${!notification.read ? "font-semibold" : "font-normal"}`}>
                                {notification.title}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
                            </div>
                            {!notification.read && (
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

            {/* User Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/user-dashboard">Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/user-dashboard/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/user-dashboard/preferences">Preferences</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/auth">Logout</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="accent" asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
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
                  <Button variant="accent" className="w-full" asChild>
                    <Link to="/auth" onClick={() => setIsOpen(false)}>Sign In</Link>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};
