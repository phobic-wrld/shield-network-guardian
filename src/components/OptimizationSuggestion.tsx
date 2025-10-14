import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Signal, Wifi, Loader2 } from "lucide-react";
import { useState } from "react";
import axios from "axios"; 
import { useSubscription } from "@/contexts/SubscriptionContext";

interface OptimizationSuggestionProps {
  title: string;
  description: string;
  type: "warning" | "info";
  actionLabel: string;
  endpoint?: string; // optional backend endpoint
  onAction?: () => void;
}

export const OptimizationSuggestion = ({
  title,
  description,
  type,
  actionLabel,
  endpoint = "/network/optimize", // default endpoint
  onAction
}: OptimizationSuggestionProps) => {
  const { toast } = useToast();
  const { isPremium } = useSubscription();
  const [isOptimizing, setIsOptimizing] = useState(false);

  // ✅ Use env variable for API base URL
  const API_BASE = import.meta.env.VITE_API_URL;

  const handleAction = async () => {
    setIsOptimizing(true);
    try {
      const response = await axios.post(`${API_BASE}${endpoint}`, {
        title,
        type,
      });

      if (onAction) onAction();

      toast({
        title: "Optimization complete",
        description: response.data?.message || `${title} has been configured successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Error applying optimization",
        description:
          error.response?.data?.message || "Something went wrong while optimizing the network.",
        variant: "destructive",
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div
      className={`border rounded-lg p-4 flex justify-between items-center animate-fade-in hover:border-primary/50 transition-all duration-300 hover:shadow-md ${
        isOptimizing ? "optimizing" : ""
      } ${isPremium ? "premium-card" : "basic-card"}`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`h-10 w-10 rounded-full transition-transform hover:scale-105 ${
            type === "warning" ? "bg-status-warning/20" : "bg-status-safe/20"
          } flex items-center justify-center ${
            type === "warning" ? "text-status-warning" : "text-status-safe"
          }`}
        >
          {isOptimizing ? (
            <Loader2 size={20} className="animate-spin" />
          ) : type === "warning" ? (
            <Signal size={20} className="animate-pulse-soft" />
          ) : (
            <Wifi size={20} className="animate-pulse-soft" />
          )}
        </div>

        <div>
          <p className="font-medium transition-colors hover:text-primary">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
          {isOptimizing && (
            <p className="text-xs text-primary mt-1 animate-pulse">
              Optimizing network settings...
            </p>
          )}
        </div>
      </div>

      <Button
        variant={type === "warning" ? "default" : "outline"}
        className={`transition-all duration-300 hover:scale-105 ${
          isPremium ? "premium-button" : "basic-button"
        }`}
        onClick={handleAction}
        disabled={isOptimizing}
      >
        {isOptimizing ? (
          <>
            <Loader2 size={16} className="animate-spin mr-2" />
            Optimizing...
          </>
        ) : (
          actionLabel
        )}
      </Button>
    </div>
  );
};
