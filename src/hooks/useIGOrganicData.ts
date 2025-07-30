import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  "https://uqdsgeqvosbfrdvebtbf.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxZHNnZXF2b3NiZnJkdmVidGJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMjg3OTksImV4cCI6MjA2ODkwNDc5OX0.m5k0J7T93-gaxfKfj5GKuT37t2VidAApyYxNfksFh3w"
);

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
      
      // Fetch real reach data from ig_organic_insights table
      const reachResponse = await supabase
        .from('ig_organic_insights')
        .select('date, value')
        .eq('metric', 'reach')
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date') as any;

      if (reachResponse.error) {
        throw reachResponse.error;
      }

      // Create a map of dates to reach values
      const reachMap = new Map<string, number>();
      if (reachResponse.data) {
        reachResponse.data.forEach((item: any) => {
          if (item.date) {
            reachMap.set(item.date, Number(item.value) || 0);
          }
        });
      }

      // Generate data for all days in range, using real reach data where available
      const transformedData: IGOrganicData[] = [];
      let currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const realReach = reachMap.get(dateStr) || 0;
        
        transformedData.push({
          date: dateStr,
          reach: realReach, // Use real data from database
          profile_views: Math.floor(Math.random() * 500 + 100), // Mock data
          website_clicks: Math.floor(Math.random() * 50 + 10) // Mock data
        });
        
        currentDate = new Date(currentDate);
        currentDate.setDate(currentDate.getDate() + 1);
      }

      setData(transformedData);
      
      // Calculate summary for current period
      const totalReach = transformedData.reduce((sum, d) => sum + d.reach, 0);
      const totalProfileViews = transformedData.reduce((sum, d) => sum + d.profile_views, 0);
      const totalWebsiteClicks = transformedData.reduce((sum, d) => sum + d.website_clicks, 0);
      
      // For previous period comparison, fetch previous reach data
      const prevStartDate = new Date(startDate);
      prevStartDate.setDate(prevStartDate.getDate() - days);
      const prevEndDate = new Date(startDate);
      prevEndDate.setDate(prevEndDate.getDate() - 1);
      
      const prevReachResponse = await supabase
        .from('ig_organic_insights')
        .select('date, value')
        .eq('metric', 'reach')
        .gte('date', prevStartDate.toISOString().split('T')[0])
        .lte('date', prevEndDate.toISOString().split('T')[0]) as any;

      const prevTotalReach = (prevReachResponse.data || []).reduce((sum: number, d: any) => sum + (Number(d.value) || 0), 0);
      
      // Mock previous data for profile views and website clicks
      const prevTotalProfileViews = Math.floor(Math.random() * 10000 + 5000);
      const prevTotalWebsiteClicks = Math.floor(Math.random() * 1000 + 500);
      
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