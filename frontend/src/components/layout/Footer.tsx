import { Link } from "react-router-dom";
import { Building2, Mail, Phone, MapPin } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-card border-t mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-hero">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold">StayFinder</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Find your perfect PG or hostel near your college with verified listings and transparent reviews.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">For Students</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/search" className="hover:text-primary transition-colors">Search PGs</Link></li>
              <li><Link to="/user-dashboard" className="hover:text-primary transition-colors">My Dashboard</Link></li>
              <li><Link to="/saved" className="hover:text-primary transition-colors">Saved PGs</Link></li>
              <li><Link to="/support" className="hover:text-primary transition-colors">Support</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">For Owners</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/post-room" className="hover:text-primary transition-colors">Post a Room</Link></li>
              <li><Link to="/owner-dashboard" className="hover:text-primary transition-colors">Owner Dashboard</Link></li>
              <li><Link to="/verification" className="hover:text-primary transition-colors">Get Verified</Link></li>
              <li><Link to="/pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>support@stayfinder.com</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>+91 98765 43210</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>Multiple Cities, India</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} StayFinder. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
