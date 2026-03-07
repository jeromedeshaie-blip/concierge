"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createProperty(formData: FormData) {
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

  // Admin can assign to another owner, owner is always self
  let ownerId = user.id;
  if (profile?.role === "admin") {
    const formOwnerId = formData.get("owner_id") as string | null;
    if (formOwnerId) ownerId = formOwnerId;
  }

  const name = (formData.get("name") as string)?.trim();
  const address = (formData.get("address") as string)?.trim();

  if (!name || !address) {
    redirect(
      "/dashboard/properties/new?error=" +
        encodeURIComponent("Le nom et l'adresse sont obligatoires.")
    );
  }

  const description =
    (formData.get("description") as string)?.trim() || null;
  const bedrooms = Math.max(
    1,
    parseInt(formData.get("bedrooms") as string) || 1
  );
  const bathrooms = Math.max(
    1,
    parseInt(formData.get("bathrooms") as string) || 1
  );
  const max_guests = Math.max(
    1,
    parseInt(formData.get("max_guests") as string) || 2
  );

  const { error } = await supabase.from("properties").insert({
    owner_id: ownerId,
    name,
    address,
    description,
    bedrooms,
    bathrooms,
    max_guests,
  });

  if (error) {
    redirect(
      "/dashboard/properties/new?error=" + encodeURIComponent(error.message)
    );
  }

  revalidatePath("/dashboard/properties");
  redirect("/dashboard/properties");
}

export async function updateProperty(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const propertyId = (formData.get("property_id") as string)?.trim();
  const name = (formData.get("name") as string)?.trim();
  const address = (formData.get("address") as string)?.trim();

  if (!propertyId || !name || !address) {
    redirect(
      `/dashboard/properties/${propertyId}?error=` +
        encodeURIComponent("Le nom et l'adresse sont obligatoires.")
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const updateData: Record<string, unknown> = {
    name,
    address,
    description:
      (formData.get("description") as string)?.trim() || null,
    bedrooms: Math.max(
      1,
      parseInt(formData.get("bedrooms") as string) || 1
    ),
    bathrooms: Math.max(
      1,
      parseInt(formData.get("bathrooms") as string) || 1
    ),
    max_guests: Math.max(
      1,
      parseInt(formData.get("max_guests") as string) || 2
    ),
  };

  if (profile?.role === "admin") {
    const formOwnerId = formData.get("owner_id") as string | null;
    if (formOwnerId) updateData.owner_id = formOwnerId;
  }

  const { error } = await supabase
    .from("properties")
    .update(updateData)
    .eq("id", propertyId);

  if (error) {
    redirect(
      `/dashboard/properties/${propertyId}?error=` +
        encodeURIComponent(error.message)
    );
  }

  revalidatePath("/dashboard/properties");
  redirect("/dashboard/properties");
}

export async function deleteProperty(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const propertyId = formData.get("property_id") as string;
  if (!propertyId) {
    redirect(
      "/dashboard/properties?error=" +
        encodeURIComponent("Propriété introuvable.")
    );
  }

  const { error } = await supabase
    .from("properties")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", propertyId);

  if (error) {
    redirect(
      "/dashboard/properties?error=" + encodeURIComponent(error.message)
    );
  }

  revalidatePath("/dashboard/properties");
  redirect("/dashboard/properties");
}
