import { useState, useEffect } from 'react';

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
      
      // Generate sample data for demonstration
      // In a real implementation, this would fetch from ig_organic_insights table
      const sampleData: IGOrganicData[] = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        sampleData.push({
          date: date.toISOString().split('T')[0],
          reach: Math.floor(Math.random() * 5000) + 1000,
          profile_views: Math.floor(Math.random() * 500) + 100,
          website_clicks: Math.floor(Math.random() * 100) + 20
        });
      }
      setData(sampleData);
      
      // Calculate summary
      const totalReach = sampleData.reduce((sum, d) => sum + d.reach, 0);
      const totalProfileViews = sampleData.reduce((sum, d) => sum + d.profile_views, 0);
      const totalWebsiteClicks = sampleData.reduce((sum, d) => sum + d.website_clicks, 0);
      
      setSummary({
        totalReach,
        totalProfileViews,
        totalWebsiteClicks,
        reachChange: Math.random() > 0.5 ? Math.random() * 20 : -Math.random() * 10,
        profileViewsChange: Math.random() > 0.5 ? Math.random() * 30 : -Math.random() * 15,
        websiteClicksChange: Math.random() > 0.5 ? Math.random() * 25 : -Math.random() * 12
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
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