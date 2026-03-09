"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addMonths, subMonths } from "date-fns";
import { fr } from "date-fns/locale";

interface CalendarHeaderProps {
  currentDate: Date;
  properties: { id: string; name: string }[];
  selectedProperty: string;
  onDateChange: (date: Date) => void;
  onPropertyChange: (propertyId: string) => void;
}

export function CalendarHeader({
  currentDate,
  properties,
  selectedProperty,
  onDateChange,
  onPropertyChange,
}: CalendarHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onDateChange(subMonths(currentDate, 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <h2 className="text-xl font-bold capitalize min-w-[200px] text-center">
          {format(currentDate, "MMMM yyyy", { locale: fr })}
        </h2>

        <Button
          variant="outline"
          size="icon"
          onClick={() => onDateChange(addMonths(currentDate, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onDateChange(new Date())}
        >
          Aujourd&apos;hui
        </Button>
      </div>

      <select
        value={selectedProperty}
        onChange={(e) => onPropertyChange(e.target.value)}
        className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm sm:w-[220px]"
      >
        <option value="all">Toutes les propriétés</option>
        {properties.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    </div>
  );
}
