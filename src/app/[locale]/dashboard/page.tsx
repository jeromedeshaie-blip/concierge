import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
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

  const [stats, movements, occupation, t] = await Promise.all([
    getDashboardStats(),
    getTodayMovements(),
    getOccupation7Days(),
    getTranslations("dashboard"),
  ]);

  const revenueFormatted = new Intl.NumberFormat("fr-CH", {
    style: "currency",
    currency: "CHF",
    maximumFractionDigits: 0,
  }).format(stats.revenue_month);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="mt-1 text-muted-foreground">
          {t("welcome", { name: profile?.full_name || "Utilisateur" })}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard
          title={t("kpi.properties")}
          value={stats.total_properties}
          icon={Home}
          color="text-blue-600"
        />
        <KpiCard
          title={t("kpi.bookings")}
          value={stats.active_bookings}
          icon={CalendarCheck}
          color="text-green-600"
        />
        <KpiCard
          title={t("kpi.tasks")}
          value={stats.pending_tasks}
          icon={ClipboardList}
          color="text-orange-500"
        />
        <KpiCard
          title={t("kpi.revenue")}
          value={revenueFormatted}
          icon={TrendingUp}
          color="text-purple-600"
        />
      </div>

      <OccupationChart
        data={occupation}
        title={t("chart.title")}
        tooltipLabel={t("chart.occupation")}
      />

      <div>
        <h2 className="mb-3 text-lg font-semibold">{t("today.title")}</h2>
        <TodayWidget movements={movements} />
      </div>
    </div>
  );
}
