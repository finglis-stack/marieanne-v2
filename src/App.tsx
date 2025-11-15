import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import POS from "./pages/POS";
import RewardCards from "./pages/RewardCards";
import CustomerDetail from "./pages/CustomerDetail";
import OrderDetail from "./pages/OrderDetail";
import Transactions from "./pages/Transactions";
import PreparationQueue from "./pages/PreparationQueue";
import Reports from "./pages/Reports";
import AuditLogs from "./pages/AuditLogs";
import DeviceManagement from "./pages/DeviceManagement";
import SecurityDashboard from "./pages/SecurityDashboard";
import NotFound from "./pages/NotFound";
import { ParticleBackground } from "./components/particle-background";

const queryClient = new QueryClient();

const LoadingScreen = () => (
  <div className="min-h-screen relative overflow-hidden flex items-center justify-center bg-slate-950">
    <div 
      className="absolute inset-0 bg-cover bg-center"
      style={{
        backgroundImage: 'url(/foodiesfeed.com_refreshing-berry-medley-with-mint-splash.png)',
      }}
    />
    <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-blue-950/85 to-slate-950/90" />
    <div className="absolute inset-0 bg-blue-900/30" />
    <ParticleBackground />
    <div className="relative z-10">
      <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
    </div>
  </div>
);

const App = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/pos" element={<POS />} />
            <Route path="/reward-cards" element={<RewardCards />} />
            <Route path="/reward-cards/:customerId" element={<CustomerDetail />} />
            <Route path="/orders/:orderId" element={<OrderDetail />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/preparation-queue" element={<PreparationQueue />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/audit-logs" element={<AuditLogs />} />
            <Route path="/device-management" element={<DeviceManagement />} />
            <Route path="/security-dashboard" element={<SecurityDashboard />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;