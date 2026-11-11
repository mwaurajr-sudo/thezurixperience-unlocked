import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, Mail, Send, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { BACKEND_URL } from "@/lib/backend";
import { PanelHeader, SectionCard } from "@/components/admin/AdminFields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// Matches the server's per-request limit; longer lists go out in several requests.
const BATCH_SIZE = 25;

type Group = "tickets" | "invites";

const GROUPS: { id: Group; label: string }[] = [
  { id: "tickets", label: "Ticket holders" },
  { id: "invites", label: "Everyone invited" },
];

type Outcome = { sent: string[]; invalid: string[]; failed: string[]; firstError: string | null };

// Every address in the box, whatever separates them (new lines, commas, spaces).
function parseEmails(text: string): string[] {
  return [...new Set((text.match(/[^\s,;<>]+@[^\s,;<>]+/g) ?? []).map((e) => e.toLowerCase()))];
}

export function EmailPanel() {
  const { session, user } = useAuth();
  const [recipientsText, setRecipientsText] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loadingGroup, setLoadingGroup] = useState<Group | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  const recipients = useMemo(() => parseEmails(recipientsText), [recipientsText]);
  const ready = subject.trim() !== "" && message.trim() !== "";
  const busy = progress !== null;

  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session?.access_token ?? ""}`,
  };

  const addGroup = async (group: Group) => {
    setLoadingGroup(group);
    try {
      const res = await fetch(`${BACKEND_URL}/api/emails/recipients?group=${group}`, { headers: authHeaders });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Couldn't load that group.");
      const merged = [...new Set([...recipients, ...(data.emails as string[])])];
      setRecipientsText(merged.join("\n"));
      const added = merged.length - recipients.length;
      toast.success(added ? `Added ${added} address${added === 1 ? "" : "es"}.` : "Everyone in that group is already in the list.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't load that group.");
    } finally {
      setLoadingGroup(null);
    }
  };

  const post = async (payload: Record<string, unknown>): Promise<Outcome> => {
    const res = await fetch(`${BACKEND_URL}/api/emails`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ subject, message, ...payload }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || "Couldn't send.");
    return data as Outcome;
  };

  const sendTest = async () => {
    setProgress("Sending a test to you...");
    setOutcome(null);
    try {
      const result = await post({ test: true });
      if (result.sent.length) toast.success(`Test sent to ${result.sent[0]}. Check your inbox.`);
      else toast.error(result.firstError || "The test didn't send.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't send the test.");
    } finally {
      setProgress(null);
    }
  };

  const sendAll = async () => {
    setConfirming(false);
    const totals: Outcome = { sent: [], invalid: [], failed: [], firstError: null };
    try {
      for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
        setProgress(`Sending ${Math.min(i + BATCH_SIZE, recipients.length)} of ${recipients.length}...`);
        const result = await post({ recipients: recipients.slice(i, i + BATCH_SIZE) });
        totals.sent.push(...result.sent);
        totals.invalid.push(...result.invalid);
        totals.failed.push(...result.failed);
        totals.firstError ??= result.firstError;
      }
      if (totals.failed.length === 0 && totals.invalid.length === 0) toast.success(`Sent to ${totals.sent.length}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sending stopped partway.");
    } finally {
      // Keep only the addresses that didn't get it, so sending again retries just those.
      const notSent = new Set([...totals.failed, ...totals.invalid]);
      const untried = recipients.filter((e) => !totals.sent.includes(e) && !notSent.has(e));
      setRecipientsText([...notSent, ...untried].join("\n"));
      setOutcome(totals);
      setProgress(null);
    }
  };

  return (
    <div className="space-y-6">
      <PanelHeader
        title="Email"
        description="Write your own message and send it to guests. It goes out in the site's email design, signed Zuri."
      />

      <SectionCard title="Recipients">
        <p className="text-xs text-muted-foreground">
          Paste addresses (one per line, or separated by commas), or add a whole group.
        </p>
        <div className="flex flex-wrap gap-2">
          {GROUPS.map((g) => (
            <Button
              key={g.id}
              variant="outline"
              size="sm"
              className="rounded-full text-xs"
              disabled={loadingGroup !== null || busy}
              onClick={() => addGroup(g.id)}
            >
              {loadingGroup === g.id ? (
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Users className="mr-1 h-3.5 w-3.5" />
              )}
              + {g.label}
            </Button>
          ))}
          {recipients.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full text-xs text-muted-foreground"
              disabled={busy}
              onClick={() => setRecipientsText("")}
            >
              Clear
            </Button>
          )}
        </div>
        <Textarea
          value={recipientsText}
          onChange={(e) => {
            setRecipientsText(e.target.value);
            setConfirming(false);
          }}
          rows={5}
          placeholder={"amina@example.com\nbrian@example.com"}
        />
        <p className="text-xs text-muted-foreground">
          {recipients.length} address{recipients.length === 1 ? "" : "es"}
        </p>
      </SectionCard>

      <SectionCard title="Message">
        <Input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Subject"
          maxLength={150}
          aria-label="Subject"
        />
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={10}
          placeholder={"Write your message here.\n\nLeave a blank line between paragraphs. Links like https://... become clickable."}
          aria-label="Message"
        />
        <p className="text-xs text-muted-foreground">
          "ZURI" is added at the end. Replies go to the reply-to address set in Cloudflare.
        </p>
      </SectionCard>

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" className="rounded-full" disabled={!ready || busy || !user} onClick={sendTest}>
          <Mail className="mr-2 h-4 w-4" /> Send a test to me
        </Button>
        {confirming ? (
          <>
            <Button
              className="rounded-full bg-primary px-6 text-primary-foreground hover:bg-primary/90"
              disabled={busy}
              onClick={sendAll}
            >
              <Send className="mr-2 h-4 w-4" /> Yes, send to {recipients.length}
            </Button>
            <Button variant="ghost" className="rounded-full" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
          </>
        ) : (
          <Button
            className="rounded-full bg-primary px-6 text-primary-foreground hover:bg-primary/90"
            disabled={!ready || recipients.length === 0 || busy}
            onClick={() => setConfirming(true)}
          >
            {progress ?? (
              <>
                <Send className="mr-2 h-4 w-4" /> Send to {recipients.length}
              </>
            )}
          </Button>
        )}
      </div>

      {outcome && (
        <div className="space-y-1 text-xs text-muted-foreground">
          <p>
            {outcome.sent.length} sent · {outcome.invalid.length} invalid · {outcome.failed.length} failed
            {outcome.failed.length + outcome.invalid.length > 0 &&
              ". The ones that didn't get it are still in the recipients box."}
          </p>
          {outcome.firstError && <p className="text-destructive">Reason: {outcome.firstError}</p>}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Resend's free plan sends up to 100 emails a day. Until your domain is verified in Resend, emails only reach
        your own Resend sign-up address.
      </p>
    </div>
  );
}
