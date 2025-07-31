import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdsDashboardData } from "@/hooks/useAdsDashboardData";
import { TrendingUp, TrendingDown, DollarSign, Package, CreditCard } from "lucide-react";

export const AdsPerformanceMetrics = () => {
  const { monthlyMetrics, loading } = useAdsDashboardData();

  if (loading) return <div>Loading metrics...</div>;

  // Get current month metrics (most recent month)
  const currentMonth = monthlyMetrics.length > 0 
    ? monthlyMetrics.sort((a, b) => b.month.localeCompare(a.month))[0]
    : { total_spend: 0, total_cases: 0, avg_spend_per_case: 0, ad_count: 0 };

  // Calculate trends (compare with previous month if available)
  const previousMonth = monthlyMetrics.length > 1 
    ? monthlyMetrics.sort((a, b) => b.month.localeCompare(a.month))[1]
    : null;
    
  const spendTrend = previousMonth 
    ? ((currentMonth.total_spend - previousMonth.total_spend) / previousMonth.total_spend) * 100
    : 0;
    
  const salesTrend = previousMonth 
    ? ((currentMonth.total_cases - previousMonth.total_cases) / previousMonth.total_cases) * 100
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Monthly Spend */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Monthly Spend</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${currentMonth.total_spend.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            Total ad spend this month
          </p>
        </CardContent>
      </Card>

      {/* Monthly Sales */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Cases Sold</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{currentMonth.total_cases.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            Cases sold this month
          </p>
        </CardContent>
      </Card>

      {/* Avg Spend per Case */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Spend per Case</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${currentMonth.avg_spend_per_case.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            Average cost per case
          </p>
        </CardContent>
      </Card>

      {/* Spend Trend */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Spend Trend</CardTitle>
          {spendTrend > 0 ? (
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600" />
          )}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{Math.abs(spendTrend)}%</div>
          <p className={`text-xs ${spendTrend > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {spendTrend > 0 ? '+' : ''}{spendTrend}% from last month
          </p>
        </CardContent>
      </Card>

      {/* Sales Trend */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Sales Trend</CardTitle>
          {salesTrend > 0 ? (
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600" />
          )}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{Math.abs(salesTrend)}%</div>
          <p className={`text-xs ${salesTrend > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {salesTrend > 0 ? '+' : ''}{salesTrend}% from last month
          </p>
        </CardContent>
      </Card>
    </div>
  );
};