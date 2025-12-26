import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Search, User, Bell, Menu, Building2 } from "lucide-react";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

export const Navbar = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

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
            <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-hero">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">StayFinder</span>
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
            <Button variant="ghost" size="icon" asChild>
              <Link to="/notifications">
                <Bell className="h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/auth">Login</Link>
            </Button>
            <Button variant="accent" asChild>
              <Link to="/auth">Sign Up</Link>
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
                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/auth" onClick={() => setIsOpen(false)}>Login</Link>
                  </Button>
                  <Button variant="accent" className="w-full" asChild>
                    <Link to="/auth" onClick={() => setIsOpen(false)}>Sign Up</Link>
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
