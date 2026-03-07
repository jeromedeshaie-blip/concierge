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
import { Plus, MapPin, BedDouble, Bath, Users } from "lucide-react";
import { PropertyCardActions } from "./delete-property-button";
import type { Property, PropertyWithOwner } from "@/lib/types/property";

export default async function PropertiesPage({
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

  const isAdmin = profile?.role === "admin";
  const canCreate = isAdmin || profile?.role === "owner";
  const canDelete = isAdmin || profile?.role === "owner";

  let properties: Property[] | PropertyWithOwner[] = [];

  if (isAdmin) {
    const { data } = await supabase
      .from("properties")
      .select("*, profiles(full_name)")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    properties = (data as PropertyWithOwner[]) || [];
  } else {
    const { data } = await supabase
      .from("properties")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    properties = (data as Property[]) || [];
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Propriétés</h1>
          <p className="mt-1 text-muted-foreground">
            Gestion de vos propriétés.
          </p>
        </div>
        {canCreate && (
          <Link href="/dashboard/properties/new">
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

      {properties.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-muted-foreground">
            Aucune propriété pour le moment.
          </p>
          {canCreate && (
            <Link
              href="/dashboard/properties/new"
              className="mt-4 inline-block"
            >
              <Button variant="outline">
                <Plus className="size-4" data-icon="inline-start" />
                Ajouter une propriété
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <Card key={property.id}>
              <CardHeader>
                <CardTitle>{property.name}</CardTitle>
                {canDelete && (
                  <CardAction>
                    <PropertyCardActions
                      propertyId={property.id}
                      propertyName={property.name}
                    />
                  </CardAction>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="mt-0.5 size-4 shrink-0" />
                  <span>{property.address}</span>
                </div>
                {property.description && (
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {property.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    <BedDouble className="size-3" />
                    {property.bedrooms} ch.
                  </Badge>
                  <Badge variant="secondary">
                    <Bath className="size-3" />
                    {property.bathrooms} sdb
                  </Badge>
                  <Badge variant="secondary">
                    <Users className="size-3" />
                    {property.max_guests} pers.
                  </Badge>
                </div>
                {isAdmin && "profiles" in property && (
                  <p className="text-xs text-muted-foreground">
                    Propriétaire : {property.profiles.full_name}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
