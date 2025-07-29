import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AdDashboardRow {
  ad_id: string;
  ad_name: string;
  spend: number;
  daily_spend: number;
  days_running: number;
  month: string;
  delivery: string;
  chain: string | null;
  state: string | null;
  monthly_sales: number | null;
  cost_per_case: number | null;
}

export interface MonthlyMetrics {
  month: string;
  total_spend: number;
  total_cases: number;
  avg_spend_per_case: number;
  ad_count: number;
}

export const useAdsDashboardData = () => {
  const [data, setData] = useState<AdDashboardRow[]>([]);
  const [monthlyMetrics, setMonthlyMetrics] = useState<MonthlyMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch real ad data from meta_ads_raw
      const { data: metaAds, error: metaError } = await supabase
        .from("meta_ads_raw")
        .select("id, name, delivery, insights");

      if (metaError) throw metaError;

      // Fetch ad tags (for chain/state mapping)
      const { data: adTags, error: tagsError } = await supabase
        .from("ad_tags")
        .select("ad_id, chain, state, notes");

      if (tagsError) throw tagsError;

      // Fetch sales data from VIP_RAW_12MO
      const { data: vipData, error: vipError } = await supabase
        .from("VIP_RAW_12MO")
        .select(`
          "Retail Accounts",
          "State",
          "12 Months 8/1/2024 thru 7/23/2025  Case Equivs"
        `);

      if (vipError) throw vipError;

      // Create monthly data by distributing spend across months ads were running
      const monthlyAdData: AdDashboardRow[] = [];
      
      metaAds?.forEach(metaAd => {
        let spend = 0;
        let daysRunning = 1;
        let startDate: Date;
        let endDate: Date;
        
        if (metaAd.insights && typeof metaAd.insights === 'object') {
          const insights = metaAd.insights as any;
          spend = parseFloat(insights.spend) || 0;
          
          if (insights.date_start && insights.date_stop) {
            startDate = new Date(insights.date_start);
            endDate = new Date(insights.date_stop);
            const totalCalendarDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
            
            // Check if ad is currently inactive
            const delivery = metaAd.delivery?.toUpperCase() || '';
            const isInactive = delivery.includes('PAUSED') || 
                              delivery.includes('DISAPPROVED') || 
                              delivery.includes('REJECTED') ||
                              delivery.includes('STOPPED');
            
            if (isInactive) {
              const estimatedActiveDays = Math.min(totalCalendarDays, Math.ceil(spend / 50));
              daysRunning = Math.max(1, estimatedActiveDays);
            } else {
              daysRunning = totalCalendarDays;
            }
            
            // Calculate daily spend
            const dailySpend = spend / daysRunning;
            
            // Find matching ad tag and sales data
            const adTag = adTags?.find(tag => tag.ad_id === metaAd.id);
            const salesMatch = vipData?.find(vip => 
              adTag?.chain && adTag?.state &&
              vip["Retail Accounts"]?.toLowerCase().includes(adTag.chain.toLowerCase()) &&
              vip.State === adTag.state
            );
            const monthlySales = salesMatch?.["12 Months 8/1/2024 thru 7/23/2025  Case Equivs"] || null;
            
            // Create entries for each month the ad was running
            const currentMonth = new Date(startDate);
            currentMonth.setDate(1); // Start from first day of start month
            
            while (currentMonth <= endDate) {
              const monthStr = currentMonth.toISOString().substring(0, 7);
              
              // Calculate days this ad ran in this specific month
              const monthStart = new Date(currentMonth);
              const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
              
              const effectiveStart = new Date(Math.max(startDate.getTime(), monthStart.getTime()));
              const effectiveEnd = new Date(Math.min(endDate.getTime(), monthEnd.getTime()));
              const daysInThisMonth = Math.max(1, Math.ceil((effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24)) + 1);
              
              const monthlySpend = dailySpend * daysInThisMonth;
              
              console.log(`Ad ${metaAd.id}: ${monthStr} - ${daysInThisMonth} days, $${monthlySpend.toFixed(2)} spend`);
              
              monthlyAdData.push({
                ad_id: metaAd.id,
                ad_name: metaAd.name || `Campaign ${metaAd.id.slice(-4)}`,
                spend: Number(monthlySpend) || 0,
                daily_spend: Number(dailySpend) || 0,
                days_running: daysInThisMonth,
                month: monthStr,
                delivery: metaAd.delivery || 'Unknown',
                chain: adTag?.chain || null,
                state: adTag?.state || null,
                monthly_sales: monthlySales,
                cost_per_case: monthlySales && monthlySpend ? Number(monthlySpend) / monthlySales : null
              });
              
              // Move to next month
              currentMonth.setMonth(currentMonth.getMonth() + 1);
            }
          }
        }
      });

      // Calculate monthly metrics starting with all months that have sales data
      const { data: salesByMonth, error: salesError } = await supabase
        .from("VIP_RAW_12MO")
        .select(`
          "1 Month 5/1/2025 thru 5/31/2025  Case Equivs",
          "1 Month 6/1/2025 thru 6/30/2025  Case Equivs", 
          "1 Month 7/1/2025 thru 7/23/2025  Case Equivs"
        `);

      if (salesError) throw salesError;

      // Initialize monthly data with sales data for May, June, July
      const monthlyData: { [key: string]: MonthlyMetrics } = {};
      
      // Add May data (sales but no spend)
      const maySales = salesByMonth?.reduce((sum, row) => {
        const val = row["1 Month 5/1/2025 thru 5/31/2025  Case Equivs"];
        return sum + (val && typeof val === 'number' ? val : (typeof val === 'string' && val !== '' ? parseFloat(val) : 0));
      }, 0) || 0;
      
      monthlyData["2025-05"] = {
        month: "2025-05",
        total_spend: 0,
        total_cases: maySales,
        avg_spend_per_case: 0,
        ad_count: 0
      };

      // Add June data (sales but no spend initially)
      const juneSales = salesByMonth?.reduce((sum, row) => {
        const val = row["1 Month 6/1/2025 thru 6/30/2025  Case Equivs"];
        return sum + (val && typeof val === 'number' ? val : (typeof val === 'string' && val !== '' ? parseFloat(val) : 0));
      }, 0) || 0;
      
      monthlyData["2025-06"] = {
        month: "2025-06",
        total_spend: 0,
        total_cases: juneSales,
        avg_spend_per_case: 0,
        ad_count: 0
      };

      // Add July data (sales but no spend initially)
      const julySales = salesByMonth?.reduce((sum, row) => {
        const val = row["1 Month 7/1/2025 thru 7/23/2025  Case Equivs"];
        return sum + (val && typeof val === 'number' ? val : (typeof val === 'string' && val !== '' ? parseFloat(val) : 0));
      }, 0) || 0;
      
      monthlyData["2025-07"] = {
        month: "2025-07",
        total_spend: 0,
        total_cases: julySales,
        avg_spend_per_case: 0,
        ad_count: 0
      };

      // Now add ad spend data to existing months
      monthlyAdData.forEach(item => {
        if (monthlyData[item.month]) {
          monthlyData[item.month].total_spend += item.spend;
          monthlyData[item.month].ad_count += 1;
        }
      });

      // Calculate avg spend per case for each month
      const monthlyMetricsArray = Object.values(monthlyData).map((metrics: MonthlyMetrics) => ({
        ...metrics,
        avg_spend_per_case: metrics.total_cases > 0 ? metrics.total_spend / metrics.total_cases : 0
      }));

      setData(monthlyAdData);
      setMonthlyMetrics(monthlyMetricsArray);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const updateAdTag = async (adId: string, chain: string, state: string) => {
    try {
      const { error } = await supabase
        .from("ad_tags")
        .upsert({ ad_id: adId, chain, state }, { onConflict: "ad_id" });

      if (error) throw error;
      
      // Refresh data after update
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update ad tag');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, monthlyMetrics, loading, error, refetch: fetchData, updateAdTag };
};