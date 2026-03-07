export interface Task {
  id: string;
  property_id: string;
  booking_id: string | null;
  assigned_to: string | null;
  type: "cleaning" | "maintenance" | "inspection" | "welcome";
  status: "pending" | "in_progress" | "completed" | "cancelled";
  priority: "low" | "medium" | "high" | "urgent";
  title: string;
  description: string | null;
  due_date: string | null;
  completed_at: string | null;
  checklist: unknown[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface TaskWithRelations extends Task {
  properties: {
    name: string;
  };
  profiles: {
    full_name: string;
  } | null;
  bookings: {
    guest_name: string;
  } | null;
}

export const typeLabels: Record<Task["type"], string> = {
  cleaning: "Ménage",
  maintenance: "Maintenance",
  inspection: "Inspection",
  welcome: "Accueil",
};

export const taskStatusLabels: Record<Task["status"], string> = {
  pending: "En attente",
  in_progress: "En cours",
  completed: "Terminée",
  cancelled: "Annulée",
};

export const priorityLabels: Record<Task["priority"], string> = {
  low: "Basse",
  medium: "Moyenne",
  high: "Haute",
  urgent: "Urgente",
};
