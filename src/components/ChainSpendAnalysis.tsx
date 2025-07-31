import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { MetaAd } from '@/hooks/useMetaAdsData';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
interface ChainSpendAnalysisProps {
  data: MetaAd[];
}
export const ChainSpendAnalysis = ({
  data
}: ChainSpendAnalysisProps) => {
  const [salesData, setSalesData] = useState<Record<string, number>>({});

  // Fetch sales data for chains
  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        const { data: vipData, error } = await supabase
          .from("VIP_RAW_12MO")
          .select(`
            "Retail Accounts",
            "12 Months 8/1/2024 thru 7/23/2025  Case Equivs"
          `);
        
        if (error) throw error;
        
        // Process sales data by chain
        const chainSalesMap: Record<string, number> = {};
        
        vipData?.forEach(row => {
          const retailAccount = row["Retail Accounts"];
          if (retailAccount && retailAccount !== 'Total') {
            // Normalize chain name to match what's in ads data
            const normalizedChain = normalizeChainName(retailAccount);
            const totalCases = row["12 Months 8/1/2024 thru 7/23/2025  Case Equivs"];
            const casesNum = typeof totalCases === 'number' ? totalCases : 
                           typeof totalCases === 'string' && totalCases !== '' ? parseFloat(totalCases) : 0;
            
            if (!isNaN(casesNum) && casesNum > 0) {
              chainSalesMap[normalizedChain] = (chainSalesMap[normalizedChain] || 0) + casesNum;
            }
          }
        });
        
        setSalesData(chainSalesMap);
      } catch (error) {
        console.error('Error fetching sales data:', error);
      }
    };

    fetchSalesData();
  }, []);

  // Helper function to normalize chain names
  const normalizeChainName = (chainName: string): string => {
    return chainName.toLowerCase()
      .replace(/[^a-z0-9]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // First pass: calculate base spend and impressions for each chain (excluding General)
  const baseChainSpend = {} as Record<string, number>;
  const baseChainImpressions = {} as Record<string, number>;
  let totalGeneralSpend = 0;
  let totalGeneralImpressions = 0;
  data.forEach(ad => {
    ad.chain.forEach(chainName => {
      if (chainName) {
        if (chainName.toLowerCase() === 'general') {
          totalGeneralSpend += ad.spend;
          totalGeneralImpressions += ad.impressions;
        } else {
          baseChainSpend[chainName] = (baseChainSpend[chainName] || 0) + ad.spend;
          baseChainImpressions[chainName] = (baseChainImpressions[chainName] || 0) + ad.impressions;
        }
      }
    });
  });

  // Calculate total base spend and impressions (excluding General)
  const totalBaseSpend = Object.values(baseChainSpend).reduce((sum, spend) => sum + spend, 0);
  const totalBaseImpressions = Object.values(baseChainImpressions).reduce((sum, impressions) => sum + impressions, 0);

  // Second pass: distribute General spend and impressions proportionally
  const finalChainSpend = {} as Record<string, number>;
  const finalChainImpressions = {} as Record<string, number>;
  if (totalBaseSpend > 0) {
    Object.entries(baseChainSpend).forEach(([chain, spend]) => {
      const proportion = spend / totalBaseSpend;
      const distributedGeneralSpend = totalGeneralSpend * proportion;
      const distributedGeneralImpressions = totalGeneralImpressions * proportion;
      finalChainSpend[chain] = spend + distributedGeneralSpend;
      finalChainImpressions[chain] = (baseChainImpressions[chain] || 0) + distributedGeneralImpressions;
    });
  } else {
    // If no base spend, just use the base values as is
    Object.assign(finalChainSpend, baseChainSpend);
    Object.assign(finalChainImpressions, baseChainImpressions);
  }

  // Convert to array and sort by spend
  const chartData = Object.entries(finalChainSpend).map(([chain, spend]) => ({
    chain,
    spend: Math.round(spend * 100) / 100,
    // Round to 2 decimal places
    impressions: Math.round(finalChainImpressions[chain] || 0)
  })).sort((a, b) => b.spend - a.spend).slice(0, 15); // Top 15 chains

  // Pie chart data for top chains
  const pieData = chartData.slice(0, 8).map((item, index) => ({
    ...item,
    fill: `hsl(${index * 45 % 360}, 70%, 50%)`
  }));
  const totalSpend = chartData.reduce((sum, item) => sum + item.spend, 0);
  const totalImpressions = chartData.reduce((sum, item) => sum + item.impressions, 0);
  return <div className="grid gap-6">
      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-4">
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
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalImpressions.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-6">
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
            <CardTitle>Impressions by Chain</CardTitle>
            <CardDescription>Impression distribution across retail chains</CardDescription>
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
                <YAxis tickFormatter={value => `${(value / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => [value.toLocaleString(), 'Impressions']} labelStyle={{
                color: 'hsl(var(--foreground))'
              }} />
                <Bar dataKey="impressions" fill="hsl(var(--success))" />
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
                {chartData.slice(0, 5).map((chain, index) => {
                  // Find cases sold for this chain
                  const normalizedChainName = normalizeChainName(chain.chain);
                  const casesSold = salesData[normalizedChainName] || 0;
                  
                  return (
                    <div key={chain.chain} className="flex justify-between items-center">
                      <span className="text-sm">{index + 1}. {chain.chain}</span>
                      <div className="text-right">
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-sm font-medium">${chain.spend.toLocaleString()}</div>
                            <div className="text-xs text-muted-foreground">Ad Spend</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">{Math.round(casesSold).toLocaleString()}</div>
                            <div className="text-xs text-muted-foreground">Cases Sold</div>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">{chain.impressions.toLocaleString()} impressions</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
          </div>
        </CardContent>
      </Card>
    </div>;
};