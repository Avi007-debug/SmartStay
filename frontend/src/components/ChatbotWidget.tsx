import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

interface ChatMessage {
  id: number;
  role: "user" | "bot";
  content: string;
}

export const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, role: "bot", content: "Hi! I'm your SmartStay assistant. How can I help you today?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || loading) return;
    
    const userMessage: ChatMessage = { 
      id: messages.length + 1, 
      role: "user", 
      content: textToSend 
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    
    try {
      const response = await axios.post(`${API_URL}/api/ai/chatbot`, {
        message: textToSend,
        chat_history: messages.map(m => ({ role: m.role, content: m.content })),
        context: {
          current_page: window.location.pathname,
          user_role: "user"
        }
      });

      const botMessage: ChatMessage = {
        id: messages.length + 2,
        role: "bot",
        content: response.data.response || "I'm here to help! You can ask me about PG listings, features, or anything else."
      };

      setMessages(prev => [...prev, botMessage]);

      // Handle suggested actions if any
      if (response.data.suggested_actions && response.data.suggested_actions.length > 0) {
        // Store suggested actions for quick replies (optional enhancement)
      }
    } catch (error: any) {
      console.error("Chatbot error:", error);
      
      // Fallback response
      const fallbackMessage: ChatMessage = {
        id: messages.length + 2,
        role: "bot",
        content: "I'm here to help! You can ask me about finding PGs, understanding features like reviews and Q&A, posting your PG, or using our AI-powered tools."
      };
      setMessages(prev => [...prev, fallbackMessage]);
      
      toast({
        title: "Connection Issue",
        description: "Using offline mode. Some features may be limited.",
        variant: "default",
      });
    } finally {
      setLoading(false);
    }
  };

  const quickReplies = [
    "How do I search for PGs?",
    "What are verified listings?",
    "How does the AI work?",
  ];

  return (
    <>
      {/* Chat Widget Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl hover:scale-110 transition-transform gradient-hero z-50"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-3rem)] h-[500px] max-h-[calc(100vh-3rem)] shadow-2xl border-2 z-50 flex flex-col animate-scale-in">
          <CardHeader className="gradient-hero text-white rounded-t-lg flex-shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">SmartStay Assistant</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 break-words ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-secondary rounded-lg px-4 py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                  placeholder="Type your message..."
                  className="flex-1"
                  disabled={loading}
                />
                <Button 
                  onClick={() => handleSend()} 
                  size="icon" 
                  className="shrink-0"
                  disabled={loading || !input.trim()}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {quickReplies.map((reply, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => handleSend(reply)}
                    disabled={loading}
                  >
                    {reply}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};
