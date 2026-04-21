import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { AuthGate } from "@/components/AuthGate";
import { GatedPageLayout } from "@/components/GatedPageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Smartphone } from "lucide-react";

type Tier = {
  name: string;
  price: string;
  perks: string[];
  featured?: boolean;
};

const tiers: Tier[] = [
  { name: "General", price: "KES 2,500", perks: ["Entry after 10 PM", "Welcome drink"] },
  { name: "VIP", price: "KES 6,000", perks: ["Priority entry", "Reserved standing", "Two welcome drinks"], featured: true },
  { name: "Table (4)", price: "KES 28,000", perks: ["Reserved table", "Bottle service", "Private host"] },
];

export const Route = createFileRoute("/tickets")({
  component: () => (
    <AuthGate>
      <TicketsPage />
    </AuthGate>
  ),
  head: () => ({ meta: [{ title: "Tickets — TheZuriXperience" }] }),
});

// Kenyan mobile: accept 2547XXXXXXXX, 2541XXXXXXXX, 07XXXXXXXX, 01XXXXXXXX, +2547..., etc.
const checkoutSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(80),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z
    .string()
    .trim()
    .regex(/^(?:\+?254|0)?(7|1)\d{8}$/, "Enter a valid Safaricom number"),
  reference: z
    .string()
    .trim()
    .min(3, "Reference too short")
    .max(20, "Reference too long")
    .regex(/^[A-Za-z0-9 _-]+$/, "Letters, numbers, spaces, - and _ only"),
});

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("254")) return digits;
  if (digits.startsWith("0")) return `254${digits.slice(1)}`;
  if (digits.startsWith("7") || digits.startsWith("1")) return `254${digits}`;
  return digits;
}

function TicketsPage() {
  const [activeTier, setActiveTier] = useState<Tier | null>(null);

  return (
    <GatedPageLayout
      eyebrow="Reserve"
      title={<>Pick your <span className="italic text-primary">entry</span></>}
      description="Capacity is intentionally small. Once a tier is gone, it's gone."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {tiers.map((t) => (
          <div
            key={t.name}
            className={`rounded-2xl border p-8 ${t.featured ? "border-primary bg-primary/5" : "border-border/60 bg-card/40"}`}
          >
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t.name}</div>
            <div className="font-display mt-3 text-4xl font-bold">{t.price}</div>
            <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
              {t.perks.map((p) => <li key={p}>· {p}</li>)}
            </ul>
            <Button
              onClick={() => setActiveTier(t)}
              className="mt-8 w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Reserve
            </Button>
          </div>
        ))}
      </div>

      <CheckoutDialog tier={activeTier} onClose={() => setActiveTier(null)} />
    </GatedPageLayout>
  );
}

function CheckoutDialog({ tier, onClose }: { tier: Tier | null; onClose: () => void }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [reference, setReference] = useState("");
  const [loading, setLoading] = useState(false);

  const open = tier !== null;

  const handleClose = () => {
    if (loading) return;
    onClose();
    // small reset on close
    setTimeout(() => {
      setFullName("");
      setEmail("");
      setPhone("");
      setReference("");
    }, 200);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = checkoutSchema.safeParse({ fullName, email, phone, reference });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    try {
      // Placeholder: STK Push wiring is not connected yet.
      // The normalized phone + reference are ready for the M-Pesa server function.
      const msisdn = normalizePhone(parsed.data.phone);
      console.info("[checkout] ready for STK Push", {
        tier: tier?.name,
        msisdn,
        reference: parsed.data.reference,
      });
      await new Promise((r) => setTimeout(r, 600));
      toast.success("Details captured. We'll prompt your phone shortly.");
      handleClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="border-border/60 bg-card/95 backdrop-blur sm:max-w-md">
        <DialogHeader>
          <p className="text-xs uppercase tracking-[0.3em] text-primary">— M-Pesa</p>
          <DialogTitle className="font-display text-3xl font-bold">
            {tier?.name} · {tier?.price}
          </DialogTitle>
          <DialogDescription>
            Enter the Safaricom number to receive the STK Push and a reference for your records.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4 pt-2">
          <div>
            <Label htmlFor="full-name" className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Full name
            </Label>
            <Input
              id="full-name"
              required
              maxLength={80}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-2"
              placeholder="As on ID"
            />
          </div>

          <div>
            <Label htmlFor="email" className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              required
              maxLength={255}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <Label htmlFor="phone" className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              M-Pesa phone number
            </Label>
            <Input
              id="phone"
              type="tel"
              inputMode="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-2"
              placeholder="07XX XXX XXX"
              autoComplete="tel"
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              Safaricom number that will receive the STK prompt.
            </p>
          </div>

          <div>
            <Label htmlFor="reference" className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Payment reference
            </Label>
            <Input
              id="reference"
              required
              maxLength={20}
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="mt-2 uppercase"
              placeholder="ZURI-001"
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              Shown on the STK prompt and your M-Pesa receipt.
            </p>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Smartphone className="h-4 w-4" />
                  Send STK Push
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
