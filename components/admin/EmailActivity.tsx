"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import type { adminEmailActivity } from "@/lib/adminActivity";
export default function EmailActivity({
  messages,
  configured,
}: {
  messages: Awaited<ReturnType<typeof adminEmailActivity>>["rows"];
  configured: boolean;
}) {
  const [rows, setRows] = useState(messages);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState<{
    subject: string;
    text: string;
  } | null>(null);
  async function view(id: string) {
    setBusy(id);
    try {
      const response = await fetch(`/api/admin/emails/${id}`);
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setPreview(result.message);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to read message",
      );
    } finally {
      setBusy(null);
    }
  }
  async function retry(id: string) {
    if (
      !confirm(
        "Send this queued transactional email to its original recipient?",
      )
    )
      return;
    setBusy(id);
    setMessage("");
    try {
      const response = await fetch("/api/admin/benefits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sendEmail", id }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setRows((previous) =>
        previous.map((row) =>
          row.id === id ? { ...row, status: "sent", lastError: null } : row,
        ),
      );
      setMessage("Email accepted by the configured provider.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Email send failed");
    } finally {
      setBusy(null);
    }
  }
  return (
    <div className="space-y-3">
      {!configured && (
        <p
          role="status"
          className="rounded-lg border border-amber-500/40 p-3 text-sm"
        >
          Email sending is not configured. Messages remain queued until
          RESEND_API_KEY and EMAIL_FROM are set.
        </p>
      )}
      {message && (
        <p role="status" className="text-sm">
          {message}
        </p>
      )}
      {preview && (
        <section
          aria-label="Email preview"
          className="rounded-xl border border-border p-4"
        >
          <div className="flex justify-between">
            <h2 className="font-semibold">{preview.subject}</h2>
            <Button variant="ghost" size="sm" onClick={() => setPreview(null)}>
              Close preview
            </Button>
          </div>
          <pre className="mt-3 whitespace-pre-wrap break-all text-xs">
            {preview.text}
          </pre>
        </section>
      )}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              {[
                "Recipient / subject",
                "Status",
                "Attempts / timestamps",
                "Provider reference",
                "Actions",
              ].map((title) => (
                <th key={title} className="p-3">
                  {title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-border">
                <td className="p-3">
                  <p className="font-medium">{row.to}</p>
                  <p>{row.subject}</p>
                  <p className="text-xs text-muted-foreground">{row.kind}</p>
                </td>
                <td className="p-3">
                  {row.status === "sent" ? "Accepted by provider" : "Queued"}
                  {row.lastError && (
                    <p className="mt-1 max-w-52 text-xs text-amber-600">
                      {row.lastError}
                    </p>
                  )}
                </td>
                <td className="p-3 text-xs">
                  <p>{row.attempts} attempts</p>
                  {row.lastAttemptAt && (
                    <p>
                      Last attempt {formatDateTime(row.lastAttemptAt).date}{" "}
                      {formatDateTime(row.lastAttemptAt).time}
                    </p>
                  )}
                  <p>
                    Created {formatDateTime(row.createdAt).date}{" "}
                    {formatDateTime(row.createdAt).time}
                  </p>
                  {row.sentAt && (
                    <p>
                      Accepted {formatDateTime(row.sentAt).date}{" "}
                      {formatDateTime(row.sentAt).time}
                    </p>
                  )}
                </td>
                <td className="max-w-48 break-all p-3 text-xs">
                  {row.providerMessageId || "Not recorded"}
                </td>
                <td className="p-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={busy === row.id}
                    onClick={() => view(row.id)}
                  >
                    View email
                  </Button>
                  {row.status === "pending" && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!configured || busy === row.id}
                      onClick={() => retry(row.id)}
                    >
                      Send queued email
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && (
          <p className="p-5 text-sm text-muted-foreground">
            No matching emails.
          </p>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Accepted means the provider accepted the send request; delivery, opens
        and bounces are not tracked. Message previews may contain private
        customer links.
      </p>
    </div>
  );
}
