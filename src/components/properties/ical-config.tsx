"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { saveIcalUrls, triggerManualSync } from "@/lib/actions/ical";

interface IcalConfigProps {
  propertyId: string;
  initialAirbnbUrl?: string | null;
  initialBookingUrl?: string | null;
  lastSync?: string | null;
}

export function IcalConfig({
  propertyId,
  initialAirbnbUrl,
  initialBookingUrl,
  lastSync,
}: IcalConfigProps) {
  const [airbnbUrl, setAirbnbUrl] = useState(initialAirbnbUrl ?? "");
  const [bookingUrl, setBookingUrl] = useState(initialBookingUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      await saveIcalUrls(propertyId, airbnbUrl || null, bookingUrl || null);
      setMessage({ type: "success", text: "URLs sauvegardées" });
    } catch {
      setMessage({ type: "error", text: "Erreur lors de la sauvegarde" });
    } finally {
      setSaving(false);
    }
  }

  async function handleSync() {
    setSyncing(true);
    setMessage(null);
    try {
      const result = await triggerManualSync(propertyId);
      const total =
        result.results?.reduce(
          (acc: number, r: { synced?: number }) => acc + (r.synced ?? 0),
          0
        ) ?? 0;
      setMessage({
        type: "success",
        text: `Synchronisation réussie — ${total} réservation(s) importée(s)`,
      });
    } catch {
      setMessage({
        type: "error",
        text: "Erreur lors de la synchronisation",
      });
    } finally {
      setSyncing(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Synchronisation iCal</CardTitle>
        <CardDescription>
          Importez automatiquement vos réservations Airbnb et Booking.com
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {lastSync && (
          <p className="text-xs text-muted-foreground">
            Dernière sync : {new Date(lastSync).toLocaleString("fr-CH")}
          </p>
        )}

        <div className="space-y-2">
          <Label>URL iCal Airbnb</Label>
          <Input
            placeholder="https://www.airbnb.com/calendar/ical/..."
            value={airbnbUrl}
            onChange={(e) => setAirbnbUrl(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Airbnb &rarr; Calendrier &rarr; Exporter le calendrier &rarr;
            Copier le lien
          </p>
        </div>

        <div className="space-y-2">
          <Label>URL iCal Booking.com</Label>
          <Input
            placeholder="https://admin.booking.com/hotel/hoteladmin/ical.html?..."
            value={bookingUrl}
            onChange={(e) => setBookingUrl(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Booking.com &rarr; Extranet &rarr; Calendrier &rarr;
            Synchronisation &rarr; Exporter
          </p>
        </div>

        {message && (
          <div
            className={`flex items-center gap-2 text-sm ${
              message.type === "success" ? "text-green-600" : "text-red-600"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle className="size-4" />
            ) : (
              <AlertCircle className="size-4" />
            )}
            {message.text}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Sauvegarde..." : "Sauvegarder"}
          </Button>
          <Button
            variant="outline"
            onClick={handleSync}
            disabled={syncing}
          >
            <RefreshCw
              className={`size-4 ${syncing ? "animate-spin" : ""}`}
            />
            {syncing ? "Synchronisation..." : "Synchroniser maintenant"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
