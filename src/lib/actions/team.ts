"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function inviteMember(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/dashboard/team");
  }

  const full_name = (formData.get("full_name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const role = (formData.get("role") as string)?.trim();

  if (!full_name || !email || !role) {
    redirect(
      "/dashboard/team/new?error=" +
        encodeURIComponent("Nom, email et rôle sont obligatoires.")
    );
  }

  const password = crypto.randomUUID();

  const adminClient = createAdminClient();
  const { error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, role },
  });

  if (error) {
    redirect(
      "/dashboard/team/new?error=" + encodeURIComponent(error.message)
    );
  }

  revalidatePath("/dashboard/team");
  redirect("/dashboard/team");
}

export async function deleteMember(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/dashboard/team");
  }

  const memberId = formData.get("member_id") as string;
  if (!memberId) {
    redirect(
      "/dashboard/team?error=" +
        encodeURIComponent("Membre introuvable.")
    );
  }

  if (memberId === user.id) {
    redirect(
      "/dashboard/team?error=" +
        encodeURIComponent("Vous ne pouvez pas vous supprimer vous-même.")
    );
  }

  const { error } = await supabase
    .from("profiles")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", memberId);

  if (error) {
    redirect(
      "/dashboard/team?error=" + encodeURIComponent(error.message)
    );
  }

  revalidatePath("/dashboard/team");
  redirect("/dashboard/team");
}
