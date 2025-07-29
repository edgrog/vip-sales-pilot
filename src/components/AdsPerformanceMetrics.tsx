import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdsDashboardData } from "@/hooks/useAdsDashboardData";
import { TrendingUp, TrendingDown, DollarSign, Package } from "lucide-react";

export const AdsPerformanceMetrics = () => {
  const { data, loading } = useAdsDashboardData();

  if (loading) return <div>Loading metrics...</div>;

  // Calculate key metrics
  const totalSpend = data.reduce((sum, item) => sum + item.spend, 0);
  const totalCases = data.reduce((sum, item) => sum + (item.monthly_sales || 0), 0);
  const avgSpendPerCase = totalCases > 0 ? totalSpend / totalCases : 0;
  const avgMonthlySales = data.length > 0 ? totalCases / data.length : 0;

  // Calculate trends (mock trend calculation)
  const spendTrend = 12.5; // Mock positive trend
  const salesTrend = -3.2; // Mock negative trend

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Avg Spend per Case */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Spend per Case</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${avgSpendPerCase.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            Cost efficiency metric
          </p>
        </CardContent>
      </Card>

      {/* Monthly Sales */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Monthly Sales</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalCases.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            Cases sold this period
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