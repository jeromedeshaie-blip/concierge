"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface CleaningTask {
  id: string;
  title: string;
  scheduled_date: string;
  status: "pending" | "in_progress" | "done" | "cancelled";
  priority: "low" | "normal" | "urgent";
  notes: string | null;
  property_id: string;
  booking_id: string | null;
  assigned_to: string | null;
  completed_at: string | null;
  properties: { name: string } | null;
  profiles: { full_name: string } | null;
  checklist_items: ChecklistItem[];
}

export interface ChecklistItem {
  id: string;
  label: string;
  is_done: boolean;
  done_at: string | null;
  position: number;
}

export async function getCleaningTasks(
  status?: string
): Promise<CleaningTask[]> {
  const supabase = await createClient();

  let query = supabase
    .from("cleaning_tasks")
    .select(
      `
      *,
      properties(name),
      profiles(full_name),
      checklist_items(*)
    `
    )
    .order("scheduled_date", { ascending: true })
    .order("position", {
      referencedTable: "checklist_items",
      ascending: true,
    });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) {
    console.error("getCleaningTasks error:", error);
    return [];
  }

  return (data ?? []) as CleaningTask[];
}

export async function getCleaningTask(
  id: string
): Promise<CleaningTask | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("cleaning_tasks")
    .select(
      `
      *,
      properties(name, address),
      profiles(full_name),
      checklist_items(*)
    `
    )
    .eq("id", id)
    .order("position", {
      referencedTable: "checklist_items",
      ascending: true,
    })
    .single();

  if (error) return null;
  return data as CleaningTask;
}

export async function createCleaningTask(formData: FormData) {
  const supabase = await createClient();

  const bookingId = (formData.get("booking_id") as string) || null;
  const assignedTo = (formData.get("assigned_to") as string) || null;

  const { error } = await supabase.rpc("create_cleaning_task", {
    p_property_id: formData.get("property_id") as string,
    p_booking_id: bookingId,
    p_scheduled_date: formData.get("scheduled_date") as string,
    p_assigned_to: assignedTo,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/cleaning");
}

export async function toggleChecklistItem(itemId: string, isDone: boolean) {
  const supabase = await createClient();

  const { error } = await supabase.rpc("toggle_checklist_item", {
    p_item_id: itemId,
    p_is_done: isDone,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/cleaning");
}

export async function updateCleaningStatus(
  taskId: string,
  status: CleaningTask["status"]
) {
  const supabase = await createClient();

  const updates: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (status === "in_progress") updates.started_at = new Date().toISOString();
  if (status === "done") updates.completed_at = new Date().toISOString();

  const { error } = await supabase
    .from("cleaning_tasks")
    .update(updates)
    .eq("id", taskId);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/cleaning");
}

export async function generateTodayCleanings() {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  const { data: departures } = await supabase
    .from("bookings")
    .select("id, property_id")
    .eq("check_out", today)
    .eq("status", "confirmed")
    .is("deleted_at", null);

  if (!departures?.length) return;

  let created = 0;
  for (const booking of departures) {
    await supabase.rpc("create_cleaning_task", {
      p_property_id: booking.property_id,
      p_booking_id: booking.id,
      p_scheduled_date: today,
      p_assigned_to: null,
    });
    created++;
  }

  revalidatePath("/dashboard/cleaning");
}
