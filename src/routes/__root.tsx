import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div className="absolute inset-0 spotlight opacity-60" />
      <div className="relative max-w-md text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-primary">— Lost in the room</p>
        <h1 className="font-display mt-6 text-[10rem] font-light italic leading-none text-foreground">404</h1>
        <p className="mt-6 text-sm text-muted-foreground">
          The door you're looking for has been sealed. Or never existed.
        </p>
        <div className="mt-10">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full border border-primary/50 bg-primary/10 px-8 py-3 text-xs uppercase tracking-[0.3em] text-foreground transition-colors hover:bg-primary/20"
          >
            Return to the foyer
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "TheZuriXperience — Events, redefined" },
      { name: "description", content: "TheZuriXperience. Look no further" },
      { name: "author", content: "TheZuriXperience" },
      { property: "og:title", content: "TheZuriXperience — Events, redefined" },
      { property: "og:description", content: "TheZuriXperience. Look no further" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "TheZuriXperience — Events, redefined" },
      { name: "twitter:description", content: "TheZuriXperience. Look no further" },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/T65XWLMLj6Ut1S2rfKTT2gRec3G3/social-images/social-1776771315352-WhatsApp_Image_2026-04-21_at_14.34.31.webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/T65XWLMLj6Ut1S2rfKTT2gRec3G3/social-images/social-1776771315352-WhatsApp_Image_2026-04-21_at_14.34.31.webp" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <AuthProvider>
      <Outlet />
      <Toaster richColors position="top-center" />
    </AuthProvider>
  );
}
