import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Package, DollarSign, Store } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface WholesaleSummary {
  totalCases: number;
  activeStores: number;
  topChain: string;
  monthlyGrowth: number;
}

export const WholesaleSummary = () => {
  const [summary, setSummary] = useState<WholesaleSummary>({
    totalCases: 0,
    activeStores: 0,
    topChain: "",
    monthlyGrowth: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWholesaleSummary();
  }, []);

  const fetchWholesaleSummary = async () => {
    try {
      const { data, error } = await supabase
        .from("VIP_RAW_12MO")
        .select(`
          "Retail Accounts",
          "State",
          "12 Months 8/1/2024 thru 7/23/2025  Case Equivs",
          "1 Month 7/1/2025 thru 7/23/2025  Case Equivs",
          "1 Month 6/1/2025 thru 6/30/2025  Case Equivs"
        `);

      if (error) throw error;

      // Calculate recent month total cases (July)
      const recentMonthCases = data?.reduce((sum, row) => {
        const val = row["1 Month 7/1/2025 thru 7/23/2025  Case Equivs"];
        const numVal = typeof val === 'number' ? val : (typeof val === 'string' && val !== '' ? parseFloat(val) : 0);
        return sum + (isNaN(numVal) ? 0 : numVal);
      }, 0) || 0;

      // Calculate active stores (stores with any sales in recent months)
      const activeStores = data?.filter(row => {
        const july = parseFloat(String(row["1 Month 7/1/2025 thru 7/23/2025  Case Equivs"] || 0));
        const june = parseFloat(String(row["1 Month 6/1/2025 thru 6/30/2025  Case Equivs"] || 0));
        const may = parseFloat(String(row["1 Month 5/1/2025 thru 5/31/2025  Case Equivs"] || 0));
        return july + june + may > 0;
      }).length || 0;

      // Find top chain
      const chainMap = new Map<string, number>();
      data?.forEach(row => {
        const chain = row["Retail Accounts"] || "Unknown";
        const normalizedChain = normalizeChain(chain);
        const cases = parseFloat(String(row["12 Months 8/1/2024 thru 7/23/2025  Case Equivs"] || 0));
        chainMap.set(normalizedChain, (chainMap.get(normalizedChain) || 0) + cases);
      });

      const topChain = Array.from(chainMap.entries())
        .sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

      // Calculate monthly growth (July vs June)
      const julyTotal = data?.reduce((sum, row) => {
        const val = row["1 Month 7/1/2025 thru 7/23/2025  Case Equivs"];
        const numVal = parseFloat(String(val || 0));
        return sum + (isNaN(numVal) ? 0 : numVal);
      }, 0) || 0;

      const juneTotal = data?.reduce((sum, row) => {
        const val = row["1 Month 6/1/2025 thru 6/30/2025  Case Equivs"];
        const numVal = parseFloat(String(val || 0));
        return sum + (isNaN(numVal) ? 0 : numVal);
      }, 0) || 0;

      const monthlyGrowth = juneTotal > 0 ? ((julyTotal - juneTotal) / juneTotal) * 100 : 0;

      setSummary({
        totalCases: Math.round(recentMonthCases),
        activeStores,
        topChain,
        monthlyGrowth
      });
    } catch (error) {
      console.error("Error fetching wholesale summary:", error);
    } finally {
      setLoading(false);
    }
  };

  const normalizeChain = (chain: string): string => {
    if (!chain) return "Unknown";
    const c = chain.toUpperCase();
    if (c.includes('WALMART')) return 'Walmart';
    if (c.includes('TARGET')) return 'Target';
    if (c.includes('KROGER')) return 'Kroger';
    if (c.includes('HEB')) return 'HEB';
    return chain.split(' ')[0];
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="h-16 bg-muted animate-pulse rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Package className="h-4 w-4" />
            Total Cases (1M)
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="text-2xl font-bold">{summary.totalCases.toLocaleString()}</div>
          <div className={`text-sm ${summary.monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {summary.monthlyGrowth >= 0 ? '+' : ''}{summary.monthlyGrowth.toFixed(1)}% vs last month
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Store className="h-4 w-4" />
            Active Stores
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="text-2xl font-bold">{summary.activeStores.toLocaleString()}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Top Chain
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="text-lg font-bold">{summary.topChain}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Monthly Growth
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className={`text-2xl font-bold ${summary.monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {summary.monthlyGrowth >= 0 ? '+' : ''}{summary.monthlyGrowth.toFixed(1)}%
          </div>
        </CardContent>
      </Card>
    </div>
  );
};