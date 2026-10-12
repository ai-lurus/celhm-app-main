"use client";

import { useTabs } from "../contexts/TabsContext";
import { findTabEntry } from "../lib/tabRegistry";

export function TabContent() {
  const { tabs, activeTab } = useTabs();

  return (
    <>
      {tabs.map((tab) => {
        // Resolve against the tab's current sub-route, not its (possibly
        // group-canonical) key, so moving between grouped routes — e.g.
        // Inventario -> Categorías inside the "Catálogo" tab — renders the
        // right screen without opening a new tab.
        const entry = findTabEntry(tab.currentPath);
        if (!entry) return null;
        const { Component } = entry;
        const isActive = tab.key === activeTab;
        return (
          <div
            key={tab.key}
            // Hidden tabs stay mounted (display:none) so their state, open
            // modals and in-flight work survive switching away and back.
            style={{ display: isActive ? "block" : "none" }}
            className="h-full"
          >
            <Component />
          </div>
        );
      })}
    </>
  );
}
