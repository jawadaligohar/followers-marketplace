"use client";

import { signOut } from "next-auth/react";
import { LogOut, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function getInitials(name?: string | null) {
  if (!name) return null;
  const parts = name.trim().split(/\s+/);
  const initials = parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
  return initials || null;
}

export default function UserMenu({ name, email }: { name?: string | null; email?: string | null }) {
  const initials = getInitials(name);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-3 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
        <div className="hidden text-right sm:block">
          <div className="text-sm font-medium">{name ?? "Account"}</div>
          <div className="text-xs text-muted-foreground">{email}</div>
        </div>
        <Avatar className="h-9 w-9 border border-border bg-gradient-to-br from-brand-500 to-accent-500">
          <AvatarFallback className="bg-transparent text-xs font-semibold text-white">
            {initials ?? <User className="h-4 w-4" />}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="text-sm font-medium">{name ?? "Account"}</div>
          <div className="text-xs font-normal text-muted-foreground">{email}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
