import { Dashboard } from "@/components/Dashboard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";

const Index = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <Header 
          title="Wholesale Platform" 
          subtitle="Wholesale analytics, chain performance, and sales insights"
          showBackButton={true}
          backButtonText="Back to Home"
          backButtonPath="/home"
        />
        <Dashboard />
      </div>
    </div>
  );
};

export default Index;
