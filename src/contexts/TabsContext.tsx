"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export interface OpenTab {
  /** Stable identity of this tab (a group's canonical path, or a route's own path). Doubles as its id. */
  key: string;
  label: string;
  /**
   * The actual route currently shown inside this tab. Equal to `key` for an
   * ungrouped tab; for a grouped tab (e.g. key "/dashboard/inventory") it
   * tracks whichever sub-route the user last navigated to inside the group
   * (e.g. "/dashboard/inventory/categories"), without opening a new tab.
   */
  currentPath: string;
}

interface TabsContextValue {
  tabs: OpenTab[];
  activeTab: string;
  openTab: (key: string, label: string, currentPath: string) => void;
  closeTab: (key: string) => void;
  setActiveTab: (key: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

export function TabsProvider({
  initialKey,
  initialLabel,
  initialPath,
  children,
}: {
  initialKey: string;
  initialLabel: string;
  initialPath: string;
  children: ReactNode;
}) {
  const [tabs, setTabs] = useState<OpenTab[]>([
    { key: initialKey, label: initialLabel, currentPath: initialPath },
  ]);
  const [activeTab, setActiveTabState] = useState<string>(initialKey);

  const openTab = useCallback((key: string, label: string, currentPath: string) => {
    setTabs((prev) => {
      const existing = prev.find((t) => t.key === key);
      if (existing) {
        if (existing.currentPath === currentPath) return prev;
        // Already open: just move it to the new sub-route, same tab.
        return prev.map((t) => (t.key === key ? { ...t, currentPath } : t));
      }
      return [...prev, { key, label, currentPath }];
    });
    setActiveTabState(key);
  }, []);

  const setActiveTab = useCallback((key: string) => {
    setActiveTabState(key);
  }, []);

  const closeTab = useCallback((key: string) => {
    setTabs((prev) => {
      if (prev.length <= 1) return prev; // never close the last tab
      const closingIndex = prev.findIndex((t) => t.key === key);
      if (closingIndex === -1) return prev;
      const next = prev.filter((t) => t.key !== key);
      setActiveTabState((currentActive) => {
        if (currentActive !== key) return currentActive;
        // Activate the tab that was to the left, or the new first tab.
        const fallbackIndex = Math.max(0, closingIndex - 1);
        return next[fallbackIndex]?.key ?? next[0].key;
      });
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ tabs, activeTab, openTab, closeTab, setActiveTab }),
    [tabs, activeTab, openTab, closeTab, setActiveTab]
  );

  return <TabsContext.Provider value={value}>{children}</TabsContext.Provider>;
}

export function useTabs() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("useTabs must be used within a TabsProvider");
  return ctx;
}
