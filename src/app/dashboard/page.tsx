import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Home, CalendarCheck, ClipboardList, TrendingUp } from "lucide-react";
import {
  getDashboardStats,
  getTodayMovements,
  getOccupation7Days,
} from "@/lib/actions/dashboard";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { OccupationChart } from "@/components/dashboard/occupation-chart";
import { TodayWidget } from "@/components/dashboard/today-widget";

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
    .select("full_name")
    .eq("id", user.id)
    .single();

  const [stats, movements, occupation] = await Promise.all([
    getDashboardStats(),
    getTodayMovements(),
    getOccupation7Days(),
  ]);

  const revenueFormatted = new Intl.NumberFormat("fr-CH", {
    style: "currency",
    currency: "CHF",
    maximumFractionDigits: 0,
  }).format(stats.revenue_month);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
        <p className="mt-1 text-muted-foreground">
          Bienvenue, {profile?.full_name || "Utilisateur"}.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard
          title="Propriétés actives"
          value={stats.total_properties}
          icon={Home}
          color="text-blue-600"
        />
        <KpiCard
          title="Réservations en cours"
          value={stats.active_bookings}
          icon={CalendarCheck}
          color="text-green-600"
        />
        <KpiCard
          title="Tâches à faire"
          value={stats.pending_tasks}
          icon={ClipboardList}
          color="text-orange-500"
        />
        <KpiCard
          title="Revenus du mois"
          value={revenueFormatted}
          icon={TrendingUp}
          color="text-purple-600"
        />
      </div>

      {/* Graphique occupation */}
      <OccupationChart data={occupation} />

      {/* Arrivées / Départs */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Mouvements du jour</h2>
        <TodayWidget movements={movements} />
      </div>
    </div>
  );
}
