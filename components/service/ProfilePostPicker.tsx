"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PreviewPost } from "@/lib/socialPreview";
export default function ProfilePostPicker({
  platform,
  onSelect,
}: {
  platform: string;
  onSelect: (url: string) => void;
}) {
  const [enabled, setEnabled] = useState(false);
  const [username, setUsername] = useState("");
  const [posts, setPosts] = useState<PreviewPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    let active = true;
    fetch("/api/social/preview")
      .then((r) => r.json())
      .then((data) => {
        if (active) setEnabled(Boolean(data.enabled));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  if (!enabled || !["instagram", "tiktok", "twitter"].includes(platform))
    return null;
  async function preview() {
    setLoading(true);
    setMessage("");
    setPosts([]);
    try {
      const response = await fetch("/api/social/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, username }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setPosts(data.posts);
      if (!data.posts.length)
        setMessage(
          "No selectable posts found. Paste your public post URL above.",
        );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to preview posts",
      );
    } finally {
      setLoading(false);
    }
  }
  return (
    <details className="rounded-lg border border-border p-3 text-sm">
      <summary className="cursor-pointer font-medium">
        Choose a public post by username
      </summary>
      <div className="mt-3 flex gap-2">
        <Input
          aria-label="Public profile username"
          placeholder="@username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
        />
        <Button
          type="button"
          variant="outline"
          disabled={!username.trim() || loading}
          onClick={preview}
        >
          {loading ? "Loading…" : "Find posts"}
        </Button>
      </div>
      {message && (
        <p role="status" className="mt-2 text-xs text-muted-foreground">
          {message}
        </p>
      )}
      <div className="mt-2 grid gap-2">
        {posts.map((post) => (
          <button
            type="button"
            key={post.url}
            onClick={() => onSelect(post.url)}
            className="break-all rounded-lg border border-border p-2 text-left hover:border-brand-500"
          >
            <span className="block text-xs font-medium">{post.title}</span>
            <span className="text-xs text-muted-foreground">{post.url}</span>
          </button>
        ))}
      </div>
    </details>
  );
}
