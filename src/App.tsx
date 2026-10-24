import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nProvider } from "@/lib/i18n";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { ActivityProvider } from "@/lib/activity-context";
import { AppLayout } from "@/components/AppLayout";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import WheatManagement from "./pages/WheatManagement";
import OilPalmAnalytics from "./pages/OilPalmAnalytics";
import MarketInsights from "./pages/MarketInsights";
import CropAdvisory from "./pages/CropAdvisory";
import ProfitPlanner from "./pages/ProfitPlanner";
import ActivityTimeline from "./pages/ActivityTimeline";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background text-foreground">Loading...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <I18nProvider>
      <AuthProvider>
        <ActivityProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/wheat" element={<WheatManagement />} />
                  <Route path="/oil-palm" element={<OilPalmAnalytics />} />
                  <Route path="/market" element={<MarketInsights />} />
                  <Route path="/profit-planner" element={<ProfitPlanner />} />
                  <Route path="/advisory" element={<CropAdvisory />} />
                  <Route path="/activity" element={<ActivityTimeline />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </ActivityProvider>
      </AuthProvider>
    </I18nProvider>
  </QueryClientProvider>
);

export default App;
