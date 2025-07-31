import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, BarChart, MapPin, TrendingUp, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMetaAdsData } from "@/hooks/useMetaAdsData";
import { MetaAdsTable } from "@/components/MetaAdsTable";
import { ChainSpendAnalysis } from "@/components/ChainSpendAnalysis";
import { StateSpendAnalysis } from "@/components/StateSpendAnalysis";
import IGOrganicTrends from "@/components/IGOrganicTrends";
const Marketing = () => {
  const navigate = useNavigate();
  const {
    data,
    loading,
    error,
    refetch,
    updateAd
  } = useMetaAdsData();

  // Calculate average CPM for comparison
  const totalSpend = data.reduce((sum, ad) => sum + ad.spend, 0);
  const totalImpressions = data.reduce((sum, ad) => sum + ad.impressions, 0);
  const averageCPM = totalImpressions > 0 ? totalSpend / totalImpressions * 1000 : 0;

  // Identify fatigued ads (30+ days running with above-average CPM)
  const fatiguedAds = data.filter(ad => {
    const adCPM = ad.impressions > 0 ? ad.spend / ad.impressions * 1000 : 0;
    return ad.days_running >= 30 && adCPM > averageCPM;
  });
  return <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/home')} className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Marketing Platform</h1>
              <p className="text-muted-foreground">Manage your Meta Ads campaigns and performance</p>
            </div>
          </div>
          <div className="flex gap-2">
            
            
          </div>
        </div>

        <Tabs defaultValue="campaigns" className="space-y-6">
          <TabsList className="grid w-full lg:w-auto lg:grid-cols-4">
            <TabsTrigger value="campaigns" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="campaign-analysis" className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Campaign Analysis
            </TabsTrigger>
            <TabsTrigger value="chains" className="flex items-center gap-2">
              <BarChart className="w-4 h-4" />
              Chain Analysis
            </TabsTrigger>
            <TabsTrigger value="states" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              State Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns" className="space-y-6">
            {/* IG Organic Trends */}
            <IGOrganicTrends />
            
            {/* Meta Ads Table */}
            <MetaAdsTable data={data} loading={loading} error={error} onRefresh={refetch} onAdUpdate={updateAd} />
          </TabsContent>

          <TabsContent value="campaign-analysis" className="space-y-6">
            {/* Fatigued Ads Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  Fatigued Ads Analysis
                </CardTitle>
                <CardDescription>
                  Detailed breakdown of ads running 30+ days with above-average CPM (${averageCPM.toFixed(2)})
                </CardDescription>
              </CardHeader>
              <CardContent>
                {fatiguedAds.length === 0 ? (
                  <p className="text-muted-foreground">
                    No fatigued ads detected. All ads are performing within expected CPM ranges.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {fatiguedAds.map(ad => {
                      const adCPM = ad.impressions > 0 ? ad.spend / ad.impressions * 1000 : 0;
                      return (
                        <div key={ad.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium truncate max-w-md">{ad.name}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="destructive" className="text-xs">
                                {ad.days_running} days
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                ${adCPM.toFixed(2)} CPM
                              </Badge>
                              {ad.chain && (
                                <Badge variant="secondary" className="text-xs">
                                  {ad.chain}
                                </Badge>
                              )}
                              {ad.state && (
                                <Badge variant="outline" className="text-xs">
                                  {ad.state}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">${ad.spend.toLocaleString()}</p>
                            <p className="text-sm text-muted-foreground">{ad.impressions.toLocaleString()} impressions</p>
                            <p className="text-xs text-muted-foreground">{ad.results} results</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Campaign Performance Breakdown */}
            <MetaAdsTable data={data} loading={loading} error={error} onRefresh={refetch} onAdUpdate={updateAd} />
          </TabsContent>

          <TabsContent value="chains" className="space-y-6">
            <ChainSpendAnalysis data={data} />
          </TabsContent>

          <TabsContent value="states" className="space-y-6">
            <StateSpendAnalysis data={data} />
          </TabsContent>
        </Tabs>
      </div>
    </div>;
};
export default Marketing;