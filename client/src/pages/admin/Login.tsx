import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { LogIn, Eye, EyeOff } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Adresse email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      console.log('Début de la connexion admin...', data.email);
      
      const response = await apiRequest("POST", "/api/admin/auth/login", data);
      console.log('Réponse login:', response);
      
      // Attendre plus longtemps pour la sauvegarde de session
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Plusieurs tentatives de vérification
      let authStatus = null;
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts && (!authStatus || !authStatus.authenticated)) {
        attempts++;
        console.log(`Tentative de vérification auth ${attempts}/${maxAttempts}`);
        
        await new Promise(resolve => setTimeout(resolve, 200 * attempts));
        
        const authCheck = await fetch("/api/admin/auth/me", {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (authCheck.ok) {
          authStatus = { authenticated: true };
        } else {
          authStatus = { authenticated: false };
        }
        console.log(`Statut auth tentative ${attempts}:`, authStatus);
      }
      
      if (!authStatus || !authStatus.authenticated) {
        throw new Error("La session n'a pas pu être établie après plusieurs tentatives");
      }
      
      return response;
    },
    onSuccess: (response) => {
      console.log('Connexion réussie, redirection vers dashboard...');
      
      // Invalider le cache pour forcer le rechargement de l'état auth
      queryClient.invalidateQueries({ queryKey: ["/api/admin/auth/me"] });
      
      toast({
        title: "Connexion réussie",
        description: "Redirection en cours...",
      });
      
      // Utiliser le router de Wouter pour la redirection
      setTimeout(() => {
        setLocation("/admin/dashboard");
      }, 100);
    },
    onError: (error: any) => {
      console.error('Erreur de connexion:', error);
      toast({
        title: "Échec de connexion",
        description: error.message || "Identifiants invalides",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  const onSubmit = (data: LoginFormData) => {
    console.log('Soumission du formulaire de connexion admin');
    setIsLoading(true);
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <LogIn className="w-6 h-6 text-primary" />
            <CardTitle className="text-2xl font-display">Connexion Admin</CardTitle>
          </div>
          <CardDescription>
            Accédez au panneau d'administration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        data-testid="input-email"
                        autoComplete="email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mot de passe</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          data-testid="input-password"
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          data-testid="button-toggle-password"
                          aria-label={showPassword ? "Masquer" : "Afficher"}
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                data-testid="button-admin-login"
              >
                {isLoading ? "Connexion..." : "Se connecter"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
