import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useAdsDashboardData } from "@/hooks/useAdsDashboardData";

export const AdsDashboardChart = () => {
  const { monthlyMetrics, loading } = useAdsDashboardData();

  const chartData = useMemo(() => {
    if (!monthlyMetrics || monthlyMetrics.length === 0) return [];

    // Sort by month and return the actual monthly data
    return monthlyMetrics
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(metrics => ({
        month: metrics.month,
        total_spend: metrics.total_spend,
        total_sales: metrics.total_cases,
        avg_spend_per_case: metrics.avg_spend_per_case
      }));
  }, [monthlyMetrics]);

  if (loading) return <div>Loading chart...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Spend per Case</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line 
              type="monotone" 
              dataKey="avg_spend_per_case" 
              stroke="#ff7300" 
              name="Spend per Case ($)"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};