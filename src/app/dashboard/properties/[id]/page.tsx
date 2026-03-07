import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateProperty } from "@/lib/actions/properties";
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

export default async function EditPropertyPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
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

  if (profile?.role !== "admin" && profile?.role !== "owner") {
    redirect("/dashboard/properties");
  }

  const { data: property } = await supabase
    .from("properties")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!property) {
    notFound();
  }

  const isAdmin = profile?.role === "admin";

  let owners: { id: string; full_name: string }[] = [];
  if (isAdmin) {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "owner")
      .is("deleted_at", null)
      .order("full_name");
    owners = data || [];
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/dashboard/properties"
        className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Retour aux propriétés
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Modifier la propriété</CardTitle>
          <CardDescription>
            Modifiez les informations de {property.name}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <form action={updateProperty} className="space-y-4">
            <input type="hidden" name="property_id" value={property.id} />

            <div className="space-y-2">
              <Label htmlFor="name">Nom de la propriété</Label>
              <Input
                id="name"
                name="name"
                placeholder="Chalet Les Étoiles"
                required
                defaultValue={property.name}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Input
                id="address"
                name="address"
                placeholder="Route de Nendaz 42, 1997 Haute-Nendaz"
                required
                defaultValue={property.address}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Description optionnelle de la propriété..."
                defaultValue={property.description || ""}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="bedrooms">Chambres</Label>
                <Input
                  id="bedrooms"
                  name="bedrooms"
                  type="number"
                  min={1}
                  defaultValue={property.bedrooms}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bathrooms">Salles de bain</Label>
                <Input
                  id="bathrooms"
                  name="bathrooms"
                  type="number"
                  min={1}
                  defaultValue={property.bathrooms}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_guests">Capacité max</Label>
                <Input
                  id="max_guests"
                  name="max_guests"
                  type="number"
                  min={1}
                  defaultValue={property.max_guests}
                  required
                />
              </div>
            </div>

            {isAdmin && owners.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="owner_id">Propriétaire</Label>
                <select
                  id="owner_id"
                  name="owner_id"
                  className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none"
                  required
                  defaultValue={property.owner_id}
                >
                  {owners.map((owner) => (
                    <option key={owner.id} value={owner.id}>
                      {owner.full_name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <Button type="submit" className="w-full">
              Enregistrer les modifications
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
