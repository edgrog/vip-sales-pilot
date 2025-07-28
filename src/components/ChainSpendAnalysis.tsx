import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { MetaAd } from '@/hooks/useMetaAdsData';
interface ChainSpendAnalysisProps {
  data: MetaAd[];
}
export const ChainSpendAnalysis = ({
  data
}: ChainSpendAnalysisProps) => {
  // First pass: calculate base spend for each chain (excluding General)
  const baseChainSpend = {} as Record<string, number>;
  let totalGeneralSpend = 0;

  data.forEach(ad => {
    ad.chain.forEach(chainName => {
      if (chainName) {
        if (chainName.toLowerCase() === 'general') {
          totalGeneralSpend += ad.spend;
        } else {
          baseChainSpend[chainName] = (baseChainSpend[chainName] || 0) + ad.spend;
        }
      }
    });
  });

  // Calculate total base spend (excluding General)
  const totalBaseSpend = Object.values(baseChainSpend).reduce((sum, spend) => sum + spend, 0);
  
  // Second pass: distribute General spend proportionally
  const finalChainSpend = {} as Record<string, number>;
  
  if (totalBaseSpend > 0) {
    Object.entries(baseChainSpend).forEach(([chain, spend]) => {
      const proportion = spend / totalBaseSpend;
      const distributedGeneralSpend = totalGeneralSpend * proportion;
      finalChainSpend[chain] = spend + distributedGeneralSpend;
    });
  } else {
    // If no base spend, just use the base spend as is
    Object.assign(finalChainSpend, baseChainSpend);
  }

  // Convert to array and sort by spend
  const chartData = Object.entries(finalChainSpend).map(([chain, spend]) => ({
    chain,
    spend: Math.round(spend * 100) / 100 // Round to 2 decimal places
  })).sort((a, b) => b.spend - a.spend).slice(0, 15); // Top 15 chains

  // Pie chart data for top chains
  const pieData = chartData.slice(0, 8).map((item, index) => ({
    ...item,
    fill: `hsl(${index * 45 % 360}, 70%, 50%)`
  }));
  const totalSpend = chartData.reduce((sum, item) => sum + item.spend, 0);
  return <div className="grid gap-6">
      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Chains Advertised</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(finalChainSpend).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Top Chain</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{chartData[0]?.chain || 'N/A'}</div>
            <p className="text-xs text-muted-foreground">
              ${chartData[0]?.spend.toLocaleString() || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Chain Spend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalSpend.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Spend by Chain (Top 15)</CardTitle>
            <CardDescription>Ad spend distribution across retail chains</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={chartData} margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 80
            }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="chain" angle={-45} textAnchor="end" height={100} tick={{
                fontSize: 12
              }} />
                <YAxis tickFormatter={value => `$${(value / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, 'Spend']} labelStyle={{
                color: 'hsl(var(--foreground))'
              }} />
                <Bar dataKey="spend" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Chain Spend Distribution</CardTitle>
            <CardDescription>Percentage breakdown of top performing chains</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" labelLine={false} label={({
                chain,
                percent
              }) => percent > 0.05 ? `${chain} ${(percent * 100).toFixed(0)}%` : ''} outerRadius={120} fill="#8884d8" dataKey="spend">
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                </Pie>
                <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, 'Spend']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Chain Performance Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">High Performing Chains</h4>
              <div className="space-y-2">
                {chartData.slice(0, 5).map((chain, index) => <div key={chain.chain} className="flex justify-between items-center">
                    <span className="text-sm">{index + 1}. {chain.chain}</span>
                    <span className="text-sm font-medium">${chain.spend.toLocaleString()}</span>
                  </div>)}
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Recommendations</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• Focus budget on top 5 performing chains</p>
                <p>• Consider expanding spend with {chartData[0]?.chain}</p>
                <p>• Monitor performance of smaller chains for optimization</p>
                <p>• Test new creative formats for underperforming chains</p>
                {totalGeneralSpend > 0 && (
                  <p>• ${totalGeneralSpend.toLocaleString()} from General campaigns distributed proportionally</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>;
};