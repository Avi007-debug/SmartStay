import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Home, MessageCircle, Star, CheckCircle, Trash2 } from "lucide-react";

const Notifications = () => {
  const notifications = [
    {
      id: 1,
      type: "vacancy",
      icon: Home,
      title: "New Vacancy Available",
      message: "A room is now available at Sunshine PG that matches your preferences.",
      time: "2 hours ago",
      read: false,
    },
    {
      id: 2,
      type: "message",
      icon: MessageCircle,
      title: "Owner Response",
      message: "Rajesh Kumar replied to your inquiry about Green Valley Hostel.",
      time: "5 hours ago",
      read: false,
    },
    {
      id: 3,
      type: "review",
      icon: Star,
      title: "New Review",
      message: "Someone reviewed a PG you saved. Check it out!",
      time: "1 day ago",
      read: true,
    },
    {
      id: 4,
      type: "alert",
      icon: Bell,
      title: "Price Drop",
      message: "Campus View PG reduced rent by ₹500/month.",
      time: "2 days ago",
      read: true,
    },
  ];

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
            <Button variant="outline">
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark All as Read
            </Button>
          </div>

          <Tabs defaultValue="all" className="w-full">
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

            <TabsContent value="all" className="space-y-3">
              {notifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={`transition-all hover:border-primary cursor-pointer ${
                    !notification.read ? "border-primary/50 bg-primary/5" : ""
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-muted shrink-0 ${getIconColor(notification.type)}`}>
                        <notification.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-1">
                          <h3 className="font-semibold">{notification.title}</h3>
                          {!notification.read && (
                            <Badge variant="secondary" className="shrink-0">New</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                        <p className="text-xs text-muted-foreground">{notification.time}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="shrink-0">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="unread" className="space-y-3">
              {notifications
                .filter(n => !n.read)
                .map((notification) => (
                  <Card
                    key={notification.id}
                    className="border-primary/50 bg-primary/5 transition-all hover:border-primary cursor-pointer"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-muted shrink-0 ${getIconColor(notification.type)}`}>
                          <notification.icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-1">
                            <h3 className="font-semibold">{notification.title}</h3>
                            <Badge variant="secondary" className="shrink-0">New</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                          <p className="text-xs text-muted-foreground">{notification.time}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="shrink-0">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </TabsContent>

            <TabsContent value="vacancies" className="space-y-3">
              {notifications
                .filter(n => n.type === "vacancy")
                .map((notification) => (
                  <Card
                    key={notification.id}
                    className="transition-all hover:border-primary cursor-pointer"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-muted shrink-0 ${getIconColor(notification.type)}`}>
                          <notification.icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold mb-1">{notification.title}</h3>
                          <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                          <p className="text-xs text-muted-foreground">{notification.time}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="shrink-0">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </TabsContent>

            <TabsContent value="messages" className="space-y-3">
              {notifications
                .filter(n => n.type === "message")
                .map((notification) => (
                  <Card
                    key={notification.id}
                    className="transition-all hover:border-primary cursor-pointer"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-muted shrink-0 ${getIconColor(notification.type)}`}>
                          <notification.icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold mb-1">{notification.title}</h3>
                          <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                          <p className="text-xs text-muted-foreground">{notification.time}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="shrink-0">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Notifications;
