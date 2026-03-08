import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  CalendarDays,
  ClipboardList,
  Percent,
} from "lucide-react";
import { statusLabels, sourceLabels } from "@/lib/types/booking";
import { taskStatusLabels, priorityLabels } from "@/lib/types/task";
import type { BookingWithProperty } from "@/lib/types/booking";
import type { TaskWithRelations } from "@/lib/types/task";

const statusVariant: Record<string, "default" | "destructive" | "outline"> = {
  confirmed: "default",
  cancelled: "destructive",
  completed: "outline",
};

const priorityVariant: Record<
  string,
  "default" | "destructive" | "outline" | "secondary"
> = {
  low: "outline",
  medium: "secondary",
  high: "default",
  urgent: "destructive",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  const today = new Date().toISOString().split("T")[0];
  const weekEnd = new Date(Date.now() + 7 * 86_400_000)
    .toISOString()
    .split("T")[0];

  const [
    { count: propertiesCount },
    { data: occupiedProperties },
    { count: weekCheckInsCount },
    { count: pendingTasksCount },
    { data: upcomingBookings },
    { data: pendingTasks },
  ] = await Promise.all([
    // Total properties
    supabase
      .from("properties")
      .select("*", { count: "exact", head: true })
      .is("deleted_at", null),
    // Properties with an active booking today (for occupancy rate)
    supabase
      .from("bookings")
      .select("property_id")
      .is("deleted_at", null)
      .eq("status", "confirmed")
      .lte("check_in", today)
      .gte("check_out", today),
    // Check-ins this week
    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .is("deleted_at", null)
      .eq("status", "confirmed")
      .gte("check_in", today)
      .lte("check_in", weekEnd),
    // Pending tasks
    supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .is("deleted_at", null)
      .in("status", ["pending", "in_progress"]),
    // Upcoming bookings list (next 5)
    supabase
      .from("bookings")
      .select("*, properties(name)")
      .is("deleted_at", null)
      .eq("status", "confirmed")
      .gte("check_out", today)
      .order("check_in", { ascending: true })
      .limit(5),
    // Pending tasks list (next 5)
    supabase
      .from("tasks")
      .select("*, properties(name), profiles(full_name)")
      .is("deleted_at", null)
      .in("status", ["pending", "in_progress"])
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(5),
  ]);

  const totalProps = propertiesCount ?? 0;
  const occupiedCount = new Set(
    (occupiedProperties ?? []).map(
      (b: { property_id: string }) => b.property_id
    )
  ).size;
  const occupancyRate =
    totalProps > 0 ? Math.round((occupiedCount / totalProps) * 100) : 0;

  const stats = [
    {
      label: "Propriétés",
      value: totalProps,
      icon: Building2,
      href: "/dashboard/properties",
    },
    {
      label: "Taux d'occupation",
      value: `${occupancyRate}%`,
      icon: Percent,
      href: "/dashboard/bookings",
    },
    {
      label: "Arrivées cette semaine",
      value: weekCheckInsCount ?? 0,
      icon: CalendarDays,
      href: "/dashboard/bookings",
    },
    {
      label: "Tâches en cours",
      value: pendingTasksCount ?? 0,
      icon: ClipboardList,
      href: "/dashboard/tasks",
    },
  ];

  const bookingsList = (upcomingBookings as BookingWithProperty[]) || [];
  const tasksList = (pendingTasks as TaskWithRelations[]) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
        <p className="mt-1 text-muted-foreground">
          Bienvenue, {profile?.full_name || "Utilisateur"}.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="transition-colors hover:border-foreground/20">
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="rounded-lg bg-muted p-2.5">
                  <stat.icon className="size-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Prochaines réservations</CardTitle>
            <CardDescription>
              Réservations confirmées à venir.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {bookingsList.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucune réservation à venir.
              </p>
            ) : (
              <div className="space-y-4">
                {bookingsList.map((booking) => (
                  <Link
                    key={booking.id}
                    href={`/dashboard/bookings/${booking.id}`}
                    className="block rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {booking.guest_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {booking.properties.name}
                        </p>
                      </div>
                      <Badge
                        variant={statusVariant[booking.status] ?? "default"}
                      >
                        {statusLabels[booking.status]}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {booking.check_in} → {booking.check_out}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant="secondary">
                        {sourceLabels[booking.source]}
                      </Badge>
                      {booking.total_amount != null && (
                        <span className="text-sm font-medium">
                          {booking.total_amount.toFixed(2)} CHF
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tâches en cours</CardTitle>
            <CardDescription>
              Tâches en attente ou en cours de traitement.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tasksList.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucune tâche en cours.
              </p>
            ) : (
              <div className="space-y-4">
                {tasksList.map((task) => (
                  <Link
                    key={task.id}
                    href={`/dashboard/tasks/${task.id}`}
                    className="block rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{task.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {task.properties.name}
                        </p>
                      </div>
                      <Badge
                        variant={priorityVariant[task.priority] ?? "secondary"}
                      >
                        {priorityLabels[task.priority]}
                      </Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <Badge variant="outline">
                        {taskStatusLabels[task.status]}
                      </Badge>
                      {task.profiles && (
                        <span className="text-sm text-muted-foreground">
                          → {task.profiles.full_name}
                        </span>
                      )}
                    </div>
                    {task.due_date && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        Échéance :{" "}
                        {new Date(task.due_date).toLocaleDateString("fr-CH")}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
