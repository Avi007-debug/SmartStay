import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageCircle, Send, Shield, Clock, Building2 } from "lucide-react";

interface Chat {
  id: number;
  pgName: string;
  ownerName: string;
  lastMessage: string;
  time: string;
  unread: number;
}

interface Message {
  id: number;
  text: string;
  sender: "user" | "owner";
  time: string;
}

export const AnonymousChatInterface = () => {
  const [selectedChat, setSelectedChat] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  
  const chats: Chat[] = [
    { id: 1, pgName: "Sunshine PG", ownerName: "Rajesh K.", lastMessage: "Yes, we have 2 beds available", time: "2h ago", unread: 2 },
    { id: 2, pgName: "Green Valley Hostel", ownerName: "Priya S.", lastMessage: "The rent includes food", time: "1d ago", unread: 0 },
    { id: 3, pgName: "Campus View PG", ownerName: "Amit R.", lastMessage: "You can visit anytime", time: "3d ago", unread: 0 },
  ];

  const messages: Message[] = [
    { id: 1, text: "Hi, I'm interested in your PG. Is there any vacancy?", sender: "user", time: "10:30 AM" },
    { id: 2, text: "Yes, we have 2 beds available right now. When would you like to visit?", sender: "owner", time: "10:35 AM" },
    { id: 3, text: "Can you tell me about the food and amenities?", sender: "user", time: "10:40 AM" },
    { id: 4, text: "We provide 3 meals a day - breakfast, lunch, and dinner. The PG has WiFi, hot water 24/7, and laundry service.", sender: "owner", time: "10:45 AM" },
  ];

  const handleSend = () => {
    if (!message.trim()) return;
    setMessage("");
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px]">
      {/* Chat List */}
      <Card className="md:col-span-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Anonymous Chats
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            {chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => setSelectedChat(chat.id)}
                className={`p-4 border-b cursor-pointer transition-colors hover:bg-secondary/50 ${
                  selectedChat === chat.id ? "bg-secondary" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10">
                      <Building2 className="h-5 w-5 text-primary" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm truncate">{chat.pgName}</p>
                      <span className="text-xs text-muted-foreground">{chat.time}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{chat.lastMessage}</p>
                  </div>
                  {chat.unread > 0 && (
                    <Badge className="shrink-0">{chat.unread}</Badge>
                  )}
                </div>
              </div>
            ))}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Chat Window */}
      <Card className="md:col-span-2">
        {selectedChat ? (
          <>
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-primary/10">
                      <Building2 className="h-5 w-5 text-primary" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{chats.find(c => c.id === selectedChat)?.pgName}</p>
                    <p className="text-xs text-muted-foreground">Owner: {chats.find(c => c.id === selectedChat)?.ownerName}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-primary/10">
                  <Shield className="h-3 w-3 mr-1" />
                  Anonymous
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col h-[460px] p-0">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-2 ${
                          msg.sender === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary"
                        }`}
                      >
                        <p className="text-sm">{msg.text}</p>
                        <p className={`text-xs mt-1 ${msg.sender === "user" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                          {msg.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Type your message..."
                    className="flex-1"
                  />
                  <Button onClick={handleSend}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>Select a chat to start messaging</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
