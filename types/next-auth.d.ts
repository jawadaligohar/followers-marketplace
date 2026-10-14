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
    sessionVersion?: number;
    role?: "customer" | "admin";
    walletBalanceCents?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sessionVersion?: number;
    id?: string;
    role?: "customer" | "admin";
    walletBalanceCents?: number;
  }
}
