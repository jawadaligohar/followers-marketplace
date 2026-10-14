"use client";

import { motion } from "motion/react";
import {
  compactQty,
  linkLabel,
  linkPlaceholder,
  POLL_OPTIONS,
  type LinkTarget,
  type PlatformId,
  type ServiceKind,
} from "@/lib/catalog";
import { centsToUsd } from "@/lib/pricing";
import type { ServiceDoc, TierDoc } from "@/lib/serviceDocs";
import type { LineDraft } from "./useLineDraft";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const chip = (active: boolean) =>
  cn(
    "relative rounded-lg border px-2 py-2 text-xs font-medium transition",
    active
      ? "border-brand-500 bg-brand-500/10 text-foreground"
      : "border-border text-muted-foreground hover:border-brand-500/30 hover:text-foreground"
  );

export function TierPicker({
  tiers,
  value,
  onChange,
  showPrices = false,
}: {
  tiers: TierDoc[];
  value: number;
  onChange: (qtyValue: number) => void;
  showPrices?: boolean;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {tiers.map((tier) => (
        <motion.button
          key={tier.qtyValue}
          type="button"
          onClick={() => onChange(tier.qtyValue)}
          whileTap={{ scale: 0.95 }}
          aria-pressed={value === tier.qtyValue}
          className={cn(chip(value === tier.qtyValue), showPrices && "py-2.5")}
        >
          {showPrices && tier.highlight && (
            <span className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-brand-500 px-1.5 text-[9px] font-semibold uppercase tracking-wide text-white">
              Popular
            </span>
          )}
          <span className="block text-sm font-semibold text-foreground">{compactQty(tier.qtyValue)}</span>
          {showPrices && <span className="block text-[11px]">${centsToUsd(tier.priceCents)}</span>}
        </motion.button>
      ))}
    </div>
  );
}

export function PostsLimitPicker({
  tier,
  value,
  onChange,
}: {
  tier: TierDoc;
  value: number;
  onChange: (posts: number) => void;
}) {
  const options = tier.postsOptions ?? [];
  if (options.length < 2) {
    return (
      <p className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
        Covers your next {options[0]?.posts ?? 30} posts over a 30-day plan.
      </p>
    );
  }
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">Posts limit</p>
      <div className="grid grid-cols-4 gap-2">
        {options.map((o) => (
          <button key={o.posts} type="button" onClick={() => onChange(o.posts)} className={chip(value === o.posts)}>
            <span className="block font-semibold text-foreground">{o.posts} posts</span>
            <span className="block text-[11px]">{o.priceCents ? `+$${centsToUsd(o.priceCents)}` : "Included"}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function LinkField({
  service,
  id,
  value,
  onChange,
}: {
  service: { platformId: string; target: LinkTarget; kind: ServiceKind };
  id: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const platformId = service.platformId as PlatformId;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {linkLabel(platformId, service.target)}
      </Label>
      <Input
        id={id}
        type="text"
        inputMode="url"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={linkPlaceholder(platformId, service.target)}
      />
      <p className="text-[11px] text-muted-foreground/70">
        {service.kind === "auto"
          ? "Your profile must be public. New posts are detected automatically."
          : "Make sure the account is public. We never ask for your password."}
      </p>
    </div>
  );
}

export function CommentsField({
  id,
  count,
  value,
  onChange,
}: {
  id: string;
  count: number;
  value: string[];
  onChange: (comments: string[]) => void;
}) {
  const filled = value.filter((c) => c.trim()).length;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-xs text-muted-foreground">
          Your comments (one per line)
        </Label>
        <span className={cn("text-[11px] font-medium", filled === count ? "text-emerald-600" : "text-muted-foreground")}>
          {filled} / {count}
        </span>
      </div>
      <textarea
        id={id}
        rows={Math.min(8, Math.max(4, count / 4))}
        value={value.join("\n")}
        onChange={(e) => onChange(e.target.value.split("\n"))}
        placeholder={"Love this!\nWhere was this taken?\nSo good 🔥"}
        className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
      />
    </div>
  );
}

export function PollOptionField({ value, onChange }: { value?: number; onChange: (option: number) => void }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">Poll option to vote for</p>
      <div className="grid grid-cols-4 gap-2">
        {POLL_OPTIONS.map((n) => (
          <button key={n} type="button" onClick={() => onChange(n)} className={chip(value === n)}>
            Option {n}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Kind-specific inputs (posts limit, comments, poll option) for a draft line. */
export function DraftExtras({
  service,
  draft,
  idPrefix,
}: {
  service: ServiceDoc;
  draft: LineDraft;
  idPrefix: string;
}) {
  if (!draft.tier) return null;
  switch (service.kind) {
    case "auto":
      return <PostsLimitPicker tier={draft.tier} value={draft.postsCovered} onChange={draft.setPostsCovered} />;
    case "comments":
      return (
        <CommentsField
          id={`${idPrefix}-comments`}
          count={draft.tier.qtyValue}
          value={draft.comments}
          onChange={draft.setComments}
        />
      );
    case "poll":
      return <PollOptionField value={draft.pollOption} onChange={draft.setPollOption} />;
    default:
      return null;
  }
}
