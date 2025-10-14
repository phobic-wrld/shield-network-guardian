import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import axios from "axios";

export type PlanType = 'home' | 'school' | 'work';
export type SubscriptionTier = 'free' | 'basic' | 'premium' | 'enterprise';

interface SubscriptionContextType {
  isPremium: boolean;
  subscriptionTier: SubscriptionTier;
  planType: PlanType;
  subscriptionEnd: string | null;
  isLoading: boolean;
  checkSubscription: () => Promise<void>;
  upgradeSubscription: (tier: SubscriptionTier) => Promise<void>;
  setPlanType: (plan: PlanType) => void;
  getThemeClass: () => string;
  hasFeatureAccess: (feature: string) => boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  isPremium: false,
  subscriptionTier: 'free',
  planType: 'home',
  subscriptionEnd: null,
  isLoading: false,
  checkSubscription: async () => {},
  upgradeSubscription: async () => {},
  setPlanType: () => {},
  getThemeClass: () => '',
  hasFeatureAccess: () => false,
});

export const useSubscription = () => useContext(SubscriptionContext);

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const [isPremium, setIsPremium] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>('free');
  const [planType, setPlanTypeState] = useState<PlanType>('home');
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const API_BASE_URL = "http://localhost:5000/api/subscription"; // adjust to your backend URL

  const featureAccess = {
    // Basic features (available to all)
    'device-list': true,
    'speed-test': true,
    'basic-monitoring': true,
    
    // Premium features (home plan)
    'smart-suggestions': ['premium', 'enterprise'],
    'optimization-tips': ['premium', 'enterprise'],
    'guest-wifi': ['premium', 'enterprise'],
    'auto-disconnect': ['premium', 'enterprise'],
    'ai-advice': ['premium', 'enterprise'],
    'weekly-reports': ['premium', 'enterprise'],
    'premium-theme': ['premium', 'enterprise'],
    'multi-location': ['premium', 'enterprise'],
    
    // School specific features
    'content-filtering': ['premium', 'enterprise'],
    'classroom-segmentation': ['premium', 'enterprise'],
    'student-analytics': ['premium', 'enterprise'],
    'access-controls': ['premium', 'enterprise'],
    
    // Work/Enterprise features
    'threat-detection': ['premium', 'enterprise'],
    'vpn-integration': ['premium', 'enterprise'],
    'productivity-insights': ['premium', 'enterprise'],
    'compliance-reporting': ['enterprise'],
    'enterprise-support': ['enterprise'],
  };

  /** 🔹 Get user subscription info from backend */
  const checkSubscription = async () => {
    setIsLoading(true);
    try {
      const userId = localStorage.getItem("userId"); // or use your auth token
      const response = await axios.get(`${API_BASE_URL}/${userId}`);

      if (response.data) {
        const { tier, planType, subscriptionEnd } = response.data;
        setSubscriptionTier(tier);
        setIsPremium(tier === "premium" || tier === "enterprise");
        setPlanTypeState(planType || "home");
        setSubscriptionEnd(subscriptionEnd || null);
      }
    } catch (error) {
      console.error("❌ Error checking subscription:", error);
      setIsPremium(false);
      setSubscriptionTier("free");
      setSubscriptionEnd(null);
    } finally {
      setIsLoading(false);
    }
  };

  /** 🔹 Upgrade or change user subscription */
  const upgradeSubscription = async (tier: SubscriptionTier) => {
    setIsLoading(true);
    try {
      const userId = localStorage.getItem("userId");
      const response = await axios.post(`${API_BASE_URL}/upgrade`, {
        userId,
        tier,
        planType,
      });

      if (response.data.success) {
        setSubscriptionTier(tier);
        setIsPremium(tier !== "free");
        setSubscriptionEnd(response.data.subscriptionEnd);
      }
    } catch (error) {
      console.error("❌ Error upgrading subscription:", error);
    } finally {
      setIsLoading(false);
    }
  };

  /** 🔹 Change selected plan (home/school/work) */
  const setPlanType = (plan: PlanType) => {
    setPlanTypeState(plan);
    localStorage.setItem("selected-plan", plan);
  };

  /** 🔹 Theme styles */
  const getThemeClass = () => {
    if (isPremium) {
      return 'premium-theme bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800';
    }
    return 'basic-theme bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800';
  };

  /** 🔹 Feature access logic */
  const hasFeatureAccess = (feature: string) => {
    const allowedTiers = featureAccess[feature as keyof typeof featureAccess];
    if (typeof allowedTiers === 'boolean') return allowedTiers;
    if (Array.isArray(allowedTiers)) {
      return allowedTiers.includes(subscriptionTier);
    }
    return false;
  };

  /** 🔹 Apply theme when subscription changes */
  useEffect(() => {
    const body = document.body;
    body.classList.remove('basic-theme', 'premium-theme');
    body.classList.add(isPremium ? 'premium-theme' : 'basic-theme');
  }, [isPremium, subscriptionTier]);

  /** 🔹 Load data when app mounts */
  useEffect(() => {
    checkSubscription();
    const savedPlan = localStorage.getItem("selected-plan") as PlanType;
    if (savedPlan && ['home', 'school', 'work'].includes(savedPlan)) {
      setPlanTypeState(savedPlan);
    }
  }, []);

  const value = {
    isPremium,
    subscriptionTier,
    planType,
    subscriptionEnd,
    isLoading,
    checkSubscription,
    upgradeSubscription,
    setPlanType,
    getThemeClass,
    hasFeatureAccess,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};
