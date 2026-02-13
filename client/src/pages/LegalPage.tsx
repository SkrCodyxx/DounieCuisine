import { useEffect } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { LegalPage } from "@shared/schema";

export default function LegalPageView() {
  const [, params] = useRoute("/legal/:slug");
  const slug = params?.slug || "";

  // Cache très long - pages légales presque jamais modifiées
  const { data: page, isLoading } = useQuery<LegalPage>({
    queryKey: [`/api/legal-pages/${slug}`],
    enabled: !!slug,
    staleTime: 4 * 60 * 60 * 1000, // 4 heures - contenu légal très stable
    gcTime: 8 * 60 * 60 * 1000, // 8 heures en cache
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  useEffect(() => {
    if (page) {
      document.title = `${page.title} | Dounie Cuisine`;
    }
  }, [page]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="animate-pulse">
          <div className="h-10 bg-muted rounded w-2/3 mb-6"></div>
          <div className="space-y-4">
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-4xl text-center">
        <h1 className="text-3xl font-serif font-bold mb-4">Page non trouvée</h1>
        <p className="text-muted-foreground">Cette page n'existe pas ou n'est pas disponible.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 
        className="text-4xl md:text-5xl font-serif font-bold mb-8 text-foreground"
        data-testid="text-legal-title"
      >
        {page.title}
      </h1>
      
      <div 
        className="prose prose-lg max-w-none prose-headings:font-serif prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground"
        dangerouslySetInnerHTML={{ __html: page.content }}
        data-testid="text-legal-content"
      />
    </div>
  );
}
