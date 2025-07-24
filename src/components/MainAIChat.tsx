import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Bot, User, TrendingDown, TrendingUp, AlertTriangle, Users, DollarSign, Target, BarChart3 } from "lucide-react";
import { useState } from "react";
import { Progress } from "@/components/ui/progress";

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Mock data for demonstration  
const mockData = {
  totalAccounts: 247,
  churnRisk: 18,
  topGrowing: 12,
  revenueChange: 8.4,
  chainData: [
    { 
      name: "Woolworths", 
      stores: 89, 
      totalSales: [245000, 268000, 252000], 
      avgPerStore: [2753, 3011, 2831],
      growth: -6.0,
      status: "declining"
    },
    { 
      name: "Coles", 
      stores: 76, 
      totalSales: [198000, 215000, 234000], 
      avgPerStore: [2605, 2829, 3079],
      growth: 18.2,
      status: "growing"
    },
    { 
      name: "IGA", 
      stores: 45, 
      totalSales: [87000, 94000, 105000], 
      avgPerStore: [1933, 2089, 2333],
      growth: 20.7,
      status: "growing"
    },
    { 
      name: "7-Eleven", 
      stores: 28, 
      totalSales: [52000, 56000, 61000], 
      avgPerStore: [1857, 2000, 2179],
      growth: 17.3,
      status: "growing"
    },
    { 
      name: "Metro/Other", 
      stores: 9, 
      totalSales: [18000, 15000, 12000], 
      avgPerStore: [2000, 1667, 1333],
      growth: -33.3,
      status: "declining"
    }
  ],
  accountsData: [
    { name: "Woolworths Metro CBD", region: "NSW", chain: "Woolworths", sales: [45000, 52000, 38000], status: "churn-risk" },
    { name: "Coles Express Kings Cross", region: "NSW", chain: "Coles", sales: [32000, 29000, 0], status: "dropped" },
    { name: "IGA Bondi Junction", region: "NSW", chain: "IGA", sales: [18000, 22000, 28000], status: "growing" },
    { name: "7-Eleven Central", region: "NSW", chain: "7-Eleven", sales: [15000, 18000, 24000], status: "growing" },
    { name: "Woolworths Parramatta", region: "NSW", chain: "Woolworths", sales: [67000, 71000, 65000], status: "stable" },
  ]
};

// Mock responses for demo
const getMockResponse = (query: string): string => {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('churn') || lowerQuery.includes('risk')) {
    return "I've identified 18 accounts at churn risk based on July performance. Key concerns:\n\n🔴 **Woolworths Metro CBD** - 15.6% decline in July\n🔴 **Coles Express Kings Cross** - Zero sales in July\n🔴 **IGA Surry Hills** - 22% decline over 2 months\n\nRecommended actions: Schedule immediate account reviews and investigate supply chain issues.";
  }
  
  if (lowerQuery.includes('chain') || lowerQuery.includes('breakdown')) {
    return "Here's your chain performance breakdown:\n\n📊 **Growing Chains:**\n• IGA: +20.7% growth (best performer)\n• Coles: +18.2% growth\n• 7-Eleven: +17.3% growth\n\n📉 **Declining Chains:**\n• Metro/Other: -33.3% (major concern)\n• Woolworths: -6.0% (needs attention)\n\nFocus on understanding why Woolworths is declining despite having the most stores.";
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
  
  return "I can help you analyze account performance, identify churn risks, and prioritize sales actions. Try asking:\n\n• \"Who are my churn-risk accounts?\"\n• \"Which stores bought in May/June but not July?\"\n• \"What are our top 5 accounts in NSW?\"\n• \"Show me chain breakdown\"\n• \"Which accounts need follow-up?\"";
};

export const MainAIChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: "👋 Welcome to your VIP Sales Co-Pilot! I'm here to help you analyze your 3-month depletion data and identify actionable insights.\n\nI can help you with:\n• Churn risk analysis\n• Chain performance breakdowns\n• Growth opportunities\n• Account prioritization\n\nWhat would you like to explore first?",
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
    "Show me chain breakdown", 
    "Top 5 accounts in NSW?",
    "Which stores dropped off in July?"
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "churn-risk":
        return <Badge variant="destructive" className="flex items-center gap-1"><TrendingDown className="w-3 h-3" />Churn Risk</Badge>;
      case "dropped":
        return <Badge variant="destructive" className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Dropped</Badge>;
      case "growing":
        return <Badge className="bg-success text-success-foreground flex items-center gap-1"><TrendingUp className="w-3 h-3" />Growing</Badge>;
      default:
        return <Badge variant="secondary">Stable</Badge>;
    }
  };

  const calculateGrowth = (sales: number[]) => {
    const [may, june, july] = sales;
    if (july === 0) return "Dropped";
    const growth = ((july - may) / may * 100).toFixed(1);
    return `${growth}%`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      {/* Header */}
      <header className="border-b bg-card/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-primary to-accent rounded-lg flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">VIP Sales Co-Pilot</h1>
              <p className="text-sm text-muted-foreground">AI-Powered CPG Performance Analytics</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Compact AI Chat Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <Card className="h-[350px] flex flex-col shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-primary to-accent text-white rounded-t-lg py-3">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <Bot className="w-5 h-5" />
                  Ask AI Assistant
                </CardTitle>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col p-0">
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-3">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-2 ${
                          message.type === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {message.type === 'assistant' && (
                          <div className="w-6 h-6 bg-gradient-to-r from-primary to-accent rounded-lg flex items-center justify-center flex-shrink-0">
                            <Bot className="w-3 h-3 text-white" />
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
                          <div className="w-6 h-6 bg-accent rounded-lg flex items-center justify-center flex-shrink-0">
                            <User className="w-3 h-3 text-accent-foreground" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask about account performance, churn risks, or growth opportunities..."
                      className="flex-1"
                    />
                    <Button onClick={handleSend} className="px-4">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Questions */}
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="text-base">Quick Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  onClick={() => setInput(question)}
                  className="w-full text-left justify-start h-auto p-2 text-xs"
                >
                  {question}
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Key Metrics Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card className="shadow-card border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Accounts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-foreground">{mockData.totalAccounts}</span>
                <Users className="w-5 h-5 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Churn Risk</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-destructive">{mockData.churnRisk}</span>
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <Progress value={(mockData.churnRisk / mockData.totalAccounts) * 100} className="mt-2" />
            </CardContent>
          </Card>

          <Card className="shadow-card border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Growing Accounts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-success">{mockData.topGrowing}</span>
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Revenue Change</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-success">+{mockData.revenueChange}%</span>
                <DollarSign className="w-5 h-5 text-success" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chain Performance Breakdown */}
        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Chain Performance Breakdown</CardTitle>
            <CardDescription>Sales performance by retail chain (May-July 2024)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockData.chainData.map((chain, index) => (
                <div key={index} className="p-4 rounded-lg border bg-gradient-to-r from-card to-card/50 hover:shadow-lg transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-foreground text-lg">{chain.name}</h4>
                    <Badge variant={chain.status === "growing" ? "default" : "destructive"} className={
                      chain.status === "growing" 
                        ? "bg-success text-success-foreground" 
                        : "bg-destructive text-destructive-foreground"
                    }>
                      {chain.growth > 0 ? `+${chain.growth}%` : `${chain.growth}%`}
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Stores</span>
                      <span className="font-medium">{chain.stores}</span>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">July Sales</span>
                        <span className="font-medium">${chain.totalSales[2].toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Avg per Store</span>
                        <span className="font-medium">${chain.avgPerStore[2].toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <div className="pt-2">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>May</span>
                        <span>June</span>
                        <span>July</span>
                      </div>
                      <div className="flex gap-1">
                        {chain.totalSales.map((sales, monthIndex) => (
                          <div 
                            key={monthIndex}
                            className="flex-1 bg-secondary rounded-sm overflow-hidden"
                          >
                            <div 
                              className={`h-2 rounded-sm ${
                                chain.status === "growing" ? "bg-success" : "bg-destructive"
                              }`}
                              style={{
                                width: `${(sales / Math.max(...chain.totalSales)) * 100}%`
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Chain Summary */}
            <div className="mt-6 pt-6 border-t">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-success">3</div>
                  <div className="text-sm text-muted-foreground">Growing Chains</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-destructive">2</div>
                  <div className="text-sm text-muted-foreground">Declining Chains</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">${mockData.chainData.reduce((sum, chain) => sum + chain.totalSales[2], 0).toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Total July Sales</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-accent">$2,684</div>
                  <div className="text-sm text-muted-foreground">Avg Store Performance</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Performance and Action Items */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-card border-0">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Account Performance (May-July)</CardTitle>
              <CardDescription>Store-level depletion data with status indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockData.accountsData.map((account, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium text-foreground">{account.name}</h4>
                        {getStatusBadge(account.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">{account.region} • {account.chain}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        May: ${account.sales[0].toLocaleString()} | 
                        June: ${account.sales[1].toLocaleString()} | 
                        July: ${account.sales[2] === 0 ? "No sales" : `$${account.sales[2].toLocaleString()}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`font-medium ${
                        account.status === "growing" ? "text-success" : 
                        account.status === "churn-risk" || account.status === "dropped" ? "text-destructive" : 
                        "text-muted-foreground"
                      }`}>
                        {calculateGrowth(account.sales)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-0">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Action Items</CardTitle>
              <CardDescription>Priority accounts requiring immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 rounded-lg border border-destructive/20 bg-destructive/5">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
                    <div>
                      <h4 className="font-medium text-foreground">Urgent: Account Dropped</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Coles Express Kings Cross had no sales in July after consistent performance. 
                        <span className="font-medium text-destructive"> Immediate follow-up required.</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg border border-warning/20 bg-warning/5">
                  <div className="flex items-start gap-3">
                    <TrendingDown className="w-5 h-5 text-warning mt-0.5" />
                    <div>
                      <h4 className="font-medium text-foreground">Churn Risk</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Woolworths Metro CBD showing declining trend. Sales dropped 15.6% in July.
                        <span className="font-medium text-warning"> Schedule account review.</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg border border-success/20 bg-success/5">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-success mt-0.5" />
                    <div>
                      <h4 className="font-medium text-foreground">Growth Opportunity</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        IGA Bondi Junction and 7-Eleven Central showing strong growth.
                        <span className="font-medium text-success"> Consider upselling opportunities.</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};