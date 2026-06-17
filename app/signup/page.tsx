import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthPageClient } from "@/components/AuthPageClient";

export const metadata: Metadata = {
  title: "Sign up"
};

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="container-page py-10 text-token-muted">Loading...</div>}>
      <AuthPageClient mode="signup" />
    </Suspense>
  );
}
