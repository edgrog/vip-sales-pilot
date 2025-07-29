import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AdDashboardRow {
  ad_id: string;
  ad_name: string;
  spend: number;
  daily_spend: number;
  days_running: number;
  delivery: string;
  chain: string | null;
  state: string | null;
  monthly_sales: number | null;
  cost_per_case: number | null;
}

export const useAdsDashboardData = () => {
  const [data, setData] = useState<AdDashboardRow[]>([]);
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

      // Combine the data based on meta_ads_raw as primary source
      const combinedData: AdDashboardRow[] = metaAds?.map(metaAd => {
        // Extract spend and date info from insights JSON
        let spend = 0;
        let daysRunning = 1;
        let dailySpend = 0;
        
        if (metaAd.insights && typeof metaAd.insights === 'object') {
          const insights = metaAd.insights as any;
          // Look for spend in common Meta insights structure
          spend = parseFloat(insights.spend) || 0;
          
          // Calculate days running from date_start and date_stop
          if (insights.date_start && insights.date_stop) {
            const startDate = new Date(insights.date_start);
            const endDate = new Date(insights.date_stop);
            daysRunning = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
          }
          
          dailySpend = spend / daysRunning;
        }

        // Find matching ad tag data
        const adTag = adTags?.find(tag => tag.ad_id === metaAd.id);

        // Find matching VIP sales data
        const salesMatch = vipData?.find(vip => 
          adTag?.chain && adTag?.state &&
          vip["Retail Accounts"]?.toLowerCase().includes(adTag.chain.toLowerCase()) &&
          vip.State === adTag.state
        );

        const monthlySales = salesMatch?.["12 Months 8/1/2024 thru 7/23/2025  Case Equivs"] || null;

        return {
          ad_id: metaAd.id,
          ad_name: metaAd.name || `Campaign ${metaAd.id.slice(-4)}`,
          spend: Number(spend) || 0,
          daily_spend: Number(dailySpend) || 0,
          days_running: daysRunning,
          delivery: metaAd.delivery || 'Unknown',
          chain: adTag?.chain || null,
          state: adTag?.state || null,
          monthly_sales: monthlySales,
          cost_per_case: monthlySales && dailySpend ? (Number(dailySpend) * 30) / monthlySales : null
        };
      }) || [];

      setData(combinedData);
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

  return { data, loading, error, refetch: fetchData, updateAdTag };
};