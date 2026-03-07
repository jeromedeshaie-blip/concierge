import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createBooking } from "@/lib/actions/bookings";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";

export default async function NewBookingPage({
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

  if (profile?.role !== "admin" && profile?.role !== "manager") {
    redirect("/dashboard/bookings");
  }

  const { data: properties } = await supabase
    .from("properties")
    .select("id, name")
    .is("deleted_at", null)
    .order("name");

  const availableProperties = properties || [];

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/dashboard/bookings"
        className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Retour aux réservations
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Ajouter une réservation</CardTitle>
          <CardDescription>
            Renseignez les informations de la nouvelle réservation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <form action={createBooking} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="property_id">Propriété</Label>
              <select
                id="property_id"
                name="property_id"
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none"
                required
              >
                <option value="">Sélectionner une propriété</option>
                {availableProperties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="guest_name">Nom du voyageur</Label>
              <Input
                id="guest_name"
                name="guest_name"
                placeholder="Jean Dupont"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="guest_email">Email du voyageur</Label>
              <Input
                id="guest_email"
                name="guest_email"
                type="email"
                placeholder="jean@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="guest_phone">Téléphone du voyageur</Label>
              <Input
                id="guest_phone"
                name="guest_phone"
                type="tel"
                placeholder="+41 79 123 45 67"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="guest_count">Nombre de voyageurs</Label>
              <Input
                id="guest_count"
                name="guest_count"
                type="number"
                min={1}
                defaultValue={1}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="check_in">Check-in</Label>
                <Input
                  id="check_in"
                  name="check_in"
                  type="date"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="check_out">Check-out</Label>
                <Input
                  id="check_out"
                  name="check_out"
                  type="date"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="status">Statut</Label>
                <select
                  id="status"
                  name="status"
                  className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none"
                >
                  <option value="confirmed">Confirmée</option>
                  <option value="cancelled">Annulée</option>
                  <option value="completed">Terminée</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="source">Source</Label>
                <select
                  id="source"
                  name="source"
                  className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none"
                >
                  <option value="direct">Direct</option>
                  <option value="airbnb">Airbnb</option>
                  <option value="booking">Booking.com</option>
                  <option value="other">Autre</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_amount">Montant total (CHF)</Label>
              <Input
                id="total_amount"
                name="total_amount"
                type="number"
                step={0.01}
                min={0}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Notes optionnelles..."
              />
            </div>

            <Button type="submit" className="w-full">
              Ajouter la réservation
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
