import { Suspense } from "react";
import AuthCard from "@/components/auth/AuthCard";
import LoginForm from "@/components/auth/LoginForm";

export const metadata = { title: "Sign in | Surgeon" };

export default function LoginPage() {
  return (
    <AuthCard title="Welcome back" subtitle="Sign in to manage your orders and wallet.">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthCard>
  );
}
