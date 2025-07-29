import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
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

        {/* Filters */}
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

        {/* Performance Metrics */}
        <AdsPerformanceMetrics />

        {/* Chart */}
        <AdsDashboardChart />

        {/* Table */}
        <AdsDashboardTable 
          selectedMonth={selectedMonth}
          selectedChain={selectedChain}
          sortBy={sortBy}
        />
      </div>
    </div>
  );
};

export default AdsDashboard;