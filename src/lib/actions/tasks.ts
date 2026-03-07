"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createTask(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const property_id = (formData.get("property_id") as string)?.trim();
  const type = (formData.get("type") as string)?.trim();
  const title = (formData.get("title") as string)?.trim();

  if (!property_id || !type || !title) {
    redirect(
      "/dashboard/tasks/new?error=" +
        encodeURIComponent("Propriété, type et titre sont obligatoires.")
    );
  }

  const booking_id =
    (formData.get("booking_id") as string)?.trim() || null;
  const assigned_to =
    (formData.get("assigned_to") as string)?.trim() || null;
  const description =
    (formData.get("description") as string)?.trim() || null;
  const due_date =
    (formData.get("due_date") as string)?.trim() || null;
  const priority = (formData.get("priority") as string) || "medium";
  const status = (formData.get("status") as string) || "pending";

  const { error } = await supabase.from("tasks").insert({
    property_id,
    booking_id,
    assigned_to,
    type,
    status,
    priority,
    title,
    description,
    due_date: due_date || null,
  });

  if (error) {
    redirect(
      "/dashboard/tasks/new?error=" + encodeURIComponent(error.message)
    );
  }

  revalidatePath("/dashboard/tasks");
  redirect("/dashboard/tasks");
}

export async function deleteTask(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const taskId = formData.get("task_id") as string;
  if (!taskId) {
    redirect(
      "/dashboard/tasks?error=" +
        encodeURIComponent("Tâche introuvable.")
    );
  }

  const { error } = await supabase
    .from("tasks")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", taskId);

  if (error) {
    redirect(
      "/dashboard/tasks?error=" + encodeURIComponent(error.message)
    );
  }

  revalidatePath("/dashboard/tasks");
  redirect("/dashboard/tasks");
}
