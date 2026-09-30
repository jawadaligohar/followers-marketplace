import AuthCard from "@/components/auth/AuthCard";
import SignupForm from "@/components/auth/SignupForm";

export const metadata = { title: "Sign up | Surgeon" };

export default function SignupPage() {
  return (
    <AuthCard title="Create your account" subtitle="Start growing your social presence today.">
      <SignupForm />
    </AuthCard>
  );
}
