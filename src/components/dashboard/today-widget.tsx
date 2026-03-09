import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { TodayMovements } from "@/lib/actions/dashboard";

interface TodayWidgetProps {
  movements: TodayMovements;
}

export async function TodayWidget({ movements }: TodayWidgetProps) {
  const t = await getTranslations("dashboard.today");
  const arrivals = movements.arrivals ?? [];
  const departures = movements.departures ?? [];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center gap-2 pb-2">
          <ArrowDownToLine className="size-4 text-green-600" />
          <CardTitle className="text-sm">
            {t("arrivals")} ({arrivals.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {arrivals.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("no_arrivals")}
            </p>
          ) : (
            <ul className="space-y-1">
              {arrivals.map((a) => (
                <li key={a.id} className="text-sm">
                  <span className="font-medium">{a.guest_name}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    — {a.property_name}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2 pb-2">
          <ArrowUpFromLine className="size-4 text-orange-500" />
          <CardTitle className="text-sm">
            {t("departures")} ({departures.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {departures.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("no_departures")}
            </p>
          ) : (
            <ul className="space-y-1">
              {departures.map((d) => (
                <li key={d.id} className="text-sm">
                  <span className="font-medium">{d.guest_name}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    — {d.property_name}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
