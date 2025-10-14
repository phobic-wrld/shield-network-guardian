import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, Crown, Shield, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";

interface Feature {
  name: string;
  basic: boolean | string;
  premium: boolean | string;
  description?: string;
}

interface SubscriptionData {
  planType: "home" | "school" | "work";
  tier: "basic" | "premium";
}

const PlanComparison = () => {
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSubscription = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/subscription");
      setSubscription(res.data);
    } catch (error) {
      console.error("Failed to fetch subscription:", error);
      toast({
        title: "Error loading subscription",
        description: "Could not load your plan data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  const upgradeSubscription = async (tier: "basic" | "premium") => {
    try {
      const res = await axios.post("http://localhost:5000/api/subscription/upgrade", { tier });
      setSubscription(res.data);
      toast({
        title: "Subscription updated",
        description: `You are now on the ${tier} plan.`,
      });
    } catch (error) {
      toast({
        title: "Upgrade failed",
        description: "There was a problem updating your subscription.",
        variant: "destructive",
      });
    }
  };

  const isPremium = subscription?.tier === "premium";
  const planType = subscription?.planType || "home";

  const features: Feature[] = [
    { name: "Device Management", basic: "Up to 10 devices", premium: "Unlimited devices", description: "Monitor and manage connected devices on your network" },
    { name: "Network Monitoring", basic: true, premium: true, description: "Real-time network performance monitoring" },
    { name: "Security Scanning", basic: "Basic scans", premium: "Advanced AI-powered threat detection", description: "Protect your network from security threats" },
    { name: "Bandwidth Analysis", basic: "Daily reports", premium: "Real-time analytics with insights", description: "Track bandwidth usage and optimize performance" },
    { name: "Guest Network", basic: false, premium: "Smart guest controls with time limits", description: "Secure guest access with advanced controls" },
    { name: "Parental Controls", basic: "Basic filtering", premium: "Advanced controls with scheduling", description: "Comprehensive content filtering and time management" },
    { name: "Custom Alerts", basic: "Basic notifications", premium: "Smart AI-powered alerts", description: "Get notified about important network events" },
    { name: "Premium Support", basic: false, premium: "24/7 priority support", description: "Get help when you need it most" },
    { name: "API Access", basic: false, premium: "Full REST API access", description: "Integrate with other systems and services" },
    { name: "Premium UI Theme", basic: false, premium: "Beautiful gradient themes", description: "Enhanced visual experience with premium styling" }
  ];

  const renderFeatureValue = (value: boolean | string) => {
    if (typeof value === "boolean") {
      return value ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-red-400" />;
    }
    return <span className="text-sm font-medium text-foreground">{value}</span>;
  };

  const getPlanPrice = (plan: "basic" | "premium") => {
    const prices = {
      home: { basic: "Free", premium: "KES 300/month" },
      school: { basic: "Free", premium: "KES 1,500/month" },
      work: { basic: "Free", premium: "KES 3,000/month" }
    };
    return prices[planType][plan];
  };

  if (loading) {
    return <div className="text-center text-muted-foreground">Loading plans...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2 text-foreground">Plan Comparison</h2>
        <p className="text-muted-foreground">Choose the plan that fits your network management needs</p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Basic Plan */}
        <Card className="relative border-border bg-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center text-foreground">
                  <Shield className="mr-2 h-5 w-5 text-primary" />
                  Basic Plan
                </CardTitle>
                <CardDescription>Essential network monitoring features</CardDescription>
              </div>
              <Badge variant="secondary">Free</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-4 text-foreground">{getPlanPrice("basic")}</div>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => upgradeSubscription("basic")}
              disabled={!isPremium}
            >
              {!isPremium ? "Current Plan" : "Downgrade to Basic"}
            </Button>
          </CardContent>
        </Card>

        {/* Premium Plan */}
        <Card className="relative border-primary/20 bg-gradient-to-br from-card to-primary/5">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <Badge className="bg-gradient-to-r from-primary to-accent text-primary-foreground">
              <Crown className="w-3 h-3 mr-1" />
              Most Popular
            </Badge>
          </div>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center text-foreground">
                  <Zap className="mr-2 h-5 w-5 text-primary" />
                  Premium Plan
                </CardTitle>
                <CardDescription>Advanced features for power users</CardDescription>
              </div>
              <Badge className="bg-gradient-to-r from-primary to-accent text-primary-foreground">
                {getPlanPrice("premium")}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-4 text-foreground">{getPlanPrice("premium")}</div>
            <Button
              className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground"
              onClick={() => upgradeSubscription("premium")}
              disabled={isPremium}
            >
              {isPremium ? "Current Plan" : "Start Premium Trial"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Feature Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Detailed Feature Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4 font-medium text-foreground">Feature</th>
                  <th className="text-center py-2 px-4 font-medium text-foreground">Basic</th>
                  <th className="text-center py-2 px-4 font-medium text-foreground">Premium</th>
                </tr>
              </thead>
              <tbody>
                {features.map((feature, index) => (
                  <tr key={index} className="border-b border-border/50">
                    <td className="py-3 px-4">
                      <div>
                        <span className="font-medium text-foreground">{feature.name}</span>
                        {feature.description && (
                          <p className="text-sm text-muted-foreground mt-1">{feature.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="text-center py-3 px-4">{renderFeatureValue(feature.basic)}</td>
                    <td className="text-center py-3 px-4">{renderFeatureValue(feature.premium)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlanComparison;
