import type { Metadata } from "next";

import { AuthForm } from "@/components/auth/auth-form";
import { safeNext } from "@/lib/safe-next";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { next } = await searchParams;

  return <AuthForm mode="login" next={safeNext(next)} />;
}
