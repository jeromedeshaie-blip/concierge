import { Link } from "@/i18n/routing";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { IcalConfig } from "@/components/properties/ical-config";
import { ArrowLeft } from "lucide-react";

export default async function PropertyIcalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: property } = await supabase
    .from("properties")
    .select("id, name, ical_airbnb_url, ical_booking_url, ical_last_sync")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!property) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/dashboard/properties"
        className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Retour aux propriétés
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">{property.name}</h1>
        <p className="mt-1 text-muted-foreground">
          Configuration de la synchronisation iCal
        </p>
      </div>

      <IcalConfig
        propertyId={property.id}
        initialAirbnbUrl={property.ical_airbnb_url}
        initialBookingUrl={property.ical_booking_url}
        lastSync={property.ical_last_sync}
      />
    </div>
  );
}
