import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";

export default function AdminRedirect() {
  const [, setLocation] = useLocation();
  
  const { data: authCheck, isLoading } = useQuery({
    queryKey: ["/api/admin/auth/me"],
    queryFn: async () => {
      const response = await fetch("/api/admin/auth/me");
      if (!response.ok) throw new Error("Failed to check auth status");
      return response.json();
    },
  });

  useEffect(() => {
    if (!isLoading) {
      if (authCheck?.id) {
        setLocation("/admin/dashboard");
      } else {
        setLocation("/admin/login");
      }
    }
  }, [authCheck, isLoading, setLocation]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-muted-foreground">Redirection...</p>
    </div>
  );
}
