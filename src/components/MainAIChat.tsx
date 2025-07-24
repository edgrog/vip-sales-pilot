import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Bot, User, TrendingDown, TrendingUp, AlertTriangle, Users, DollarSign, Target, BarChart3 } from "lucide-react";
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
  churnRiskAccounts: number;
  growingAccounts: number;
  totalRevenueChange: number;
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

  const fetchSalesData = async () => {
    console.log('Starting to fetch sales data...');
    try {
      const { data, error } = await supabase
        .from('vip_sales' as any)
        .select('*');

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
    // Filter out records with null/empty account names
    const validData = data.filter(account => 
      account["Retail Accounts"] && 
      account["Retail Accounts"].trim() !== '' && 
      account["Retail Accounts"] !== 'Total'
    );
    
    console.log('Total records from database:', data.length);
    
    // Debug filtering step by step
    const nullAccounts = data.filter(account => !account["Retail Accounts"]);
    const emptyAccounts = data.filter(account => account["Retail Accounts"] && account["Retail Accounts"].trim() === '');
    const totalAccountsDebug = data.filter(account => account["Retail Accounts"] === 'Total');
    
    console.log('Records with null Retail Accounts:', nullAccounts.length);
    console.log('Records with empty Retail Accounts:', emptyAccounts.length);
    console.log('Records with "Total" as Retail Accounts:', totalAccountsDebug.length);
    console.log('Total filtered out:', nullAccounts.length + emptyAccounts.length + totalAccountsDebug.length);
    
    console.log('Valid records after filtering:', validData.length);
    console.log('Expected vs Actual:', {expected: 1578, actual: validData.length, difference: 1578 - validData.length});
    
    if (!validData.length) return;

    // Count ALL unique stores (not filtering by sales) to debug
    const allUniqueStores = new Set();
    const uniqueStoresWithSales = new Set();
    const storesWithNoSales = [];
    
    validData.forEach(account => {
      allUniqueStores.add(account["Retail Accounts"]);
      
      const may = account["May 2025"] || 0;
      const june = account["June 2025"] || 0;
      const july = account["July 2025"] || 0;
      
      // If store has any sales in any month, count it as active
      if (may > 0 || june > 0 || july > 0) {
        uniqueStoresWithSales.add(account["Retail Accounts"]);
      } else {
        storesWithNoSales.push(account["Retail Accounts"]);
      }
    });
    
    console.log('All unique stores in filtered data:', allUniqueStores.size);
    console.log('Unique stores with sales:', uniqueStoresWithSales.size);
    console.log('Stores with no sales:', storesWithNoSales.length);
    console.log('Should match SQL query of 1,578:', allUniqueStores.size === 1578);
    
    const totalAccounts = allUniqueStores.size; // Use all unique stores, not just those with sales
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

    setDashboardData({
      totalAccounts,
      churnRiskAccounts,
      growingAccounts,
      totalRevenueChange,
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
        {/* AI Chat Interface - Fixed height to prevent overlap */}
        <div className="mb-12">
          <SalesAIChat />
        </div>

        {/* Key Metrics Dashboard - Now properly spaced below chat */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card className="shadow-card border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Unique Retail Locations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-foreground">{dashboardData.totalAccounts}</div>
                <Users className="w-8 h-8 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Distinct stores with sales activity</p>
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
              <CardTitle className="text-sm font-medium text-muted-foreground">Revenue Change</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className={`text-3xl font-bold ${dashboardData.totalRevenueChange >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {dashboardData.totalRevenueChange >= 0 ? '+' : ''}{dashboardData.totalRevenueChange.toFixed(1)}%
                </div>
                <DollarSign className={`w-8 h-8 ${dashboardData.totalRevenueChange >= 0 ? 'text-success' : 'text-destructive'}`} />
              </div>
              <p className="text-xs text-muted-foreground mt-2">June to July change</p>
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
            <div className="space-y-4">
              {dashboardData.chainPerformance.map((chain, index) => (
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
                    <div key={account.name} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/30">
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