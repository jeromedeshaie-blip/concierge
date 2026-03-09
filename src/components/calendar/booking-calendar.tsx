"use client";

import { useState, useTransition } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
} from "date-fns";
import { CalendarHeader } from "./calendar-header";
import { CalendarDay } from "./calendar-day";
import { CalendarLegend } from "./calendar-legend";
import { getCalendarBookings } from "@/lib/actions/calendar";
import type { CalendarBooking } from "@/lib/actions/calendar";
import { useRouter } from "@/i18n/routing";

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

interface BookingCalendarProps {
  initialBookings: CalendarBooking[];
  properties: { id: string; name: string }[];
  initialYear: number;
  initialMonth: number;
}

export function BookingCalendar({
  initialBookings,
  properties,
  initialYear,
  initialMonth,
}: BookingCalendarProps) {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(
    new Date(initialYear, initialMonth - 1, 1)
  );
  const [selectedProperty, setSelectedProperty] = useState("all");
  const [bookings, setBookings] =
    useState<CalendarBooking[]>(initialBookings);
  const [isPending, startTransition] = useTransition();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  async function handleDateChange(newDate: Date) {
    setCurrentDate(newDate);
    startTransition(async () => {
      const data = await getCalendarBookings(
        newDate.getFullYear(),
        newDate.getMonth() + 1,
        selectedProperty === "all" ? undefined : selectedProperty
      );
      setBookings(data);
    });
  }

  async function handlePropertyChange(propertyId: string) {
    setSelectedProperty(propertyId);
    startTransition(async () => {
      const data = await getCalendarBookings(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        propertyId === "all" ? undefined : propertyId
      );
      setBookings(data);
    });
  }

  function handleDateClick(date: Date) {
    const dateStr = format(date, "yyyy-MM-dd");
    router.push(`/dashboard/bookings/new?check_in=${dateStr}`);
  }

  return (
    <div className={isPending ? "opacity-60 pointer-events-none" : ""}>
      <CalendarHeader
        currentDate={currentDate}
        properties={properties}
        selectedProperty={selectedProperty}
        onDateChange={handleDateChange}
        onPropertyChange={handlePropertyChange}
      />

      <CalendarLegend />

      <div className="border rounded-lg overflow-hidden">
        <div className="grid grid-cols-7 bg-gray-100">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="text-center text-sm font-medium text-gray-600 py-2 border-b"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {days.map((day) => (
            <CalendarDay
              key={day.toISOString()}
              date={day}
              currentMonth={currentDate}
              bookings={bookings}
              onDateClick={handleDateClick}
            />
          ))}
        </div>
      </div>

      {isPending && (
        <p className="text-center text-sm text-gray-500 mt-4">
          Chargement...
        </p>
      )}
    </div>
  );
}
