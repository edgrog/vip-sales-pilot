import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingDown, TrendingUp, AlertTriangle, Users, DollarSign, Target, MessageSquare } from "lucide-react";
import { useState } from "react";
import { AIChat } from "./AIChat";

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

export const Dashboard = () => {
  const [showChat, setShowChat] = useState(false);

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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">VIP Sales Co-Pilot</h1>
                <p className="text-sm text-muted-foreground">CPG Performance Analytics</p>
              </div>
            </div>
            <Button
              onClick={() => setShowChat(!showChat)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              AI Assistant
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* Key Metrics */}
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
        <div className="mb-8">
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
        </div>

        {/* Accounts Overview */}
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
                      <p className="text-sm text-muted-foreground">{account.region}</p>
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

      {/* AI Chat Overlay */}
      {showChat && <AIChat onClose={() => setShowChat(false)} />}
    </div>
  );
};