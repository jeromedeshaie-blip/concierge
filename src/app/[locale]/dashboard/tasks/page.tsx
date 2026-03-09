import { Link } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Building2, User, CalendarDays, Clock } from "lucide-react";
import { TaskCardActions } from "./delete-task-button";
import { FilterBar } from "@/components/filter-bar";
import type { TaskWithRelations } from "@/lib/types/task";
import {
  typeLabels,
  taskStatusLabels,
  priorityLabels,
} from "@/lib/types/task";

const statusVariant: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
  pending: "outline",
  in_progress: "default",
  completed: "secondary",
  cancelled: "destructive",
};

const priorityVariant: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
  low: "secondary",
  medium: "outline",
  high: "default",
  urgent: "destructive",
};

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    q?: string;
    type?: string;
    status?: string;
    priority?: string;
  }>;
}) {
  const { error, q, type, status, priority } = await searchParams;
  const supabase = await createClient();
  const t = await getTranslations("tasks");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single();

  const canCreate =
    profile?.role === "admin" || profile?.role === "manager";
  const canDelete =
    profile?.role === "admin" || profile?.role === "manager";

  let query = supabase
    .from("tasks")
    .select("*, properties(name), profiles(full_name), bookings(guest_name)")
    .is("deleted_at", null)
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (q) {
    query = query.ilike("title", `%${q}%`);
  }
  if (type) {
    query = query.eq("type", type);
  }
  if (status) {
    query = query.eq("status", status);
  }
  if (priority) {
    query = query.eq("priority", priority);
  }

  const { data } = await query;
  const tasks = (data as TaskWithRelations[]) || [];
  const hasFilters = !!(q || type || status || priority);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="mt-1 text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>
        {canCreate && (
          <Link href="/dashboard/tasks/new">
            <Button>
              <Plus className="size-4" data-icon="inline-start" />
              {t("add")}
            </Button>
          </Link>
        )}
      </div>

      <FilterBar
        searchPlaceholder={t("search")}
        filters={[
          {
            paramKey: "type",
            label: t("all_types"),
            options: Object.entries(typeLabels).map(([value, label]) => ({
              value,
              label,
            })),
          },
          {
            paramKey: "status",
            label: t("all_statuses"),
            options: Object.entries(taskStatusLabels).map(([value, label]) => ({
              value,
              label,
            })),
          },
          {
            paramKey: "priority",
            label: t("all_priorities"),
            options: Object.entries(priorityLabels).map(([value, label]) => ({
              value,
              label,
            })),
          },
        ]}
      />

      {error && (
        <div className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-muted-foreground">
            {hasFilters ? t("empty_filtered") : t("empty")}
          </p>
          {!hasFilters && canCreate && (
            <Link
              href="/dashboard/tasks/new"
              className="mt-4 inline-block"
            >
              <Button variant="outline">
                <Plus className="size-4" data-icon="inline-start" />
                {t("add_long")}
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tasks.map((task) => (
            <Card key={task.id}>
              <CardHeader>
                <CardTitle>{task.title}</CardTitle>
                {canDelete && (
                  <CardAction>
                    <TaskCardActions
                      taskId={task.id}
                      taskTitle={task.title}
                    />
                  </CardAction>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="size-4 shrink-0" />
                  <span>{task.properties.name}</span>
                </div>
                {task.profiles && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="size-4 shrink-0" />
                    <span>{task.profiles.full_name}</span>
                  </div>
                )}
                {task.bookings && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarDays className="size-4 shrink-0" />
                    <span>{task.bookings.guest_name}</span>
                  </div>
                )}
                {task.due_date && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="size-4 shrink-0" />
                    <span>
                      {new Date(task.due_date).toLocaleDateString("fr-CH", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    {typeLabels[task.type]}
                  </Badge>
                  <Badge variant={statusVariant[task.status] ?? "outline"}>
                    {taskStatusLabels[task.status]}
                  </Badge>
                  <Badge variant={priorityVariant[task.priority] ?? "outline"}>
                    {priorityLabels[task.priority]}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
