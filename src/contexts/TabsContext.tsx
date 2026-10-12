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
  /** Pathname this tab represents, e.g. "/dashboard/sales". Also doubles as its id. */
  path: string;
  label: string;
}

interface TabsContextValue {
  tabs: OpenTab[];
  activeTab: string;
  openTab: (path: string, label: string) => void;
  closeTab: (path: string) => void;
  setActiveTab: (path: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

export function TabsProvider({
  initialPath,
  initialLabel,
  children,
}: {
  initialPath: string;
  initialLabel: string;
  children: ReactNode;
}) {
  const [tabs, setTabs] = useState<OpenTab[]>([
    { path: initialPath, label: initialLabel },
  ]);
  const [activeTab, setActiveTabState] = useState<string>(initialPath);

  const openTab = useCallback((path: string, label: string) => {
    setTabs((prev) => {
      if (prev.some((t) => t.path === path)) return prev;
      return [...prev, { path, label }];
    });
    setActiveTabState(path);
  }, []);

  const setActiveTab = useCallback((path: string) => {
    setActiveTabState(path);
  }, []);

  const closeTab = useCallback((path: string) => {
    setTabs((prev) => {
      if (prev.length <= 1) return prev; // never close the last tab
      const closingIndex = prev.findIndex((t) => t.path === path);
      if (closingIndex === -1) return prev;
      const next = prev.filter((t) => t.path !== path);
      setActiveTabState((currentActive) => {
        if (currentActive !== path) return currentActive;
        // Activate the tab that was to the left, or the new first tab.
        const fallbackIndex = Math.max(0, closingIndex - 1);
        return next[fallbackIndex]?.path ?? next[0].path;
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
