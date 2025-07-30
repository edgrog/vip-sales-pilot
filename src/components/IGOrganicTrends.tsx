import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    followers: true,
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              IG Organic Performance
              <Badge variant="secondary">{data.length} data points</Badge>
            </CardTitle>
            <CardDescription>
              Instagram organic reach, profile views, and website clicks over time
            </CardDescription>
          </div>
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
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-lg">
            <Eye className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total Reach (Last {dateRange}d)</p>
              <p className="text-2xl font-bold">{formatNumber(summary.totalReach)}</p>
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
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-success/5 rounded-lg">
            <TrendingUp className="w-8 h-8 text-success" />
            <div>
              <p className="text-sm text-muted-foreground">Followers</p>
              <p className="text-2xl font-bold">{formatNumber(summary.totalFollowers)}</p>
              <div className="flex items-center text-xs text-muted-foreground">
                {summary.followersChange >= 0 ? (
                  <ArrowUp className="h-3 w-3 mr-1 text-green-500" />
                ) : (
                  <ArrowDown className="h-3 w-3 mr-1 text-red-500" />
                )}
                <span className={summary.followersChange >= 0 ? "text-green-500" : "text-red-500"}>
                  {formatPercentage(summary.followersChange)}
                </span>
                <span className="ml-1">vs previous 30d</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-info/5 rounded-lg">
            <MousePointer className="w-8 h-8 text-info" />
            <div>
              <p className="text-sm text-muted-foreground">Website Clicks</p>
              <p className="text-2xl font-bold">{formatNumber(summary.totalWebsiteClicks)}</p>
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
            </div>
          </div>
        </div>

        {/* Metric Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
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
              id="followers"
              checked={selectedMetrics.followers}
              onCheckedChange={() => handleMetricToggle('followers')}
            />
            <label htmlFor="followers" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Followers
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
        
        {/* Chart */}
        <div className="border rounded-lg">
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
              {selectedMetrics.followers && (
                <Line 
                  type="monotone" 
                  dataKey="followers" 
                  stroke="#06b6d4" 
                  name="Followers"
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
        </div>
      </CardContent>
    </Card>
  );
};

export default IGOrganicTrends;