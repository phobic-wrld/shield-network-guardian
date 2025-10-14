import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Coffee, Film, Scissors, Home as HomeIcon, Building2, 
  School, Users, Wifi, Shield, ArrowRight, ArrowLeft, CheckCircle, LucideIcon 
} from "lucide-react";

type BusinessType = 
  | "home"
  | "cafe"
  | "restaurant"
  | "salon"
  | "movie_shop"
  | "bnb"
  | "office"
  | "school"
  | "retail"
  | "other";

type PlanType = "home" | "school" | "work";

interface Question {
  id: string;
  title: string;
  description: string;
  options: {
    id: BusinessType | string;
    label: string;
    icon: LucideIcon;
    description: string;
  }[];
}

interface QuestionnaireProps {
  onComplete: (planType: PlanType) => void;
  onBack: () => void;
}

const questions: Question[] = [
  {
    id: "business_type",
    title: "What type of location will use this network?",
    description: "Help us understand your environment to recommend the best plan",
    options: [
      { id: "home", label: "Home / Family", icon: HomeIcon, description: "Personal home network for family use" },
      { id: "cafe", label: "Café / Coffee Shop", icon: Coffee, description: "Customer WiFi and business operations" },
      { id: "restaurant", label: "Restaurant", icon: Users, description: "Dining establishment with guest access" },
      { id: "salon", label: "Salon / Beauty Shop", icon: Scissors, description: "Beauty services with client WiFi" },
      { id: "movie_shop", label: "Entertainment / Media", icon: Film, description: "Movie store or gaming center" },
      { id: "bnb", label: "BnB / Hotel", icon: Building2, description: "Guest accommodation services" },
      { id: "office", label: "Office / Business", icon: Building2, description: "Professional workplace environment" },
      { id: "school", label: "School / Education", icon: School, description: "Educational institution or training center" },
    ],
  },
  {
    id: "user_count",
    title: "How many people typically use your network?",
    description: "This helps us recommend the right capacity",
    options: [
      { id: "small", label: "1-10 users", icon: Users, description: "Small household or business" },
      { id: "medium", label: "11-50 users", icon: Users, description: "Medium business or busy household" },
      { id: "large", label: "50+ users", icon: Users, description: "Large business or institution" },
    ],
  },
  {
    id: "priorities",
    title: "What's most important for your network?",
    description: "Choose your primary concern",
    options: [
      { id: "security", label: "Security & Privacy", icon: Shield, description: "Protect sensitive data and devices" },
      { id: "performance", label: "Speed & Performance", icon: Wifi, description: "Fast, reliable internet for all users" },
      { id: "guest_access", label: "Guest WiFi Management", icon: Users, description: "Easy guest access with controls" },
      { id: "monitoring", label: "Usage Monitoring", icon: CheckCircle, description: "Track and manage network usage" },
    ],
  },
];

export const PlanQuestionnaire = ({ onComplete, onBack }: QuestionnaireProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showRecommendation, setShowRecommendation] = useState(false);

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const handleAnswer = (questionId: string, answerId: string) => {
    const newAnswers = { ...answers, [questionId]: answerId };
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowRecommendation(true);
    }
  };

  const getPlanRecommendation = (): { plan: PlanType; reason: string; confidence: number } => {
    const businessType = answers.business_type;
    const userCount = answers.user_count;
    const priority = answers.priorities;

    if (businessType === "school") {
      return {
        plan: "school",
        reason: "Educational institutions need specialized features like student monitoring and filtering.",
        confidence: 95,
      };
    }

    if (["office", "bnb", "cafe", "restaurant", "salon", "movie_shop"].includes(businessType)) {
      if (userCount === "large" || priority === "security") {
        return {
          plan: "work",
          reason: "Business environments require enterprise-grade security and monitoring.",
          confidence: 90,
        };
      }
      return {
        plan: "work",
        reason: "Professional settings benefit from guest access and management tools.",
        confidence: 85,
      };
    }

    return {
      plan: "home",
      reason: "Perfect for personal use with family-friendly device management.",
      confidence: 90,
    };
  };

  const recommendation = showRecommendation ? getPlanRecommendation() : null;

  const planDetails = {
    home: { name: "Home Plan", color: "bg-blue-500", icon: HomeIcon },
    school: { name: "School Plan", color: "bg-green-500", icon: School },
    work: { name: "Work Plan", color: "bg-purple-500", icon: Building2 },
  };

  if (showRecommendation && recommendation) {
    const planInfo = planDetails[recommendation.plan];
    const PlanIcon = planInfo.icon;

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-400 rounded-full flex items-center justify-center mb-4">
              <CheckCircle size={32} className="text-white" />
            </div>
            <CardTitle className="text-2xl mb-2">Perfect Match Found!</CardTitle>
            <p className="text-blue-200">Based on your answers, we recommend:</p>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="flex items-center justify-center space-x-4">
              <div className={`w-12 h-12 ${planInfo.color} rounded-lg flex items-center justify-center`}>
                <PlanIcon size={24} className="text-white" />
              </div>
              <div className="text-left">
                <h3 className="text-xl font-bold">{planInfo.name}</h3>
                <Badge variant="secondary" className="bg-green-500/20 text-green-300">
                  {recommendation.confidence}% match
                </Badge>
              </div>
            </div>

            <p className="text-blue-100 bg-white/5 p-4 rounded-lg">{recommendation.reason}</p>

            <div className="flex space-x-4">
              <Button
                variant="outline"
                onClick={() => setShowRecommendation(false)}
                className="flex-1 border-white/20 text-white hover:bg-white/10"
              >
                <ArrowLeft className="mr-2" size={16} />
                Go Back
              </Button>
              <Button
                onClick={() => onComplete(recommendation.plan)}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
              >
                Continue with {planInfo.name}
                <ArrowRight className="ml-2" size={16} />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const question = questions[currentQuestion];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-blue-200">
          <span>Question {currentQuestion + 1} of {questions.length}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl mb-2">{question.title}</CardTitle>
          <p className="text-blue-200">{question.description}</p>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {question.options.map((option) => {
              const OptionIcon = option.icon;
              return (
                <Card
                  key={option.id}
                  className="cursor-pointer transition-all duration-300 transform hover:scale-105 border-2 border-white/20 bg-white/5 hover:border-blue-400 hover:bg-blue-50/10"
                  onClick={() => handleAnswer(question.id, option.id)}
                >
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <OptionIcon size={24} className="text-white" />
                    </div>
                    <h3 className="font-semibold mb-2">{option.label}</h3>
                    <p className="text-sm text-blue-200">{option.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={currentQuestion > 0 ? () => setCurrentQuestion(currentQuestion - 1) : onBack}
          className="border-white/20 text-white hover:bg-white/10"
        >
          <ArrowLeft className="mr-2" size={16} />
          {currentQuestion > 0 ? "Previous" : "Back to Plans"}
        </Button>

        {Object.keys(answers).length > currentQuestion && (
          <Button
            onClick={() => {
              if (currentQuestion < questions.length - 1) {
                setCurrentQuestion(currentQuestion + 1);
              } else {
                setShowRecommendation(true);
              }
            }}
            className="bg-blue-500 hover:bg-blue-600"
          >
            {currentQuestion < questions.length - 1 ? "Next" : "Get Recommendation"}
            <ArrowRight className="ml-2" size={16} />
          </Button>
        )}
      </div>
    </div>
  );
};
