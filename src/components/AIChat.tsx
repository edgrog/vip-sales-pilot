import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { X, Send, Bot, User, TrendingDown, TrendingUp, AlertTriangle } from "lucide-react";
import { useState } from "react";

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIChatProps {
  onClose: () => void;
}

// Mock responses for demo
const getMockResponse = (query: string): string => {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('churn') || lowerQuery.includes('risk')) {
    return "I've identified 18 accounts at churn risk based on July performance. Key concerns:\n\n🔴 **Woolworths Metro CBD** - 15.6% decline in July\n🔴 **Coles Express Kings Cross** - Zero sales in July\n🔴 **IGA Surry Hills** - 22% decline over 2 months\n\nRecommended actions: Schedule immediate account reviews and investigate supply chain issues.";
  }
  
  if (lowerQuery.includes('dropped') || lowerQuery.includes('may') || lowerQuery.includes('june')) {
    return "Found 3 accounts that bought in May/June but had zero sales in July:\n\n❌ **Coles Express Kings Cross** - Last order: June 28\n❌ **7-Eleven George St** - Last order: June 15\n❌ **Metro Convenience Store** - Last order: May 30\n\nTotal lost revenue: $47,000. I recommend reaching out within 24 hours.";
  }
  
  if (lowerQuery.includes('top') || lowerQuery.includes('nsw') || lowerQuery.includes('best')) {
    return "Top 5 performing accounts in NSW (July sales):\n\n🥇 **Woolworths Parramatta** - $71,000 (+6.2%)\n🥈 **Coles Bondi Junction** - $65,000 (+8.1%)\n🥉 **IGA Double Bay** - $52,000 (+12.4%)\n4️⃣ **7-Eleven Circular Quay** - $48,000 (+15.2%)\n5️⃣ **Metro World Square** - $45,000 (+9.8%)\n\nTotal NSW revenue: $281,000 (+10.2% vs June)";
  }
  
  if (lowerQuery.includes('growing') || lowerQuery.includes('growth')) {
    return "Fastest growing accounts (month-over-month):\n\n📈 **7-Eleven Central** - +33.3% growth\n📈 **IGA Bondi Junction** - +27.3% growth\n📈 **Metro Pitt St** - +24.1% growth\n\nThese accounts show strong velocity and are prime candidates for expanded product lines or promotional opportunities.";
  }
  
  return "I can help you analyze account performance, identify churn risks, and prioritize sales actions. Try asking:\n\n• \"Who are my churn-risk accounts?\"\n• \"Which stores bought in May/June but not July?\"\n• \"What are our top 5 accounts in NSW?\"\n• \"Where are we seeing sales drops?\"\n• \"Which accounts need follow-up?\"";
};

export const AIChat = ({ onClose }: AIChatProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: "Hi! I'm your VIP Sales Co-Pilot. I can help you analyze your 3-month depletion data to identify churn risks, growth opportunities, and priority actions. What would you like to know?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date()
    };

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: 'assistant',
      content: getMockResponse(input),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage, assistantMessage]);
    setInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickQuestions = [
    "Who are my churn-risk accounts?",
    "Which stores bought in May/June but not July?", 
    "Top 5 accounts in NSW?",
    "Where are we seeing sales drops?"
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl h-[600px] flex flex-col shadow-2xl border-0">
        <CardHeader className="flex-row items-center justify-between bg-gradient-to-r from-primary to-accent text-white rounded-t-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <CardTitle className="text-lg">AI Sales Co-Pilot</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white/20"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.type === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.type === 'assistant' && (
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.type === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-line">{message.content}</p>
                    <span className="text-xs opacity-70 mt-1 block">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  
                  {message.type === 'user' && (
                    <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-accent-foreground" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Quick Questions */}
          <div className="p-4 border-t bg-secondary/30">
            <p className="text-xs text-muted-foreground mb-2">Quick questions:</p>
            <div className="flex flex-wrap gap-2">
              {quickQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => setInput(question)}
                  className="text-xs h-7"
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about account performance, churn risks, or growth opportunities..."
                className="flex-1"
              />
              <Button onClick={handleSend} className="px-3">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};