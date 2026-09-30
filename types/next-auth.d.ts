import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "customer" | "admin";
      walletBalanceCents: number;
    } & DefaultSession["user"];
  }

  interface User {
    role?: "customer" | "admin";
    walletBalanceCents?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "customer" | "admin";
    walletBalanceCents?: number;
  }
}
