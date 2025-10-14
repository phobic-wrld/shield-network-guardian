
import { ReactNode, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";

interface AuthGateProps {
  children: ReactNode;
}

export const AuthGate = ({ children }: AuthGateProps) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('AuthGate check:', { 
      user: user?.email || 'No user', 
      isLoading, 
      pathname: location.pathname 
    });

    if (!isLoading) {
      const isAuthPage = location.pathname === "/auth";
      
      if (!user && !isAuthPage) {
        // User not authenticated, redirect to auth
        console.log('Redirecting to auth page - user not authenticated');
        navigate("/auth", { replace: true });
      } else if (user && isAuthPage) {
        // User authenticated but on auth page, redirect to home
        console.log('Redirecting to home - user already authenticated');
        navigate("/", { replace: true });
      }
    }
  }, [user, isLoading, location.pathname, navigate]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-white border-t-transparent mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading Shield...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
