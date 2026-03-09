import { Link } from "@/i18n/routing";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createTask } from "@/lib/actions/tasks";
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

export default async function NewTaskPage({
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
    redirect("/dashboard/tasks");
  }

  const { data: properties } = await supabase
    .from("properties")
    .select("id, name")
    .is("deleted_at", null)
    .order("name");

  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, guest_name")
    .is("deleted_at", null)
    .eq("status", "confirmed")
    .order("check_in", { ascending: false });

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .is("deleted_at", null)
    .order("full_name");

  const availableProperties = properties || [];
  const availableBookings = bookings || [];
  const availableProfiles = profiles || [];

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/dashboard/tasks"
        className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Retour aux tâches
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Ajouter une tâche</CardTitle>
          <CardDescription>
            Renseignez les informations de la nouvelle tâche.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <form action={createTask} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre</Label>
              <Input
                id="title"
                name="title"
                placeholder="Ménage après départ"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                name="type"
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none"
                required
              >
                <option value="cleaning">Ménage</option>
                <option value="maintenance">Maintenance</option>
                <option value="inspection">Inspection</option>
                <option value="welcome">Accueil</option>
              </select>
            </div>

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
              <Label htmlFor="booking_id">Réservation liée</Label>
              <select
                id="booking_id"
                name="booking_id"
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none"
              >
                <option value="">Aucune</option>
                {availableBookings.map((booking) => (
                  <option key={booking.id} value={booking.id}>
                    {booking.guest_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assigned_to">Assigné à</Label>
              <select
                id="assigned_to"
                name="assigned_to"
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none"
              >
                <option value="">Non assigné</option>
                {availableProfiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="priority">Priorité</Label>
                <select
                  id="priority"
                  name="priority"
                  className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none"
                >
                  <option value="low">Basse</option>
                  <option value="medium" selected>Moyenne</option>
                  <option value="high">Haute</option>
                  <option value="urgent">Urgente</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Statut</Label>
                <select
                  id="status"
                  name="status"
                  className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none"
                >
                  <option value="pending">En attente</option>
                  <option value="in_progress">En cours</option>
                  <option value="completed">Terminée</option>
                  <option value="cancelled">Annulée</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_date">Échéance</Label>
              <Input
                id="due_date"
                name="due_date"
                type="datetime-local"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Description optionnelle de la tâche..."
              />
            </div>

            <Button type="submit" className="w-full">
              Ajouter la tâche
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
