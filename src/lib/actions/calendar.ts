"use server";

import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";

export interface CalendarBooking {
  id: string;
  guest_name: string;
  property_id: string;
  property_name: string;
  check_in: string;
  check_out: string;
  status: string;
  source: string;
}

export async function getCalendarBookings(
  year: number,
  month: number,
  propertyId?: string
): Promise<CalendarBooking[]> {
  const supabase = await createClient();

  const monthStart = format(new Date(year, month - 1, 1), "yyyy-MM-dd");
  const monthEnd = format(new Date(year, month, 0), "yyyy-MM-dd");

  let query = supabase
    .from("bookings")
    .select(
      `
      id,
      guest_name,
      property_id,
      check_in,
      check_out,
      status,
      source,
      properties(name)
    `
    )
    .is("deleted_at", null)
    .gte("check_out", monthStart)
    .lte("check_in", monthEnd)
    .neq("status", "cancelled")
    .order("check_in");

  if (propertyId && propertyId !== "all") {
    query = query.eq("property_id", propertyId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("getCalendarBookings error:", error);
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((b: any) => ({
    id: b.id,
    guest_name: b.guest_name,
    property_id: b.property_id,
    property_name: b.properties?.name ?? "",
    check_in: b.check_in,
    check_out: b.check_out,
    status: b.status,
    source: b.source ?? "manual",
  }));
}

export async function getCalendarProperties() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("properties")
    .select("id, name")
    .is("deleted_at", null)
    .order("name");
  return data ?? [];
}
