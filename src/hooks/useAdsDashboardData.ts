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
        .select("*");

      if (salesError) {
        console.error("Sales data error:", salesError);
        throw salesError;
      }

      console.log("Sales data sample:", salesByMonth?.slice(0, 3));
      console.log("Sales data length:", salesByMonth?.length);
      
      // Debug: Check what columns are actually available
      if (salesByMonth && salesByMonth.length > 0) {
        console.log("First row keys:", Object.keys(salesByMonth[0]));
        console.log("Sample values:", salesByMonth[0]);
      }

      // Initialize monthly data with sales data for all 12 months (Aug 2024 - Jul 2025)
      const monthlyColumns = [
        { col: "1 Month 8/1/2024 thru 8/31/2024  Case Equivs", month: "2024-08", name: "Aug 2024" },
        { col: "1 Month 9/1/2024 thru 9/30/2024  Case Equivs", month: "2024-09", name: "Sep 2024" },
        { col: "1 Month 10/1/2024 thru 10/31/2024  Case Equivs", month: "2024-10", name: "Oct 2024" },
        { col: "1 Month 11/1/2024 thru 11/30/2024  Case Equivs", month: "2024-11", name: "Nov 2024" },
        { col: "1 Month 12/1/2024 thru 12/31/2024  Case Equivs", month: "2024-12", name: "Dec 2024" },
        { col: "1 Month 1/1/2025 thru 1/31/2025  Case Equivs", month: "2025-01", name: "Jan 2025" },
        { col: "1 Month 2/1/2025 thru 2/28/2025  Case Equivs", month: "2025-02", name: "Feb 2025" },
        { col: "1 Month 3/1/2025 thru 3/31/2025  Case Equivs", month: "2025-03", name: "Mar 2025" },
        { col: "1 Month 4/1/2025 thru 4/30/2025  Case Equivs", month: "2025-04", name: "Apr 2025" },
        { col: "1 Month 5/1/2025 thru 5/31/2025  Case Equivs", month: "2025-05", name: "May 2025" },
        { col: "1 Month 6/1/2025 thru 6/30/2025  Case Equivs", month: "2025-06", name: "Jun 2025" },
        { col: "1 Month 7/1/2025 thru 7/23/2025  Case Equivs", month: "2025-07", name: "Jul 2025" }
      ];

      const monthlyData: { [key: string]: MonthlyMetrics } = {};
      
      // Initialize all 12 months with sales data
      monthlyColumns.forEach(({ col, month, name }) => {
        const monthlySales = salesByMonth?.reduce((sum, row) => {
          const val = row[col];
          const numVal = typeof val === 'number' ? val : (typeof val === 'string' && val !== '' && val !== null ? parseFloat(val) : 0);
          return sum + (isNaN(numVal) || numVal === null ? 0 : numVal);
        }, 0) || 0;
        
        console.log(`${name} sales total:`, monthlySales);
        
        monthlyData[month] = {
          month,
          total_spend: 0,
          total_cases: monthlySales,
          avg_spend_per_case: 0,
          ad_count: 0
        };
      });

      // Now add ad spend data to existing months
      monthlyAdData.forEach(item => {
        if (monthlyData[item.month]) {
          monthlyData[item.month].total_spend += item.spend;
          monthlyData[item.month].ad_count += 1;
        } else {
          // Create month if it doesn't exist (shouldn't happen for June/July but just in case)
          monthlyData[item.month] = {
            month: item.month,
            total_spend: item.spend,
            total_cases: item.monthly_sales || 0,
            avg_spend_per_case: 0,
            ad_count: 1
          };
        }
      });

      console.log("Monthly data before final calculation:", monthlyData);

      // Calculate avg spend per case for each month
      const monthlyMetricsArray = Object.values(monthlyData).map((metrics: MonthlyMetrics) => ({
        ...metrics,
        avg_spend_per_case: metrics.total_cases > 0 ? metrics.total_spend / metrics.total_cases : 0
      }));

      console.log("Final monthly metrics:", monthlyMetricsArray);

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