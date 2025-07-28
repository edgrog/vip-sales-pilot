import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MetaAd } from '@/hooks/useMetaAdsData';

interface USHeatMapProps {
  data: MetaAd[];
}

export const USHeatMap = ({ data }: USHeatMapProps) => {
  // Aggregate spend by state
  const stateSpendData = data.reduce((acc, ad) => {
    ad.state.forEach(stateName => {
      if (stateName && stateName !== 'AU/NZ') {
        acc[stateName] = (acc[stateName] || 0) + ad.spend;
      }
    });
    return acc;
  }, {} as Record<string, number>);

  const spendValues = Object.values(stateSpendData);
  const maxSpend = Math.max(...spendValues);
  const minSpend = Math.min(...spendValues);
  
  // Get color intensity based on spend
  const getSpendIntensity = (state: string) => {
    const spend = stateSpendData[state] || 0;
    if (spend === 0) return 0;
    return ((spend - minSpend) / (maxSpend - minSpend)) * 0.8 + 0.2; // 0.2 to 1.0 range
  };

  // State path data (simplified SVG paths for major states)
  const statePaths: Record<string, string> = {
    CA: "M 50 200 L 120 200 L 130 350 L 40 350 Z",
    TX: "M 200 250 L 350 250 L 350 350 L 200 380 Z",
    FL: "M 400 350 L 500 350 L 520 400 L 480 420 L 400 400 Z",
    NY: "M 450 120 L 520 120 L 520 180 L 450 180 Z",
    IL: "M 350 180 L 400 180 L 400 250 L 350 250 Z",
    OH: "M 400 180 L 450 180 L 450 230 L 400 230 Z",
    MI: "M 400 150 L 450 150 L 450 200 L 400 200 Z",
    WI: "M 350 150 L 400 150 L 400 200 L 350 200 Z",
    MA: "M 480 130 L 520 130 L 520 150 L 480 150 Z"
  };

  const sortedStates = Object.entries(stateSpendData)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10);

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>US Ad Spend Heat Map</CardTitle>
          <CardDescription>
            Geographic distribution of ad spend across states
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Simplified Heat Map Visualization */}
            <div className="space-y-4">
              <div className="relative bg-slate-50 dark:bg-slate-900 rounded-lg p-6 min-h-[400px]">
                <svg viewBox="0 0 600 500" className="w-full h-full">
                  {/* Background */}
                  <rect width="600" height="500" fill="hsl(var(--muted))" />
                  
                  {/* State representations */}
                  {Object.entries(statePaths).map(([state, path]) => {
                    const intensity = getSpendIntensity(state);
                    const spend = stateSpendData[state] || 0;
                    return (
                      <g key={state}>
                        <path
                          d={path}
                          fill={spend > 0 ? `rgba(239, 68, 68, ${intensity})` : 'hsl(var(--muted-foreground))'}
                          stroke="hsl(var(--border))"
                          strokeWidth="1"
                          className="transition-all hover:stroke-2 cursor-pointer"
                        />
                        <text
                          x={path.includes('M 50') ? 85 : path.includes('M 200') ? 275 : path.includes('M 400 350') ? 460 : path.includes('M 450 120') ? 485 : path.includes('M 350 180') ? 375 : path.includes('M 400 180') ? 425 : path.includes('M 400 150') ? 425 : path.includes('M 350 150') ? 375 : 500}
                          y={path.includes('M 50') ? 275 : path.includes('M 200') ? 315 : path.includes('M 400 350') ? 375 : path.includes('M 450 120') ? 150 : path.includes('M 350 180') ? 215 : path.includes('M 400 180') ? 205 : path.includes('M 400 150') ? 175 : path.includes('M 350 150') ? 175 : 140}
                          textAnchor="middle"
                          className="text-xs font-medium fill-foreground"
                        >
                          {state}
                        </text>
                      </g>
                    );
                  })}
                </svg>
                
                {/* Legend */}
                <div className="absolute bottom-4 left-4 bg-background p-3 rounded-lg shadow-lg border">
                  <p className="text-xs font-medium mb-2">Spend Intensity</p>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-300 rounded"></div>
                    <span className="text-xs">Low</span>
                    <div className="w-8 h-2 bg-gradient-to-r from-red-200 to-red-600 rounded"></div>
                    <span className="text-xs">High</span>
                  </div>
                </div>
              </div>
            </div>

            {/* State Rankings */}
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-3">Top Performing States</h4>
                <div className="space-y-2">
                  {sortedStates.map(([state, spend], index) => (
                    <div key={state} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                          {index + 1}
                        </span>
                        <span className="font-medium">{state}</span>
                      </div>
                      <span className="font-bold">${spend.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">Highest Spend</p>
                  <p className="text-lg font-bold text-green-800 dark:text-green-200">
                    {sortedStates[0]?.[0]} - ${sortedStates[0]?.[1].toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Active States</p>
                  <p className="text-lg font-bold text-blue-800 dark:text-blue-200">
                    {Object.keys(stateSpendData).length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Geographic Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Geographic Market Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-semibold mb-2 text-green-600">Strong Markets</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                {sortedStates.slice(0, 3).map(([state]) => (
                  <p key={state}>• {state} - Dominant presence</p>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-yellow-600">Growth Opportunities</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• Expand into underrepresented regions</p>
                <p>• Consider regional partnerships</p>
                <p>• Test localized creative strategies</p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-blue-600">Strategic Recommendations</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• Focus on top 5 performing states</p>
                <p>• Analyze competitor presence by region</p>
                <p>• Consider seasonal geographic trends</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};