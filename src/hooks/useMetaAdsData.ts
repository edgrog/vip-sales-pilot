import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MetaAd {
  id: string;
  name: string;
  spend: number;
  tag: string[];
  state: string[];
  chain: string[];
  notes: string;
}

interface MetaAdsResponse {
  data: Array<{
    id: string;
    name: string;
    insights: {
      data: Array<{
        spend: string;
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
        'https://uqdsgeqvosbfrdvebtbf.functions.supabase.co/fetch-meta-ads'
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
        
        return {
          id: ad.id,
          name: ad.name,
          spend: parseFloat(ad.insights?.data?.[0]?.spend || '0'),
          tag: parseCommaSeparated(tagData?.tag),
          state: parseCommaSeparated(tagData?.state),
          chain: parseCommaSeparated(tagData?.chain),
          notes: tagData?.notes || ''
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