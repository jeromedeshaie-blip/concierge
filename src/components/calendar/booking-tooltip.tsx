import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { CalendarBooking } from "@/lib/actions/calendar";

const SOURCE_LABELS: Record<string, string> = {
  airbnb: "Airbnb",
  booking: "Booking.com",
  manual: "Manuel",
  direct: "Direct",
  other: "Autre",
};

interface BookingTooltipProps {
  booking: CalendarBooking;
}

export function BookingTooltip({ booking }: BookingTooltipProps) {
  return (
    <div className="bg-white border rounded-lg shadow-lg p-3 text-sm min-w-[200px] z-50">
      <p className="font-bold text-gray-900">{booking.guest_name}</p>
      <p className="text-gray-600">{booking.property_name}</p>
      <div className="mt-2 space-y-1 text-gray-500">
        <p>
          {format(new Date(booking.check_in), "dd MMM", { locale: fr })}
          {" → "}
          {format(new Date(booking.check_out), "dd MMM yyyy", { locale: fr })}
        </p>
        <p>{SOURCE_LABELS[booking.source] ?? booking.source}</p>
      </div>
    </div>
  );
}
