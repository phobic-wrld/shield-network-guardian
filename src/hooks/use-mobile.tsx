
import * as React from "react";

// Adjust breakpoints for better responsiveness
const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false);

  React.useEffect(() => {
    // Initial check
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    
    // Check on mount
    checkMobile();

    // Setup resize listener
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    
    const handleChange = () => {
      checkMobile();
    };
    
    // Modern event listener
    if (mql.addEventListener) {
      mql.addEventListener("change", handleChange);
    } else {
      // Fallback for older browsers
      window.addEventListener('resize', handleChange);
    }
    
    return () => {
      if (mql.removeEventListener) {
        mql.removeEventListener("change", handleChange);
      } else {
        window.removeEventListener('resize', handleChange);
      }
    };
  }, []);

  return isMobile;
}
