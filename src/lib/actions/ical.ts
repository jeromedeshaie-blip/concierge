"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function saveIcalUrls(
  propertyId: string,
  airbnbUrl: string | null,
  bookingUrl: string | null
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("properties")
    .update({
      ical_airbnb_url: airbnbUrl || null,
      ical_booking_url: bookingUrl || null,
    })
    .eq("id", propertyId);

  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/properties/${propertyId}/ical`);
  return { success: true };
}

export async function triggerManualSync(propertyId: string) {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const response = await fetch(`${baseUrl}/api/ical/sync`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.CRON_SECRET}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) throw new Error("Erreur lors de la synchronisation");

  revalidatePath(`/dashboard/properties/${propertyId}/ical`);
  return await response.json();
}
