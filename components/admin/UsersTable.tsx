"use client";

import { useState } from "react";
import { toast } from "sonner";
import { motion } from "motion/react";
import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
      toast.success("Role updated");
    } else {
      toast.error("Failed to update role");
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
      toast.success("Wallet balance updated");
    } else {
      toast.error(data.error ?? "Failed to adjust wallet balance");
    }
  }

  return (
    <Card className="overflow-x-auto border-border bg-card p-0">
      <Table>
        <TableHeader>
          <TableRow className="border-border">
            <TableHead>User</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Wallet</TableHead>
            <TableHead>Joined</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((user, i) => (
            <motion.tr
              key={user._id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: Math.min(i * 0.04, 0.4) }}
              className="border-b border-border transition-colors last:border-0 hover:bg-muted/50"
            >
              <TableCell>
                <div>{user.name}</div>
                <div className="text-xs text-muted-foreground">{user.email}</div>
              </TableCell>
              <TableCell>
                <Select
                  value={user.role}
                  disabled={busy === user._id}
                  onValueChange={(value) => handleRoleChange(user._id, value as string)}
                >
                  <SelectTrigger size="sm" className="h-7 text-xs capitalize">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer" className="text-xs">customer</SelectItem>
                    <SelectItem value="admin" className="text-xs">admin</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="text-foreground/80">${(user.walletBalanceCents / 100).toFixed(2)}</span>
                  {adjusting === user._id ? (
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="+/- $"
                        value={adjustAmount[user._id] ?? ""}
                        onChange={(e) =>
                          setAdjustAmount((prev) => ({ ...prev, [user._id]: e.target.value }))
                        }
                        className="h-7 w-24 text-xs"
                      />
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleWalletAdjust(user._id)}
                        disabled={busy === user._id}
                        className="h-7"
                      >
                        {busy === user._id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Apply"}
                      </Button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAdjusting(user._id)}
                      className="text-xs text-brand-600 hover:underline"
                    >
                      Adjust
                    </button>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(user.createdAt).toLocaleDateString()}
              </TableCell>
            </motion.tr>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
