import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface ChartData {
  month: string;
  total_spend: number;
  total_sales: number;
}

export const AdsDashboardChart = () => {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        // Fetch VIP sales data for chart
        const { data: vipData } = await supabase
          .from("VIP_RAW_12MO")
          .select(`
            "Retail Accounts",
            "State",
            "1 Month 5/1/2025 thru 5/31/2025  Case Equivs",
            "1 Month 6/1/2025 thru 6/30/2025  Case Equivs",
            "1 Month 7/1/2025 thru 7/23/2025  Case Equivs"
          `);

        // Create mock chart data
        const mockData = [
          { month: "2025-05", total_spend: 45000, total_sales: 2800 },
          { month: "2025-06", total_spend: 52000, total_sales: 3200 },
          { month: "2025-07", total_spend: 48000, total_sales: 2950 },
        ];

        setChartData(mockData);
      } catch (error) {
        console.error("Error fetching chart data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, []);

  if (loading) return <div>Loading chart...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Spend vs Sales Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="total_spend" 
              stroke="#8884d8" 
              name="Total Spend ($)"
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="total_sales" 
              stroke="#82ca9d" 
              name="Total Sales (Cases)"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};