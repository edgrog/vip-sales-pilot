import { Dashboard } from "@/components/Dashboard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Index = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/home')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Wholesale Platform</h1>
              <p className="text-muted-foreground">Wholesale analytics, chain performance, and sales insights</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <span className="text-sm text-muted-foreground">
                  {user.email}
                </span>
                <Button onClick={signOut} variant="outline" size="sm">
                  Sign Out
                </Button>
              </>
            ) : (
              <Button onClick={() => navigate('/auth')} variant="outline" size="sm">
                Sign In
              </Button>
            )}
          </div>
        </div>
        <Dashboard />
      </div>
    </div>
  );
};

export default Index;
