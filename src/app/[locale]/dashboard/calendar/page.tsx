import {
  getCalendarBookings,
  getCalendarProperties,
} from "@/lib/actions/calendar";
import { BookingCalendar } from "@/components/calendar/booking-calendar";
import { getTranslations } from "next-intl/server";

export default async function CalendarPage() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const t = await getTranslations("calendar");

  const [bookings, properties] = await Promise.all([
    getCalendarBookings(year, month),
    getCalendarProperties(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      <BookingCalendar
        initialBookings={bookings}
        properties={properties}
        initialYear={year}
        initialMonth={month}
      />
    </div>
  );
}
