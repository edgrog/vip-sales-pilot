import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Send, Bot, User, TrendingDown, TrendingUp, AlertTriangle, Users, DollarSign, Target, BarChart3, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { SalesAIChat } from "./SalesAIChat";

interface VipSalesData {
  "Retail Accounts": string;
  "State": string;
  "Dist. STATE": string;
  "May 2025": number;
  "June 2025": number;
  "July 2025": number;
  normalized_chain?: string;
}

interface DashboardData {
  totalAccounts: number;
  totalStoresWithSales: number; // Add this new field
  churnRiskAccounts: number;
  growingAccounts: number;
  totalRevenueChange: number;
  averageSalesVelocity: number;
  velocityChange: number;
  allTimeHighVelocity: number;
  chainPerformance: Array<{
    chain: string;
    accounts: number;
    totalCases: number;
    avgGrowth: number;
    status: 'growing' | 'stable' | 'declining';
  }>;
  accountPerformance: Array<{
    name: string;
    state: string;
    julyCases: number;
    growth: number;
    status: 'growing' | 'stable' | 'churn-risk' | 'dropped';
  }>;
}

export const MainAIChat = () => {
  const [salesData, setSalesData] = useState<VipSalesData[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isChainPerformanceOpen, setIsChainPerformanceOpen] = useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);

  const fetchSalesData = async () => {
    console.log('Starting to fetch sales data...');
    try {
      const { data, error } = await supabase
        .from('vip_sales' as any)
        .select('*')
        .limit(3000); // Increase limit further to ensure we get all records

      console.log('Supabase response:', { data, error });
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      const typedData = data as unknown as VipSalesData[];
      console.log('Typed data length:', typedData?.length);
      setSalesData(typedData || []);
      calculateDashboardMetrics(typedData || []);
    } catch (error) {
      console.error('Error fetching sales data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDashboardMetrics = (data: VipSalesData[]) => {
    console.log('Total records from database (including NULL):', data.length);
    
    // Filter out invalid records for calculations, but keep count of all records
    const validData = data.filter(account => 
      account["Retail Accounts"] && 
      account["Retail Accounts"].trim() !== '' && 
      account["Retail Accounts"] !== 'Total'
    );
    
    console.log('Valid records after filtering:', validData.length);
    console.log('NULL/invalid records:', data.length - validData.length);
    
    if (!validData.length) return;

    // Count ALL unique stores (not filtering by sales) - even those with 0 sales
    const allUniqueStores = new Set();
    const uniqueStoresWithSales = new Set();
    const storesWithZeroSales = [];
    
    validData.forEach(account => {
      // Add every store to the total count, regardless of sales
      allUniqueStores.add(account["Retail Accounts"]);
      
      const may = account["May 2025"] || 0;
      const june = account["June 2025"] || 0;
      const july = account["July 2025"] || 0;
      
      // Since every store should have sales, count all as having sales
      // The original logic was incorrect - there are no valid stores with zero sales
      uniqueStoresWithSales.add(account["Retail Accounts"]);
    });
    
    console.log('All unique stores (after filtering NULL records):', allUniqueStores.size);
    console.log('This should match the total since every store has sales:', uniqueStoresWithSales.size);
    console.log('Should be 1,578:', allUniqueStores.size === 1578);
    
    const totalAccounts = data.length; // Include ALL records (including NULL entries)
    const totalStoresWithSales = allUniqueStores.size; // Only stores with valid names
    let churnRiskAccounts = 0;
    let growingAccounts = 0;
    let totalJuneCases = 0;
    let totalJulyCases = 0;

    // Calculate chain performance
    const chainMap = new Map<string, {
      accounts: number;
      totalCases: number;
      totalGrowth: number;
      accountGrowths: number[];
    }>();

    const accountPerformance: DashboardData['accountPerformance'] = [];

    validData.forEach(account => {
      const june = account["June 2025"] || 0;
      const july = account["July 2025"] || 0;
      const growth = june > 0 ? ((july - june) / june) * 100 : 0;
      
      totalJuneCases += june;
      totalJulyCases += july;

      // Determine account status
      let status: 'growing' | 'stable' | 'churn-risk' | 'dropped';
      if (july === 0) {
        status = 'dropped';
      } else if (growth > 10) {
        status = 'growing';
        growingAccounts++;
      } else if (growth < -20) {
        status = 'churn-risk';
        churnRiskAccounts++;
      } else {
        status = 'stable';
      }

      // Use normalized chain name from database
      const chainName = account.normalized_chain || 'Other';
      
      if (!chainMap.has(chainName)) {
        chainMap.set(chainName, {
          accounts: 0,
          totalCases: 0,
          totalGrowth: 0,
          accountGrowths: []
        });
      }
      
      const chainData = chainMap.get(chainName)!;
      chainData.accounts++;
      chainData.totalCases += july;
      chainData.accountGrowths.push(growth);

      accountPerformance.push({
        name: account["Retail Accounts"],
        state: account["State"],
        julyCases: july,
        growth,
        status
      });
    });

    // Calculate chain performance with status - only include chains with 5+ stores
    const chainPerformance = Array.from(chainMap.entries())
      .filter(([chain, data]) => data.accounts >= 5) // Only include chains with 5+ stores
      .map(([chain, data]) => {
        const avgGrowth = data.accountGrowths.reduce((sum, g) => sum + g, 0) / data.accountGrowths.length;
        let status: 'growing' | 'stable' | 'declining';
        
        if (avgGrowth > 5) status = 'growing';
        else if (avgGrowth < -5) status = 'declining';
        else status = 'stable';

        return {
          chain,
          accounts: data.accounts,
          totalCases: data.totalCases,
          avgGrowth,
          status
        };
      }).sort((a, b) => b.totalCases - a.totalCases);

    // Sort account performance by July cases
    accountPerformance.sort((a, b) => b.julyCases - a.julyCases);

    const totalRevenueChange = totalJuneCases > 0 ? ((totalJulyCases - totalJuneCases) / totalJuneCases) * 100 : 0;
    const averageSalesVelocity = totalAccounts > 0 ? totalJulyCases / totalAccounts : 0;
    const juneVelocity = totalAccounts > 0 ? totalJuneCases / totalAccounts : 0;
    const velocityChange = juneVelocity > 0 ? ((averageSalesVelocity - juneVelocity) / juneVelocity) * 100 : 0;
    
    // Calculate all-time high velocity from all three months
    let totalMayCases = 0;
    validData.forEach(account => {
      totalMayCases += account["May 2025"] || 0;
    });
    
    const mayVelocity = totalAccounts > 0 ? totalMayCases / totalAccounts : 0;
    const allTimeHighVelocity = Math.max(mayVelocity, juneVelocity, averageSalesVelocity);

    setDashboardData({
      totalAccounts,
      totalStoresWithSales, // Add this field
      churnRiskAccounts,
      growingAccounts,
      totalRevenueChange,
      averageSalesVelocity,
      velocityChange,
      allTimeHighVelocity,
      chainPerformance,
      accountPerformance: accountPerformance // Show all accounts, not just top 10
    });
  };

  useEffect(() => {
    fetchSalesData();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'churn-risk':
        return <Badge variant="destructive">Churn Risk</Badge>;
      case 'dropped':
        return <Badge variant="destructive">Dropped</Badge>;
      case 'growing':
        return <Badge variant="default" className="bg-green-100 text-green-800">Growing</Badge>;
      case 'stable':
        return <Badge variant="secondary">Stable</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const calculateGrowth = (current: number, previous: number): string => {
    if (previous === 0) return current > 0 ? '+∞' : '0';
    const growth = ((current - previous) / previous) * 100;
    return growth >= 0 ? `+${growth.toFixed(1)}%` : `${growth.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading sales data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-muted-foreground">No sales data available</p>
          </div>
        </div>
      </div>
    );
  }

  return <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
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

      <div className="container mx-auto px-6 py-8">
        {/* AI Chat Interface - Same width as chain performance */}
        <Card className="shadow-card border-0 mb-8">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">VIP Sales AI Assistant</CardTitle>
            <CardDescription>Get insights and analysis for your sales performance data</CardDescription>
          </CardHeader>
          <CardContent>
            <Collapsible open={isAIChatOpen} onOpenChange={setIsAIChatOpen}>
              <CollapsibleTrigger className="flex items-center justify-center w-full p-2 text-sm text-muted-foreground hover:text-foreground transition-colors border rounded-lg bg-muted/30 hover:bg-muted/50">
                <span className="mr-2">
                  {isAIChatOpen ? 'Hide AI Chat' : 'Show AI Chat'}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isAIChatOpen ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <div className="mt-4">
                  <SalesAIChat />
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>

        {/* Key Metrics Dashboard - Now properly spaced below chat */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <Card className="shadow-card border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Stores in Database</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-foreground">{dashboardData.totalAccounts}</div>
                <Users className="w-8 h-8 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">All stores listed</p>
            </CardContent>
          </Card>

          <Card className="shadow-card border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Stores with Sales Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-foreground">{dashboardData.totalStoresWithSales}</div>
                <DollarSign className="w-8 h-8 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Stores with May-July sales</p>
            </CardContent>
          </Card>

          <Card className="shadow-card border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Churn Risk</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-destructive">{dashboardData.churnRiskAccounts}</div>
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Accounts requiring attention</p>
            </CardContent>
          </Card>

          <Card className="shadow-card border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Growing Accounts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-success">{dashboardData.growingAccounts}</div>
                <TrendingUp className="w-8 h-8 text-success" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Accounts showing growth</p>
            </CardContent>
          </Card>

          <Card className="shadow-card border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Sales Velocity (July 2025)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-foreground">{dashboardData.averageSalesVelocity.toFixed(1)}</div>
                <BarChart3 className="w-8 h-8 text-primary" />
              </div>
              <div className="flex items-center gap-2 mt-2">
                <p className="text-xs text-muted-foreground">Cases per store per week</p>
                <div className={`text-xs font-medium ${
                  dashboardData.velocityChange >= 0 ? 'text-success' : 'text-destructive'
                }`}>
                  {dashboardData.velocityChange >= 0 ? '+' : ''}{dashboardData.velocityChange.toFixed(1)}%
                </div>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-muted-foreground">All-time high: {dashboardData.allTimeHighVelocity.toFixed(1)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chain Performance Breakdown */}
        <Card className="shadow-card border-0 mt-8">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Chain Performance Breakdown</CardTitle>
            <CardDescription>Sales performance by retail chain (June to July 2025)</CardDescription>
          </CardHeader>
          <CardContent>
            <Collapsible open={isChainPerformanceOpen} onOpenChange={setIsChainPerformanceOpen}>
              {/* Preview: Top 3 chains */}
              <div className="space-y-4">
                {dashboardData.chainPerformance.slice(0, 3).map((chain, index) => (
                  <div key={chain.chain} className="flex items-center justify-between p-4 rounded-lg border border-border bg-card/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-semibold">{chain.chain.charAt(0)}</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">{chain.chain}</h4>
                        <p className="text-sm text-muted-foreground">{chain.accounts} accounts • {chain.totalCases.toFixed(1)} cases/week</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${
                        chain.status === 'growing' ? 'text-success' : 
                        chain.status === 'declining' ? 'text-destructive' : 'text-muted-foreground'
                      }`}>
                        {chain.avgGrowth >= 0 ? '+' : ''}{chain.avgGrowth.toFixed(1)}%
                      </div>
                      <div className="text-xs text-muted-foreground capitalize">{chain.status}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Collapsible trigger */}
              {dashboardData.chainPerformance.length > 3 && (
                <CollapsibleTrigger className="flex items-center justify-center w-full mt-4 p-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <span className="mr-2">
                    {isChainPerformanceOpen ? `Hide ${dashboardData.chainPerformance.length - 3} more chains` : `Show ${dashboardData.chainPerformance.length - 3} more chains`}
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isChainPerformanceOpen ? 'rotate-180' : ''}`} />
                </CollapsibleTrigger>
              )}

              {/* Collapsible content: Remaining chains */}
              <CollapsibleContent>
                <div className="space-y-4 mt-4">
                  {dashboardData.chainPerformance.slice(3).map((chain, index) => (
                    <div key={chain.chain} className="flex items-center justify-between p-4 rounded-lg border border-border bg-card/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-primary font-semibold">{chain.chain.charAt(0)}</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground">{chain.chain}</h4>
                          <p className="text-sm text-muted-foreground">{chain.accounts} accounts • {chain.totalCases.toFixed(1)} cases/week</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-medium ${
                          chain.status === 'growing' ? 'text-success' : 
                          chain.status === 'declining' ? 'text-destructive' : 'text-muted-foreground'
                        }`}>
                          {chain.avgGrowth >= 0 ? '+' : ''}{chain.avgGrowth.toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted-foreground capitalize">{chain.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>

        {/* Account Performance and Action Items */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <Card className="shadow-card border-0">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Account Performance ({dashboardData.accountPerformance.length} accounts)</CardTitle>
              <CardDescription>Store-level performance data with status indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3 pr-4">
                  {dashboardData.accountPerformance.map((account, index) => (
                    <div key={`${account.name}-${index}`} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/30">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-foreground text-sm">{account.name}</h4>
                          {getStatusBadge(account.status)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{account.state} • {account.julyCases.toFixed(1)} cases/week</p>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-medium ${
                          account.growth > 0 ? 'text-success' : 
                          account.growth < -10 ? 'text-destructive' : 'text-muted-foreground'
                        }`}>
                          {account.growth >= 0 ? '+' : ''}{account.growth.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="shadow-card border-0">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Action Items</CardTitle>
              <CardDescription>Priority accounts requiring immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.churnRiskAccounts > 0 && (
                  <div className="p-4 rounded-lg border border-destructive/20 bg-destructive/5">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
                      <div>
                        <h4 className="font-medium text-foreground">Urgent: Churn Risk Accounts</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {dashboardData.churnRiskAccounts} accounts showing significant decline (&gt;20% drop).
                          <span className="font-medium text-destructive"> Immediate follow-up required.</span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {dashboardData.totalRevenueChange < 0 && (
                  <div className="p-4 rounded-lg border border-warning/20 bg-warning/5">
                    <div className="flex items-start gap-3">
                      <TrendingDown className="w-5 h-5 text-warning mt-0.5" />
                      <div>
                        <h4 className="font-medium text-foreground">Revenue Decline</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Overall revenue down {Math.abs(dashboardData.totalRevenueChange).toFixed(1)}% from June to July.
                          <span className="font-medium text-warning"> Chain performance review needed.</span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {dashboardData.growingAccounts > 0 && (
                  <div className="p-4 rounded-lg border border-success/20 bg-success/5">
                    <div className="flex items-start gap-3">
                      <TrendingUp className="w-5 h-5 text-success mt-0.5" />
                      <div>
                        <h4 className="font-medium text-foreground">Growth Opportunity</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {dashboardData.growingAccounts} accounts showing strong growth (&gt;10% increase).
                          <span className="font-medium text-success"> Consider expansion opportunities.</span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>;
};