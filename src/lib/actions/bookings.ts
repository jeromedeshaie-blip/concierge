"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createBooking(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const property_id = (formData.get("property_id") as string)?.trim();
  const guest_name = (formData.get("guest_name") as string)?.trim();
  const check_in = (formData.get("check_in") as string)?.trim();
  const check_out = (formData.get("check_out") as string)?.trim();

  if (!property_id || !guest_name || !check_in || !check_out) {
    redirect(
      "/dashboard/bookings/new?error=" +
        encodeURIComponent(
          "Propriété, nom du voyageur, check-in et check-out sont obligatoires."
        )
    );
  }

  if (check_out <= check_in) {
    redirect(
      "/dashboard/bookings/new?error=" +
        encodeURIComponent(
          "La date de check-out doit être postérieure au check-in."
        )
    );
  }

  const guest_email =
    (formData.get("guest_email") as string)?.trim() || null;
  const guest_phone =
    (formData.get("guest_phone") as string)?.trim() || null;
  const guest_count = Math.max(
    1,
    parseInt(formData.get("guest_count") as string) || 1
  );
  const status = (formData.get("status") as string) || "confirmed";
  const source = (formData.get("source") as string) || "direct";
  const notes = (formData.get("notes") as string)?.trim() || null;

  const rawAmount = formData.get("total_amount") as string;
  const total_amount = rawAmount ? parseFloat(rawAmount) || null : null;

  const { error } = await supabase.from("bookings").insert({
    property_id,
    guest_name,
    guest_email,
    guest_phone,
    guest_count,
    check_in,
    check_out,
    status,
    source,
    total_amount,
    notes,
  });

  if (error) {
    redirect(
      "/dashboard/bookings/new?error=" + encodeURIComponent(error.message)
    );
  }

  revalidatePath("/dashboard/bookings");
  redirect("/dashboard/bookings");
}

export async function updateBooking(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const bookingId = (formData.get("booking_id") as string)?.trim();
  const property_id = (formData.get("property_id") as string)?.trim();
  const guest_name = (formData.get("guest_name") as string)?.trim();
  const check_in = (formData.get("check_in") as string)?.trim();
  const check_out = (formData.get("check_out") as string)?.trim();

  if (!bookingId || !property_id || !guest_name || !check_in || !check_out) {
    redirect(
      `/dashboard/bookings/${bookingId}?error=` +
        encodeURIComponent(
          "Propriété, nom du voyageur, check-in et check-out sont obligatoires."
        )
    );
  }

  if (check_out <= check_in) {
    redirect(
      `/dashboard/bookings/${bookingId}?error=` +
        encodeURIComponent(
          "La date de check-out doit être postérieure au check-in."
        )
    );
  }

  const guest_email =
    (formData.get("guest_email") as string)?.trim() || null;
  const guest_phone =
    (formData.get("guest_phone") as string)?.trim() || null;
  const guest_count = Math.max(
    1,
    parseInt(formData.get("guest_count") as string) || 1
  );
  const status = (formData.get("status") as string) || "confirmed";
  const source = (formData.get("source") as string) || "direct";
  const notes = (formData.get("notes") as string)?.trim() || null;

  const rawAmount = formData.get("total_amount") as string;
  const total_amount = rawAmount ? parseFloat(rawAmount) || null : null;

  const { error } = await supabase
    .from("bookings")
    .update({
      property_id,
      guest_name,
      guest_email,
      guest_phone,
      guest_count,
      check_in,
      check_out,
      status,
      source,
      total_amount,
      notes,
    })
    .eq("id", bookingId);

  if (error) {
    redirect(
      `/dashboard/bookings/${bookingId}?error=` +
        encodeURIComponent(error.message)
    );
  }

  revalidatePath("/dashboard/bookings");
  redirect("/dashboard/bookings");
}

export async function deleteBooking(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const bookingId = formData.get("booking_id") as string;
  if (!bookingId) {
    redirect(
      "/dashboard/bookings?error=" +
        encodeURIComponent("Réservation introuvable.")
    );
  }

  const { error } = await supabase
    .from("bookings")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", bookingId);

  if (error) {
    redirect(
      "/dashboard/bookings?error=" + encodeURIComponent(error.message)
    );
  }

  revalidatePath("/dashboard/bookings");
  redirect("/dashboard/bookings");
}
