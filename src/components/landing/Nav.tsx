import { createClient } from "@/lib/supabase/server";
import { userHasAdminRole } from "@/lib/auth/rbac";
import { NavClient } from "./NavClient";

export async function Nav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdmin = user ? await userHasAdminRole(supabase, user.id) : false;

  return <NavClient user={user ? { email: user.email ?? null } : null} isAdmin={isAdmin} />;
}
