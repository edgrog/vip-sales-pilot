import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, Store, TrendingUp, TrendingDown, AlertCircle, Users, Target, Filter, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { supabase } from "@/integrations/supabase/client";

interface ChainData {
  chainName: string;
  stores: Array<{
    name: string;
    address: string;
    city: string;
    state: string;
    may_2025: number;
    june_2025: number;
    july_2025: number;
    growth: number;
    weeklyAverage: number;
    status: 'growing' | 'declining' | 'stable';
  }>;
  totalStores: number;
  totalCases: number;
  avgGrowth: number;
  chainStatus: 'growing' | 'declining' | 'stable';
}

const ChainOverview = () => {
  const { chainId } = useParams<{ chainId: string }>();
  const navigate = useNavigate();
  const [chainData, setChainData] = useState<ChainData | null>(null);
  const [loading, setLoading] = useState(true);
  const [trendFilter, setTrendFilter] = useState<'all' | 'growing' | 'stable' | 'declining'>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  useEffect(() => {
    if (chainId) {
      fetchChainData();
    }
  }, [chainId]);

  const fetchChainData = async () => {
    try {
      setLoading(true);
      
      // Decode the chain ID from URL encoding
      const decodedChainId = decodeURIComponent(chainId || '');
      
      const { data, error } = await supabase
        .from('vip_sales')
        .select('*')
        .eq('normalized_chain', decodedChainId)
        .neq('Retail Accounts', 'Total')
        .not('Retail Accounts', 'is', null);

      if (error) {
        console.error('Error fetching chain data:', error);
        return;
      }

      if (data && data.length > 0) {
        const stores = data.map(store => {
          const may = store["May 2025"] || 0;
          const june = store["June 2025"] || 0;
          const july = store["July 2025"] || 0;
          
          // Calculate more robust growth trend
          const growth = calculateGrowthTrend(may, june, july);
          const weeklyAverage = (may + june + july) / 3;
          
          let status: 'growing' | 'declining' | 'stable' = 'stable';
          if (growth > 10) status = 'growing';
          else if (growth < -10) status = 'declining';

          return {
            name: store["Retail Accounts"] || '',
            address: store["Address"] || '',
            city: store["City"] || '',
            state: store["State"] || '',
            may_2025: may,
            june_2025: june,
            july_2025: july,
            growth,
            weeklyAverage,
            status
          };
        });

        // Sort by weekly average descending by default
        const sortedStores = stores.sort((a, b) => b.weeklyAverage - a.weeklyAverage);
        const totalCases = sortedStores.reduce((sum, store) => sum + store.july_2025, 0);
        const avgGrowth = sortedStores.length > 0 
          ? sortedStores.reduce((sum, store) => sum + store.growth, 0) / sortedStores.length 
          : 0;

        let chainStatus: 'growing' | 'declining' | 'stable' = 'stable';
        if (avgGrowth > 10) chainStatus = 'growing';
        else if (avgGrowth < -10) chainStatus = 'declining';

        const chainData: ChainData = {
          chainName: decodedChainId,
          stores: sortedStores,
          totalStores: sortedStores.length,
          totalCases,
          avgGrowth,
          chainStatus
        };

        setChainData(chainData);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to calculate growth trend using 3-month data
  const calculateGrowthTrend = (may: number, june: number, july: number) => {
    // Handle edge cases
    if (may === 0 && june === 0 && july === 0) return 0; // No data
    if (may === 0 && june === 0) return july > 0 ? 100 : 0; // New launch
    
    // Calculate trend using linear regression approach for 3 points
    const dataPoints = [
      { month: 1, value: may },
      { month: 2, value: june },
      { month: 3, value: july }
    ];
    
    // Simple slope calculation
    const avgMonth = 2; // (1+2+3)/3
    const avgValue = (may + june + july) / 3;
    
    let numerator = 0;
    let denominator = 0;
    
    dataPoints.forEach(point => {
      numerator += (point.month - avgMonth) * (point.value - avgValue);
      denominator += (point.month - avgMonth) ** 2;
    });
    
    const slope = denominator === 0 ? 0 : numerator / denominator;
    
    // Convert slope to percentage change relative to average
    return avgValue > 0 ? (slope / avgValue) * 100 : 0;
  };

  // Filter and sort stores based on current selections
  const getFilteredAndSortedStores = () => {
    if (!chainData) return [];
    
    let filteredStores = chainData.stores;
    
    // Apply trend filter
    if (trendFilter !== 'all') {
      filteredStores = filteredStores.filter(store => store.status === trendFilter);
    }
    
    // Apply sorting
    return [...filteredStores].sort((a, b) => {
      const compareValue = sortOrder === 'desc' 
        ? b.weeklyAverage - a.weeklyAverage 
        : a.weeklyAverage - b.weeklyAverage;
      return compareValue;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'growing': return 'bg-success text-success-foreground';
      case 'declining': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'growing': return <TrendingUp className="w-4 h-4" />;
      case 'declining': return <TrendingDown className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const chartData = chainData ? [
    { 
      month: 'May 2025', 
      cases: chainData.stores.reduce((sum, store) => sum + store.may_2025, 0)
    },
    { 
      month: 'June 2025', 
      cases: chainData.stores.reduce((sum, store) => sum + store.june_2025, 0)
    },
    { 
      month: 'July 2025', 
      cases: chainData.stores.reduce((sum, store) => sum + store.july_2025, 0)
    },
  ] : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center gap-4 mb-8">
            <Skeleton className="h-10 w-10 rounded" />
            <Skeleton className="h-8 w-64" />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  if (!chainData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center gap-4 mb-8">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/')}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </div>
          
          <div className="text-center py-16">
            <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Chain Not Found</h2>
            <p className="text-muted-foreground">The chain you're looking for doesn't exist or has no stores.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
          
          <div>
            <h1 className="text-3xl font-bold">{chainData.chainName}</h1>
            <p className="text-muted-foreground">Chain Performance Overview</p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Stores</p>
                  <p className="text-2xl font-bold">{chainData.totalStores}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Cases/Week</p>
                  <p className="text-2xl font-bold">{chainData.totalCases.toFixed(1)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                {chainData.avgGrowth >= 0 ? (
                  <TrendingUp className="w-5 h-5 text-success" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-destructive" />
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Avg Growth</p>
                  <p className={`text-2xl font-bold ${
                    chainData.avgGrowth >= 0 ? 'text-success' : 'text-destructive'
                  }`}>
                    {chainData.avgGrowth >= 0 ? '+' : ''}{chainData.avgGrowth.toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                {getStatusIcon(chainData.chainStatus)}
                <div>
                  <p className="text-sm text-muted-foreground">Chain Status</p>
                  <Badge className={getStatusColor(chainData.chainStatus)}>
                    {chainData.chainStatus}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chain Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Chain Performance Trend</CardTitle>
              <CardDescription>Total cases sold per week (Last 3 Months)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [`${value} cases/week`, 'Total Cases']}
                      labelFormatter={(label) => `Month: ${label}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="cases" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Top Performing Stores */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Stores</CardTitle>
              <CardDescription>Highest weekly sales in July 2025</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {chainData.stores.slice(0, 5).map((store, index) => (
                  <div 
                    key={store.name}
                    className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/50 cursor-pointer hover:bg-card/80 transition-colors"
                    onClick={() => navigate(`/accounts/${encodeURIComponent(store.name)}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">{index + 1}</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">{store.name}</h4>
                        <p className="text-xs text-muted-foreground">{store.city}, {store.state}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold">{store.july_2025.toFixed(1)}</div>
                      <div className={`text-xs ${
                        store.growth >= 0 ? 'text-success' : 'text-destructive'
                      }`}>
                        {store.growth >= 0 ? '+' : ''}{store.growth.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* All Stores List */}
        <Card className="mt-6">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>All Stores in {chainData.chainName}</CardTitle>
                <CardDescription>
                  {getFilteredAndSortedStores().length} of {chainData.totalStores} stores
                  {trendFilter !== 'all' && ` (${trendFilter})`}
                </CardDescription>
              </div>
              
              {/* Filter and Sort Controls */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <Select value={trendFilter} onValueChange={(value: any) => setTrendFilter(value)}>
                    <SelectTrigger className="w-[140px] bg-background">
                      <SelectValue placeholder="Filter by trend" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border shadow-lg z-50">
                      <SelectItem value="all">All Trends</SelectItem>
                      <SelectItem value="growing">📈 Growing</SelectItem>
                      <SelectItem value="stable">➖ Stable</SelectItem>
                      <SelectItem value="declining">📉 Declining</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                  <Select value={sortOrder} onValueChange={(value: any) => setSortOrder(value)}>
                    <SelectTrigger className="w-[160px] bg-background">
                      <SelectValue placeholder="Sort by cases" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border shadow-lg z-50">
                      <SelectItem value="desc">Highest to Lowest</SelectItem>
                      <SelectItem value="asc">Lowest to Highest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getFilteredAndSortedStores().length > 0 ? (
                getFilteredAndSortedStores().map((store) => (
                <div 
                  key={store.name}
                  className="flex items-center justify-between p-4 rounded-lg border border-border bg-card/50 cursor-pointer hover:bg-card/80 transition-colors"
                  onClick={() => navigate(`/accounts/${encodeURIComponent(store.name)}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-semibold">{store.name.charAt(0)}</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">{store.name}</h4>
                      <p className="text-sm text-muted-foreground">{store.city}, {store.state}</p>
                      <div className="mt-1">
                        <Badge className={getStatusColor(store.status)}>
                          {store.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-foreground">
                      {store.weeklyAverage.toFixed(1)}
                    </div>
                    <p className="text-xs text-muted-foreground">Avg Cases/Week</p>
                    <div className={`text-xs font-medium ${
                      store.growth >= 0 ? 'text-success' : 'text-destructive'
                    }`}>
                      {store.growth >= 0 ? '+' : ''}{store.growth.toFixed(1)}%
                    </div>
                  </div>
                </div>
                ))
              ) : (
                <div className="col-span-full text-center py-8">
                  <div className="w-16 h-16 bg-muted/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Store className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">No Stores Found</h3>
                  <p className="text-muted-foreground">
                    No stores match the current filter criteria. Try adjusting your filters.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ChainOverview;