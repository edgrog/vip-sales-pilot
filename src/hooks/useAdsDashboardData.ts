import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AdDashboardRow {
  ad_id: string;
  ad_name: string;
  spend: number;
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

      // Fetch ad tags (primary data source)
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

      // Combine the data based on ad_tags as primary source
      const combinedData: AdDashboardRow[] = adTags?.map(adTag => {
        // Mock spend data (in real app this would come from meta_ads_raw)
        const spend = Math.random() * 5000 + 1000; // Random spend between $1000-$6000

        // Find matching VIP sales data
        const salesMatch = vipData?.find(vip => 
          vip["Retail Accounts"]?.toLowerCase().includes(adTag.chain?.toLowerCase() || '') &&
          vip.State === adTag.state
        );

        const monthlySales = salesMatch?.["12 Months 8/1/2024 thru 7/23/2025  Case Equivs"] || null;

        return {
          ad_id: adTag.ad_id,
          ad_name: `Campaign ${adTag.ad_id.slice(-4)}`, // Mock ad name
          spend,
          delivery: Math.random() > 0.5 ? 'Active' : 'Paused', // Mock delivery status
          chain: adTag.chain,
          state: adTag.state,
          monthly_sales: monthlySales,
          cost_per_case: monthlySales ? spend / monthlySales : null
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