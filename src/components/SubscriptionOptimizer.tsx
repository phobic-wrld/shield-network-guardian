import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { PremiumGate } from "@/components/PremiumGate";

const plans = [
  { name: "Basic", speed: 10, price: 30, recommended: false },
  { name: "Standard", speed: 25, price: 45, recommended: true },
  { name: "Premium", speed: 50, price: 60, recommended: false },
  { name: "Ultimate", speed: 100, price: 85, recommended: false },
];

interface WeeklyUsage { monday: number; tuesday: number; wednesday: number; thursday: number; friday: number; saturday: number; sunday: number; }

export const SubscriptionOptimizer = () => {
  const [selectedPlan, setSelectedPlan] = useState("Standard");
  const [stats, setStats] = useState<WeeklyUsage>({
    monday: 0, tuesday: 0, wednesday: 0, thursday: 0, friday: 0, saturday: 0, sunday: 0,
  });
  const { toast } = useToast();
  const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8080";

  // WebSocket
  useEffect(() => {
    const ws = new WebSocket(WS_URL);

    ws.onopen = () => console.log("✅ Connected to subscription optimizer WebSocket");
    ws.onmessage = (e) => {
      try { const data = JSON.parse(e.data); if (data.type === "weekly_usage") setStats(data.stats); } 
      catch (err) { console.error(err); }
    };
    ws.onclose = () => console.warn("⚠️ WebSocket closed");

    return () => ws.close();
  }, []);

  const handlePlanChange = (plan: string) => {
    setSelectedPlan(plan);
    toast({ title: "Plan selected", description: `You've selected the ${plan} plan.` });
  };

  const usageData = [
    { day: "Mon", usage: stats.monday },
    { day: "Tue", usage: stats.tuesday },
    { day: "Wed", usage: stats.wednesday },
    { day: "Thu", usage: stats.thursday },
    { day: "Fri", usage: stats.friday },
    { day: "Sat", usage: stats.saturday },
    { day: "Sun", usage: stats.sunday },
  ];

  const currentSpeed = plans.find(p => p.name === selectedPlan)?.speed || 25;
  const maxUsage = Math.max(...usageData.map(d => d.usage));
  const utilization = Math.round((maxUsage / currentSpeed) * 100);

  return (
    <PremiumGate feature="optimization-tips" description="Optimize your internet plan based on usage patterns with Premium subscription.">
      <Card>
        <CardHeader>
          <CardTitle>Subscription Optimizer</CardTitle>
          <CardDescription>Find the right plan for your usage</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={usageData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" />
                <YAxis label={{ value: "Mbps", angle: -90, position: "insideLeft" }} width={40} />
                <Tooltip />
                <Bar dataKey="usage" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {utilization > 80 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
              <p className="font-medium">You've exceeded {utilization}% of your plan capacity.</p>
              <p className="text-sm mt-1">Consider upgrading your plan for better performance.</p>
            </div>
          )}

          {utilization < 50 && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
              <p className="font-medium">You're using only {utilization}% of your plan capacity.</p>
              <p className="text-sm mt-1">You might save money with a lower-tier plan.</p>
            </div>
          )}

          <div>
            <h3 className="mb-3 font-semibold">Available Plans</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {plans.map(plan => (
                <div key={plan.name} onClick={() => handlePlanChange(plan.name)}
                  className={`flex flex-col border rounded-lg p-4 cursor-pointer transition-all
                  ${selectedPlan === plan.name ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}
                  ${plan.recommended ? "ring-2 ring-primary ring-offset-2" : ""}`}>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">{plan.name}</h4>
                    {plan.recommended && <span className="text-xs font-medium px-2 py-0.5 bg-primary text-primary-foreground rounded-full">Recommended</span>}
                  </div>
                  <span className="text-2xl font-bold">${plan.price}</span>
                  <span className="text-sm text-muted-foreground">per month</span>
                  <div className="mt-2 text-sm">{plan.speed} Mbps</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <Button className="flex items-center space-x-2"><span>Upgrade Plan</span><ArrowRight size={16} /></Button>
          </div>
        </CardContent>
      </Card>
    </PremiumGate>
  );
};
