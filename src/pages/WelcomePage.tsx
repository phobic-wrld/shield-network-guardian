
import { useEffect, useState } from "react";
import  DashboardLayout  from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Shield, Wifi, Users, BarChart3, Settings, CheckCircle, Lock, Zap } from "lucide-react";
import { toast } from "sonner";

const WelcomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);

  const welcomeSteps = [
    {
      icon: Shield,
      title: "Initializing Shield",
      description: "Securing your network gateway...",
      action: "Continue"
    },
    {
      icon: Wifi,
      title: "Collecting Network Data",
      description: "Scanning for connected devices and analyzing traffic...",
      action: "Continue"
    },
    {
      icon: Lock,
      title: "Securing Users",
      description: "Implementing security protocols and access controls...",
      action: "Continue"
    },
    {
      icon: Zap,
      title: "Optimizing Performance",
      description: "Fine-tuning network performance and monitoring...",
      action: "Continue"
    },
    {
      icon: CheckCircle,
      title: "Welcome to Shield",
      description: "Your network guardian is ready! All systems are operational.",
      action: "Enter Dashboard"
    }
  ];

  useEffect(() => {
    // Show welcome toast
    toast.success(`Welcome back, ${user?.email?.split('@')[0] || 'Guardian'}!`, {
      description: "Shield Network Guardian is initializing...",
      duration: 3000,
    });

    // Auto-progress through steps with animation
    const timer = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < welcomeSteps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(timer);
          setIsAnimating(false);
          return prev;
        }
      });
    }, 2500);

    return () => clearInterval(timer);
  }, [user]);

  const handleAction = () => {
    if (currentStep === welcomeSteps.length - 1) {
      navigate("/");
    } else {
      setCurrentStep(prev => Math.min(prev + 1, welcomeSteps.length - 1));
    }
  };

  const currentStepData = welcomeSteps[currentStep];
  const StepIcon = currentStepData.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center relative overflow-hidden">
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto px-6">
        <Card className="w-full bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader className="text-center">
            <div className={`mx-auto w-20 h-20 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center mb-4 transition-all duration-500 ${isAnimating ? 'animate-pulse' : ''}`}>
              <StepIcon size={40} className="text-white" />
            </div>
            <CardTitle className="text-2xl text-white animate-fade-in">{currentStepData.title}</CardTitle>
            <CardDescription className="text-blue-200 animate-fade-in delay-200">
              {currentStepData.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Progress indicator */}
            <div className="flex justify-center space-x-2">
              {welcomeSteps.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index <= currentStep 
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-400 scale-110' 
                      : 'bg-white/30'
                  }`}
                />
              ))}
            </div>
            
            {/* Progress steps */}
            <div className="space-y-3 max-h-48 overflow-hidden">
              {welcomeSteps.slice(0, currentStep + 1).map((step, index) => {
                const IconComponent = step.icon;
                return (
                  <div 
                    key={index} 
                    className={`flex items-center space-x-3 transition-all duration-500 ${
                      index === currentStep ? 'animate-fade-in' : ''
                    }`}
                  >
                    <div className={`p-2 rounded-full ${
                      index < currentStep 
                        ? 'bg-green-500/20' 
                        : index === currentStep 
                        ? 'bg-blue-500/20 animate-pulse' 
                        : 'bg-gray-500/20'
                    }`}>
                      {index < currentStep ? (
                        <CheckCircle size={16} className="text-green-400" />
                      ) : (
                        <IconComponent size={16} className={`${
                          index === currentStep ? 'text-blue-400' : 'text-gray-400'
                        }`} />
                      )}
                    </div>
                    <span className={`text-sm transition-colors ${
                      index <= currentStep ? 'text-white' : 'text-gray-400'
                    }`}>
                      {step.title}
                    </span>
                  </div>
                );
              })}
            </div>

            {!isAnimating && (
              <Button 
                onClick={handleAction} 
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 animate-fade-in"
              >
                {currentStepData.action}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WelcomePage;
