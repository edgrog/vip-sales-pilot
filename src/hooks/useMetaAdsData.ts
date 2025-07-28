import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MetaAd {
  id: string;
  name: string;
  spend: number;
  delivery: string;
  results: number;
  impressions: number;
  cost_per_result: number;
  tag: string[];
  state: string[];
  chain: string[];
  notes: string;
  created_time: string;
  days_running: number;
}

interface MetaAdsResponse {
  data: Array<{
    id: string;
    name: string;
    effective_status?: string;
    created_time?: string;
    insights?: {
      data: Array<{
        spend: string;
        impressions?: string;
        actions?: Array<{
          action_type: string;
          value: string;
        }>;
        cost_per_action_type?: Array<{
          action_type: string;
          value: string;
        }>;
      }>;
    };
  }>;
}

interface AdTag {
  ad_id: string;
  tag: string | null;
  state: string | null;
  chain: string | null;
  notes: string | null;
}

const parseCommaSeparated = (value: string | null): string[] => {
  if (!value) return [];
  return value.split(',').map(item => item.trim()).filter(Boolean);
};

export const useMetaAdsData = () => {
  const [data, setData] = useState<MetaAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch Meta Ads data from edge function
      const metaResponse = await fetch(
        'https://uqdsgeqvosbfrdvebtbf.functions.supabase.co/fetch-meta-ads',
        {
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxZHNnZXF2b3NiZnJkdmVidGJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMjg3OTksImV4cCI6MjA2ODkwNDc5OX0.m5k0J7T93-gaxfKfj5GKuT37t2VidAApyYxNfksFh3w',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxZHNnZXF2b3NiZnJkdmVidGJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMjg3OTksImV4cCI6MjA2ODkwNDc5OX0.m5k0J7T93-gaxfKfj5GKuT37t2VidAApyYxNfksFh3w',
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!metaResponse.ok) {
        throw new Error(`Meta Ads API error: ${metaResponse.status}`);
      }
      
      const metaData: MetaAdsResponse = await metaResponse.json();

      // Fetch manual tags from Supabase using any type to bypass strict typing
      const response = await fetch(
        `https://uqdsgeqvosbfrdvebtbf.supabase.co/rest/v1/ad_tags?select=ad_id,tag,state,chain,notes`,
        {
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxZHNnZXF2b3NiZnJkdmVidGJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMjg3OTksImV4cCI6MjA2ODkwNDc5OX0.m5k0J7T93-gaxfKfj5GKuT37t2VidAApyYxNfksFh3w',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxZHNnZXF2b3NiZnJkdmVidGJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMjg3OTksImV4cCI6MjA2ODkwNDc5OX0.m5k0J7T93-gaxfKfj5GKuT37t2VidAApyYxNfksFh3w',
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch ad tags: ${response.status}`);
      }

      const tagsData: AdTag[] = await response.json();

      // Create a map for quick tag lookup
      const tagsMap = new Map<string, AdTag>();
      tagsData.forEach((tag) => {
        tagsMap.set(tag.ad_id, tag);
      });

      // Merge the datasets
      const combinedData: MetaAd[] = metaData.data.map((ad) => {
        const tagData = tagsMap.get(ad.id);
        const insights = ad.insights?.data?.[0];
        
        // Extract results from actions array (looking for common conversion actions)
        const actions = insights?.actions || [];
        const results = actions.find(action => 
          action.action_type === 'link_click' || 
          action.action_type === 'post_engagement' ||
          action.action_type === 'landing_page_view'
        );
        
        // Extract cost per result from cost_per_action_type array
        const costPerActions = insights?.cost_per_action_type || [];
        const costPerResult = costPerActions.find(cost => 
          cost.action_type === 'link_click' || 
          cost.action_type === 'post_engagement' ||
          cost.action_type === 'landing_page_view'
        );
        
        // Calculate days running
        const createdTime = ad.created_time || new Date().toISOString();
        const createdDate = new Date(createdTime);
        const currentDate = new Date();
        const daysRunning = Math.floor((currentDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          id: ad.id,
          name: ad.name,
          spend: parseFloat(insights?.spend || '0'),
          delivery: ad.effective_status || 'UNKNOWN',
          results: parseInt(results?.value || '0'),
          impressions: parseInt(insights?.impressions || '0'),
          cost_per_result: parseFloat(costPerResult?.value || '0'),
          tag: parseCommaSeparated(tagData?.tag),
          state: parseCommaSeparated(tagData?.state),
          chain: parseCommaSeparated(tagData?.chain),
          notes: tagData?.notes || '',
          created_time: createdTime,
          days_running: daysRunning
        };
      });

      setData(combinedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updateAd = (adId: string, updates: Partial<MetaAd>) => {
    setData(prevData => 
      prevData.map(ad => 
        ad.id === adId ? { ...ad, ...updates } : ad
      )
    );
  };

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    updateAd
  };
};