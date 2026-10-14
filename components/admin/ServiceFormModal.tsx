"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { LinkTarget, ServiceKind } from "@/lib/catalog";

const KINDS: ServiceKind[] = ["standard", "auto", "comments", "poll"];
const TARGETS: LinkTarget[] = ["profile", "post", "video", "reel", "live", "page", "tweet", "space"];
const selectClass =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

export type ServiceFormTier = {
  qty: string;
  qtyValue: number;
  priceCents: number;
  highlight?: boolean;
  /** Auto plans; not editable here, but preserved on save. */
  postsOptions?: { posts: number; priceCents: number }[];
};

export type ServiceFormData = {
  _id?: string;
  slug: string;
  kind: ServiceKind;
  target: LinkTarget;
  platformId: string;
  platformLabel: string;
  category: string;
  active: boolean;
  supplierServiceId?: string | null;
  tiers: ServiceFormTier[];
};

const EMPTY: ServiceFormData = {
  slug: "",
  kind: "standard",
  target: "profile",
  platformId: "",
  platformLabel: "",
  category: "Followers",
  active: true,
  supplierServiceId: "",
  tiers: [{ qty: "100", qtyValue: 100, priceCents: 100 }],
};

export default function ServiceFormModal({
  initial,
  onClose,
  onSaved,
}: {
  initial: ServiceFormData | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<ServiceFormData>(initial ?? EMPTY);
  const [saving, setSaving] = useState(false);

  function updateTier(index: number, patch: Partial<ServiceFormTier>) {
    setForm((prev) => ({
      ...prev,
      tiers: prev.tiers.map((t, i) => (i === index ? { ...t, ...patch } : t)),
    }));
  }

  function addTier() {
    setForm((prev) => ({
      ...prev,
      tiers: [...prev.tiers, { qty: "", qtyValue: 0, priceCents: 0 }],
    }));
  }

  function removeTier(index: number) {
    setForm((prev) => ({ ...prev, tiers: prev.tiers.filter((_, i) => i !== index) }));
  }

  async function handleSave() {
    setSaving(true);

    const url = form._id ? `/api/admin/services/${form._id}` : "/api/admin/services";
    const method = form._id ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      // sortOrder is only sent on create, so editing keeps the service's position.
      body: JSON.stringify({
        slug: form.slug.trim(),
        kind: form.kind,
        target: form.target,
        platformId: form.platformId,
        platformLabel: form.platformLabel,
        category: form.category,
        active: form.active,
        supplierServiceId: form.supplierServiceId?.trim() || null,
        tiers: form.tiers,
        ...(!form._id && { sortOrder: 999 }),
      }),
    });

    const data = await res.json().catch(() => ({}));
    setSaving(false);

    if (!res.ok) {
      toast.error(data.error ?? "Something went wrong");
      return;
    }

    toast.success(form._id ? "Service updated" : "Service created");
    onSaved();
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{form._id ? "Edit service" : "New service"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="slug" className="text-xs text-muted-foreground">
              Slug (URL: /services/slug)
            </Label>
            <Input
              id="slug"
              value={form.slug}
              onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
              placeholder="instagram-likes"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="kind" className="text-xs text-muted-foreground">
                Kind
              </Label>
              <select
                id="kind"
                value={form.kind}
                onChange={(e) => setForm((p) => ({ ...p, kind: e.target.value as ServiceKind }))}
                className={selectClass}
              >
                {KINDS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="target" className="text-xs text-muted-foreground">
                Link target
              </Label>
              <select
                id="target"
                value={form.target}
                onChange={(e) => setForm((p) => ({ ...p, target: e.target.value as LinkTarget }))}
                className={selectClass}
              >
                {TARGETS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="platformId" className="text-xs text-muted-foreground">
              Platform ID
            </Label>
            <Input
              id="platformId"
              value={form.platformId}
              onChange={(e) => setForm((p) => ({ ...p, platformId: e.target.value }))}
              placeholder="instagram"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="platformLabel" className="text-xs text-muted-foreground">
              Platform Label
            </Label>
            <Input
              id="platformLabel"
              value={form.platformLabel}
              onChange={(e) => setForm((p) => ({ ...p, platformLabel: e.target.value }))}
              placeholder="Instagram"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="category" className="text-xs text-muted-foreground">
              Category
            </Label>
            <Input
              id="category"
              value={form.category}
              onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
              placeholder="Followers"
            />
          </div>
          <div className="flex items-end gap-2">
            <label className="flex items-center gap-2 text-sm text-foreground/80">
              <Switch
                checked={form.active}
                onCheckedChange={(checked) => setForm((p) => ({ ...p, active: checked }))}
              />
              Active
            </label>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="supplierServiceId" className="text-xs text-muted-foreground">
                Peakerr Service ID (Automated Fulfillment)
              </Label>
              <span className="text-[11px] text-muted-foreground/70">
                Leave empty for manual processing
              </span>
            </div>
            <Input
              id="supplierServiceId"
              value={form.supplierServiceId ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, supplierServiceId: e.target.value }))}
              placeholder="e.g. 1001 (from your Peakerr panel)"
            />
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Pricing tiers</Label>
            <button
              type="button"
              onClick={addTier}
              className="flex items-center gap-1 text-xs text-brand-600 hover:underline"
            >
              <Plus className="h-3.5 w-3.5" /> Add tier
            </button>
          </div>

          <div className="space-y-2">
            {form.tiers.map((tier, i) => (
              <div key={i} className="grid grid-cols-12 gap-2">
                <Input
                  value={tier.qty}
                  onChange={(e) => updateTier(i, { qty: e.target.value })}
                  placeholder="Label (e.g. 1,000)"
                  className="col-span-4 h-8 text-xs"
                />
                <Input
                  type="number"
                  value={tier.qtyValue || ""}
                  onChange={(e) => updateTier(i, { qtyValue: parseInt(e.target.value) || 0 })}
                  placeholder="Qty"
                  className="col-span-3 h-8 text-xs"
                />
                <Input
                  type="number"
                  value={tier.priceCents ? (tier.priceCents / 100).toString() : ""}
                  onChange={(e) =>
                    updateTier(i, { priceCents: Math.round(parseFloat(e.target.value || "0") * 100) })
                  }
                  placeholder="Price $"
                  step="0.01"
                  className="col-span-3 h-8 text-xs"
                />
                <div className="col-span-1 flex items-center justify-center" title="Highlight">
                  <Switch
                    checked={!!tier.highlight}
                    onCheckedChange={(checked) => updateTier(i, { highlight: checked })}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeTier(i)}
                  className="col-span-1 text-muted-foreground/50 hover:text-rose-500"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="default" onClick={handleSave} disabled={saving} className="gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
