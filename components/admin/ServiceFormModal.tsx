"use client";

import { useState } from "react";
import { X, Plus, Trash2, Loader2 } from "lucide-react";

export type ServiceFormTier = {
  qty: string;
  qtyValue: number;
  priceCents: number;
  highlight?: boolean;
};

export type ServiceFormData = {
  _id?: string;
  platformId: string;
  platformLabel: string;
  category: string;
  active: boolean;
  tiers: ServiceFormTier[];
};

const EMPTY: ServiceFormData = {
  platformId: "",
  platformLabel: "",
  category: "Followers",
  active: true,
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
  const [error, setError] = useState<string | null>(null);

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
    setError(null);
    setSaving(true);

    const url = form._id ? `/api/admin/services/${form._id}` : "/api/admin/services";
    const method = form._id ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platformId: form.platformId,
        platformLabel: form.platformLabel,
        category: form.category,
        active: form.active,
        tiers: form.tiers,
        sortOrder: 0,
      }),
    });

    const data = await res.json().catch(() => ({}));
    setSaving(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
      return;
    }

    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/10 bg-[#0d0f1d] p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{form._id ? "Edit service" : "New service"}</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/50">Platform ID</label>
            <input
              value={form.platformId}
              onChange={(e) => setForm((p) => ({ ...p, platformId: e.target.value }))}
              placeholder="instagram"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/50">Platform Label</label>
            <input
              value={form.platformLabel}
              onChange={(e) => setForm((p) => ({ ...p, platformLabel: e.target.value }))}
              placeholder="Instagram"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/50">Category</label>
            <input
              value={form.category}
              onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
              placeholder="Followers"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-brand-500"
            />
          </div>
          <div className="flex items-end gap-2">
            <label className="flex items-center gap-2 text-sm text-white/70">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))}
              />
              Active
            </label>
          </div>
        </div>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs font-medium text-white/50">Pricing tiers</label>
            <button
              type="button"
              onClick={addTier}
              className="flex items-center gap-1 text-xs text-accent-500 hover:underline"
            >
              <Plus className="h-3.5 w-3.5" /> Add tier
            </button>
          </div>

          <div className="space-y-2">
            {form.tiers.map((tier, i) => (
              <div key={i} className="grid grid-cols-12 gap-2">
                <input
                  value={tier.qty}
                  onChange={(e) => updateTier(i, { qty: e.target.value })}
                  placeholder="Label (e.g. 1,000)"
                  className="col-span-4 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none"
                />
                <input
                  type="number"
                  value={tier.qtyValue || ""}
                  onChange={(e) => updateTier(i, { qtyValue: parseInt(e.target.value) || 0 })}
                  placeholder="Qty"
                  className="col-span-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none"
                />
                <input
                  type="number"
                  value={tier.priceCents ? (tier.priceCents / 100).toString() : ""}
                  onChange={(e) =>
                    updateTier(i, { priceCents: Math.round(parseFloat(e.target.value || "0") * 100) })
                  }
                  placeholder="Price $"
                  step="0.01"
                  className="col-span-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none"
                />
                <label className="col-span-1 flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={!!tier.highlight}
                    onChange={(e) => updateTier(i, { highlight: e.target.checked })}
                    title="Highlight"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => removeTier(i)}
                  className="col-span-1 flex items-center justify-center text-white/30 hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-xl border border-white/15 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
