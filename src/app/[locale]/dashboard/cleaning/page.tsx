import { getCleaningTasks, generateTodayCleanings } from "@/lib/actions/cleaning";
import { CleaningCard } from "@/components/cleaning/cleaning-card";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { Plus, RefreshCw } from "lucide-react";

const TABS = [
  { key: "pending", label: "À faire" },
  { key: "in_progress", label: "En cours" },
  { key: "done", label: "Terminés" },
  { key: "all", label: "Tous" },
] as const;

export default async function CleaningPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = "pending" } = await searchParams;
  const t = await getTranslations("cleaning");

  const tasks = await getCleaningTasks(tab === "all" ? undefined : tab);

  // Get counts for all tabs
  const [pending, inProgress, done, all] = await Promise.all([
    getCleaningTasks("pending"),
    getCleaningTasks("in_progress"),
    getCleaningTasks("done"),
    getCleaningTasks(),
  ]);
  const counts: Record<string, number> = {
    pending: pending.length,
    in_progress: inProgress.length,
    done: done.length,
    all: all.length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <form action={generateTodayCleanings}>
            <Button variant="outline" type="submit">
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline ml-2">{t("generate")}</span>
            </Button>
          </form>
        </div>
      </div>

      {/* Tabs via links */}
      <div className="flex gap-1 border-b">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/dashboard/cleaning?tab=${t.key}`}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label} ({counts[t.key] ?? 0})
          </Link>
        ))}
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Aucun ménage dans cette catégorie
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => (
            <CleaningCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}
