import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageCircle, Send, Shield, Building2, Loader2 } from "lucide-react";
import { chatService, authService } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface Chat {
  id: string;
  pg_id: string;
  owner_id: string;
  is_anonymous: boolean;
  last_message?: string;
  last_message_at?: string;
  pg_listings?: {
    name: string;
  };
  profiles?: {
    full_name: string;
  };
}

interface Message {
  id: string;
  message_text: string;
  sender_id: string;
  created_at: string;
  sender?: {
    full_name: string;
  };
}

export const AnonymousChatInterface = () => {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadUserChats();
  }, []);

  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat);
      
      // Subscribe to new messages
      const subscription = chatService.subscribeToMessages(selectedChat, (newMessage: any) => {
        setMessages(prev => [...prev, newMessage]);
        scrollToBottom();
      });

      return () => {
        subscription?.unsubscribe();
      };
    }
  }, [selectedChat]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadUserChats = async () => {
    try {
      const user = await authService.getCurrentUser();
      setCurrentUser(user);
      
      const userChats = await chatService.getAll();
      setChats(userChats);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load chats",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (chatId: string) => {
    try {
      const chatMessages = await chatService.getMessages(chatId);
      setMessages(chatMessages);
      setTimeout(scrollToBottom, 100);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load messages",
        variant: "destructive",
      });
    }
  };

  const handleSend = async () => {
    if (!message.trim() || !selectedChat || sending) return;
    
    setSending(true);
    try {
      await chatService.sendMessage(selectedChat, message);
      setMessage("");
      scrollToBottom();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <Card className="h-[600px] flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium mb-2">No Chats Yet</p>
          <p className="text-sm">Start a conversation from a PG listing page</p>
        </div>
      </Card>
    );
  }

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
                      <p className="font-medium text-sm truncate">
                        {chat.pg_listings?.name || 'PG Listing'}
                      </p>
                      {chat.last_message_at && (
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(chat.last_message_at), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {chat.last_message || 'No messages yet'}
                    </p>
                  </div>
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
                    <p className="font-semibold">
                      {chats.find(c => c.id === selectedChat)?.pg_listings?.name || 'PG Listing'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Owner: {chats.find(c => c.id === selectedChat)?.profiles?.full_name || 'Property Owner'}
                    </p>
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
                  {messages.map((msg) => {
                    const isCurrentUser = msg.sender_id === currentUser?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg px-4 py-2 ${
                            isCurrentUser
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary"
                          }`}
                        >
                          <p className="text-sm">{msg.message_text}</p>
                          <p className={`text-xs mt-1 ${
                            isCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground"
                          }`}>
                            {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                    placeholder="Type your message..."
                    className="flex-1"
                    disabled={sending}
                  />
                  <Button onClick={handleSend} disabled={sending || !message.trim()}>
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
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
