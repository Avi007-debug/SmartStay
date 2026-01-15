import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Home, MessageCircle, Star, CheckCircle, Trash2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { notificationsService, authService } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const Notifications = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadUserAndNotifications();
  }, []);

  const loadUserAndNotifications = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        navigate('/auth');
        return;
      }
      
      setUser(currentUser);
      await fetchNotifications();
      
      // Subscribe to real-time notifications
      const unsubscribe = notificationsService.subscribeToNotifications(
        currentUser.id,
        (notification) => {
          setNotifications(prev => [notification, ...prev]);
          toast({
            title: notification.title,
            description: notification.message,
          });
        }
      );

      return () => {
        unsubscribe();
      };
    } catch (error) {
      console.error('Error loading user:', error);
      navigate('/auth');
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationsService.getAll();
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: "Error",
        description: "Failed to load notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationsService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
      await Promise.all(unreadIds.map(id => notificationsService.markAsRead(id)));
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark all as read",
        variant: "destructive",
      });
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "vacancy": return Home;
      case "message": return MessageCircle;
      case "review": return Star;
      case "price_drop": return Bell;
      default: return Bell;
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case "vacancy":
        return "text-success";
      case "message":
        return "text-primary";
      case "review":
        return "text-accent";
      default:
        return "text-muted-foreground";
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === "all") return true;
    if (activeTab === "unread") return !n.read;
    if (activeTab === "vacancies") return n.type === "vacancy";
    if (activeTab === "messages") return n.type === "message";
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Notifications</h1>
              <p className="text-muted-foreground">Stay updated with your PG search</p>
            </div>
            <Button variant="outline" onClick={handleMarkAllAsRead}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark All as Read
            </Button>
          </div>

          <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unread">
                Unread
                <Badge variant="secondary" className="ml-2">
                  {notifications.filter(n => !n.read).length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="vacancies">Vacancies</TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-3">
              {filteredNotifications.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No notifications yet</p>
                  </CardContent>
                </Card>
              ) : (
                filteredNotifications.map((notification) => {
                  const Icon = getIcon(notification.type);
                  return (
                    <Card
                      key={notification.id}
                      className={`transition-all hover:border-primary cursor-pointer ${
                        !notification.read ? "border-primary/50 bg-primary/5" : ""
                      }`}
                      onClick={() => handleMarkAsRead(notification.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-muted shrink-0 ${getIconColor(notification.type)}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4 mb-1">
                              <h3 className="font-semibold">{notification.title}</h3>
                              {!notification.read && (
                                <Badge variant="secondary" className="shrink-0">New</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                            <p className="text-xs text-muted-foreground">{formatTime(notification.created_at)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Notifications;
