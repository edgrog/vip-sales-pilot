import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, DollarSign, TrendingUp, Target, BarChart3 } from "lucide-react";
import { AdsDashboardTable } from "@/components/AdsDashboardTable";
import { AdsDashboardChart } from "@/components/AdsDashboardChart";
import { AdsPerformanceMetrics } from "@/components/AdsPerformanceMetrics";

const AdsDashboard = () => {
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedChain, setSelectedChain] = useState<string>("");
  const [sortBy, setSortBy] = useState<"spend" | "sales" | "cost_per_case">("spend");

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/home")} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
          <h1 className="text-3xl font-bold">Ads Performance Dashboard</h1>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Ad Spend</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$125,480</div>
              <p className="text-xs text-muted-foreground">
                Last 90 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cost per Case</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$8.42</div>
              <p className="text-xs text-muted-foreground">
                Average efficiency
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cases Sold</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">14,908</div>
              <p className="text-xs text-muted-foreground">
                From ad campaigns
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ROAS</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3.2x</div>
              <p className="text-xs text-muted-foreground">
                Return on ad spend
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs with Breakdowns */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="chain-analysis">Chain Analysis</TabsTrigger>
            <TabsTrigger value="performance-metrics">Performance Metrics</TabsTrigger>
            <TabsTrigger value="detailed-data">Detailed Data</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="flex gap-4 items-center">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="">All Months</option>
                <option value="2025-07">July 2025</option>
                <option value="2025-06">June 2025</option>
                <option value="2025-05">May 2025</option>
              </select>

              <select
                value={selectedChain}
                onChange={(e) => setSelectedChain(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="">All Chains</option>
                <option value="Walmart">Walmart</option>
                <option value="Target">Target</option>
                <option value="Kroger">Kroger</option>
              </select>
            </div>
            <AdsDashboardChart />
          </TabsContent>

          <TabsContent value="chain-analysis" className="space-y-4">
            <AdsDashboardTable 
              selectedMonth={selectedMonth}
              selectedChain={selectedChain}
              sortBy={sortBy}
            />
          </TabsContent>

          <TabsContent value="performance-metrics" className="space-y-4">
            <AdsPerformanceMetrics />
          </TabsContent>

          <TabsContent value="detailed-data" className="space-y-4">
            <div className="flex gap-4 items-center mb-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "spend" | "sales" | "cost_per_case")}
                className="px-3 py-2 border rounded-md"
              >
                <option value="spend">Sort by Spend</option>
                <option value="sales">Sort by Sales</option>
                <option value="cost_per_case">Sort by Cost per Case</option>
              </select>
            </div>
            <AdsDashboardTable 
              selectedMonth={selectedMonth}
              selectedChain={selectedChain}
              sortBy={sortBy}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdsDashboard;