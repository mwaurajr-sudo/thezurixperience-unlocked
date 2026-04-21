import type { ReactNode } from "react";
import { SiteHeader } from "@/components/SiteHeader";

interface Props {
  eyebrow: string;
  title: ReactNode;
  description?: string;
  children?: ReactNode;
}

export function GatedPageLayout({ eyebrow, title, description, children }: Props) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-6 pb-24 pt-32">
        <div className="border-b border-border/60 pb-12">
          <p className="text-xs uppercase tracking-[0.3em] text-primary">— {eyebrow}</p>
          <h1 className="font-display mt-4 text-5xl font-bold leading-[0.95] tracking-tight sm:text-6xl md:text-7xl">
            {title}
          </h1>
          {description && (
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {description}
            </p>
          )}
        </div>
        <div className="mt-16">{children}</div>
      </main>
    </div>
  );
}
