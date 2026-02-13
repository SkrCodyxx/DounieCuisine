import { useEffect } from "react";
import { useLocation } from "wouter";

/**
 * Component that scrolls to top of page when route changes
 */
export function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location]);

  return null;
}
