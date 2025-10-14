
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      <div className="text-center max-w-md mx-auto px-6">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-white mb-4">404</h1>
          <p className="text-xl text-blue-200 mb-8">Oops! Page not found</p>
          <p className="text-sm text-blue-300 mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        <Button 
          onClick={() => window.location.href = "/"}
          className="bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white px-8 py-3 text-lg font-semibold rounded-xl shadow-lg"
        >
          <Home className="mr-2 h-5 w-5" />
          Return Home
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
