import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AboutSection } from "@/components/AboutSection";
import PlanComparison from "@/components/PlanComparison";
import { PlanQuestionnaire } from "@/components/PlanQuestionnaire";
import { 
  Shield, 
  Home, 
  School, 
  Building2, 
  ArrowRight, 
  CheckCircle, 
  Star,
  Zap,
  Users,
  BarChart3,
  Wifi,
  Lock,
  Info,
  DollarSign,
  Activity,
  Database,
  Eye,
  GraduationCap,
  Crown
} from "lucide-react";

type PlanType = 'home' | 'school' | 'work';

const LandingPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);

  const loadingSteps = [
    { icon: Database, text: "Loading Network Resources...", delay: 500 },
    { icon: Shield, text: "Securing Connection...", delay: 1000 },
    { icon: Activity, text: "Analyzing Network Traffic...", delay: 1500 },
    { icon: Eye, text: "Monitoring Devices...", delay: 2000 },
    { icon: Lock, text: "Establishing Security Protocols...", delay: 2500 },
    { icon: CheckCircle, text: "Welcome to Shield Network Guardian!", delay: 3000 }
  ];

  const [currentStep, setCurrentStep] = useState(-1);

  const handleGetStarted = (planType?: PlanType) => {
    setIsLoading(true);
    setCurrentStep(0);
    
    loadingSteps.forEach((step, index) => {
      setTimeout(() => {
        setCurrentStep(index);
        if (index === loadingSteps.length - 1) {
          setTimeout(() => {
            navigate("/dashboard", { state: { selectedPlan: planType || 'home' } });
          }, 1000);
        }
      }, step.delay);
    });
  };

  const plans = {
    home: {
      icon: Home,
      title: "🏠 Home",
      subtitle: "Smart WiFi Guardian for Families",
      description: "Perfect for home networks with multiple devices and family members.",
      features: {
        basic: [
          "Show all connected devices (IP/MAC)",
          "Device count vs plan limits",
          "Network overload alerts", 
          "Speed monitoring with trends",
          "Light blue theme"
        ],
        premium: [
          "Smart restart suggestions",
          "ISP-based optimization tips", 
          "Guest WiFi with auto-expiry",
          "Auto-disconnect inactive devices",
          "AI router upgrade advice",
          "Weekly performance reports",
          "Premium gradient theme + dark mode"
        ]
      },
      pricing: {
        basic: "Free",
        premium: "KES 300/month"
      }
    },
    school: {
      icon: School,
      title: "🎓 School",
      subtitle: "Network Management for Education",
      description: "Designed for schools, libraries, and educational institutions.",
      features: {
        basic: [
          "Student device monitoring",
          "Bandwidth allocation tracking",
          "Basic content filtering alerts",
          "Network performance reports"
        ],
        premium: [
          "Advanced content filtering",
          "Classroom network segmentation", 
          "Student usage analytics",
          "Automated access controls",
          "Educational resource optimization",
          "Multi-campus support"
        ]
      },
      pricing: {
        basic: "Free",
        premium: "KES 1,500/month"
      }
    },
    work: {
      icon: Building2,
      title: "💼 Work",
      subtitle: "Enterprise Network Security",
      description: "Built for businesses, offices, and professional environments.",
      features: {
        basic: [
          "Employee device tracking",
          "Basic security monitoring",
          "Bandwidth usage reports",
          "Network uptime tracking"
        ],
        premium: [
          "Advanced threat detection",
          "VPN integration support",
          "Employee productivity insights",
          "Multi-location management",
          "Compliance reporting",
          "24/7 enterprise support"
        ]
      },
      pricing: {
        basic: "Free",
        premium: "KES 3,000/month"
      }
    }
  };

  if (showQuestionnaire) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 py-12 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center mr-4">
                <Shield size={32} className="text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white">Find Your Perfect Plan</h1>
            </div>
            <p className="text-blue-200">Answer a few questions to get a personalized recommendation</p>
          </div>
          
          <PlanQuestionnaire
            onComplete={handleGetStarted}
            onBack={() => setShowQuestionnaire(false)}
          />
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center relative overflow-hidden">
        {/* Background Animation */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        <div className="relative z-10 text-center max-w-2xl mx-auto px-6">
          {/* Animated Logo */}
          <div className="mx-auto w-32 h-32 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-3xl flex items-center justify-center mb-8 shadow-2xl animate-pulse-soft">
            <Shield size={64} className="text-white animate-float" />
          </div>

          {/* Loading Steps */}
          <div className="space-y-6">
            {loadingSteps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = index <= currentStep;
              const isCurrent = index === currentStep;
              
              return (
                <div
                  key={index}
                  className={`flex items-center justify-center space-x-4 transition-all duration-500 ${
                    isActive ? 'opacity-100 scale-100' : 'opacity-30 scale-95'
                  }`}
                >
                  <div className={`p-3 rounded-full ${isCurrent ? 'bg-cyan-400 animate-pulse' : 'bg-white/20'}`}>
                    <StepIcon 
                      size={24} 
                      className={`${isCurrent ? 'text-slate-900' : 'text-white'} transition-colors duration-300`} 
                    />
                  </div>
                  <span className={`text-lg font-medium ${isCurrent ? 'text-cyan-300' : 'text-white'} transition-colors duration-300`}>
                    {step.text}
                  </span>
                  {isActive && index < currentStep && (
                    <CheckCircle size={20} className="text-green-400 animate-fade-in" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Progress Bar */}
          <div className="mt-8 w-full bg-white/10 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-cyan-400 h-2 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${((currentStep + 1) / loadingSteps.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedPlan) {
    const plan = plans[selectedPlan];
    const PlanIcon = plan.icon;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <Button 
              variant="ghost" 
              onClick={() => setSelectedPlan(null)}
              className="text-white hover:bg-white/10 mb-6"
            >
              ← Back to Plans
            </Button>
            
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center mr-4">
                <PlanIcon size={32} className="text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-4xl font-bold text-white">{plan.title}</h1>
                <p className="text-xl text-blue-200">{plan.subtitle}</p>
              </div>
            </div>
            
            <p className="text-lg text-blue-200 max-w-2xl mx-auto">{plan.description}</p>
          </div>

          {/* Pricing Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Basic Plan */}
            <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl">Basic Plan</CardTitle>
                  <Badge variant="secondary" className="bg-blue-500/20 text-blue-200">
                    {plan.pricing.basic}
                  </Badge>
                </div>
                <CardDescription className="text-blue-200">
                  Essential network monitoring features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {plan.features.basic.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle size={16} className="text-green-400 mt-1 mr-3 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  onClick={() => handleGetStarted(selectedPlan)}
                  className="w-full mt-6 bg-blue-500 hover:bg-blue-600"
                >
                  Start Free
                </Button>
              </CardContent>
            </Card>

            {/* Premium Plan */}
            <Card className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-md border-amber-400/30 text-white relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <Crown className="text-amber-400" size={24} />
              </div>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl">Premium Plan</CardTitle>
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500">
                    {plan.pricing.premium}
                  </Badge>
                </div>
                <CardDescription className="text-amber-100">
                  Advanced features with AI-powered insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <p className="text-sm text-amber-200 mb-2">Everything in Basic, plus:</p>
                </div>
                <ul className="space-y-3">
                  {plan.features.premium.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Star size={16} className="text-amber-400 mt-1 mr-3 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  onClick={() => handleGetStarted(selectedPlan)}
                  className="w-full mt-6 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                >
                  <Crown className="mr-2" size={16} />
                  Start Premium Trial
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Feature Breakdown */}
          <Card className="bg-white/5 backdrop-blur-md border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-center">Detailed Feature Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-white">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="text-left py-3 px-4">Feature</th>
                      <th className="text-center py-3 px-4">Basic</th>
                      <th className="text-center py-3 px-4">Premium</th>
                    </tr>
                  </thead>
                  <tbody className="space-y-2">
                    <tr className="border-b border-white/10">
                      <td className="py-3 px-4">Device List</td>
                      <td className="text-center py-3 px-4"><CheckCircle className="text-green-400 mx-auto" size={16} /></td>
                      <td className="text-center py-3 px-4"><CheckCircle className="text-green-400 mx-auto" size={16} /></td>
                    </tr>
                    <tr className="border-b border-white/10">
                      <td className="py-3 px-4">Speed Test</td>
                      <td className="text-center py-3 px-4"><CheckCircle className="text-green-400 mx-auto" size={16} /></td>
                      <td className="text-center py-3 px-4"><CheckCircle className="text-green-400 mx-auto" size={16} /></td>
                    </tr>
                    <tr className="border-b border-white/10">
                      <td className="py-3 px-4">Smart Alerts</td>
                      <td className="text-center py-3 px-4">❌</td>
                      <td className="text-center py-3 px-4"><CheckCircle className="text-green-400 mx-auto" size={16} /></td>
                    </tr>
                    <tr className="border-b border-white/10">
                      <td className="py-3 px-4">Guest WiFi Access</td>
                      <td className="text-center py-3 px-4">❌</td>
                      <td className="text-center py-3 px-4"><CheckCircle className="text-green-400 mx-auto" size={16} /></td>
                    </tr>
                    <tr className="border-b border-white/10">
                      <td className="py-3 px-4">AI Recommendations</td>
                      <td className="text-center py-3 px-4">❌</td>
                      <td className="text-center py-3 px-4"><CheckCircle className="text-green-400 mx-auto" size={16} /></td>
                    </tr>
                    <tr className="border-b border-white/10">
                      <td className="py-3 px-4">Premium Theme</td>
                      <td className="text-center py-3 px-4">❌</td>
                      <td className="text-center py-3 px-4"><CheckCircle className="text-green-400 mx-auto" size={16} /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Main landing page content with enhanced information
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white">
      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center mr-4">
              <Shield size={32} className="text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              Shield Network Guardian
            </h1>
          </div>
          <p className="text-xl text-blue-200 mb-8 max-w-3xl mx-auto">
            Your Smart WiFi Guardian for Home, School & Work
          </p>
          <p className="text-lg text-blue-300 max-w-2xl mx-auto">
            Advanced AI-powered network security and optimization platform designed to protect and enhance your digital infrastructure.
          </p>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="plans" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-12 bg-white/10">
            <TabsTrigger value="plans" className="text-white data-[state=active]:bg-blue-500">
              <DollarSign className="w-4 h-4 mr-2" />
              Choose Plans
            </TabsTrigger>
            <TabsTrigger value="about" className="text-white data-[state=active]:bg-green-500">
              <Info className="w-4 h-4 mr-2" />
              About Us
            </TabsTrigger>
            <TabsTrigger value="compare" className="text-white data-[state=active]:bg-purple-500">
              <BarChart3 className="w-4 h-4 mr-2" />
              Compare Plans
            </TabsTrigger>
          </TabsList>

          <TabsContent value="plans">
            {/* Plan Selection Cards */}
            <div className="grid md:grid-cols-3 gap-8 mb-16">
              {(Object.keys(plans) as PlanType[]).map((planKey) => {
                const plan = plans[planKey];
                const PlanIcon = plan.icon;
                
                return (
                  <Card 
                    key={planKey}
                    className={`cursor-pointer transition-all duration-300 transform hover:scale-105 border-2 ${
                      selectedPlan === planKey 
                        ? 'border-blue-500 bg-blue-50/10 shadow-2xl shadow-blue-500/20' 
                        : 'border-white/20 bg-white/5 hover:border-blue-400 hover:bg-blue-50/5'
                    }`}
                    onClick={() => setSelectedPlan(planKey)}
                  >
                    <CardHeader className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <PlanIcon size={32} className="text-white" />
                      </div>
                      <CardTitle className="text-2xl text-white">{plan.title}</CardTitle>
                      <CardDescription className="text-blue-200">
                        {plan.subtitle}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                      <p className="text-blue-300 mb-4">{plan.description}</p>
                      {selectedPlan === planKey && (
                        <Button 
                          className="w-full mt-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg"
                          onClick={() => handleGetStarted(planKey)}
                        >
                          Choose {plan.title.replace('🏠 ', '').replace('🎓 ', '').replace('💼 ', '')} Plan <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Quick Start Option */}
            <div className="text-center mb-16">
              <Card className="bg-white/5 border-white/20 max-w-md mx-auto">
                <CardContent className="p-6">
                  <Zap className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Quick Start</h3>
                  <p className="text-blue-200 mb-4">
                    Not sure which plan? Start with our smart setup wizard
                  </p>
                  <Button 
                    onClick={() => setShowQuestionnaire(true)}
                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                  >
                    Find My Perfect Plan
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Bonus Feature Callout */}
            <div className="text-center">
              <Card className="bonus-features-card bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20 max-w-4xl mx-auto">
                <CardContent className="p-8">
                  <div className="flex items-center justify-center mb-4">
                    <Star className="w-8 h-8 text-primary mr-2" />
                    <h3 className="text-2xl font-bold gradient-text-fix">Bonus Features</h3>
                  </div>
                  <p className="gradient-text-fix mb-6">
                    All plans include 24/7 monitoring, automatic security updates, and our mobile app for remote management
                  </p>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <Shield className="w-8 h-8 text-primary mx-auto mb-2" />
                      <h4 className="font-semibold gradient-text-fix">AI Security</h4>
                      <p className="text-sm text-muted-foreground">Machine learning threat detection</p>
                    </div>
                    <div className="text-center">
                      <Wifi className="w-8 h-8 text-green-400 mx-auto mb-2" />
                      <h4 className="font-semibold text-white">Smart Optimization</h4>
                      <p className="text-sm text-blue-300">Automatic performance tuning</p>
                    </div>
                    <div className="text-center">
                      <BarChart3 className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                      <h4 className="font-semibold text-white">Advanced Analytics</h4>
                      <p className="text-sm text-blue-300">Detailed insights and reporting</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="about">
            <AboutSection />
          </TabsContent>

          <TabsContent value="compare">
            <PlanComparison />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default LandingPage;