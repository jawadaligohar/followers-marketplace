"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

export type AdminUserRow = {
  _id: string;
  name: string;
  email: string;
  role: "customer" | "admin";
  walletBalanceCents: number;
  createdAt: string;
};

export default function UsersTable({ users }: { users: AdminUserRow[] }) {
  const [rows, setRows] = useState(users);
  const [adjusting, setAdjusting] = useState<string | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  async function handleRoleChange(id: string, role: string) {
    setBusy(id);
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    setBusy(null);
    if (res.ok) {
      setRows((prev) => prev.map((u) => (u._id === id ? { ...u, role: role as "customer" | "admin" } : u)));
    }
  }

  async function handleWalletAdjust(id: string) {
    const raw = adjustAmount[id];
    const dollars = parseFloat(raw ?? "");
    if (isNaN(dollars) || dollars === 0) return;

    setBusy(id);
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walletAdjustmentCents: Math.round(dollars * 100) }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(null);

    if (res.ok && data.user) {
      setRows((prev) =>
        prev.map((u) => (u._id === id ? { ...u, walletBalanceCents: data.user.walletBalanceCents } : u))
      );
      setAdjustAmount((prev) => ({ ...prev, [id]: "" }));
      setAdjusting(null);
    }
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-white/40">
            <th className="px-4 py-3 font-medium">User</th>
            <th className="px-4 py-3 font-medium">Role</th>
            <th className="px-4 py-3 font-medium">Wallet</th>
            <th className="px-4 py-3 font-medium">Joined</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((user) => (
            <tr key={user._id} className="border-b border-white/5 last:border-0">
              <td className="px-4 py-3">
                <div>{user.name}</div>
                <div className="text-xs text-white/40">{user.email}</div>
              </td>
              <td className="px-4 py-3">
                <select
                  value={user.role}
                  disabled={busy === user._id}
                  onChange={(e) => handleRoleChange(user._id, e.target.value)}
                  className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white outline-none capitalize"
                >
                  <option value="customer" className="bg-[#0d0f1d]">customer</option>
                  <option value="admin" className="bg-[#0d0f1d]">admin</option>
                </select>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-white/70">${(user.walletBalanceCents / 100).toFixed(2)}</span>
                  {adjusting === user._id ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="+/- $"
                        value={adjustAmount[user._id] ?? ""}
                        onChange={(e) =>
                          setAdjustAmount((prev) => ({ ...prev, [user._id]: e.target.value }))
                        }
                        className="w-24 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white outline-none"
                      />
                      <button
                        onClick={() => handleWalletAdjust(user._id)}
                        disabled={busy === user._id}
                        className="rounded-lg bg-brand-500 px-2 py-1 text-xs font-medium text-white"
                      >
                        {busy === user._id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Apply"}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAdjusting(user._id)}
                      className="text-xs text-accent-500 hover:underline"
                    >
                      Adjust
                    </button>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-white/40">
                {new Date(user.createdAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
