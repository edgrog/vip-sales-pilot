import { Dashboard } from "@/components/Dashboard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { Home } from "lucide-react";

const Index = () => {
  const { user, signOut } = useAuth();
  
  return (
    <div className="min-h-screen">
      <div className="fixed top-4 left-4 z-50">
        <Link to="/home">
          <Button variant="outline" size="sm">
            <Home className="w-4 h-4 mr-2" />
            Home
          </Button>
        </Link>
      </div>
      <div className="fixed top-4 right-4 z-50">
        {user ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {user.email}
            </span>
            <Button onClick={signOut} variant="outline" size="sm">
              Sign Out
            </Button>
          </div>
        ) : (
          <Link to="/auth">
            <Button variant="outline" size="sm">
              Sign In
            </Button>
          </Link>
        )}
      </div>
      <Dashboard />
    </div>
  );
};

export default Index;
