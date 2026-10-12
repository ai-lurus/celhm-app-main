"use client";

import { X } from "lucide-react";
import { useTabs } from "../contexts/TabsContext";

export function TabBar() {
  const { tabs, activeTab, setActiveTab, closeTab } = useTabs();

  if (tabs.length <= 1) {
    // Nothing to switch between yet; skip the chrome until a second tab opens.
    return null;
  }

  return (
    <div className="flex items-center gap-1 overflow-x-auto bg-card border-b border-border px-2 flex-shrink-0">
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`group flex items-center gap-2 px-3 py-2 text-sm border-b-2 whitespace-nowrap transition-colors ${
              isActive
                ? "border-blue-500 text-primary font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            }`}
          >
            <span>{tab.label}</span>
            <span
              role="button"
              tabIndex={-1}
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.key);
              }}
              className="rounded hover:bg-muted p-0.5 opacity-60 group-hover:opacity-100"
              aria-label={`Cerrar pestaña ${tab.label}`}
            >
              <X className="w-3.5 h-3.5" />
            </span>
          </button>
        );
      })}
    </div>
  );
}
