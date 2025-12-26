import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, X, Send } from "lucide-react";

export const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: "Hi! I'm your StayFinder assistant. How can I help you today?", sender: "bot" },
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    
    setMessages([...messages, { id: messages.length + 1, text: input, sender: "user" }]);
    setInput("");
    
    // Simulate bot response
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        { 
          id: prev.length + 1, 
          text: "I'm here to help! You can ask me about PG listings, pricing, amenities, or anything else.", 
          sender: "bot" 
        }
      ]);
    }, 1000);
  };

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
        <Card className="fixed bottom-6 right-6 w-96 h-[500px] shadow-2xl border-2 z-50 flex flex-col animate-scale-in">
          <CardHeader className="gradient-hero text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">StayFinder Assistant</CardTitle>
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
          
          <CardContent className="flex-1 flex flex-col p-0">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        message.sender === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Type your message..."
                  className="flex-1"
                />
                <Button onClick={handleSend} size="icon" className="shrink-0">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInput("Show me PGs near Delhi University")}
                >
                  Find PGs
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInput("What amenities are available?")}
                >
                  Amenities
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};
