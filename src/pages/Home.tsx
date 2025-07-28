import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, Megaphone } from "lucide-react";
const Home = () => {
  const navigate = useNavigate();
  return <div className="min-h-screen bg-gradient-to-br from-background to-background/50 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Grog Team Dashboard</h1>
          <p className="text-xl text-muted-foreground">
            Choose your platform to get started
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer" onClick={() => navigate('/')}>
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
              <div className="mx-auto w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mb-4">
                <Megaphone className="w-8 h-8 text-secondary" />
              </div>
              <CardTitle className="text-2xl">Marketing</CardTitle>
              <CardDescription className="text-base">Track ad performance & socials</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button variant="secondary" size="lg" className="w-full">
                Go to Marketing
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>;
};
export default Home;