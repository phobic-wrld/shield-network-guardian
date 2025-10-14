import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { DownloadProvider } from "@/contexts/DownloadContext";

import ErrorBoundary from "@/components/ErrorBoundary";
import { VoiceWelcome } from "@/components/VoiceWelcome";

import Index from "./pages/Index";
import LandingPage from "./pages/LandingPage";
import DevicesPage from "./pages/DevicesPage";
import GuestAccessPage from "./pages/GuestAccessPage";
import SecurityPage from "./pages/SecurityPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import SettingsPage from "./pages/SettingsPage";
import SubscriptionPage from "./pages/SubscriptionPage";
import ExportPage from "./pages/ExportPage";
import ProfilePage from "./pages/ProfilePage";
import PulsePage from "./pages/PulsePage";
import InteractivePage from "./pages/InteractivePage";
import ConnectPage from "./pages/ConnectPage";
import OverviewPage from "./pages/OverviewPage";
import NotFound from "./pages/NotFound";

// ✅ QueryClient instance outside component to prevent recreation
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  useEffect(() => {
    // ✅ Apply theme based on localStorage subscription flag
    const updateTheme = () => {
      const isPremium = localStorage.getItem("demo-premium") === "true";
      if (isPremium) {
        document.body.className =
          "premium-theme bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 text-white";
      } else {
        document.body.className = "basic-theme";
      }
    };

    updateTheme();
    window.addEventListener("storage", updateTheme);
    return () => window.removeEventListener("storage", updateTheme);
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <SubscriptionProvider>
            <DownloadProvider>
              
                <div className="min-h-screen bg-background">
                  <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/dashboard" element={<Index />} />
                    <Route path="/overview" element={<OverviewPage />} />
                    <Route path="/connect" element={<ConnectPage />} />
                    <Route path="/devices" element={<DevicesPage />} />
                    <Route path="/guest-access" element={<GuestAccessPage />} />
                    <Route path="/security" element={<SecurityPage />} />
                    <Route path="/analytics" element={<AnalyticsPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/subscription" element={<SubscriptionPage />} />
                    <Route path="/export" element={<ExportPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/pulse" element={<PulsePage />} />
                    <Route path="/interactive" element={<InteractivePage />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                  <Toaster />
                  <SonnerToaster />
                  <VoiceWelcome />
                </div>
              
            </DownloadProvider>
          </SubscriptionProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
