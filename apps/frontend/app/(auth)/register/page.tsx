import type { Metadata } from "next";

import { AuthForm } from "@/components/auth/auth-form";
import { safeNext } from "@/lib/safe-next";

export const metadata: Metadata = {
  title: "Create an account",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { next } = await searchParams;

  return <AuthForm mode="register" next={safeNext(next)} />;
}
