"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const fullName = formData.get("full_name")?.toString().trim();
  const phone = formData.get("phone")?.toString().trim() || null;

  if (!fullName) {
    redirect(
      `/dashboard/settings?error=${encodeURIComponent("Le nom complet est requis.")}`
    );
  }

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName, phone })
    .eq("id", user.id);

  if (error) {
    redirect(
      `/dashboard/settings?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath("/dashboard");
  redirect(
    `/dashboard/settings?success=${encodeURIComponent("Profil mis à jour avec succès.")}`
  );
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const newPassword = formData.get("new_password")?.toString();

  if (!newPassword || newPassword.length < 6) {
    redirect(
      `/dashboard/settings?error=${encodeURIComponent("Le mot de passe doit contenir au moins 6 caractères.")}`
    );
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    redirect(
      `/dashboard/settings?error=${encodeURIComponent(error.message)}`
    );
  }

  redirect(
    `/dashboard/settings?success=${encodeURIComponent("Mot de passe modifié avec succès.")}`
  );
}
