
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, Eye, EyeOff, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

interface PasswordAnalysis {
  score: number;
  strength: string;
  suggestions: string[];
  checks: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    numbers: boolean;
    special: boolean;
    common: boolean;
  };
}

export const PasswordStrengthTool = () => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [analysis, setAnalysis] = useState<PasswordAnalysis | null>(null);

  const commonPasswords = [
    "password", "123456", "password123", "admin", "qwerty", 
    "letmein", "welcome", "monkey", "1234567890", "password1"
  ];

  const analyzePassword = (pwd: string): PasswordAnalysis => {
    const checks = {
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      numbers: /\d/.test(pwd),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
      common: !commonPasswords.includes(pwd.toLowerCase())
    };

    const checksPassed = Object.values(checks).filter(Boolean).length;
    const score = Math.min((checksPassed / 6) * 100, 100);

    let strength = "Very Weak";
    if (score >= 80) strength = "Very Strong";
    else if (score >= 60) strength = "Strong";
    else if (score >= 40) strength = "Moderate";
    else if (score >= 20) strength = "Weak";

    const suggestions: string[] = [];
    if (!checks.length) suggestions.push("Use at least 8 characters");
    if (!checks.uppercase) suggestions.push("Add uppercase letters (A-Z)");
    if (!checks.lowercase) suggestions.push("Add lowercase letters (a-z)");
    if (!checks.numbers) suggestions.push("Include numbers (0-9)");
    if (!checks.special) suggestions.push("Add special characters (!@#$%^&*)");
    if (!checks.common) suggestions.push("Avoid common passwords");

    return { score, strength, suggestions, checks };
  };

  useEffect(() => {
    if (password) {
      setAnalysis(analyzePassword(password));
    } else {
      setAnalysis(null);
    }
  }, [password]);

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case "Very Strong": return "text-green-600";
      case "Strong": return "text-blue-600";
      case "Moderate": return "text-yellow-600";
      case "Weak": return "text-orange-600";
      default: return "text-red-600";
    }
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-blue-500";
    if (score >= 40) return "bg-yellow-500";
    if (score >= 20) return "bg-orange-500";
    return "bg-red-500";
  };

  const CheckItem = ({ check, label }: { check: boolean; label: string }) => (
    <div className="flex items-center gap-2">
      {check ? (
        <CheckCircle size={16} className="text-green-500" />
      ) : (
        <XCircle size={16} className="text-red-500" />
      )}
      <span className={check ? "text-green-700" : "text-red-700"}>{label}</span>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="text-purple-500" />
          Password Strength Checker
        </CardTitle>
        <CardDescription>
          Test your WiFi password strength and get security recommendations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="password-input">Enter WiFi Password</Label>
          <div className="relative">
            <Input
              id="password-input"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your WiFi password to analyze"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {analysis && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Password Strength</span>
                <Badge 
                  variant="outline" 
                  className={`${getStrengthColor(analysis.strength)} border-current`}
                >
                  {analysis.strength}
                </Badge>
              </div>
              <div className="relative">
                <Progress value={analysis.score} className="h-3" />
                <div 
                  className={`absolute top-0 left-0 h-3 rounded-full transition-all duration-300 ${getProgressColor(analysis.score)}`}
                  style={{ width: `${analysis.score}%` }}
                />
              </div>
              <div className="text-center text-sm text-gray-600 mt-1">
                {analysis.score.toFixed(0)}% Secure
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Security Checklist</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <CheckItem check={analysis.checks.length} label="At least 8 characters" />
                <CheckItem check={analysis.checks.uppercase} label="Uppercase letters" />
                <CheckItem check={analysis.checks.lowercase} label="Lowercase letters" />
                <CheckItem check={analysis.checks.numbers} label="Numbers" />
                <CheckItem check={analysis.checks.special} label="Special characters" />
                <CheckItem check={analysis.checks.common} label="Not a common password" />
              </div>
            </div>

            {analysis.suggestions.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-2">Suggestions to improve your password:</div>
                  <ul className="list-disc list-inside space-y-1">
                    {analysis.suggestions.map((suggestion, index) => (
                      <li key={index} className="text-sm">{suggestion}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {analysis.score >= 80 && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700">
                  Excellent! Your password is very strong and provides good security for your network.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
