import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Lock, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import axios from "axios";

interface PremiumGateProps {
  children: React.ReactNode;
  feature?: string;
  fallback?: React.ReactNode;
  title?: string;
  description?: string;
}

export const PremiumGate: React.FC<PremiumGateProps> = ({ 
  children, 
  feature, 
  fallback,
  title = "Premium Feature",
  description = "Upgrade to access this advanced feature"
}) => {
  const [subscription, setSubscription] = useState<{
    isPremium: boolean;
    features: string[];
    planType: string;
    tier: string;
  } | null>(null);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/user/subscription`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSubscription(res.data);
      } catch (err) {
        console.error("Failed to load subscription info", err);
        setSubscription({
          isPremium: false,
          features: [],
          planType: "free",
          tier: "basic",
        });
      }
    };

    fetchSubscription();
  }, []);

  if (!subscription) return null;

  const hasAccess = feature
    ? subscription.features.includes(feature)
    : subscription.isPremium;

  if (hasAccess) return <>{children}</>;
  if (fallback) return <>{fallback}</>;

  return (
    <Card className="relative overflow-hidden border-2 border-dashed border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
      <div className="absolute top-4 right-4">
        <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
          <Crown className="w-3 h-3 mr-1" />
          Premium
        </Badge>
      </div>
      
      <CardHeader className="text-center pb-4">
        <div className="mx-auto w-16 h-16 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center mb-4">
          <Lock className="w-8 h-8 text-white" />
        </div>
        <CardTitle className="text-xl font-bold text-amber-900 dark:text-amber-100">
          {title}
        </CardTitle>
        <CardDescription className="text-amber-700 dark:text-amber-200">
          {description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2 text-sm text-amber-600 dark:text-amber-300">
          <Sparkles className="w-4 h-4" />
          <span>Available in Premium plan</span>
        </div>
        
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Current plan: <span className="capitalize font-medium">{subscription.tier}</span> ({subscription.planType})
          </p>
          
          <div className="flex gap-2 justify-center">
            <Link to="/subscription">
              <Button size="sm" className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
                <Crown className="w-3 h-3 mr-1" />
                Upgrade Now
              </Button>
            </Link>
            
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => {
                localStorage.setItem('demo-premium', 'true');
                window.location.reload();
              }}
              className="border-amber-300 text-amber-600 hover:bg-amber-50 dark:border-amber-600 dark:text-amber-400"
            >
              Try Demo
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
