"use client";

import { useTabs } from "../contexts/TabsContext";
import { findTabEntry } from "../lib/tabRegistry";

export function TabContent() {
  const { tabs, activeTab } = useTabs();

  return (
    <>
      {tabs.map((tab) => {
        const entry = findTabEntry(tab.path);
        if (!entry) return null;
        const { Component } = entry;
        const isActive = tab.path === activeTab;
        return (
          <div
            key={tab.path}
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
