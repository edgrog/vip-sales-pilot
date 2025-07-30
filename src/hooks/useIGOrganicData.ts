import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const client = createClient(
  "https://uqdsgeqvosbfrdvebtbf.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxZHNnZXF2b3NiZnJkdmVidGJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMjg3OTksImV4cCI6MjA2ODkwNDc5OX0.m5k0J7T93-gaxfKfj5GKuT37t2VidAApyYxNfksFh3w"
);

interface IGOrganicData {
  date: string;
  reach: number;
  followers: number;
  website_clicks: number;
}

interface IGOrganicSummary {
  totalReach: number;
  totalFollowers: number;
  totalWebsiteClicks: number;
  reachChange: number;
  followersChange: number;
  websiteClicksChange: number;
}

export const useIGOrganicData = () => {
  const [data, setData] = useState<IGOrganicData[]>([]);
  const [summary, setSummary] = useState<IGOrganicSummary>({
    totalReach: 0,
    totalFollowers: 0,
    totalWebsiteClicks: 0,
    reachChange: 0,
    followersChange: 0,
    websiteClicksChange: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (days: number = 30) => {
    try {
      setLoading(true);
      setError(null);
      
      // Calculate date range
      const today = new Date();
      const startDateMs = today.getTime() - (days * 24 * 60 * 60 * 1000);
      const startDate = new Date(startDateMs);
      
      // Fetch real reach data from ig_organic_insights table
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = today.toISOString().split('T')[0];
      
      const reachQuery: any = await client
        .from('ig_organic_insights')
        .select('date, value')
        .eq('metric', 'reach')
        .gte('date', startDateStr)
        .lte('date', endDateStr)
        .order('date');

      if (reachQuery.error) {
        throw reachQuery.error;
      }

      // Fetch current followers count from ig_analytics_followers table
      const followersQuery: any = await client
        .from('ig_analytics_followers')
        .select('value')
        .eq('metric', 'followers')
        .single();

      if (followersQuery.error) {
        throw followersQuery.error;
      }

      const currentFollowers = followersQuery.data?.value || 0;

      // Create maps of dates to values
      const reachMap = new Map<string, number>();
      if (reachQuery.data) {
        reachQuery.data.forEach((item: any) => {
          if (item.date) {
            reachMap.set(item.date, Number(item.value) || 0);
          }
        });
      }

      // Generate data for all days in range, using real data where available
      const transformedData: IGOrganicData[] = [];
      
      for (let i = 0; i < days; i++) {
        const currentDateMs = startDateMs + (i * 24 * 60 * 60 * 1000);
        const currentDate = new Date(currentDateMs);
        const dateStr = currentDate.toISOString().split('T')[0];
        const realReach = reachMap.get(dateStr) || 0;
        
        transformedData.push({
          date: dateStr,
          reach: realReach, // Use real data from database
          followers: currentFollowers, // Use static followers count for all dates
          website_clicks: Math.floor(Math.random() * 50 + 10) // Mock data
        });
      }

      setData(transformedData);
      
      // Calculate summary for current period
      const totalReach = transformedData.reduce((sum, d) => sum + d.reach, 0);
      const totalFollowers = transformedData.length > 0 ? transformedData[transformedData.length - 1].followers : 0; // Latest followers count
      const totalWebsiteClicks = transformedData.reduce((sum, d) => sum + d.website_clicks, 0);
      
      // For previous period comparison, fetch previous data
      const prevEndDateMs = startDateMs - (24 * 60 * 60 * 1000);
      const prevStartDateMs = prevEndDateMs - (days * 24 * 60 * 60 * 1000);
      const prevStartDate = new Date(prevStartDateMs);
      const prevEndDate = new Date(prevEndDateMs);
      
      const prevReachQuery: any = await client
        .from('ig_organic_insights')
        .select('date, value')
        .eq('metric', 'reach')
        .gte('date', prevStartDate.toISOString().split('T')[0])
        .lte('date', prevEndDate.toISOString().split('T')[0]);

      // Calculate previous totals
      const prevTotalReach = (prevReachQuery.data || []).reduce((sum, d) => sum + (Number(d.value) || 0), 0);
      const prevTotalFollowers = Math.floor(Math.random() * 10000 + 5000);
      const prevTotalWebsiteClicks = Math.floor(Math.random() * 1000 + 500);
      
      // Calculate percentage changes
      const reachChange = prevTotalReach > 0 ? ((totalReach - prevTotalReach) / prevTotalReach) * 100 : 0;
      const followersChange = prevTotalFollowers > 0 ? ((totalFollowers - prevTotalFollowers) / prevTotalFollowers) * 100 : 0;
      const websiteClicksChange = prevTotalWebsiteClicks > 0 ? ((totalWebsiteClicks - prevTotalWebsiteClicks) / prevTotalWebsiteClicks) * 100 : 0;
      
      setSummary({
        totalReach,
        totalFollowers,
        totalWebsiteClicks,
        reachChange,
        followersChange,
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