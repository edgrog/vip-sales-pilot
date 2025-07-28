import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, BarChart, MapPin, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMetaAdsData } from "@/hooks/useMetaAdsData";
import { MetaAdsTable } from "@/components/MetaAdsTable";
import { ChainSpendAnalysis } from "@/components/ChainSpendAnalysis";
import { StateSpendAnalysis } from "@/components/StateSpendAnalysis";

const Marketing = () => {
  const navigate = useNavigate();
  const { data, loading, error, refetch, updateAd } = useMetaAdsData();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/home')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Marketing Platform</h1>
              <p className="text-muted-foreground">Manage your Meta Ads campaigns and performance</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="campaigns" className="space-y-6">
          <TabsList className="grid w-full lg:w-auto lg:grid-cols-3">
            <TabsTrigger value="campaigns" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Campaigns
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
            {/* Meta Ads Table */}
            <MetaAdsTable 
              data={data}
              loading={loading}
              error={error}
              onRefresh={refetch}
              onAdUpdate={updateAd}
            />

            {/* Additional Marketing Features */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Campaign Management</CardTitle>
                  <CardDescription>
                    Create, monitor, and optimize your marketing campaigns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Additional campaign management features coming soon! This will include campaign creation, 
                    automated bidding strategies, and cross-platform campaign coordination.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Audience Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Understand your target audience with detailed demographic and behavioral data from Meta Ads.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="chains" className="space-y-6">
            <ChainSpendAnalysis data={data} />
          </TabsContent>

          <TabsContent value="states" className="space-y-6">
            <StateSpendAnalysis data={data} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Marketing;