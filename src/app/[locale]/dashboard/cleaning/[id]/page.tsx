import {
  getCleaningTask,
  updateCleaningStatus,
} from "@/lib/actions/cleaning";
import { ChecklistItemRow } from "@/components/cleaning/checklist-item";
import { CleaningStatusBadge } from "@/components/cleaning/cleaning-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { notFound } from "next/navigation";
import { ArrowLeft, Home, Calendar } from "lucide-react";
import { Link } from "@/i18n/routing";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default async function CleaningDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const task = await getCleaningTask(id);
  if (!task) notFound();

  const totalItems = task.checklist_items?.length ?? 0;
  const doneItems =
    task.checklist_items?.filter((i) => i.is_done).length ?? 0;
  const progress =
    totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/cleaning">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{task.title}</h1>
          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Home className="h-3 w-3" />
              {task.properties?.name}
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(task.scheduled_date), "dd MMMM yyyy", {
                locale: fr,
              })}
            </div>
          </div>
        </div>
        <CleaningStatusBadge status={task.status} />
      </div>

      {/* Progression */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progression</span>
            <span className="text-sm text-muted-foreground">
              {doneItems}/{totalItems} tâches — {progress}%
            </span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions statut */}
      {task.status !== "done" && (
        <div className="flex gap-2">
          {task.status === "pending" && (
            <form
              action={updateCleaningStatus.bind(
                null,
                task.id,
                "in_progress"
              )}
            >
              <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
                Démarrer le ménage
              </Button>
            </form>
          )}
          {task.status === "in_progress" && (
            <form
              action={updateCleaningStatus.bind(null, task.id, "done")}
            >
              <Button type="submit" className="bg-green-500 hover:bg-green-600">
                Marquer comme terminé
              </Button>
            </form>
          )}
        </div>
      )}

      {/* Check-list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Check-list ({totalItems} points)
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          {task.checklist_items?.map((item) => (
            <ChecklistItemRow key={item.id} item={item} />
          ))}
        </CardContent>
      </Card>

      {/* Notes */}
      {task.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{task.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
