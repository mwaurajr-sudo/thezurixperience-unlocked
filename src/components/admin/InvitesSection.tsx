import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { BACKEND_URL } from "@/lib/backend";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const BATCH_SIZE = 25;

type InviteRow = {
  id: string;
  email: string;
  status: string;
  last_error: string | null;
  sent_at: string | null;
};

type Outcome = { sent: string[]; skipped: string[]; invalid: string[]; failed: string[] };

export function InvitesSection() {
  const { session } = useAuth();
  const [list, setList] = useState("");
  const [resend, setResend] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [invites, setInvites] = useState<InviteRow[]>([]);

  const emails = useMemo(
    () => [
      ...new Set(
        list
          .split(/[\s,;]+/)
          .map((e) => e.trim().toLowerCase())
          .filter(Boolean),
      ),
    ],
    [list],
  );

  const loadInvites = useCallback(() => {
    supabase
      .from("invites")
      .select("id, email, status, last_error, sent_at")
      .order("created_at", { ascending: false })
      .then(({ data }) => setInvites((data as InviteRow[]) ?? []));
  }, []);

  useEffect(loadInvites, [loadInvites]);

  const send = async () => {
    const totals: Outcome = { sent: [], skipped: [], invalid: [], failed: [] };
    try {
      for (let i = 0; i < emails.length; i += BATCH_SIZE) {
        setProgress(`Sending ${Math.min(i + BATCH_SIZE, emails.length)} of ${emails.length}...`);
        const res = await fetch(`${BACKEND_URL}/api/invites`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token ?? ""}`,
          },
          body: JSON.stringify({ emails: emails.slice(i, i + BATCH_SIZE), resend }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || "Could not send invites");
        }
        totals.sent.push(...data.sent);
        totals.skipped.push(...data.skipped);
        totals.invalid.push(...data.invalid);
        totals.failed.push(...data.failed);
      }
      setList([...totals.failed, ...totals.invalid].join("\n"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send invites");
    } finally {
      setOutcome(totals);
      setProgress(null);
      loadInvites();
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Paste guest emails, separated by commas or new lines. Each guest gets the event details, the
        RSVP link and instructions on how to RSVP and get their ticket.
      </p>
      <Textarea
        value={list}
        onChange={(e) => setList(e.target.value)}
        rows={5}
        placeholder={"guest@example.com\nanother@example.com"}
      />
      <label className="flex items-center gap-2 text-xs text-muted-foreground">
        <input type="checkbox" checked={resend} onChange={(e) => setResend(e.target.checked)} />
        Also re-send to people who were already invited
      </label>
      <Button
        className="rounded-full bg-primary px-6 text-primary-foreground hover:bg-primary/90"
        disabled={emails.length === 0 || progress !== null}
        onClick={send}
      >
        {progress ?? `Send ${emails.length} invite${emails.length === 1 ? "" : "s"}`}
      </Button>

      {outcome && (
        <p className="text-xs text-muted-foreground">
          {outcome.sent.length} sent · {outcome.skipped.length} already invited ·{" "}
          {outcome.invalid.length} invalid · {outcome.failed.length} failed
          {outcome.failed.length + outcome.invalid.length > 0 &&
            ". Those that didn't go out are still in the box above."}
        </p>
      )}

      {invites.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr>
                <th className="py-2 pr-4 font-medium">Invited</th>
                <th className="py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {invites.map((invite) => (
                <tr key={invite.id} className="border-t border-border/60">
                  <td className="py-2 pr-4">{invite.email}</td>
                  <td className="py-2">
                    {invite.status === "sent" && invite.sent_at
                      ? `Sent ${new Date(invite.sent_at).toLocaleDateString()}`
                      : "Failed to send"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
