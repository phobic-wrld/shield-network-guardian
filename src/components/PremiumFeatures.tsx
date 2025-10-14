import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Crown, Shield, Zap, Eye, BarChart3, Globe, Lock, Wifi,
  Users, Router, AlertTriangle, TrendingUp, BrainCircuit,
  UserCheck, FileText, Palette, MapPin
} from "lucide-react";

const planFeatures = {
  home: [
    { icon: Eye, title: "Device Management", description: "Show all connected devices (IP/MAC)", tier: "basic", category: "📶 Device Management" },
    { icon: Users, title: "Usage Limits", description: "Show device count vs plan limits", tier: "basic", category: "🔌 Usage Limit" },
    { icon: AlertTriangle, title: "Network Alerts", description: "Warn when overloaded or device limit exceeded", tier: "basic", category: "🚨 Alerts" },
    { icon: BarChart3, title: "Speed Monitor", description: "Download, upload, ping with trends", tier: "basic", category: "📊 Speed Monitor" },
    { icon: BrainCircuit, title: "Smart Suggestions", description: "Restart router, remove idle devices", tier: "premium", category: "💡 Smart Suggestions" },
    { icon: TrendingUp, title: "Optimization Tips", description: "ISP/package based improvement suggestions", tier: "premium", category: "⚙️ Optimization Tips" },
    { icon: Wifi, title: "Guest WiFi", description: "Temporary WiFi with auto-expiry", tier: "premium", category: "📱 Guest WiFi" },
    { icon: UserCheck, title: "Auto-Disconnect", description: "Remove inactive or suspicious devices", tier: "premium", category: "🚫 Auto-Disconnect" },
    { icon: BrainCircuit, title: "AI Advice", description: "Router upgrades or ISP switch recommendations", tier: "premium", category: "🧠 AI Advice" },
    { icon: FileText, title: "Weekly Reports", description: "Email/PDF performance + recommendations", tier: "premium", category: "📈 Weekly Reports" },
    { icon: Palette, title: "Premium Theming", description: "Sleek gradient + dark mode", tier: "premium", category: "🎨 Theming" },
    { icon: MapPin, title: "Multi-Location", description: "Manage up to 5 network locations", tier: "premium", category: "🌐 Multi-Location" },
  ]
};

const tierPricing = {
  home: { basic: "Free", premium: "KES 300/month" }
};

export const PremiumFeatures = () => {
  const [planType] = useState("home"); // default plan
  const [subscriptionTier, setSubscriptionTier] = useState("basic");
  const [isLoading, setIsLoading] = useState(true);
  const [isUpgrading, setIsUpgrading] = useState(false);

  const isPremium = subscriptionTier === "premium";
  const currentFeatures = planFeatures[planType];
  const pricing = tierPricing[planType];

  // Fetch user plan from your backend
  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/subscription");
        setSubscriptionTier(res.data.tier || "basic");
      } catch (error) {
        console.error("Failed to fetch subscription:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPlan();
  }, []);

  const handleUpgrade = async () => {
    try {
      setIsUpgrading(true);
      await axios.post("http://localhost:5000/api/subscription/upgrade", { tier: "premium" });
      setSubscriptionTier("premium");
    } catch (error) {
      console.error("Upgrade failed:", error);
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleDemo = () => {
    localStorage.setItem("demo-premium", "true");
    window.location.reload();
  };

  const tierLevels = { free: 0, basic: 1, premium: 2, enterprise: 3 };

  if (isLoading) {
    return <p className="text-center text-muted-foreground">Loading plan details...</p>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className={`${isPremium ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200' : ''}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Crown className={`h-5 w-5 ${isPremium ? 'text-amber-600' : 'text-muted-foreground'}`} />
              <CardTitle className="capitalize">{planType} Plan Features</CardTitle>
              {isPremium && (
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                  Premium Active
                </Badge>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Current Tier</p>
              <p className="font-semibold capitalize">{subscriptionTier}</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {currentFeatures.map((feature, i) => {
          const Icon = feature.icon;
          const hasAccess = tierLevels[subscriptionTier] >= tierLevels[feature.tier];
          return (
            <Card key={i} className={`transition-all ${
              hasAccess ? 'border-green-200 bg-green-50' : 'border-border bg-muted/30'
            }`}>
              <CardContent className="p-4 flex items-start space-x-3">
                <div className={`p-2 rounded-lg ${
                  hasAccess ? 'bg-green-100' : 'bg-muted'
                }`}>
                  <Icon className={`h-4 w-4 ${
                    hasAccess ? 'text-green-600' : 'text-muted-foreground'
                  }`} />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-sm">{feature.title}</h4>
                    <Badge variant={hasAccess ? "default" : "secondary"} className="text-xs capitalize">
                      {hasAccess ? "Active" : feature.tier}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Upgrade Section */}
      <Card className="border-2 border-amber-300">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            Premium Plan
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500">
              {pricing.premium}
            </Badge>
          </CardTitle>
          <CardDescription>Everything in Basic, plus advanced features</CardDescription>
        </CardHeader>
        <CardContent>
          {!isPremium && (
            <div className="space-y-2">
              <Button
                onClick={handleUpgrade}
                disabled={isUpgrading}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              >
                <Crown className="mr-2 h-4 w-4" />
                {isUpgrading ? "Upgrading..." : "Upgrade Now"}
              </Button>
              <Button
                onClick={handleDemo}
                variant="outline"
                className="w-full border-amber-300 text-amber-600 hover:bg-amber-50"
              >
                Try Demo Mode
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
