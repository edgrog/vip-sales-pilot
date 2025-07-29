import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface IGOrganicData {
  date: string;
  reach: number;
  profile_views: number;
  website_clicks: number;
}

interface IGOrganicSummary {
  totalReach: number;
  totalProfileViews: number;
  totalWebsiteClicks: number;
  reachChange: number;
  profileViewsChange: number;
  websiteClicksChange: number;
}

export const useIGOrganicData = () => {
  const [data, setData] = useState<IGOrganicData[]>([]);
  const [summary, setSummary] = useState<IGOrganicSummary>({
    totalReach: 0,
    totalProfileViews: 0,
    totalWebsiteClicks: 0,
    reachChange: 0,
    profileViewsChange: 0,
    websiteClicksChange: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (days: number = 30) => {
    try {
      setLoading(true);
      setError(null);
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      // Use the database function we created
      const { data: igData, error: fetchError } = await supabase.rpc('get_ig_organic_data', {
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0]
      }) as { data: any[] | null, error: any };

      if (fetchError) {
        throw fetchError;
      }

      // Transform data to match expected format
      const transformedData: IGOrganicData[] = (igData || []).map((item: any) => ({
        date: item.date || '',
        reach: item.reach || 0,
        profile_views: item.profile_views || 0,
        website_clicks: item.website_clicks || 0
      }));

      setData(transformedData);
      
      // Calculate summary for current period
      const totalReach = transformedData.reduce((sum, d) => sum + d.reach, 0);
      const totalProfileViews = transformedData.reduce((sum, d) => sum + d.profile_views, 0);
      const totalWebsiteClicks = transformedData.reduce((sum, d) => sum + d.website_clicks, 0);
      
      // Calculate previous period for comparison
      const prevStartDate = new Date(startDate);
      prevStartDate.setDate(prevStartDate.getDate() - days);
      const prevEndDate = new Date(startDate);
      prevEndDate.setDate(prevEndDate.getDate() - 1);
      
      const { data: prevData } = await supabase.rpc('get_ig_organic_data', {
        start_date: prevStartDate.toISOString().split('T')[0],
        end_date: prevEndDate.toISOString().split('T')[0]
      }) as { data: any[] | null, error: any };

      const prevTotalReach = (prevData || []).reduce((sum: number, d: any) => sum + (d.reach || 0), 0);
      const prevTotalProfileViews = (prevData || []).reduce((sum: number, d: any) => sum + (d.profile_views || 0), 0);
      const prevTotalWebsiteClicks = (prevData || []).reduce((sum: number, d: any) => sum + (d.website_clicks || 0), 0);
      
      // Calculate percentage changes
      const reachChange = prevTotalReach > 0 ? ((totalReach - prevTotalReach) / prevTotalReach) * 100 : 0;
      const profileViewsChange = prevTotalProfileViews > 0 ? ((totalProfileViews - prevTotalProfileViews) / prevTotalProfileViews) * 100 : 0;
      const websiteClicksChange = prevTotalWebsiteClicks > 0 ? ((totalWebsiteClicks - prevTotalWebsiteClicks) / prevTotalWebsiteClicks) * 100 : 0;
      
      setSummary({
        totalReach,
        totalProfileViews,
        totalWebsiteClicks,
        reachChange,
        profileViewsChange,
        websiteClicksChange
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch Instagram organic data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    data,
    summary,
    loading,
    error,
    refetch: fetchData
  };
};