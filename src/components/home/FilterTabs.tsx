"use client";

import { cn } from "@/lib/utils";
import type { FilterTab } from "@/types";

interface Tab {
  key: FilterTab;
  label: string;
  count: number;
}

interface Props {
  tabs: Tab[];
  active: FilterTab;
  onChange: (k: FilterTab) => void;
}

export function FilterTabs({ tabs, active, onChange }: Props) {
  return (
    <div
      className="flex flex-wrap gap-1 rounded-xl border border-zinc-200 bg-zinc-100 p-1"
      role="tablist"
      aria-label="Filtrar resultados"
    >
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          role="tab"
          aria-selected={active === tab.key}
          onClick={() => onChange(tab.key)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onChange(tab.key);
            }
          }}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors sm:flex-none",
            active === tab.key
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-500 hover:bg-white/60 hover:text-zinc-900",
          )}
        >
          {tab.label}
          <span
            className={cn(
              "text-[10px] font-bold tabular-nums",
              active === tab.key ? "text-zinc-700" : "text-zinc-400",
            )}
          >
            {tab.count}
          </span>
        </button>
      ))}
    </div>
  );
}
