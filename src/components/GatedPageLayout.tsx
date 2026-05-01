import type { ReactNode } from "react";
import { SiteHeader } from "@/components/SiteHeader";

interface Props {
  eyebrow: string;
  title: ReactNode;
  description?: string;
  index?: string;
  children?: ReactNode;
}

export function GatedPageLayout({ eyebrow, title, description, index = "001", children }: Props) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[60vh] spotlight opacity-50" />
      <SiteHeader />
      <main className="relative mx-auto max-w-[1400px] px-5 pb-32 pt-32 sm:px-8 sm:pt-40">
        <div className="grid gap-8 border-b border-border/60 pb-14 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.4em] text-primary-glow">
              <span className="mr-3 text-muted-foreground">— Chapter</span>
              {index}
            </div>
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
              {eyebrow}
            </p>
          </div>
          <div className="lg:col-span-9">
            <h1 className="font-display text-5xl font-light leading-[0.92] tracking-tight text-foreground sm:text-6xl md:text-7xl lg:text-[6rem]">
              {title}
            </h1>
            {description && (
              <p className="mt-8 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                {description}
              </p>
            )}
          </div>
        </div>
        <div className="mt-16">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}

function SiteFooter() {
  return (
    <footer className="relative border-t border-border/60 px-5 py-12 sm:px-8">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-4 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        <span>© {new Date().getFullYear()} TheZuriXperience</span>
        <span className="text-primary-glow">Vol. 01 — RnB</span>
        <span>Nairobi · Felt everywhere</span>
      </div>
    </footer>
  );
}
