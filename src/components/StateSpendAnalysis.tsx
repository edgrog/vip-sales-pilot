import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MetaAd } from '@/hooks/useMetaAdsData';

interface StateSpendAnalysisProps {
  data: MetaAd[];
}

export const StateSpendAnalysis = ({ data }: StateSpendAnalysisProps) => {
  // Aggregate spend by state
  const stateSpendData = data.reduce((acc, ad) => {
    ad.state.forEach(stateName => {
      if (stateName && stateName !== 'AU/NZ') {
        acc[stateName] = (acc[stateName] || 0) + ad.spend;
      }
    });
    return acc;
  }, {} as Record<string, number>);

  // Convert to array and sort by spend
  const chartData = Object.entries(stateSpendData)
    .map(([state, spend]) => ({ state, spend }))
    .sort((a, b) => b.spend - a.spend);

  const totalSpend = chartData.reduce((sum, item) => sum + item.spend, 0);
  const averageSpendPerState = totalSpend / chartData.length;

  // Identify states needing attention
  const lowSpendStates = chartData.filter(item => item.spend < averageSpendPerState * 0.5);
  const highSpendStates = chartData.slice(0, 3);

  // Get color based on spend level
  const getBarColor = (spend: number) => {
    if (spend > averageSpendPerState * 1.5) return '#ef4444'; // High spend - red
    if (spend < averageSpendPerState * 0.5) return '#f59e0b'; // Low spend - amber
    return 'hsl(var(--primary))'; // Normal spend
  };

  const chartDataWithColors = chartData.map(item => ({
    ...item,
    fill: getBarColor(item.spend)
  }));

  return (
    <div className="grid gap-6">
      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active States</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{chartData.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Top State</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{chartData[0]?.state || 'N/A'}</div>
            <p className="text-xs text-muted-foreground">
              ${chartData[0]?.spend.toLocaleString() || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average per State</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${averageSpendPerState.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total State Spend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalSpend.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* State Spend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Ad Spend by State</CardTitle>
          <CardDescription>
            State-by-state ad spend analysis
            <span className="block mt-1 text-xs">
              🔴 High spend (&gt;150% avg) • 🟡 Low spend (&lt;50% avg) • 🔵 Normal spend
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartDataWithColors} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="state" />
              <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
              <Tooltip 
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Spend']}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Bar dataKey="spend" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Analysis Cards */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">High Spend States</CardTitle>
            <CardDescription>States with spend above 150% of average</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {highSpendStates.length > 0 ? (
                highSpendStates.map((state, index) => (
                  <div key={state.state} className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                    <div>
                      <span className="font-medium">{state.state}</span>
                      <p className="text-sm text-muted-foreground">
                        {((state.spend / averageSpendPerState) * 100).toFixed(0)}% of average
                      </p>
                    </div>
                    <span className="font-bold text-red-600">${state.spend.toLocaleString()}</span>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">No states with exceptionally high spend</p>
              )}
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  💡 Consider: Review ROI and performance metrics to ensure high spend is justified
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-amber-600">Low Spend States</CardTitle>
            <CardDescription>States with spend below 50% of average</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowSpendStates.length > 0 ? (
                lowSpendStates.slice(0, 5).map((state) => (
                  <div key={state.state} className="flex justify-between items-center p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                    <div>
                      <span className="font-medium">{state.state}</span>
                      <p className="text-sm text-muted-foreground">
                        {((state.spend / averageSpendPerState) * 100).toFixed(0)}% of average
                      </p>
                    </div>
                    <span className="font-bold text-amber-600">${state.spend.toLocaleString()}</span>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">No states with low spend</p>
              )}
              <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <p className="text-sm text-green-700 dark:text-green-300">
                  💡 Opportunity: Consider increasing budget allocation to expand market presence
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>State Performance Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-semibold mb-2 text-green-600">Expand Markets</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                {lowSpendStates.slice(0, 3).map(state => (
                  <p key={state.state}>• Increase spend in {state.state}</p>
                ))}
                {lowSpendStates.length === 0 && <p>• All states have adequate spend</p>}
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-blue-600">Optimize Performance</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• Monitor ROI in top spending states</p>
                <p>• A/B test creative in underperforming regions</p>
                <p>• Analyze demographic data by state</p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-purple-600">Strategic Focus</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• Prioritize {chartData[0]?.state} market expansion</p>
                <p>• Consider regional campaign variations</p>
                <p>• Evaluate state-specific competition</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};