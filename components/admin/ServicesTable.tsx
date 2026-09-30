"use client";

import { useState } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import ServiceFormModal, { ServiceFormData } from "./ServiceFormModal";

export type AdminServiceRow = ServiceFormData & { _id: string };

export default function ServicesTable({ services }: { services: AdminServiceRow[] }) {
  const [rows, setRows] = useState(services);
  const [editing, setEditing] = useState<ServiceFormData | null | "new">(null);

  async function handleDelete(id: string) {
    if (!confirm("Delete this service?")) return;
    const res = await fetch(`/api/admin/services/${id}`, { method: "DELETE" });
    if (res.ok) {
      setRows((prev) => prev.filter((s) => s._id !== id));
    }
  }

  function handleSaved() {
    setEditing(null);
    window.location.reload();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setEditing("new")}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-2.5 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" />
          New service
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-white/40">
              <th className="px-4 py-3 font-medium">Platform</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Tiers</th>
              <th className="px-4 py-3 font-medium">Active</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.map((svc) => (
              <tr key={svc._id} className="border-b border-white/5 last:border-0">
                <td className="px-4 py-3">{svc.platformLabel}</td>
                <td className="px-4 py-3 text-white/70">{svc.category}</td>
                <td className="px-4 py-3 text-white/70">{svc.tiers.length} tiers</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs ${
                      svc.active
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-white/5 text-white/40"
                    }`}
                  >
                    {svc.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-3">
                    <button onClick={() => setEditing(svc)} className="text-white/50 hover:text-white">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(svc._id)}
                      className="text-white/50 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <ServiceFormModal
          initial={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
