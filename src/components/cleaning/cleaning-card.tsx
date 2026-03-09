import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CleaningStatusBadge,
  PriorityBadge,
} from "./cleaning-status-badge";
import { Home, Calendar, User, CheckSquare } from "lucide-react";
import { Link } from "@/i18n/routing";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { CleaningTask } from "@/lib/actions/cleaning";

interface CleaningCardProps {
  task: CleaningTask;
}

export function CleaningCard({ task }: CleaningCardProps) {
  const totalItems = task.checklist_items?.length ?? 0;
  const doneItems =
    task.checklist_items?.filter((i) => i.is_done).length ?? 0;
  const progress =
    totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold">{task.title}</h3>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <Home className="h-3 w-3" />
              {task.properties?.name}
            </div>
          </div>
          <div className="flex gap-2">
            <PriorityBadge priority={task.priority} />
            <CleaningStatusBadge status={task.status} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(task.scheduled_date), "dd MMM yyyy", {
                locale: fr,
              })}
            </div>
            {task.profiles && (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {task.profiles.full_name}
              </div>
            )}
          </div>

          {totalItems > 0 && (
            <div>
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <div className="flex items-center gap-1">
                  <CheckSquare className="h-3 w-3" />
                  {doneItems}/{totalItems} tâches
                </div>
                <span>{progress}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <Link href={`/dashboard/cleaning/${task.id}`}>
            <Button size="sm" className="w-full">
              {task.status === "pending"
                ? "Démarrer le ménage"
                : "Voir la check-list"}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
