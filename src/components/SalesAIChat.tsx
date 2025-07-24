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
  account_name: string;
  sale_month: string;
  case_equivs: number;
}

export const SalesAIChat = () => {
  const [messages, setMessages] = useState<Message[]>([{
    id: '1',
    type: 'assistant',
    content: "👋 I'm your VIP Sales Co-Pilot! I can analyze your store-level sales data to help identify churn risks, top performers, and growth opportunities.\n\nTry asking:\n• \"Who are our churn-risk accounts?\"\n• \"Which stores dropped off in July?\"\n• \"What are our top-performing accounts?\"\n• \"Show me accounts with declining sales\"",
    timestamp: new Date()
  }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const analyzeChurnRisk = async (): Promise<string> => {
    const { data: salesData, error } = await supabase
      .from('vip_sales_raw')
      .select('*')
      .order('account_name, sale_month');

    if (error || !salesData) {
      return "❌ Sorry, I couldn't retrieve the sales data. Please try again.";
    }

    // Group by account and calculate trends
    const accountMap = new Map<string, SalesData[]>();
    salesData.forEach((row) => {
      const accountName = row.account_name;
      if (!accountMap.has(accountName)) {
        accountMap.set(accountName, []);
      }
      accountMap.get(accountName)!.push({
        account_name: row.account_name,
        sale_month: row.sale_month,
        case_equivs: Number(row.case_equivs)
      });
    });

    const churnRiskAccounts: string[] = [];
    const droppedAccounts: string[] = [];

    accountMap.forEach((sales, accountName) => {
      if (sales.length >= 2) {
        const sortedSales = sales.sort((a, b) => new Date(a.sale_month).getTime() - new Date(b.sale_month).getTime());
        const latestSales = sortedSales[sortedSales.length - 1];
        const previousSales = sortedSales[sortedSales.length - 2];

        // Check for dropped accounts (zero sales in latest month)
        if (latestSales.case_equivs === 0 && previousSales.case_equivs > 0) {
          droppedAccounts.push(accountName);
        }
        // Check for declining trend (>20% decline)
        else if (previousSales.case_equivs > 0) {
          const decline = ((previousSales.case_equivs - latestSales.case_equivs) / previousSales.case_equivs) * 100;
          if (decline > 20) {
            churnRiskAccounts.push(`${accountName} (${decline.toFixed(1)}% decline)`);
          }
        }
      }
    });

    let response = "🔍 **Churn Risk Analysis:**\n\n";

    if (droppedAccounts.length > 0) {
      response += `🚨 **URGENT - Zero Sales in Latest Month:**\n`;
      droppedAccounts.forEach(account => {
        response += `• ${account}\n`;
      });
      response += "\n";
    }

    if (churnRiskAccounts.length > 0) {
      response += `⚠️ **Accounts with Significant Decline (>20%):**\n`;
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
      .from('vip_sales_raw')
      .select('*')
      .order('case_equivs', { ascending: false });

    if (error || !salesData) {
      return "❌ Sorry, I couldn't retrieve the sales data. Please try again.";
    }

    // Get latest month's top performers
    const latestMonth = new Date(Math.max(...salesData.map(row => new Date(row.sale_month).getTime())));
    const latestMonthStr = latestMonth.toISOString().split('T')[0];
    
    const topPerformers = salesData
      .filter(row => row.sale_month === latestMonthStr)
      .slice(0, 5);

    let response = `🏆 **Top 5 Performing Accounts (${new Date(latestMonthStr).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}):**\n\n`;

    topPerformers.forEach((account, index) => {
      const emoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}️⃣`;
      response += `${emoji} **${account.account_name}** - ${Number(account.case_equivs).toLocaleString()} case equivalents\n`;
    });

    response += "\n💡 **Insights:**\n";
    response += "• Consider expanding product lines with top performers\n";
    response += "• Use these accounts as case studies for best practices\n";
    response += "• Explore upselling opportunities";

    return response;
  };

  const analyzeDropoffs = async (): Promise<string> => {
    const { data: salesData, error } = await supabase
      .from('vip_sales_raw')
      .select('*')
      .order('account_name, sale_month');

    if (error || !salesData) {
      return "❌ Sorry, I couldn't retrieve the sales data. Please try again.";
    }

    // Group by account
    const accountMap = new Map<string, SalesData[]>();
    salesData.forEach((row) => {
      const accountName = row.account_name;
      if (!accountMap.has(accountName)) {
        accountMap.set(accountName, []);
      }
      accountMap.get(accountName)!.push({
        account_name: row.account_name,
        sale_month: row.sale_month,
        case_equivs: Number(row.case_equivs)
      });
    });

    const dropoffAccounts: Array<{name: string, lastSale: string, amount: number}> = [];

    accountMap.forEach((sales, accountName) => {
      const sortedSales = sales.sort((a, b) => new Date(a.sale_month).getTime() - new Date(b.sale_month).getTime());
      const latestSales = sortedSales[sortedSales.length - 1];
      
      // Find accounts with zero sales in latest month
      if (latestSales.case_equivs === 0) {
        // Find their last non-zero sale
        for (let i = sortedSales.length - 2; i >= 0; i--) {
          if (sortedSales[i].case_equivs > 0) {
            dropoffAccounts.push({
              name: accountName,
              lastSale: sortedSales[i].sale_month,
              amount: sortedSales[i].case_equivs
            });
            break;
          }
        }
      }
    });

    let response = "📉 **Accounts That Dropped Off:**\n\n";

    if (dropoffAccounts.length > 0) {
      dropoffAccounts.forEach(account => {
        const lastSaleDate = new Date(account.lastSale).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        response += `❌ **${account.name}**\n`;
        response += `   Last sale: ${lastSaleDate} (${account.amount.toLocaleString()} case equivalents)\n\n`;
      });

      const totalLostRevenue = dropoffAccounts.reduce((sum, account) => sum + account.amount, 0);
      response += `💰 **Impact:** ${totalLostRevenue.toLocaleString()} case equivalents lost\n\n`;
      response += "🎯 **Action Plan:**\n";
      response += "• Contact these accounts immediately\n";
      response += "• Investigate reasons for discontinuation\n";
      response += "• Offer incentives or promotions to re-engage";
    } else {
      response += "✅ Great news! No accounts have completely dropped off based on current data.";
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
    
    if (lowerQuery.includes('dropped') || lowerQuery.includes('drop') || lowerQuery.includes('july') || lowerQuery.includes('june') || lowerQuery.includes('may')) {
      return await analyzeDropoffs();
    }

    // Default response with available queries
    return "I can help you analyze your sales data! Try asking:\n\n🔍 **Churn Analysis:**\n• \"Who are our churn-risk accounts?\"\n• \"Show me accounts with declining sales\"\n\n📈 **Performance Analysis:**\n• \"What are our top-performing accounts?\"\n• \"Show me our best stores\"\n\n📉 **Dropoff Analysis:**\n• \"Which stores dropped off in July?\"\n• \"Show me accounts that stopped buying\"";
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
    "Which stores dropped off in July?",
    "Show me accounts with declining sales"
  ];

  return (
    <Card className="w-full max-w-4xl mx-auto h-[600px] flex flex-col">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          Ask AI - Sales Analytics
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start gap-3 ${
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.type === 'assistant' && (
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[70%] p-3 rounded-lg whitespace-pre-line ${
                    message.type === 'user'
                      ? 'bg-primary text-white'
                      : 'bg-secondary'
                  }`}
                >
                  {message.content}
                </div>
                {message.type === 'user' && (
                  <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
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