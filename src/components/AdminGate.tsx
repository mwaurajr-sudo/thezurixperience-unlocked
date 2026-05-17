import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/admin-login" });
      return;
    }
    if (!loading && user) {
      supabase
        .rpc("has_role", { _role: "admin", _user_id: user.id })
        .then(({ data, error }) => {
          setIsAdmin(error ? false : !!data);
          setChecking(false);
        });
    }
  }, [loading, user, navigate]);

  if (loading || checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 text-center">
        <ShieldAlert className="h-12 w-12 text-destructive" />
        <h1 className="font-display text-3xl font-bold">Access denied</h1>
        <p className="text-muted-foreground">You don't have superuser privileges.</p>
        <Button
          className="rounded-full bg-primary px-8 text-primary-foreground hover:bg-primary/90"
          onClick={() => navigate({ to: "/admin-login" })}
        >
          Sign in as admin
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
