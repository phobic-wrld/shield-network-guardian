import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { 
  Home, School, Building2, Users, Shield, Wifi, BarChart3, Clock,
  BookOpen, Briefcase, Filter, TrendingUp, UserCheck, AlertTriangle, Smartphone
} from "lucide-react";
import axios from "axios";

export function PlanDashboard() {
  const { planType, isPremium, setPlanType } = useSubscription();
  const [planData, setPlanData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // ✅ Fetch plan data from your backend
  useEffect(() => {
    const fetchPlanData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`http://localhost:5000/api/plans/${planType}`);
        setPlanData(response.data);
      } catch (error) {
        console.error("Error fetching plan data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlanData();
  }, [planType]);

  const handleUpgrade = async () => {
    try {
      await axios.post(`http://localhost:5000/api/subscription/upgrade`, { planType });
      alert("Successfully upgraded to Premium!");
    } catch (error) {
      console.error("Upgrade failed:", error);
    }
  };

  if (loading || !planData) {
    return <p className="text-center text-muted-foreground">Loading plan data...</p>;
  }

  const IconMap = {
    home: Home,
    school: School,
    work: Building2,
  };

  const PlanIcon = IconMap[planType];

  return (
    <div className="space-y-6">
      {/* Plan Selection */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {Object.keys(IconMap).map((key) => {
          const Icon = IconMap[key as keyof typeof IconMap];
          return (
            <Button
              key={key}
              variant={planType === key ? "default" : "outline"}
              className="h-auto p-4 flex flex-col items-center space-y-2"
              onClick={() => setPlanType(key as any)}
            >
              <Icon className="h-6 w-6" />
              <span className="text-sm font-medium">
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </span>
            </Button>
          );
        })}
      </div>

      {/* Plan Header */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <PlanIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">{planData.title}</CardTitle>
                <CardDescription>{planData.description}</CardDescription>
              </div>
            </div>
            <Badge variant={isPremium ? "default" : "secondary"}>
              {isPremium ? "Premium" : "Basic"}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {planData.stats.map((stat: any, index: number) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <stat.icon className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Features */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Current Features</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {planData.features.basic.map((feature: string, index: number) => (
                <li key={index} className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>{isPremium ? "Premium Features" : "Upgrade to Premium"}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {planData.features.premium.map((feature: string, index: number) => (
                <li key={index} className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${isPremium ? 'bg-blue-500' : 'bg-gray-300'}`} />
                  <span className={`text-sm ${!isPremium ? 'text-muted-foreground' : ''}`}>
                    {feature}
                  </span>
                </li>
              ))}
            </ul>
            {!isPremium && (
              <Button className="w-full mt-4" variant="outline" onClick={handleUpgrade}>
                Upgrade to Premium
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Recent Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {planData.activities.map((activity: string, index: number) => (
              <div key={index} className="flex items-center space-x-3 p-2 rounded-lg bg-muted/50">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span className="text-sm">{activity}</span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {index === 0 ? "Just now" : `${index * 15} minutes ago`}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
