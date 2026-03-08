import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import ical from "node-ical";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const { data: properties, error } = await supabaseAdmin
      .from("properties")
      .select("id, name, ical_airbnb_url, ical_booking_url")
      .or("ical_airbnb_url.not.is.null,ical_booking_url.not.is.null");

    if (error) throw error;

    const results = [];

    for (const property of properties ?? []) {
      const syncs = [
        { url: property.ical_airbnb_url, source: "airbnb" },
        { url: property.ical_booking_url, source: "booking" },
      ];

      for (const { url, source } of syncs) {
        if (!url) continue;

        try {
          const events = await ical.async.fromURL(url);
          let count = 0;

          for (const event of Object.values(events)) {
            if (!event || event.type !== "VEVENT") continue;
            if (!event.start || !event.end) continue;

            const checkIn = new Date(event.start);
            const checkOut = new Date(event.end);
            const rawSummary =
              "summary" in event ? event.summary : undefined;
            const summaryStr =
              typeof rawSummary === "string"
                ? rawSummary
                : rawSummary && typeof rawSummary === "object" && "val" in rawSummary
                  ? rawSummary.val
                  : undefined;
            const guestName =
              summaryStr
                ?.replace("Airbnb (", "")
                .replace(")", "")
                .replace("Reserved", "Invité") ?? `Invité ${source}`;

            await supabaseAdmin.rpc("upsert_ical_booking", {
              p_property_id: property.id,
              p_external_uid: event.uid,
              p_guest_name: guestName,
              p_check_in: checkIn.toISOString().split("T")[0],
              p_check_out: checkOut.toISOString().split("T")[0],
              p_source: source,
            });

            count++;
          }

          await supabaseAdmin.rpc("update_ical_last_sync", {
            p_property_id: property.id,
          });

          results.push({ property: property.name, source, synced: count });
        } catch (err) {
          results.push({
            property: property.name,
            source,
            error: String(err),
          });
        }
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // Vercel cron sends GET — forward to POST handler
  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${process.env.CRON_SECRET}`) {
    return POST(request);
  }
  return NextResponse.json(
    { message: "API iCal sync opérationnelle" },
    { status: 200 }
  );
}
