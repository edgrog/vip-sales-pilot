import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, Megaphone, BarChart3 } from "lucide-react";
import { WholesaleSummary } from "@/components/WholesaleSummary";
import { MarketingSummary } from "@/components/MarketingSummary";
const Home = () => {
  const navigate = useNavigate();
  return <div className="max-w-7xl mx-auto space-y-8">
    

    {/* Wholesale Summary */}
    <div>
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <ShoppingCart className="h-5 w-5" />
        Wholesale Overview
      </h2>
      <WholesaleSummary />
    </div>

    {/* Marketing Summary */}
    <div>
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Megaphone className="h-5 w-5" />
        Marketing Overview
      </h2>
      <MarketingSummary />
    </div>

    {/* Navigation Cards */}
    
  </div>;
};
export default Home;