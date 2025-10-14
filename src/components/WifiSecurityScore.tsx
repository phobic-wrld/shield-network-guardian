import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface SecurityFactorProps {
  name: string;
  score: number;
  maxScore: number;
  description: string;
}

const SecurityFactor: React.FC<SecurityFactorProps> = ({
  name,
  score,
  maxScore,
  description,
}) => {
  const percentage = (score / maxScore) * 100;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="font-medium">{name}</span>
        <span>{score}/{maxScore}</span>
      </div>
      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            percentage >= 75
              ? "bg-green-500"
              : percentage >= 50
              ? "bg-yellow-500"
              : percentage >= 25
              ? "bg-orange-500"
              : "bg-red-500"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
};

interface WifiSecurityScoreProps {
  passwordStrength: number; // 0–4
  unknownDevices: number;   // number of unknown devices
  guestAccessFrequency: number; // 0–5
  securePasswordUsage: boolean;  // WPA3 enabled?
}

export const WifiSecurityScore: React.FC<WifiSecurityScoreProps> = ({
  passwordStrength,
  unknownDevices,
  guestAccessFrequency,
  securePasswordUsage,
}) => {
  // Calculate individual scores
  const passwordScore = passwordStrength * 10; // 0–40
  const unknownDevicesScore = Math.max(0, 20 - unknownDevices * 5); // 0–20
  const guestAccessScore = Math.max(0, 20 - guestAccessFrequency * 4); // 0–20
  const securePasswordUsageScore = securePasswordUsage ? 20 : 0; // 0 or 20

  const totalScore =
    passwordScore + unknownDevicesScore + guestAccessScore + securePasswordUsageScore;

  const starRating = Math.round((totalScore / 100) * 5);

  const getSuggestions = (): string[] => {
    const tips: string[] = [];

    if (passwordScore < 30)
      tips.push(
        "Use a stronger WiFi password with a mix of letters, numbers, and symbols."
      );
    if (unknownDevicesScore < 15)
      tips.push("Check connected devices and remove unauthorized ones.");
    if (guestAccessScore < 15)
      tips.push("Limit guest access usage and shorten expiry times.");
    if (!securePasswordUsage)
      tips.push("Enable WPA3 for better encryption.");

    if (tips.length === 0)
      tips.push("Your network security is strong. Keep monitoring regularly.");

    return tips;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>WiFi Security Score</span>
          <Badge
            className={cn(
              "text-white",
              totalScore >= 80
                ? "bg-green-600"
                : totalScore >= 60
                ? "bg-yellow-600"
                : "bg-red-600"
            )}
          >
            {totalScore}/100
          </Badge>
        </CardTitle>
        <CardDescription>Your network security rating</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Stars */}
        <div className="flex justify-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={28}
              className={i < starRating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
            />
          ))}
        </div>

        {/* Security Factors */}
        <div className="space-y-4 mt-4">
          <SecurityFactor
            name="Password Strength"
            score={passwordStrength}
            maxScore={4}
            description="Strong passwords protect your network from attacks."
          />
          <SecurityFactor
            name="Unknown Devices"
            score={Math.max(0, 4 - unknownDevices)}
            maxScore={4}
            description="Fewer unknown devices improve security."
          />
          <SecurityFactor
            name="Guest Access Management"
            score={Math.max(0, 5 - guestAccessFrequency)}
            maxScore={5}
            description="Limited guest access reduces risks."
          />
          <SecurityFactor
            name="Security Protocol"
            score={securePasswordUsage ? 1 : 0}
            maxScore={1}
            description="Using WPA3 ensures strong encryption."
          />
        </div>

        {/* Suggestions */}
        <div className="mt-4 p-3 bg-muted rounded-md">
          <h4 className="font-medium mb-2">Security Tips</h4>
          <ul className="text-sm space-y-1 list-disc pl-5">
            {getSuggestions().map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
