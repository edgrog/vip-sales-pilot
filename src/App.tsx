import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Index from "./pages/Index";
import Marketing from "./pages/Marketing";
import AdsDashboard from "./pages/AdsDashboard";
import AccountOverview from "./pages/AccountOverview";
import ChainOverview from "./pages/ChainOverview";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/home" element={<Home />} />
          <Route path="/" element={<Index />} />
          <Route path="/marketing" element={<Marketing />} />
          <Route path="/marketing/ads-dashboard" element={<AdsDashboard />} />
          <Route path="/accounts/:accountId" element={<AccountOverview />} />
          <Route path="/chains/:chainId" element={<ChainOverview />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
