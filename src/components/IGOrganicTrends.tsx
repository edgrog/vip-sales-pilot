import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Calendar, TrendingUp, Eye, MousePointer, ArrowUp, ArrowDown, RefreshCw } from "lucide-react";
import { useIGOrganicData } from "@/hooks/useIGOrganicData";

const IGOrganicTrends = () => {
  const { data, summary, loading, error, refetch } = useIGOrganicData();
  const [selectedMetrics, setSelectedMetrics] = useState({
    reach: true,
    profile_views: true,
    website_clicks: true
  });
  const [dateRange, setDateRange] = useState(30);

  const handleMetricToggle = (metric: string) => {
    setSelectedMetrics(prev => ({
      ...prev,
      [metric]: !prev[metric as keyof typeof prev]
    }));
  };

  const handleDateRangeChange = (days: number) => {
    setDateRange(days);
    refetch(days);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatPercentage = (num: number) => {
    const sign = num >= 0 ? '+' : '';
    return `${sign}${num.toFixed(1)}%`;
  };

  if (loading) return <div>Loading IG Organic data...</div>;
  if (error) return <div>Error loading data: {error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <div className="flex gap-2">
          <Button
            variant={dateRange === 7 ? "default" : "outline"}
            size="sm"
            onClick={() => handleDateRangeChange(7)}
          >
            7d
          </Button>
          <Button
            variant={dateRange === 30 ? "default" : "outline"}
            size="sm"
            onClick={() => handleDateRangeChange(30)}
          >
            30d
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch(dateRange)}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reach</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(summary.totalReach)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {summary.reachChange >= 0 ? (
                <ArrowUp className="h-3 w-3 mr-1 text-green-500" />
              ) : (
                <ArrowDown className="h-3 w-3 mr-1 text-red-500" />
              )}
              <span className={summary.reachChange >= 0 ? "text-green-500" : "text-red-500"}>
                {formatPercentage(summary.reachChange)}
              </span>
              <span className="ml-1">vs previous 30d</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profile Views</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(summary.totalProfileViews)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {summary.profileViewsChange >= 0 ? (
                <ArrowUp className="h-3 w-3 mr-1 text-green-500" />
              ) : (
                <ArrowDown className="h-3 w-3 mr-1 text-red-500" />
              )}
              <span className={summary.profileViewsChange >= 0 ? "text-green-500" : "text-red-500"}>
                {formatPercentage(summary.profileViewsChange)}
              </span>
              <span className="ml-1">vs previous 30d</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Website Clicks</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(summary.totalWebsiteClicks)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {summary.websiteClicksChange >= 0 ? (
                <ArrowUp className="h-3 w-3 mr-1 text-green-500" />
              ) : (
                <ArrowDown className="h-3 w-3 mr-1 text-red-500" />
              )}
              <span className={summary.websiteClicksChange >= 0 ? "text-green-500" : "text-red-500"}>
                {formatPercentage(summary.websiteClicksChange)}
              </span>
              <span className="ml-1">vs previous 30d</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Metrics Over Time</CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="reach"
                  checked={selectedMetrics.reach}
                  onCheckedChange={() => handleMetricToggle('reach')}
                />
                <label htmlFor="reach" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Reach
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="profile_views"
                  checked={selectedMetrics.profile_views}
                  onCheckedChange={() => handleMetricToggle('profile_views')}
                />
                <label htmlFor="profile_views" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Profile Views
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="website_clicks"
                  checked={selectedMetrics.website_clicks}
                  onCheckedChange={() => handleMetricToggle('website_clicks')}
                />
                <label htmlFor="website_clicks" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Website Clicks
                </label>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { 
                  weekday: 'short',
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                })}
                formatter={(value: number, name: string) => [formatNumber(value), name]}
              />
              <Legend />
              {selectedMetrics.reach && (
                <Line 
                  type="monotone" 
                  dataKey="reach" 
                  stroke="#8b5cf6" 
                  name="Reach"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              )}
              {selectedMetrics.profile_views && (
                <Line 
                  type="monotone" 
                  dataKey="profile_views" 
                  stroke="#06b6d4" 
                  name="Profile Views"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              )}
              {selectedMetrics.website_clicks && (
                <Line 
                  type="monotone" 
                  dataKey="website_clicks" 
                  stroke="#f59e0b" 
                  name="Website Clicks"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default IGOrganicTrends;