import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AUTH_COOKIE } from "@lattice/shared/api";

export default async function RootPage() {
  const store = await cookies();

  redirect(store.has(AUTH_COOKIE) ? "/dashboard" : "/login");
}
