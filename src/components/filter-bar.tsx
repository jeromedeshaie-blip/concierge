"use client";

import { Suspense } from "react";
import { SearchInput } from "@/components/search-input";
import { FilterSelect } from "@/components/filter-select";

interface FilterConfig {
  paramKey: string;
  label: string;
  options: { value: string; label: string }[];
}

interface FilterBarProps {
  searchPlaceholder: string;
  filters?: FilterConfig[];
}

function FilterBarInner({ searchPlaceholder, filters }: FilterBarProps) {
  return (
    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
      <SearchInput placeholder={searchPlaceholder} />
      {filters?.map((f) => (
        <FilterSelect
          key={f.paramKey}
          paramKey={f.paramKey}
          label={f.label}
          options={f.options}
        />
      ))}
    </div>
  );
}

export function FilterBar(props: FilterBarProps) {
  return (
    <Suspense>
      <FilterBarInner {...props} />
    </Suspense>
  );
}
