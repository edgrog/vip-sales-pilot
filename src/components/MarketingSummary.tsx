import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Eye, TrendingUp, Activity } from "lucide-react";
import { useState, useEffect } from "react";
import { useMetaAdsData } from "@/hooks/useMetaAdsData";
import { useAdsDashboardData } from "@/hooks/useAdsDashboardData";

interface MarketingSummary {
  totalSpend: number;
  totalImpressions: number;
  averageCPM: number;
  activeAds: number;
  costPerCase: number;
}

export const MarketingSummary = () => {
  const { data: metaAds, loading: metaLoading } = useMetaAdsData();
  const { monthlyMetrics, loading: dashboardLoading } = useAdsDashboardData();
  const [summary, setSummary] = useState<MarketingSummary>({
    totalSpend: 0,
    totalImpressions: 0,
    averageCPM: 0,
    activeAds: 0,
    costPerCase: 0
  });

  useEffect(() => {
    if (!metaLoading && !dashboardLoading && metaAds && monthlyMetrics) {
      calculateSummary();
    }
  }, [metaAds, monthlyMetrics, metaLoading, dashboardLoading]);

  const calculateSummary = () => {
    // Calculate totals from Meta Ads data
    const totalSpend = metaAds.reduce((sum, ad) => sum + ad.spend, 0);
    const totalImpressions = metaAds.reduce((sum, ad) => sum + ad.impressions, 0);
    const activeAds = metaAds.filter(ad => 
      ad.delivery.includes('ACTIVE') || 
      ad.delivery.includes('LIVE') ||
      !ad.delivery.includes('PAUSED')
    ).length;

    // Calculate average CPM (Cost Per Mille - cost per 1000 impressions)
    const averageCPM = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0;

    // Get recent cost per case from dashboard data
    const recentMetrics = monthlyMetrics
      .filter(m => m.total_spend > 0 && m.total_cases > 0)
      .sort((a, b) => b.month.localeCompare(a.month));
    
    const costPerCase = recentMetrics.length > 0 ? recentMetrics[0].avg_spend_per_case : 0;

    setSummary({
      totalSpend,
      totalImpressions,
      averageCPM,
      activeAds,
      costPerCase
    });
  };

  const loading = metaLoading || dashboardLoading;

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="h-16 bg-muted animate-pulse rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Total Spend
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="text-2xl font-bold">${summary.totalSpend.toLocaleString()}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Impressions
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="text-2xl font-bold">{(summary.totalImpressions / 1000000).toFixed(1)}M</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Avg CPM
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="text-2xl font-bold">${summary.averageCPM.toFixed(2)}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Active Ads
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="text-2xl font-bold">{summary.activeAds}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Cost/Case
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="text-2xl font-bold">${summary.costPerCase.toFixed(2)}</div>
        </CardContent>
      </Card>
    </div>
  );
};