"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";

interface FilterSelectProps {
  paramKey: string;
  label: string;
  options: { value: string; label: string }[];
}

export function FilterSelect({ paramKey, label, options }: FilterSelectProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const current = searchParams.get(paramKey) ?? "";

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    if (e.target.value) {
      params.set(paramKey, e.target.value);
    } else {
      params.delete(paramKey);
    }
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <select
      value={current}
      onChange={handleChange}
      className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
    >
      <option value="">{label}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
