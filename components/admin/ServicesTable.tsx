"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Trash2, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
      toast.success("Service deleted");
    } else {
      toast.error("Failed to delete service");
    }
  }

  function handleSaved() {
    setEditing(null);
    window.location.reload();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="brand" onClick={() => setEditing("new")} className="gap-2">
          <Plus className="h-4 w-4" />
          New service
        </Button>
      </div>

      <Card className="overflow-x-auto border-white/10 bg-white/[0.03] p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10">
              <TableHead>Platform</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Tiers</TableHead>
              <TableHead>Active</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((svc) => (
              <TableRow key={svc._id} className="border-white/5">
                <TableCell>{svc.platformLabel}</TableCell>
                <TableCell className="text-white/70">{svc.category}</TableCell>
                <TableCell className="text-white/70">{svc.tiers.length} tiers</TableCell>
                <TableCell>
                  <Badge variant={svc.active ? "completed" : "cancelled"} className="rounded-full">
                    {svc.active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditing(svc)}
                      className="text-white/50 hover:text-white"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(svc._id)}
                      className="text-white/50 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

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
