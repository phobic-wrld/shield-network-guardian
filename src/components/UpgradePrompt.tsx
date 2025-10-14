import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, Zap, ArrowUpCircle, Wifi } from "lucide-react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useNavigate } from "react-router-dom";

interface UpgradePromptProps {
  deviceCount: number;
  usage: "high" | "medium" | "low";
  currentPlan: string;
}

interface UpgradeReason {
  title: string;
  description: string;
  icon: JSX.Element;
  urgency: "high" | "medium" | "low";
}

export const UpgradePrompt = ({ deviceCount, usage, currentPlan }: UpgradePromptProps) => {
  const { isPremium, planType } = useSubscription();
  const navigate = useNavigate();

  if (isPremium) return null;

  const getUpgradeReason = (): UpgradeReason => {
    if (deviceCount > 10) {
      return {
        title: "Too Many Devices Detected",
        description: `You have ${deviceCount} devices connected. Upgrade to Premium for unlimited device management.`,
        icon: <Users className="text-primary" size={24} />,
        urgency: "high",
      };
    }
    if (usage === "high") {
      return {
        title: "High Network Usage Detected",
        description:
          "Your network is experiencing heavy traffic. Upgrade for AI optimization and priority management.",
        icon: <TrendingUp className="text-primary" size={24} />,
        urgency: "medium",
      };
    }
    return {
      title: "Unlock Premium Features",
      description: "Get AI recommendations, guest WiFi, and advanced security features.",
      icon: <Zap className="text-primary" size={24} />,
      urgency: "low",
    };
  };

  const reason = getUpgradeReason();

  return (
    <Card
      role="alert"
      className={`border-l-4 ${
        reason.urgency === "high"
          ? "border-l-destructive"
          : reason.urgency === "medium"
          ? "border-l-yellow-500"
          : "border-l-primary"
      } bg-gradient-to-r from-primary/5 to-transparent hover:from-primary/10 transition-all duration-300`}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3 text-lg">
          {reason.icon}
          {reason.title}
          {reason.urgency === "high" && (
            <Badge variant="destructive" className="ml-auto">
              Urgent
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{reason.description}</p>

          <div className="flex items-center gap-2 text-sm">
            <Wifi size={16} className="text-muted-foreground" />
            <span>
              Current Plan: <strong>{planType || "Basic"} {currentPlan}</strong>
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={() => navigate("/subscription")}
              className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              <ArrowUpCircle size={16} className="mr-2" />
              Upgrade to Premium
            </Button>
            <Button variant="outline" size="sm" className="text-xs">
              Learn More
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
