"use client";

import { useState } from "react";
import { format, isToday, isSameMonth } from "date-fns";
import { BookingTooltip } from "./booking-tooltip";
import type { CalendarBooking } from "@/lib/actions/calendar";

const SOURCE_COLORS: Record<string, string> = {
  airbnb: "bg-red-400 text-white",
  booking: "bg-blue-400 text-white",
  manual: "bg-gray-400 text-white",
  direct: "bg-gray-400 text-white",
  other: "bg-purple-400 text-white",
};

interface CalendarDayProps {
  date: Date;
  currentMonth: Date;
  bookings: CalendarBooking[];
  onDateClick: (date: Date) => void;
}

export function CalendarDay({
  date,
  currentMonth,
  bookings,
  onDateClick,
}: CalendarDayProps) {
  const [hoveredBooking, setHoveredBooking] = useState<CalendarBooking | null>(
    null
  );

  const isCurrentMonth = isSameMonth(date, currentMonth);
  const isCurrentDay = isToday(date);

  const dayBookings = bookings.filter((b) => {
    const checkIn = new Date(b.check_in);
    const checkOut = new Date(b.check_out);
    const day = new Date(date);
    day.setHours(12, 0, 0, 0);
    checkIn.setHours(0, 0, 0, 0);
    checkOut.setHours(23, 59, 59, 999);
    return day >= checkIn && day <= checkOut;
  });

  return (
    <div
      className={`
        min-h-[100px] p-1 border-b border-r cursor-pointer hover:bg-gray-50 transition-colors
        ${!isCurrentMonth ? "bg-gray-50 opacity-50" : ""}
        ${isCurrentDay ? "bg-blue-50" : ""}
      `}
      onClick={() => onDateClick(date)}
    >
      <div
        className={`
        text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full
        ${isCurrentDay ? "bg-blue-600 text-white" : "text-gray-700"}
      `}
      >
        {format(date, "d")}
      </div>

      <div className="space-y-0.5">
        {dayBookings.slice(0, 3).map((booking) => (
          <div
            key={booking.id}
            className={`
              relative text-xs px-1 py-0.5 rounded truncate cursor-pointer
              ${SOURCE_COLORS[booking.source] ?? SOURCE_COLORS.other}
            `}
            onMouseEnter={() => setHoveredBooking(booking)}
            onMouseLeave={() => setHoveredBooking(null)}
            onClick={(e) => e.stopPropagation()}
          >
            {booking.guest_name}

            {hoveredBooking?.id === booking.id && (
              <div className="absolute left-0 top-6 z-50">
                <BookingTooltip booking={booking} />
              </div>
            )}
          </div>
        ))}

        {dayBookings.length > 3 && (
          <p className="text-xs text-gray-500 px-1">
            +{dayBookings.length - 3} autres
          </p>
        )}
      </div>
    </div>
  );
}
