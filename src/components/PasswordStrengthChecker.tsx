
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { checkPasswordStrength, generateStrongPassword } from "@/utils/passwordUtils";
import { Eye, EyeOff, RefreshCw } from "lucide-react";

export const PasswordStrengthChecker = () => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");
  
  const passwordStrength = checkPasswordStrength(password);
  
  const getScoreColor = (score: number) => {
    switch(score) {
      case 0: return "bg-red-500";
      case 1: return "bg-orange-500";
      case 2: return "bg-yellow-500";
      case 3: return "bg-green-500";
      case 4: return "bg-green-700";
      default: return "bg-gray-300";
    }
  };
  
  const getScoreLabel = (score: number) => {
    switch(score) {
      case 0: return "Very Weak";
      case 1: return "Weak";
      case 2: return "Medium";
      case 3: return "Strong";
      case 4: return "Very Strong";
      default: return "No Password";
    }
  };
  
  const handleGeneratePassword = () => {
    const newPassword = generateStrongPassword();
    setGeneratedPassword(newPassword);
    setPassword(newPassword);
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>WiFi Password Strength Checker</CardTitle>
        <CardDescription>
          Check the security of your WiFi password
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password to check"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                />
                <button 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleGeneratePassword}
              title="Generate strong password"
            >
              <RefreshCw size={18} />
            </Button>
          </div>
          
          {generatedPassword && (
            <div className="p-3 mt-2 text-sm bg-muted rounded-md">
              <p className="font-medium">Generated Password:</p>
              <p className="font-mono">{generatedPassword}</p>
            </div>
          )}
        </div>
        
        {password && (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Strength:</span>
                <span className="font-medium">{getScoreLabel(passwordStrength.score)}</span>
              </div>
              <Progress 
                value={(passwordStrength.score + 1) * 20} 
                className={getScoreColor(passwordStrength.score)}
              />
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium">Estimated crack time:</p>
              <p className="text-sm">{passwordStrength.crackTimeDisplay}</p>
            </div>
            
            {passwordStrength.feedback.warning && (
              <div className="text-sm text-orange-600 dark:text-orange-400">
                <p className="font-medium">Warning:</p>
                <p>{passwordStrength.feedback.warning}</p>
              </div>
            )}
            
            {passwordStrength.feedback.suggestions.length > 0 && (
              <div className="text-sm">
                <p className="font-medium">Suggestions to improve:</p>
                <ul className="list-disc pl-5 space-y-1">
                  {passwordStrength.feedback.suggestions.map((suggestion, i) => (
                    <li key={i}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
