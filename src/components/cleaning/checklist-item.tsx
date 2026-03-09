"use client";

import { useState } from "react";
import { toggleChecklistItem } from "@/lib/actions/cleaning";
import { Check } from "lucide-react";
import type { ChecklistItem } from "@/lib/actions/cleaning";

interface ChecklistItemProps {
  item: ChecklistItem;
}

export function ChecklistItemRow({ item }: ChecklistItemProps) {
  const [isDone, setIsDone] = useState(item.is_done);
  const [isLoading, setIsLoading] = useState(false);

  async function handleToggle() {
    setIsLoading(true);
    const newValue = !isDone;
    setIsDone(newValue);
    try {
      await toggleChecklistItem(item.id, newValue);
    } catch {
      setIsDone(isDone);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      className={`
        flex items-center gap-3 p-3 rounded-lg cursor-pointer
        transition-colors hover:bg-gray-50
        ${isDone ? "opacity-60" : ""}
        ${isLoading ? "pointer-events-none" : ""}
      `}
      onClick={handleToggle}
    >
      <div
        className={`
        w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0
        transition-colors
        ${
          isDone
            ? "bg-green-500 border-green-500"
            : "border-gray-300 hover:border-green-400"
        }
      `}
      >
        {isDone && <Check className="h-4 w-4 text-white" />}
      </div>

      <span
        className={`text-sm ${isDone ? "line-through text-muted-foreground" : ""}`}
      >
        {item.label}
      </span>
    </div>
  );
}
