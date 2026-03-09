import { Badge } from "@/components/ui/badge";

const STATUS_CONFIG = {
  pending: { label: "À faire", variant: "outline" as const },
  in_progress: { label: "En cours", variant: "default" as const },
  done: { label: "Terminé", variant: "secondary" as const },
  cancelled: { label: "Annulé", variant: "destructive" as const },
};

const PRIORITY_CONFIG = {
  low: { label: "Basse", variant: "secondary" as const },
  normal: { label: "Normale", variant: "outline" as const },
  urgent: { label: "Urgent", variant: "destructive" as const },
};

export function CleaningStatusBadge({
  status,
}: {
  status: keyof typeof STATUS_CONFIG;
}) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function PriorityBadge({
  priority,
}: {
  priority: keyof typeof PRIORITY_CONFIG;
}) {
  const config = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.normal;
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
