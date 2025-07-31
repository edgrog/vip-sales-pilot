import { Dashboard } from "@/components/Dashboard";

const Index = () => {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Wholesale Platform</h1>
        <p className="text-muted-foreground">Wholesale analytics, chain performance, and sales insights</p>
      </div>
      <Dashboard />
    </div>
  );
};

export default Index;
