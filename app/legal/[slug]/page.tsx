"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import PageLayout from "@/components/layout/page-layout";

interface LegalPage {
  title: string;
  content: string;
  slug: string;
}

export default function LegalPageView() {
  const params = useParams();
  const slug = params?.slug as string;

  const { data: page, isLoading } = useQuery<LegalPage>({
    queryKey: ["legal-page", slug],
    queryFn: () => fetch(`/api/legal-pages?slug=${slug}`).then((r) => r.json()),
    enabled: !!slug,
    staleTime: 4 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <div className="animate-pulse">
            <div className="h-10 bg-muted rounded w-2/3 mb-6" />
            <div className="space-y-4">
              <div className="h-4 bg-muted rounded" />
              <div className="h-4 bg-muted rounded" />
              <div className="h-4 bg-muted rounded w-5/6" />
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!page) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-16 max-w-4xl text-center">
          <h1 className="text-3xl font-serif font-bold mb-4">Page non trouvee</h1>
          <p className="text-muted-foreground">{"Cette page n'existe pas ou n'est pas disponible."}</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-serif font-bold mb-8 text-foreground">{page.title}</h1>
        <div
          className="prose prose-lg max-w-none prose-headings:font-serif prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      </div>
    </PageLayout>
  );
}
