import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface SalesData {
  "Retail Accounts": string;
  "Dist. STATE": string;
  "State": string;
  "May 2025": number;
  "June 2025": number;
  "July 2025": number;
}

export const SalesAIChat = () => {
  const [messages, setMessages] = useState<Message[]>([{
    id: '1',
    type: 'assistant',
    content: "👋 I'm your VIP Sales Co-Pilot! I can analyze your store-level sales data to help identify churn risks, top performers, and sales reductions.\n\nTry asking:\n• \"Who are our churn-risk accounts?\"\n• \"What accounts had reduced sales in July?\"\n• \"What are our top-performing accounts?\"\n• \"Show me accounts with declining sales\"",
    timestamp: new Date()
  }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const analyzeChurnRisk = async (): Promise<string> => {
    const { data: salesData, error } = await supabase
      .from('vip_sales' as any)
      .select('*');

    if (error || !salesData) {
      return "❌ Sorry, I couldn't retrieve the sales data. Please try again.";
    }

    const churnRiskAccounts: string[] = [];
    const droppedAccounts: string[] = [];

    salesData.forEach((row: any) => {
      const may = row["May 2025"] || 0;
      const june = row["June 2025"] || 0;
      const july = row["July 2025"] || 0;

      // Check for dropped accounts (zero sales in July)
      if (july === 0 && june > 0) {
        const lastSaleAmount = june > 0 ? june : may;
        droppedAccounts.push(`${row["Retail Accounts"]} (Lost ${lastSaleAmount.toFixed(1)} cases/week from ${june > 0 ? 'June' : 'May'})`);
      }
      // Check for declining trend from June to July (>20% decline)
      else if (june > 0 && july > 0) {
        const decline = ((june - july) / june) * 100;
        const unitDrop = june - july;
        if (decline > 20) {
          churnRiskAccounts.push(`${row["Retail Accounts"]} (${decline.toFixed(1)}% decline, -${unitDrop.toFixed(1)} cases/week)`);
        }
      }
      // Check for consistent decline from May to July
      else if (may > 0 && june > 0 && july > 0) {
        const mayToJune = ((may - june) / may) * 100;
        const juneToJuly = ((june - july) / june) * 100;
        if (mayToJune > 10 && juneToJuly > 10) {
          const totalDecline = ((may - july) / may) * 100;
          const totalUnitDrop = may - july;
          churnRiskAccounts.push(`${row["Retail Accounts"]} (${totalDecline.toFixed(1)}% total decline, -${totalUnitDrop.toFixed(1)} cases/week since May)`);
        }
      }
    });

    let response = "🔍 **Churn Risk Analysis:**\n\n";

    if (droppedAccounts.length > 0) {
      response += `🚨 **URGENT - Zero Sales in July:**\n`;
      droppedAccounts.forEach(account => {
        response += `• ${account}\n`;
      });
      response += "\n";
    }

    if (churnRiskAccounts.length > 0) {
      response += `⚠️ **Accounts with Significant Decline:**\n`;
      churnRiskAccounts.forEach(account => {
        response += `• ${account}\n`;
      });
      response += "\n";
    }

    if (droppedAccounts.length === 0 && churnRiskAccounts.length === 0) {
      response += "✅ Good news! No accounts show immediate churn risk based on current data.\n\n";
    }

    response += "💡 **Recommended Actions:**\n";
    response += "• Contact dropped accounts within 24 hours\n";
    response += "• Schedule reviews for declining accounts\n";
    response += "• Investigate supply chain or competitive issues";

    return response;
  };

  const analyzeTopPerformers = async (): Promise<string> => {
    const { data: salesData, error } = await supabase
      .from('vip_sales' as any)
      .select('*');

    if (error || !salesData) {
      return "❌ Sorry, I couldn't retrieve the sales data. Please try again.";
    }

    // Get top 5 performers based on July sales and sort them
    const topPerformers = salesData
      .filter((row: any) => row["July 2025"] > 0)
      .sort((a: any, b: any) => b["July 2025"] - a["July 2025"])
      .slice(0, 5);

    let response = `🏆 **Top 5 Performing Accounts (July 2025):**\n\n`;

    topPerformers.forEach((account: any, index) => {
      const emoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}️⃣`;
      const june = account["June 2025"] || 0;
      const july = account["July 2025"] || 0;
      
      let trendInfo = '';
      if (june > 0) {
        const growth = ((july - june) / june) * 100;
        const unitChange = july - june;
        if (growth > 0) {
          trendInfo = ` 📈 (+${growth.toFixed(1)}%, +${unitChange.toFixed(1)} cases/week vs June)`;
        } else if (growth < 0) {
          trendInfo = ` 📉 (${growth.toFixed(1)}%, ${unitChange.toFixed(1)} cases/week vs June)`;
        } else {
          trendInfo = ` ➡️ (No change from June)`;
        }
      }
      
      response += `${emoji} **${account["Retail Accounts"]}** (${account["State"]})\n`;
      response += `   📊 ${july.toFixed(1)} cases/week/store${trendInfo}\n\n`;
    });

    response += "💡 **Insights:**\n";
    response += "• Consider expanding product lines with top performers\n";
    response += "• Use these accounts as case studies for best practices\n";
    response += "• Explore upselling opportunities";

    return response;
  };

  const analyzeDropoffs = async (): Promise<string> => {
    const { data: salesData, error } = await supabase
      .from('vip_sales' as any)
      .select('*');

    if (error || !salesData) {
      return "❌ Sorry, I couldn't retrieve the sales data. Please try again.";
    }

    const reducedSalesAccounts: Array<{name: string, state: string, june: number, july: number, decline: number, unitDrop: number}> = [];

    salesData.forEach((row: any) => {
      const june = row["June 2025"] || 0;
      const july = row["July 2025"] || 0;

      // Find accounts with reduced sales from June to July
      if (june > 0 && july < june) {
        const decline = ((june - july) / june) * 100;
        const unitDrop = june - july;
        
        reducedSalesAccounts.push({
          name: row["Retail Accounts"],
          state: row["State"],
          june: june,
          july: july,
          decline: decline,
          unitDrop: unitDrop
        });
      }
    });

    // Sort by decline percentage (highest decline first)
    reducedSalesAccounts.sort((a, b) => b.decline - a.decline);

    let response = "📉 **Accounts with Reduced Sales in July:**\n\n";

    if (reducedSalesAccounts.length > 0) {
      reducedSalesAccounts.forEach(account => {
        const severity = account.decline > 50 ? '🚨' : account.decline > 25 ? '⚠️' : '📉';
        
        response += `${severity} **${account.name}** (${account.state})\n`;
        response += `   June: ${account.june.toFixed(1)} → July: ${account.july.toFixed(1)} cases/week/store\n`;
        response += `   📊 -${account.decline.toFixed(1)}% (-${account.unitDrop.toFixed(1)} cases/week)\n\n`;
      });

      const totalUnitDrop = reducedSalesAccounts.reduce((sum, account) => sum + account.unitDrop, 0);
      const avgDecline = reducedSalesAccounts.reduce((sum, account) => sum + account.decline, 0) / reducedSalesAccounts.length;
      
      response += `💰 **Total Impact:**\n`;
      response += `• ${totalUnitDrop.toFixed(1)} cases/week/store lost across ${reducedSalesAccounts.length} accounts\n`;
      response += `• Average decline: ${avgDecline.toFixed(1)}% per account\n\n`;
      response += "🎯 **Action Plan:**\n";
      response += "• Prioritize accounts with >50% decline for immediate contact\n";
      response += "• Investigate supply chain or competitive issues\n";
      response += "• Schedule account reviews for declining performers";
    } else {
      response += "✅ Great news! No accounts had reduced sales in July compared to June.";
    }

    return response;
  };

  const getAIResponse = async (query: string): Promise<string> => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('churn') || lowerQuery.includes('risk')) {
      return await analyzeChurnRisk();
    }
    
    if (lowerQuery.includes('top') || lowerQuery.includes('best') || lowerQuery.includes('perform')) {
      return await analyzeTopPerformers();
    }
    
    if (lowerQuery.includes('dropped') || lowerQuery.includes('drop') || lowerQuery.includes('reduced') || lowerQuery.includes('decline') || lowerQuery.includes('july') || lowerQuery.includes('june') || lowerQuery.includes('may')) {
      return await analyzeDropoffs();
    }

    // Default response with available queries
    return "I can help you analyze your sales data! Try asking:\n\n🔍 **Churn Analysis:**\n• \"Who are our churn-risk accounts?\"\n• \"Show me accounts with declining sales\"\n\n📈 **Performance Analysis:**\n• \"What are our top-performing accounts?\"\n• \"Show me our best stores\"\n\n📉 **Sales Reduction Analysis:**\n• \"What accounts had reduced sales in July?\"\n• \"Show me accounts with declining performance\"";
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const aiResponse = await getAIResponse(input);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: "❌ Sorry, I encountered an error analyzing your data. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickQuestions = [
    "Who are our churn-risk accounts?",
    "What are our top-performing accounts?",
    "What accounts had reduced sales in July?",
    "Show me accounts with declining sales"
  ];

  return (
    <Card className="w-full max-w-4xl mx-auto h-[500px] flex flex-col mb-8 shadow-lg">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          Ask AI - Sales Analytics
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <ScrollArea className="flex-1 max-h-[350px] overflow-y-auto">
          <div className="p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start gap-3 ${
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.type === 'assistant' && (
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[70%] p-3 rounded-lg whitespace-pre-line break-words ${
                    message.type === 'user'
                      ? 'bg-primary text-white'
                      : 'bg-secondary'
                  }`}
                >
                  {message.content}
                </div>
                {message.type === 'user' && (
                  <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-secondary p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="border-t p-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {quickQuestions.map((question, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => setInput(question)}
                className="text-xs"
              >
                {question}
              </Button>
            ))}
          </div>
          
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about your sales data..."
              disabled={isLoading}
            />
            <Button onClick={handleSend} disabled={!input.trim() || isLoading}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};