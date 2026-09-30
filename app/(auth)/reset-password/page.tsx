import { Suspense } from "react";
import AuthCard from "@/components/auth/AuthCard";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

export const metadata = { title: "Reset password | Surgeon" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params.token ?? "";

  return (
    <AuthCard title="Set a new password" subtitle="Choose a strong password for your account.">
      <Suspense fallback={null}>
        <ResetPasswordForm token={token} />
      </Suspense>
    </AuthCard>
  );
}
