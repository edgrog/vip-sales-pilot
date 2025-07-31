import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, Megaphone, BarChart3 } from "lucide-react";
import { WholesaleSummary } from "@/components/WholesaleSummary";
import { MarketingSummary } from "@/components/MarketingSummary";

const Home = () => {
  const navigate = useNavigate();
  return <div className="max-w-7xl mx-auto space-y-8">
    <div className="text-center">
      <img 
        src="/lovable-uploads/16b7eb00-ca19-4bc1-96c7-0ea3abc83cb2.png" 
        alt="Grog One" 
        className="h-20 w-auto mx-auto mb-4"
      />
      <h1 className="text-3xl font-bold mb-2">Grog One Dashboard</h1>
      <p className="text-muted-foreground">Your business performance at a glance</p>
    </div>

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
    <div>
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <BarChart3 className="h-5 w-5" />
        Quick Access
      </h2>
        
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer" onClick={() => navigate('/wholesale')}>
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <ShoppingCart className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Wholesale</CardTitle>
              <CardDescription className="text-base">Wholesale analytics, chain performance, and sales insights</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button size="lg" className="w-full">
                Go to Wholesale
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer" onClick={() => navigate('/marketing')}>
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                <Megaphone className="w-8 h-8 text-yellow-500" strokeWidth={3} />
              </div>
              <CardTitle className="text-2xl">Marketing</CardTitle>
              <CardDescription className="text-base">Ad Spend by Chain & Geography</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button variant="outline" size="lg" className="w-full text-slate-50 bg-amber-500 hover:bg-amber-400">
                Go to Marketing
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer" onClick={() => navigate('/ads-dashboard')}>
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mb-4">
                <BarChart3 className="w-8 h-8 text-pink-500" strokeWidth={3} />
              </div>
              <CardTitle className="text-2xl">Impact</CardTitle>
              <CardDescription className="text-base">ROI Analysis</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button variant="secondary" size="lg" className="w-full my-[19px] shadow-sm text-slate-50 bg-red-500 hover:bg-red-400">
                Go to Ads Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
    </div>
  </div>;
};

export default Home;