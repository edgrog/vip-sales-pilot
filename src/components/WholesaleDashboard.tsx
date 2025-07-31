import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Package, DollarSign, Store, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
interface MonthlyData {
  month: string;
  cases: number;
  monthName: string;
}
interface ChainPerformance {
  chain: string;
  totalCases: number;
  recentCases: number;
  stores: number;
  thisMonthCases: number;
  lastMonthCases: number;
  growthRate: number;
}
interface StateData {
  state: string;
  totalCases: number;
  chains: number;
}
interface StoreBreakdown {
  storeName: string;
  state: string;
  totalCases: number;
  recentCases: number;
  thisMonthCases: number;
  lastMonthCases: number;
  growthRate: number;
}

// Client-side chain normalization function
const normalizeChainName = (retailAccount: string): string => {
  if (!retailAccount) return "Unknown";
  const account = retailAccount.toUpperCase().trim();
  if (account.includes('HEB')) return 'HEB';
  if (account.includes('WALMART')) return 'Walmart';
  if (account.includes('TARGET')) return 'Target';
  if (account.includes('KROGER')) return 'Kroger';
  if (account.includes('SAFEWAY')) return 'Safeway';
  if (account.includes('PUBLIX')) return 'Publix';
  if (account.includes('COSTCO')) return 'Costco';
  if (account.includes('SAM')) return "Sam's Club";
  if (account.includes('WHOLE FOODS')) return 'Whole Foods';
  if (account.includes('CVS')) return 'CVS';
  if (account.includes('WALGREENS')) return 'Walgreens';
  if (account.includes('7 ELEVEN') || account.includes('7-ELEVEN')) return '7-Eleven';
  if (account.includes('BEVERAGES')) return 'BevMo';

  // Extract first word for other chains, but skip common generic words
  const firstWord = account.split(' ')[0];
  const genericWords = ['LIQUOR', 'WINE', 'BEER', 'SPIRITS', 'MARKET', 'STORE', 'SHOP'];
  
  if (genericWords.includes(firstWord)) {
    // For generic words, try to find a more specific identifier or use full name
    const words = account.split(' ');
    if (words.length > 1) {
      // Look for a more specific second word or use the first two words
      const secondWord = words[1];
      if (secondWord && !genericWords.includes(secondWord)) {
        return `${firstWord} ${secondWord}`;
      }
    }
    // If no better identifier, use the full name (truncated if too long)
    return account.length > 20 ? account.substring(0, 20) + '...' : account;
  }
  
  return firstWord;
};
export const WholesaleDashboard = () => {
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [chainData, setChainData] = useState<ChainPerformance[]>([]);
  const [stateData, setStateData] = useState<StateData[]>([]);
  const [selectedChain, setSelectedChain] = useState<string | null>(null);
  const [chainBreakdown, setChainBreakdown] = useState<StoreBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCases, setTotalCases] = useState(0);
  const [totalStores, setTotalStores] = useState(0);
  const [activeStoresMonthlyData, setActiveStoresMonthlyData] = useState<MonthlyData[]>([]);
  useEffect(() => {
    fetchWholesaleData();
  }, []);
  const fetchWholesaleData = async () => {
    try {
      setLoading(true);

      // Fetch all records using pagination to bypass 1000 record limit
      let allRecords: any[] = [];
      let from = 0;
      const pageSize = 1000;
      while (true) {
        const {
          data: pageData,
          error
        } = await supabase.from("VIP_RAW_12MO").select("*").range(from, from + pageSize - 1);
        if (error) throw error;
        if (!pageData || pageData.length === 0) break;
        allRecords = [...allRecords, ...pageData];
        if (pageData.length < pageSize) break; // Last page

        from += pageSize;
      }
      const data = allRecords;
      console.log(`Raw data length: ${data?.length}`);

      // Process monthly data for the last 12 months
      const monthlyColumns = [{
        col: "1 Month 8/1/2024 thru 8/31/2024  Case Equivs",
        month: "2024-08",
        name: "Aug 2024"
      }, {
        col: "1 Month 9/1/2024 thru 9/30/2024  Case Equivs",
        month: "2024-09",
        name: "Sep 2024"
      }, {
        col: "1 Month 10/1/2024 thru 10/31/2024  Case Equivs",
        month: "2024-10",
        name: "Oct 2024"
      }, {
        col: "1 Month 11/1/2024 thru 11/30/2024  Case Equivs",
        month: "2024-11",
        name: "Nov 2024"
      }, {
        col: "1 Month 12/1/2024 thru 12/31/2024  Case Equivs",
        month: "2024-12",
        name: "Dec 2024"
      }, {
        col: "1 Month 1/1/2025 thru 1/31/2025  Case Equivs",
        month: "2025-01",
        name: "Jan 2025"
      }, {
        col: "1 Month 2/1/2025 thru 2/28/2025  Case Equivs",
        month: "2025-02",
        name: "Feb 2025"
      }, {
        col: "1 Month 3/1/2025 thru 3/31/2025  Case Equivs",
        month: "2025-03",
        name: "Mar 2025"
      }, {
        col: "1 Month 4/1/2025 thru 4/30/2025  Case Equivs",
        month: "2025-04",
        name: "Apr 2025"
      }, {
        col: "1 Month 5/1/2025 thru 5/31/2025  Case Equivs",
        month: "2025-05",
        name: "May 2025"
      }, {
        col: "1 Month 6/1/2025 thru 6/30/2025  Case Equivs",
        month: "2025-06",
        name: "Jun 2025"
      }, {
        col: "1 Month 7/1/2025 thru 7/23/2025  Case Equivs",
        month: "2025-07",
        name: "Jul 2025"
      }];
      const monthlyResults: MonthlyData[] = monthlyColumns.map(({
        col,
        month,
        name
      }) => {
        const cases = data?.reduce((sum, row) => {
          const val = row[col];
          const numVal = typeof val === 'number' ? val : typeof val === 'string' && val !== '' && val !== null ? parseFloat(val) : 0;
          return sum + (isNaN(numVal) || numVal === null ? 0 : numVal);
        }, 0) || 0;
        return {
          month,
          monthName: name,
          cases: Math.round(cases)
        };
      });
      setMonthlyData(monthlyResults);

      // Process chain performance data
      const chainMap = new Map<string, {
        total: number;
        recent: number;
        thisMonth: number;
        lastMonth: number;
        stores: Set<string>;
      }>();
      data?.forEach(row => {
        // Apply normalization on client side
        const rawChain = row["Retail Accounts"] || "Unknown";
        const normalizedChain = normalizeChainName(rawChain);
        const state = row["State"] || "Unknown";
        const storeKey = `${rawChain}-${state}`;
        if (!chainMap.has(normalizedChain)) {
          chainMap.set(normalizedChain, {
            total: 0,
            recent: 0,
            thisMonth: 0,
            lastMonth: 0,
            stores: new Set()
          });
        }
        const chainInfo = chainMap.get(normalizedChain)!;
        chainInfo.stores.add(storeKey);

        // Add total cases from the last 3 months
        const recentMonths = ["1 Month 5/1/2025 thru 5/31/2025  Case Equivs", "1 Month 6/1/2025 thru 6/30/2025  Case Equivs", "1 Month 7/1/2025 thru 7/23/2025  Case Equivs"];
        recentMonths.forEach(monthCol => {
          const val = row[monthCol];
          const numVal = typeof val === 'number' ? val : typeof val === 'string' && val !== '' && val !== null ? parseFloat(val) : 0;
          chainInfo.recent += isNaN(numVal) || numVal === null ? 0 : numVal;
        });

        // Add this month's cases (July 2025)
        const thisMonthVal = row["1 Month 7/1/2025 thru 7/23/2025  Case Equivs"];
        const thisMonthNum = typeof thisMonthVal === 'number' ? thisMonthVal : typeof thisMonthVal === 'string' && thisMonthVal !== '' && thisMonthVal !== null ? parseFloat(thisMonthVal) : 0;
        chainInfo.thisMonth += isNaN(thisMonthNum) || thisMonthNum === null ? 0 : thisMonthNum;

        // Add last month's cases (June 2025)
        const lastMonthVal = row["1 Month 6/1/2025 thru 6/30/2025  Case Equivs"];
        const lastMonthNum = typeof lastMonthVal === 'number' ? lastMonthVal : typeof lastMonthVal === 'string' && lastMonthVal !== '' && lastMonthVal !== null ? parseFloat(lastMonthVal) : 0;
        chainInfo.lastMonth += isNaN(lastMonthNum) || lastMonthNum === null ? 0 : lastMonthNum;

        // Add total from 12-month column
        const totalVal = row["12 Months 8/1/2024 thru 7/23/2025  Case Equivs"];
        const totalNumVal = typeof totalVal === 'number' ? totalVal : typeof totalVal === 'string' && totalVal !== '' && totalVal !== null ? parseFloat(totalVal) : 0;
        chainInfo.total += isNaN(totalNumVal) || totalNumVal === null ? 0 : totalNumVal;
      });
      const chainResults: ChainPerformance[] = Array.from(chainMap.entries()).map(([chain, info]) => {
        const thisMonth = Math.round(info.thisMonth);
        const lastMonth = Math.round(info.lastMonth);
        const growthRate = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;
        
        return {
          chain,
          totalCases: Math.round(info.total),
          recentCases: Math.round(info.recent),
          thisMonthCases: thisMonth,
          lastMonthCases: lastMonth,
          growthRate: growthRate,
          stores: info.stores.size
        };
      }).sort((a, b) => b.totalCases - a.totalCases).slice(0, 10);
      setChainData(chainResults);

      // Process state data
      const stateMap = new Map<string, {
        total: number;
        chains: Set<string>;
      }>();
      data?.forEach(row => {
        const state = row["State"] || "Unknown";
        const rawChain = row["Retail Accounts"] || "Unknown";
        const normalizedChain = normalizeChainName(rawChain);
        if (!stateMap.has(state)) {
          stateMap.set(state, {
            total: 0,
            chains: new Set()
          });
        }
        const stateInfo = stateMap.get(state)!;
        stateInfo.chains.add(normalizedChain);
        const totalVal = row["12 Months 8/1/2024 thru 7/23/2025  Case Equivs"];
        const totalNumVal = typeof totalVal === 'number' ? totalVal : typeof totalVal === 'string' && totalVal !== '' && totalVal !== null ? parseFloat(totalVal) : 0;
        stateInfo.total += isNaN(totalNumVal) || totalNumVal === null ? 0 : totalNumVal;
      });
      const stateResults: StateData[] = Array.from(stateMap.entries()).map(([state, info]) => ({
        state,
        totalCases: Math.round(info.total),
        chains: info.chains.size
      })).sort((a, b) => b.totalCases - a.totalCases).slice(0, 15);
      setStateData(stateResults);

      // Calculate total cases from all data (not just top chains)
      const totalCasesSum = data?.reduce((sum, row) => {
        const totalVal = row["12 Months 8/1/2024 thru 7/23/2025  Case Equivs"];
        const totalNumVal = typeof totalVal === 'number' ? totalVal : typeof totalVal === 'string' && totalVal !== '' && totalVal !== null ? parseFloat(totalVal) : 0;
        return sum + (isNaN(totalNumVal) || totalNumVal === null ? 0 : totalNumVal);
      }, 0) || 0;

      // Calculate active stores from the full dataset
      const activeStoresCount = data?.filter(row => {
        const july2025 = parseFloat(String(row["1 Month 7/1/2025 thru 7/23/2025  Case Equivs"] || 0));
        const june2025 = parseFloat(String(row["1 Month 6/1/2025 thru 6/30/2025  Case Equivs"] || 0));
        const may2025 = parseFloat(String(row["1 Month 5/1/2025 thru 5/31/2025  Case Equivs"] || 0));
        const last3MonthsCases = july2025 + june2025 + may2025;
        return last3MonthsCases > 1;
      }).length || 0;
      console.log(`Total records in data: ${data?.length}`);
      console.log(`Active stores count: ${activeStoresCount}`);
      setTotalCases(Math.round(totalCasesSum));
      setTotalStores(activeStoresCount);

      // Calculate monthly active stores data (3-month rolling count)
      const activeStoresMonthlyResults: MonthlyData[] = monthlyColumns.map(({
        col,
        month,
        name
      }, index) => {
        // Get current month and previous 2 months for rolling 3-month count
        const currentMonthIndex = index;
        const previousMonth1 = index > 0 ? monthlyColumns[index - 1] : null;
        const previousMonth2 = index > 1 ? monthlyColumns[index - 2] : null;
        const activeCount = data?.filter(row => {
          // Sum cases from current month and previous 2 months
          const currentVal = row[col];
          const currentNum = typeof currentVal === 'number' ? currentVal : typeof currentVal === 'string' && currentVal !== '' && currentVal !== null ? parseFloat(currentVal) : 0;
          const prev1Val = previousMonth1 ? row[previousMonth1.col] : 0;
          const prev1Num = typeof prev1Val === 'number' ? prev1Val : typeof prev1Val === 'string' && prev1Val !== '' && prev1Val !== null ? parseFloat(prev1Val) : 0;
          const prev2Val = previousMonth2 ? row[previousMonth2.col] : 0;
          const prev2Num = typeof prev2Val === 'number' ? prev2Val : typeof prev2Val === 'string' && prev2Val !== '' && prev2Val !== null ? parseFloat(prev2Val) : 0;
          const total3MonthCases = (isNaN(currentNum) ? 0 : currentNum) + (isNaN(prev1Num) ? 0 : prev1Num) + (isNaN(prev2Num) ? 0 : prev2Num);
          return total3MonthCases > 1;
        }).length || 0;
        return {
          month,
          monthName: name,
          cases: activeCount
        };
      });
      setActiveStoresMonthlyData(activeStoresMonthlyResults);
    } catch (error) {
      console.error("Error fetching wholesale data:", error);
    } finally {
      setLoading(false);
    }
  };
  const fetchChainBreakdown = async (chainName: string) => {
    try {
      const {
        data,
        error
      } = await supabase.from("VIP_RAW_12MO").select("*");
      if (error) throw error;

      // Filter by normalized chain name on the client side
      const filteredData = data?.filter(row => {
        const rawChain = row["Retail Accounts"] || "Unknown";
        const normalizedChain = normalizeChainName(rawChain);
        return normalizedChain === chainName;
      }) || [];
      const breakdown: StoreBreakdown[] = filteredData.map(row => {
        const totalVal = row["12 Months 8/1/2024 thru 7/23/2025  Case Equivs"];
        const totalCases = typeof totalVal === 'number' ? totalVal : typeof totalVal === 'string' && totalVal !== '' && totalVal !== null ? parseFloat(totalVal) : 0;
        const recentCases = ["1 Month 5/1/2025 thru 5/31/2025  Case Equivs", "1 Month 6/1/2025 thru 6/30/2025  Case Equivs", "1 Month 7/1/2025 thru 7/23/2025  Case Equivs"].reduce((sum, monthCol) => {
          const val = row[monthCol];
          const numVal = typeof val === 'number' ? val : typeof val === 'string' && val !== '' && val !== null ? parseFloat(val) : 0;
          return sum + (isNaN(numVal) || numVal === null ? 0 : numVal);
        }, 0);
        
        // Get this month (July 2025) and last month (June 2025) cases
        const thisMonthVal = row["1 Month 7/1/2025 thru 7/23/2025  Case Equivs"];
        const thisMonthCases = typeof thisMonthVal === 'number' ? thisMonthVal : typeof thisMonthVal === 'string' && thisMonthVal !== '' && thisMonthVal !== null ? parseFloat(thisMonthVal) : 0;
        
        const lastMonthVal = row["1 Month 6/1/2025 thru 6/30/2025  Case Equivs"];
        const lastMonthCases = typeof lastMonthVal === 'number' ? lastMonthVal : typeof lastMonthVal === 'string' && lastMonthVal !== '' && lastMonthVal !== null ? parseFloat(lastMonthVal) : 0;
        
        const growthRate = lastMonthCases > 0 ? ((thisMonthCases - lastMonthCases) / lastMonthCases) * 100 : 0;
        
        return {
          storeName: row["Retail Accounts"] || "Unknown",
          state: row["State"] || "Unknown",
          totalCases: Math.round(isNaN(totalCases) ? 0 : totalCases),
          recentCases: Math.round(recentCases),
          thisMonthCases: Math.round(thisMonthCases),
          lastMonthCases: Math.round(lastMonthCases),
          growthRate: growthRate
        };
      }).sort((a, b) => b.totalCases - a.totalCases);
      setChainBreakdown(breakdown);
    } catch (error) {
      console.error("Error fetching chain breakdown:", error);
    }
  };
  const handleChainClick = (chainName: string) => {
    setSelectedChain(chainName);
    fetchChainBreakdown(chainName);
  };
  const handleBackToChains = () => {
    setSelectedChain(null);
    setChainBreakdown([]);
  };
  const recentMonth = monthlyData[monthlyData.length - 1];
  const previousMonth = monthlyData[monthlyData.length - 2];
  const monthlyGrowth = previousMonth && recentMonth ? (recentMonth.cases - previousMonth.cases) / previousMonth.cases * 100 : 0;
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];
  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading wholesale data...</div>;
  }
  return <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cases (12M)</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCases.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Across all retail partners
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cases (1M)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentMonth?.cases.toLocaleString() || 0}</div>
            <p className={`text-xs ${monthlyGrowth > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {monthlyGrowth > 0 ? '+' : ''}{monthlyGrowth.toFixed(1)}% from previous month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Stores</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStores.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Stores selling 1+ cases (last 3 months)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Chain</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{chainData[0]?.totalCases.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              {chainData[0]?.chain.split(' ')[0] || 'N/A'} - cases sold
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Monthly Trends</TabsTrigger>
          <TabsTrigger value="pods">PODs</TabsTrigger>
          <TabsTrigger value="chains">Chain Performance</TabsTrigger>
          <TabsTrigger value="states">State Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>12-Month Sales Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="monthName" />
                  <YAxis />
                  <Tooltip formatter={value => [`${Number(value).toLocaleString()} cases`, 'Cases Sold']} />
                  <Line type="monotone" dataKey="cases" stroke="#8884d8" strokeWidth={2} dot={{
                  r: 4
                }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pods" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active PODs Monthly Trend (3-Month Rolling)</CardTitle>
              <p className="text-sm text-muted-foreground">
                PODs (Points of Distribution) that sold more than 1 case in current month + previous 2 months
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={activeStoresMonthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="monthName" />
                  <YAxis />
                  <Tooltip formatter={value => [`${Number(value).toLocaleString()} PODs`, 'Active PODs']} />
                  <Line type="monotone" dataKey="cases" stroke="#00C49F" strokeWidth={2} dot={{
                  r: 4
                }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chains" className="space-y-4">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top 10 Retail Chains</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie data={chainData} cx="50%" cy="50%" labelLine={false} label={({
                    chain,
                    percent
                  }) => `${chain} ${(percent * 100).toFixed(0)}%`} outerRadius={120} fill="#8884d8" dataKey="totalCases">
                      {chainData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={value => [`${Number(value).toLocaleString()} cases`, 'Total Cases']} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>
                  {selectedChain ? <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={handleBackToChains}>
                        <ArrowLeft className="w-4 h-4" />
                      </Button>
                      {selectedChain} - Store Breakdown
                    </div> : "Chain Performance Details"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedChain ? <div className="space-y-4 max-h-96 overflow-y-auto">
                    {chainBreakdown.map((store, index) => <div key={`${store.storeName}-${store.state}`} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{store.storeName}</p>
                          <p className="text-xs text-muted-foreground">{store.state}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <div>
                              <p className="font-bold">{store.totalCases.toLocaleString()}</p>
                              <p className="text-xs text-muted-foreground">total cases</p>
                            </div>
                            <div className="border-l pl-2 ml-2">
                              <p className="text-sm font-medium">{store.thisMonthCases.toLocaleString()}</p>
                              <p className="text-xs text-muted-foreground">this month</p>
                              <p className={`text-xs font-medium ${store.growthRate > 0 ? 'text-emerald-600' : store.growthRate < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                                {store.growthRate > 0 ? '+' : ''}{store.growthRate.toFixed(1)}%
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>)}
                  </div> : <div className="space-y-4 max-h-96 overflow-y-auto">
                    {chainData.map((chain, index) => <div key={chain.chain} className="flex items-center justify-between p-3 border rounded cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleChainClick(chain.chain)}>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{chain.chain}</p>
                          <p className="text-xs text-muted-foreground">{chain.stores} stores</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <div>
                              <p className="font-bold">{chain.totalCases.toLocaleString()}</p>
                              <p className="text-xs text-muted-foreground">total cases</p>
                            </div>
                            <div className="border-l pl-2 ml-2">
                              <p className="text-sm font-medium">{chain.thisMonthCases.toLocaleString()}</p>
                              <p className="text-xs text-muted-foreground">this month</p>
                              <p className={`text-xs font-medium ${chain.growthRate > 0 ? 'text-emerald-600' : chain.growthRate < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                                {chain.growthRate > 0 ? '+' : ''}{chain.growthRate.toFixed(1)}%
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>)}
                  </div>}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="states" className="space-y-4">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Sales by State</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie data={stateData.slice(0, 6)} cx="50%" cy="50%" labelLine={false} label={({
                    state,
                    percent
                  }) => `${state} ${(percent * 100).toFixed(0)}%`} outerRadius={120} fill="#8884d8" dataKey="totalCases">
                      {stateData.slice(0, 6).map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={value => [`${Number(value).toLocaleString()} cases`, 'Total Cases']} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>State Rankings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {stateData.map((state, index) => <div key={state.state} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold w-6">#{index + 1}</span>
                        <div>
                          <p className="font-medium">{state.state}</p>
                          <p className="text-xs text-muted-foreground">{state.chains} chains</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{state.totalCases.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">cases</p>
                      </div>
                    </div>)}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>;
};