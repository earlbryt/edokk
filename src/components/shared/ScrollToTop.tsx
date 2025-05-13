import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // If there's a hash in the URL (for anchor links), let the browser handle it
    if (hash) return;
    
    // Explicitly reset both window and document scroll positions
    // This ensures maximum compatibility across different browsers
    try {
      // For modern browsers, use smooth scrolling
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
      });
      
      // For older browsers or as a fallback
      document.body.scrollTop = 0; // For Safari
      document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
      
      // If using any custom scroll containers, reset those too
      const mainContent = document.getElementById('main-content');
      if (mainContent) {
        mainContent.scrollTop = 0;
      }
    } catch (error) {
      // Fallback for any errors
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return null;
}
