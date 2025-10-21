import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const BACKEND_URL = "http://192.168.4.1:3000"; // Raspberry Pi backend

export const OptimizationSuggestion = () => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const { toast } = useToast();

  const fetchSuggestions = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/network/optimize`);
      if (!res.ok) throw new Error("Failed to fetch optimization suggestions");

      const data = await res.json();
      setSuggestions(data.suggestions || []);
    } catch (err: any) {
      console.error("Error fetching optimization suggestions:", err);
      toast({
        title: "Fetch Error",
        description: err.message || "Unable to get optimization suggestions",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>🛠 Optimization Suggestions</CardTitle>
      </CardHeader>
      <CardContent>
        {suggestions.length > 0 ? (
          <ul className="list-disc pl-5 space-y-1">
            {suggestions.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        ) : (
          <p>No optimization suggestions at the moment.</p>
        )}
        <div className="mt-3">
          <Button size="sm" variant="outline" onClick={fetchSuggestions}>
            Refresh Suggestions
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
