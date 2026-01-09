import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { useRecentlyViewed, RecentlyViewedPG } from "@/hooks/use-recently-viewed";
import { useEffect, useState } from "react";
import { storageService } from "@/lib/supabase";

export const RecentlyViewedList = () => {
  const { getRecentlyViewed, clearRecentlyViewed } = useRecentlyViewed();
  const [items, setItems] = useState<RecentlyViewedPG[]>([]);

  useEffect(() => {
    const loadRecent = () => {
      const recent = getRecentlyViewed();
      setItems(recent);
    };

    loadRecent();

    // Listen for storage changes
    window.addEventListener('storage', loadRecent);
    return () => window.removeEventListener('storage', loadRecent);
  }, []);

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recently Viewed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Eye className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No recently viewed PGs</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recently Viewed
        </CardTitle>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => {
            clearRecentlyViewed();
            setItems([]);
          }}
        >
          Clear All
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((item) => (
            <Link
              key={`${item.id}-${item.viewedAt}`}
              to={`/pg/${item.id}`}
              className="block group"
            >
              <div className="flex gap-3 p-3 rounded-lg border hover:border-primary hover:bg-accent/5 transition-all">
                <div className="w-20 h-20 rounded-md bg-muted flex-shrink-0 overflow-hidden">
                  {item.image ? (
                    <img
                      src={storageService.getPublicUrl("pg-images", item.image)}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold group-hover:text-primary transition-colors truncate">
                    {item.name}
                  </h4>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">{item.city}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-semibold text-primary">
                      ₹{item.rent.toLocaleString()}/mo
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatTimeAgo(item.viewedAt)}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
