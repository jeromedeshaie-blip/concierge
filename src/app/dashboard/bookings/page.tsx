import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Building2, CalendarDays, Users } from "lucide-react";
import { BookingCardActions } from "./delete-booking-button";
import type { BookingWithProperty } from "@/lib/types/booking";
import { statusLabels, sourceLabels } from "@/lib/types/booking";

const statusVariant: Record<string, "default" | "destructive" | "outline"> = {
  confirmed: "default",
  cancelled: "destructive",
  completed: "outline",
};

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();

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

  const { data } = await supabase
    .from("bookings")
    .select("*, properties(name)")
    .is("deleted_at", null)
    .order("check_in", { ascending: false });

  const bookings = (data as BookingWithProperty[]) || [];

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Réservations</h1>
          <p className="mt-1 text-muted-foreground">
            Gestion des réservations.
          </p>
        </div>
        {canCreate && (
          <Link href="/dashboard/bookings/new">
            <Button>
              <Plus className="size-4" data-icon="inline-start" />
              Ajouter
            </Button>
          </Link>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-muted-foreground">
            Aucune réservation pour le moment.
          </p>
          {canCreate && (
            <Link
              href="/dashboard/bookings/new"
              className="mt-4 inline-block"
            >
              <Button variant="outline">
                <Plus className="size-4" data-icon="inline-start" />
                Ajouter une réservation
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bookings.map((booking) => (
            <Card key={booking.id}>
              <CardHeader>
                <CardTitle>{booking.guest_name}</CardTitle>
                {canDelete && (
                  <CardAction>
                    <BookingCardActions
                      bookingId={booking.id}
                      guestName={booking.guest_name}
                    />
                  </CardAction>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="size-4 shrink-0" />
                  <span>{booking.properties.name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays className="size-4 shrink-0" />
                  <span>
                    {booking.check_in} → {booking.check_out}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant={statusVariant[booking.status] ?? "default"}
                  >
                    {statusLabels[booking.status]}
                  </Badge>
                  <Badge variant="secondary">
                    {sourceLabels[booking.source]}
                  </Badge>
                </div>
                {booking.total_amount != null && (
                  <p className="text-sm font-medium">
                    {booking.total_amount.toFixed(2)} CHF
                  </p>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="size-4 shrink-0" />
                  <span>
                    {booking.guest_count} voyageur
                    {booking.guest_count > 1 ? "s" : ""}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
