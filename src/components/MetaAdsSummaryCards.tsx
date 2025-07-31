import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, DollarSign, Eye, TrendingUp } from 'lucide-react';
import { MetaAd } from '@/hooks/useMetaAdsData';

interface MetaAdsSummaryCardsProps {
  data: MetaAd[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export const MetaAdsSummaryCards = ({
  data,
  loading,
  error,
  onRefresh
}: MetaAdsSummaryCardsProps) => {
  // Filter out campaigns with 'AU/NZ' tag OR state from frontend display
  const visibleData = data.filter(ad => !ad.tag.includes('AU/NZ') && !ad.state.includes('AU/NZ'));

  const totalSpend = visibleData.reduce((sum, ad) => sum + ad.spend, 0);
  const totalImpressions = visibleData.reduce((sum, ad) => sum + ad.impressions, 0);
  const costPerMil = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0;

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Error Loading Meta Ads Data</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={onRefresh} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Meta Ads Performance
              <Badge variant="secondary">{visibleData.length} ads</Badge>
            </CardTitle>
            <CardDescription>
              Live Meta Ads data summary
            </CardDescription>
          </div>
          <Button onClick={onRefresh} variant="outline" disabled={loading} className="flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-lg">
            <DollarSign className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total Spend ($AUD)</p>
              <p className="text-2xl font-bold">${totalSpend.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-success/5 rounded-lg">
            <Eye className="w-8 h-8 text-success" />
            <div>
              <p className="text-sm text-muted-foreground">Total Impressions</p>
              <p className="text-2xl font-bold">{totalImpressions.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-info/5 rounded-lg">
            <TrendingUp className="w-8 h-8 text-info" />
            <div>
              <p className="text-sm text-muted-foreground">Cost Per Mil (CPM)</p>
              <p className="text-2xl font-bold">${costPerMil.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};