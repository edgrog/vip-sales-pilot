import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Send, Bot, User, TrendingDown, TrendingUp, AlertTriangle, Users, DollarSign, Target, BarChart3, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { SalesAIChat } from "./SalesAIChat";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
  totalActivePODs: number;
  activePODsChange: number;
  totalStoresWithSales: number; // Keep for backward compatibility
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
  const navigate = useNavigate();
  const [salesData, setSalesData] = useState<VipSalesData[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isChainPerformanceOpen, setIsChainPerformanceOpen] = useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<'chain' | 'churn' | 'growing' | 'velocity' | 'accounts'>('chain'); // Track which section to show
  const [isChurnRiskOpen, setIsChurnRiskOpen] = useState(false); // For churn risk collapsible
  const [isGrowingAccountsOpen, setIsGrowingAccountsOpen] = useState(false); // For growing accounts collapsible

  const fetchSalesData = async () => {
    console.log('Starting to fetch sales data...');
    try {
      // Fetch all records using pagination to bypass 1000 record limit
      const pageSize = 1000;
      let allData: VipSalesData[] = [];
      let page = 0;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('vip_sales' as any)
          .select('*')
          .range(page * pageSize, (page + 1) * pageSize - 1);

        console.log(`Fetched page ${page + 1}:`, data?.length || 0, 'records');
        
        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }

        if (data && data.length > 0) {
          allData = [...allData, ...(data as unknown as VipSalesData[])];
          hasMore = data.length === pageSize; // Continue if we got a full page
          page++;
        } else {
          hasMore = false;
        }
      }

      console.log('Total records fetched across all pages:', allData.length);
      console.log('Supabase response complete');
      
      const typedData = allData as unknown as VipSalesData[];
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
    console.log('DEBUG: Total records from database (including NULL):', data.length);
    console.log('DEBUG: First few records:', data.slice(0, 3));
    console.log('DEBUG: Last few records:', data.slice(-3));
    
    // Filter out invalid records for calculations, but keep count of all records
    const validData = data.filter(account => 
      account["Retail Accounts"] && 
      account["Retail Accounts"].trim() !== '' && 
      account["Retail Accounts"] !== 'Total'
    );
    
    console.log('DEBUG: Valid records after filtering:', validData.length);
    console.log('DEBUG: NULL/invalid records:', data.length - validData.length);
    
    if (!validData.length) return;

    // Calculate Active PODs (stores with sales in last 2 months: June + July)
    const activePODsCurrentPeriod = new Set();
    const activePODsJulyOnly = new Set();
    const activePODsJuneOnly = new Set();
    
    validData.forEach(account => {
      const june = account["June 2025"] || 0;
      const july = account["July 2025"] || 0;
      
      // Active in last 2 months (June + July)
      if (june > 0 || july > 0) {
        activePODsCurrentPeriod.add(account["Retail Accounts"]);
      }
      
      // Active in July only (for comparison)
      if (july > 0) {
        activePODsJulyOnly.add(account["Retail Accounts"]);
      }
      
      // Active in June only (for comparison)
      if (june > 0) {
        activePODsJuneOnly.add(account["Retail Accounts"]);
      }
    });
    
    const totalActivePODs = activePODsCurrentPeriod.size;
    const julyActivePODs = activePODsJulyOnly.size;
    const juneActivePODs = activePODsJuneOnly.size;
    
    // Calculate month-over-month change (July vs June)
    const activePODsChange = juneActivePODs > 0 ? ((julyActivePODs - juneActivePODs) / juneActivePODs) * 100 : 0;
    
    console.log('Active PODs - Last 2 months:', totalActivePODs);
    console.log('Active PODs - July:', julyActivePODs);
    console.log('Active PODs - June:', juneActivePODs);
    console.log('Active PODs - Change:', activePODsChange.toFixed(1) + '%');
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
    const averageSalesVelocity = totalActivePODs > 0 ? totalJulyCases / totalActivePODs : 0;
    const juneVelocity = totalActivePODs > 0 ? totalJuneCases / totalActivePODs : 0;
    const velocityChange = juneVelocity > 0 ? ((averageSalesVelocity - juneVelocity) / juneVelocity) * 100 : 0;
    
    // Calculate all-time high velocity from all three months
    let totalMayCases = 0;
    validData.forEach(account => {
      totalMayCases += account["May 2025"] || 0;
    });
    
    const mayVelocity = totalActivePODs > 0 ? totalMayCases / totalActivePODs : 0;
    const allTimeHighVelocity = Math.max(mayVelocity, juneVelocity, averageSalesVelocity);

    setDashboardData({
      totalActivePODs,
      activePODsChange,
      totalStoresWithSales: totalActivePODs, // Use active PODs for backward compatibility
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

  const getChurnRiskStores = () => {
    if (!dashboardData) return [];
    
    return dashboardData.accountPerformance
      .filter(account => account.status === 'churn-risk' || account.status === 'dropped')
      .map(account => {
        // Calculate actual case reduction (we need to get the June data for this)
        const storeData = salesData.find(data => data["Retail Accounts"] === account.name);
        const juneCases = storeData ? (storeData["June 2025"] || 0) : 0;
        const julyCases = account.julyCases;
        const caseReduction = juneCases - julyCases; // Positive number = cases lost
        
        return {
          ...account,
          caseReduction: caseReduction,
          juneCases: juneCases
        };
      })
      .sort((a, b) => b.caseReduction - a.caseReduction); // Sort by largest case reduction first
  };

  const getGrowingStores = () => {
    if (!dashboardData) return [];
    
    return dashboardData.accountPerformance
      .filter(account => account.status === 'growing')
      .map(account => {
        // Calculate actual case increase (we need to get the June data for this)
        const storeData = salesData.find(data => data["Retail Accounts"] === account.name);
        const juneCases = storeData ? (storeData["June 2025"] || 0) : 0;
        const julyCases = account.julyCases;
        const caseIncrease = julyCases - juneCases; // Positive number = cases gained
        
        return {
          ...account,
          caseIncrease: caseIncrease,
          juneCases: juneCases
        };
      })
      .sort((a, b) => b.caseIncrease - a.caseIncrease); // Sort by largest case increase first
  };

  const getVelocityData = () => {
    if (!dashboardData || !salesData.length) return [];
    
    // Calculate velocity for each month using valid accounts only
    const validData = salesData.filter(account => 
      account["Retail Accounts"] && 
      account["Retail Accounts"].trim() !== '' && 
      account["Retail Accounts"] !== 'Total'
    );

    const validAccountsCount = validData.length; // Use valid accounts only (1,578)
    
    let totalMayCases = 0;
    let totalJuneCases = 0;
    let totalJulyCases = 0;

    validData.forEach(account => {
      totalMayCases += account["May 2025"] || 0;
      totalJuneCases += account["June 2025"] || 0;
      totalJulyCases += account["July 2025"] || 0;
    });

    const mayVelocity = validAccountsCount > 0 ? totalMayCases / validAccountsCount : 0;
    const juneVelocity = validAccountsCount > 0 ? totalJuneCases / validAccountsCount : 0;
    const julyVelocity = validAccountsCount > 0 ? totalJulyCases / validAccountsCount : 0;

    return [
      {
        month: 'May 2025',
        velocity: Number(mayVelocity.toFixed(2)),
        cases: totalMayCases
      },
      {
        month: 'June 2025',
        velocity: Number(juneVelocity.toFixed(2)),
        cases: totalJuneCases
      },
      {
        month: 'July 2025',
        velocity: Number(julyVelocity.toFixed(2)),
        cases: totalJulyCases
      }
    ];
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
            <div className="w-16 h-16 rounded-lg overflow-hidden">
              <img 
                src="/lovable-uploads/072fbba7-85ff-4594-94d0-c4f01498cf16.png" 
                alt="Grog Logo" 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Grog Sales Analyser 3000</h1>
              <p className="text-sm text-foreground/80">AI-Powered CPG Performance Analytics</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-6">

        {/* Key Metrics Dashboard - Now properly spaced below chat */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card 
            className="card-grog cursor-pointer hover:shadow-glow transition-all duration-300" 
            onClick={() => setActiveSection('accounts')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active PODs</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">Stores with orders in last 2 months</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-foreground">{dashboardData.totalActivePODs}</div>
                  <div className={`text-xs font-medium mt-1 flex items-center gap-1 ${
                    dashboardData.activePODsChange >= 0 ? 'text-success' : 'text-destructive'
                  }`}>
                    {dashboardData.activePODsChange >= 0 ? '+' : ''}{dashboardData.activePODsChange.toFixed(1)}%
                    <span className="text-muted-foreground">vs last month</span>
                  </div>
                </div>
                <Users className="w-8 h-8 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Click to view details</p>
            </CardContent>
          </Card>

          <Card 
            className="card-grog cursor-pointer hover:shadow-glow transition-all duration-300" 
            onClick={() => setActiveSection('churn')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Churn Risk</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-destructive">{dashboardData.churnRiskAccounts}</div>
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Click to view details</p>
            </CardContent>
          </Card>

          <Card 
            className="card-grog cursor-pointer hover:shadow-glow transition-all duration-300" 
            onClick={() => setActiveSection('growing')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Growing Accounts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-success">{dashboardData.growingAccounts}</div>
                <TrendingUp className="w-8 h-8 text-success" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Click to view details</p>
            </CardContent>
          </Card>

          <Card 
            className="card-grog cursor-pointer hover:shadow-glow transition-all duration-300" 
            onClick={() => setActiveSection('velocity')}
          >
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
                <p className="text-xs text-muted-foreground">Click to view monthly breakdown</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dynamic Section: Chain Performance or Churn Risk */}
        <Card className="card-grog mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">
                  {activeSection === 'chain' ? 'Chain Performance Breakdown' : 
                   activeSection === 'churn' ? 'Churn Risk Analysis' : 
                   activeSection === 'growing' ? 'Growing Accounts Performance' : 
                   activeSection === 'accounts' ? 'All Accounts Performance' : 'Sales Velocity Breakdown'}
                </CardTitle>
                <CardDescription>
                  {activeSection === 'chain' 
                    ? 'Sales performance by retail chain (June to July 2025)' 
                    : activeSection === 'churn'
                    ? 'Stores requiring immediate attention'
                    : activeSection === 'growing'
                    ? 'Top performing stores with strong growth'
                    : activeSection === 'accounts'
                    ? 'All stores ranked by sales per week (July 2025)'
                    : 'Monthly sales velocity trend (May - July 2025)'
                  }
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {activeSection === 'chain' ? (
              // Chain Performance Section
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px]">Chain</TableHead>
                      <TableHead className="text-center w-[80px]">Stores</TableHead>
                      <TableHead className="text-right w-[120px] pr-6">Cases/Week</TableHead>
                      <TableHead className="text-right w-[100px] pr-6">Growth</TableHead>
                      <TableHead className="text-center w-[100px]">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dashboardData.chainPerformance.slice(0, 5).map((chain) => (
                      <TableRow 
                        key={chain.chain}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => navigate(`/chains/${encodeURIComponent(chain.chain)}`)}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-semibold text-primary">{chain.chain.charAt(0)}</span>
                            </div>
                            {chain.chain}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{chain.accounts}</TableCell>
                        <TableCell className="text-right font-medium pr-6">{chain.totalCases.toFixed(1)}</TableCell>
                        <TableCell className={`text-right font-medium pr-6 ${
                          chain.avgGrowth >= 0 ? 'text-success' : 'text-destructive'
                        }`}>
                          {chain.avgGrowth >= 0 ? '+' : ''}{chain.avgGrowth.toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge 
                            variant={
                              chain.status === 'growing' ? 'default' : 
                              chain.status === 'declining' ? 'destructive' : 
                              'secondary'
                            }
                            className={
                              chain.status === 'growing' ? 'bg-success text-success-foreground' :
                              chain.status === 'declining' ? 'bg-destructive text-destructive-foreground' :
                              'bg-secondary text-secondary-foreground'
                            }
                          >
                            {chain.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    
                    {/* Conditionally show remaining chains */}
                    {isChainPerformanceOpen && dashboardData.chainPerformance.slice(5).map((chain) => (
                      <TableRow 
                        key={chain.chain}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => navigate(`/chains/${encodeURIComponent(chain.chain)}`)}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-semibold text-primary">{chain.chain.charAt(0)}</span>
                            </div>
                            {chain.chain}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{chain.accounts}</TableCell>
                        <TableCell className="text-right font-medium pr-6">{chain.totalCases.toFixed(1)}</TableCell>
                        <TableCell className={`text-right font-medium pr-6 ${
                          chain.avgGrowth >= 0 ? 'text-success' : 'text-destructive'
                        }`}>
                          {chain.avgGrowth >= 0 ? '+' : ''}{chain.avgGrowth.toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge 
                            variant={
                              chain.status === 'growing' ? 'default' : 
                              chain.status === 'declining' ? 'destructive' : 
                              'secondary'
                            }
                            className={
                              chain.status === 'growing' ? 'bg-success text-success-foreground' :
                              chain.status === 'declining' ? 'bg-destructive text-destructive-foreground' :
                              'bg-secondary text-secondary-foreground'
                            }
                          >
                            {chain.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {/* Toggle button */}
                {dashboardData.chainPerformance.length > 5 && (
                  <button
                    onClick={() => setIsChainPerformanceOpen(!isChainPerformanceOpen)}
                    className="flex items-center justify-center w-full p-2 text-sm text-muted-foreground hover:text-foreground transition-colors border rounded-lg bg-muted/30 hover:bg-muted/50"
                  >
                    <span className="mr-2">
                      {isChainPerformanceOpen ? `Hide ${dashboardData.chainPerformance.length - 5} more chains` : `Show ${dashboardData.chainPerformance.length - 5} more chains`}
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${isChainPerformanceOpen ? 'rotate-180' : ''}`} />
                  </button>
                )}
              </div>
            ) : activeSection === 'churn' ? (
              // Churn Risk Section
              <Collapsible open={isChurnRiskOpen} onOpenChange={setIsChurnRiskOpen}>
                {getChurnRiskStores().length > 0 ? (
                  <>
                     {/* Preview: First 3 churn risk stores */}
                     <div className="space-y-4">
                        {getChurnRiskStores().slice(0, 3).map((store, index) => (
                          <div 
                            key={`${store.name}-${index}`} 
                            className="flex items-center justify-between p-4 rounded-lg border border-destructive/20 bg-destructive/5 cursor-pointer hover:bg-destructive/10 transition-colors"
                            onClick={() => navigate(`/accounts/${encodeURIComponent(store.name)}`)}
                          >
                            <div className="flex items-center gap-3">
                              <AlertTriangle className="w-5 h-5 text-destructive" />
                              <div>
                                <h4 className="font-medium text-foreground">{store.name}</h4>
                                <p className="text-sm text-muted-foreground">{store.state} • {store.julyCases.toFixed(1)} cases/week (July)</p>
                                <p className="text-xs text-muted-foreground">June: {store.juneCases.toFixed(1)} cases/week</p>
                                <div className="mt-1">
                                  {getStatusBadge(store.status)}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-destructive">
                                -{store.caseReduction.toFixed(1)}
                              </div>
                              <p className="text-xs text-muted-foreground">Cases Lost/Week</p>
                              <p className="text-xs text-muted-foreground">({store.growth.toFixed(1)}%)</p>
                            </div>
                          </div>
                        ))}
                     </div>

                    {/* Collapsible trigger */}
                    {getChurnRiskStores().length > 3 && (
                      <CollapsibleTrigger className="flex items-center justify-center w-full mt-4 p-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                        <span className="mr-2">
                          {isChurnRiskOpen ? `Hide ${getChurnRiskStores().length - 3} more stores` : `Show ${getChurnRiskStores().length - 3} more stores`}
                        </span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${isChurnRiskOpen ? 'rotate-180' : ''}`} />
                      </CollapsibleTrigger>
                    )}

                     {/* Collapsible content: Remaining churn risk stores */}
                     <CollapsibleContent>
                       <div className="space-y-4 mt-4">
                          {getChurnRiskStores().slice(3).map((store, index) => (
                            <div 
                              key={`${store.name}-${index + 3}`} 
                              className="flex items-center justify-between p-4 rounded-lg border border-destructive/20 bg-destructive/5 cursor-pointer hover:bg-destructive/10 transition-colors"
                              onClick={() => navigate(`/accounts/${encodeURIComponent(store.name)}`)}
                            >
                              <div className="flex items-center gap-3">
                                <AlertTriangle className="w-5 h-5 text-destructive" />
                                <div>
                                  <h4 className="font-medium text-foreground">{store.name}</h4>
                                  <p className="text-sm text-muted-foreground">{store.state} • {store.julyCases.toFixed(1)} cases/week (July)</p>
                                  <p className="text-xs text-muted-foreground">June: {store.juneCases.toFixed(1)} cases/week</p>
                                  <div className="mt-1">
                                    {getStatusBadge(store.status)}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold text-destructive">
                                  -{store.caseReduction.toFixed(1)}
                                </div>
                                <p className="text-xs text-muted-foreground">Cases Lost/Week</p>
                                <p className="text-xs text-muted-foreground">({store.growth.toFixed(1)}%)</p>
                              </div>
                            </div>
                          ))}
                       </div>
                     </CollapsibleContent>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <TrendingUp className="w-8 h-8 text-success" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">No Churn Risk Detected</h3>
                    <p className="text-muted-foreground">All stores are performing within acceptable ranges.</p>
                  </div>
                )}
              </Collapsible>
            ) : activeSection === 'growing' ? (
              // Growing Accounts Section
              <Collapsible open={isGrowingAccountsOpen} onOpenChange={setIsGrowingAccountsOpen}>
                {getGrowingStores().length > 0 ? (
                  <>
                    {/* Preview: First 3 growing stores */}
                    <div className="space-y-4">
                      {getGrowingStores().slice(0, 3).map((store, index) => (
                        <div 
                          key={`${store.name}-${index}`} 
                          className="flex items-center justify-between p-4 rounded-lg border border-success/20 bg-success/5 cursor-pointer hover:bg-success/10 transition-colors"
                          onClick={() => navigate(`/accounts/${encodeURIComponent(store.name)}`)}
                        >
                          <div className="flex items-center gap-3">
                            <TrendingUp className="w-5 h-5 text-success" />
                            <div>
                              <h4 className="font-medium text-foreground">{store.name}</h4>
                              <p className="text-sm text-muted-foreground">{store.state} • {store.julyCases.toFixed(1)} cases/week • June: {store.juneCases.toFixed(1)}</p>
                              <div className="mt-1">
                                {getStatusBadge(store.status)}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-success">
                              +{store.caseIncrease.toFixed(1)}
                            </div>
                            <p className="text-xs text-muted-foreground">Cases/Week Gained</p>
                            <div className="text-xs text-success font-medium">
                              +{store.growth.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Collapsible trigger */}
                    {getGrowingStores().length > 3 && (
                      <CollapsibleTrigger className="flex items-center justify-center w-full mt-4 p-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                        <span className="mr-2">
                          {isGrowingAccountsOpen ? `Hide ${getGrowingStores().length - 3} more stores` : `Show ${getGrowingStores().length - 3} more stores`}
                        </span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${isGrowingAccountsOpen ? 'rotate-180' : ''}`} />
                      </CollapsibleTrigger>
                    )}

                    {/* Collapsible content: Remaining growing stores */}
                    <CollapsibleContent>
                      <div className="space-y-4 mt-4">
                        {getGrowingStores().slice(3).map((store, index) => (
                          <div 
                            key={`${store.name}-${index + 3}`} 
                            className="flex items-center justify-between p-4 rounded-lg border border-success/20 bg-success/5 cursor-pointer hover:bg-success/10 transition-colors"
                            onClick={() => navigate(`/accounts/${encodeURIComponent(store.name)}`)}
                          >
                            <div className="flex items-center gap-3">
                              <TrendingUp className="w-5 h-5 text-success" />
                              <div>
                                <h4 className="font-medium text-foreground">{store.name}</h4>
                                <p className="text-sm text-muted-foreground">{store.state} • {store.julyCases.toFixed(1)} cases/week • June: {store.juneCases.toFixed(1)}</p>
                                <div className="mt-1">
                                  {getStatusBadge(store.status)}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-success">
                                +{store.caseIncrease.toFixed(1)}
                              </div>
                              <p className="text-xs text-muted-foreground">Cases/Week Gained</p>
                              <div className="text-xs text-success font-medium">
                                +{store.growth.toFixed(1)}%
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-muted/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <TrendingUp className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">No Growing Accounts</h3>
                    <p className="text-muted-foreground">No stores are currently showing significant growth.</p>
                  </div>
                )}
              </Collapsible>
            ) : activeSection === 'accounts' ? (
              // All Accounts Section
              <div className="space-y-4">
                {dashboardData.accountPerformance
                  .filter(account => account.julyCases > 0)
                  .sort((a, b) => b.julyCases - a.julyCases) // Sort by sales per week
                  .slice(0, 10) // Show first 10 accounts to match chain performance visibility
                  .map((account, index) => (
                    <div 
                      key={`${account.name}-${account.state}`} 
                      className="flex items-center justify-between p-4 rounded-lg border border-border bg-card/50 cursor-pointer hover:bg-card/80 transition-colors"
                      onClick={() => navigate(`/accounts/${encodeURIComponent(account.name)}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-primary font-semibold">{account.name.charAt(0)}</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground">{account.name}</h4>
                          <p className="text-sm text-muted-foreground">{account.state}</p>
                          <div className="mt-1">
                            {getStatusBadge(account.status)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-foreground">
                          {account.julyCases.toFixed(1)}
                        </div>
                        <p className="text-xs text-muted-foreground">Cases/Week</p>
                        <div className={`text-xs font-medium ${
                          account.growth >= 0 ? 'text-success' : 'text-destructive'
                        }`}>
                          {account.growth >= 0 ? '+' : ''}{account.growth.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                
                {/* Collapsible for remaining accounts */}
                <Collapsible>
                  <CollapsibleTrigger className="flex items-center justify-center w-full mt-4 p-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <span className="mr-2">
                      Show {dashboardData.accountPerformance.filter(account => account.julyCases > 0).length - 10} more accounts
                    </span>
                    <ChevronDown className="w-4 h-4 transition-transform ui-state-open:rotate-180" />
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="space-y-4 mt-4">
                      {dashboardData.accountPerformance
                        .filter(account => account.julyCases > 0)
                        .sort((a, b) => b.julyCases - a.julyCases)
                        .slice(10) // Skip first 10
                        .map((account, index) => (
                          <div 
                            key={`${account.name}-${account.state}-${index}`} 
                            className="flex items-center justify-between p-4 rounded-lg border border-border bg-card/50 cursor-pointer hover:bg-card/80 transition-colors"
                            onClick={() => navigate(`/accounts/${encodeURIComponent(account.name)}`)}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-primary font-semibold">{account.name.charAt(0)}</span>
                              </div>
                              <div>
                                <h4 className="font-medium text-foreground">{account.name}</h4>
                                <p className="text-sm text-muted-foreground">{account.state}</p>
                                <div className="mt-1">
                                  {getStatusBadge(account.status)}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-foreground">
                                {account.julyCases.toFixed(1)}
                              </div>
                              <p className="text-xs text-muted-foreground">Cases/Week</p>
                              <div className={`text-xs font-medium ${
                                account.growth >= 0 ? 'text-success' : 'text-destructive'
                              }`}>
                                {account.growth >= 0 ? '+' : ''}{account.growth.toFixed(1)}%
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            ) : (
              // Sales Velocity Section
              <div className="space-y-6">
                {/* Velocity Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {getVelocityData().map((month) => (
                    <div key={month.month} className="p-4 rounded-lg border border-border bg-card/30">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-foreground">{month.velocity}</div>
                        <p className="text-sm text-muted-foreground">Cases/Store/Week</p>
                        <p className="text-xs text-muted-foreground mt-1">{month.month}</p>
                        <p className="text-xs text-muted-foreground">Total: {month.cases.toLocaleString()} cases</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bar Chart */}
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getVelocityData()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="month" 
                        fontSize={12}
                        tickFormatter={(value) => value.split(' ')[0]} // Show only month name
                      />
                      <YAxis 
                        fontSize={12}
                        label={{ value: 'Cases per Store per Week', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        labelFormatter={(value) => value}
                        formatter={(value: number, name: string) => [
                          `${value} cases/store/week`,
                          'Sales Velocity'
                        ]}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar 
                        dataKey="velocity" 
                        fill="hsl(var(--primary))"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Velocity Insights */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border border-border bg-card/30">
                    <h4 className="font-medium text-foreground mb-2">Trend Analysis</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">June vs May:</span>
                        <span className={`text-sm font-medium ${
                          getVelocityData()[1]?.velocity >= getVelocityData()[0]?.velocity ? 'text-success' : 'text-destructive'
                        }`}>
                          {getVelocityData()[1]?.velocity >= getVelocityData()[0]?.velocity ? '+' : ''}
                          {getVelocityData()[1] && getVelocityData()[0] ? 
                            ((getVelocityData()[1].velocity - getVelocityData()[0].velocity) / getVelocityData()[0].velocity * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">July vs June:</span>
                        <span className={`text-sm font-medium ${
                          dashboardData.velocityChange >= 0 ? 'text-success' : 'text-destructive'
                        }`}>
                          {dashboardData.velocityChange >= 0 ? '+' : ''}{dashboardData.velocityChange.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border border-border bg-card/30">
                    <h4 className="font-medium text-foreground mb-2">Performance Metrics</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Current Velocity:</span>
                        <span className="text-sm font-medium">{dashboardData.averageSalesVelocity.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">All-Time High:</span>
                        <span className="text-sm font-medium text-success">{dashboardData.allTimeHighVelocity.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Active PODs:</span>
                        <span className="text-sm font-medium">{dashboardData.totalActivePODs.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Performance and Action Items */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <Card className="card-grog">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Account Performance ({dashboardData.accountPerformance.length} accounts)</CardTitle>
              <CardDescription>Store-level performance data with status indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
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

          <Card className="card-grog">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Chain Performance</CardTitle>
              <CardDescription>Performance breakdown by retail chain ({dashboardData.chainPerformance.length} chains)</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Chain</TableHead>
                      <TableHead className="text-center">Stores</TableHead>
                      <TableHead className="text-right">Cases/Week</TableHead>
                      <TableHead className="text-right">Growth</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dashboardData.chainPerformance.map((chain) => (
                      <TableRow 
                        key={chain.chain}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => navigate(`/chains/${encodeURIComponent(chain.chain)}`)}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-semibold text-primary">{chain.chain.charAt(0)}</span>
                            </div>
                            {chain.chain}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{chain.accounts}</TableCell>
                        <TableCell className="text-right font-medium">{chain.totalCases.toFixed(1)}</TableCell>
                        <TableCell className={`text-right font-medium ${
                          chain.avgGrowth >= 0 ? 'text-success' : 'text-destructive'
                        }`}>
                          {chain.avgGrowth >= 0 ? '+' : ''}{chain.avgGrowth.toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge 
                            variant={
                              chain.status === 'growing' ? 'default' : 
                              chain.status === 'declining' ? 'destructive' : 
                              'secondary'
                            }
                            className={
                              chain.status === 'growing' ? 'bg-success text-success-foreground' :
                              chain.status === 'declining' ? 'bg-destructive text-destructive-foreground' :
                              'bg-secondary text-secondary-foreground'
                            }
                          >
                            {chain.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>;
};