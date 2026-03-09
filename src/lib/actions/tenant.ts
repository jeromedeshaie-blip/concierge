"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function createTenant(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const name = formData.get("name") as string;
  const slug = generateSlug(name);

  const { error } = await supabase.rpc("create_tenant", {
    p_name: name,
    p_slug: slug,
    p_owner_id: user.id,
  });

  if (error) {
    redirect(
      `/onboarding?error=${encodeURIComponent(error.message)}`
    );
  }

  redirect("/dashboard");
}

export async function getCurrentTenant() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id, tenants(*)")
    .eq("id", user.id)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return profile?.tenants as any;
}

export async function checkTenantLimits() {
  const supabase = await createClient();
  const tenant = await getCurrentTenant();
  if (!tenant) return { canAddProperty: false, canAddUser: false };

  const { count: propCount } = await supabase
    .from("properties")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenant.id);

  const { count: userCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenant.id);

  return {
    canAddProperty: (propCount ?? 0) < tenant.max_properties,
    canAddUser: (userCount ?? 0) < tenant.max_users,
    tenant,
  };
}
