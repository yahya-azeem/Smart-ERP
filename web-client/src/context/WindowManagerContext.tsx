import React, { createContext, useContext, useState } from 'react';

interface Tab {
  id: string;
  title: string;
  component: React.ReactNode;
}

interface WindowManagerContextType {
  tabs: Tab[];
  activeTabId: string | null;
  openTab: (id: string, title: string, component: React.ReactNode) => void;
  closeTab: (id: string) => void;
  setActiveTabId: (id: string) => void;
}

const WindowManagerContext = createContext<WindowManagerContextType | null>(null);

export const WindowManagerProvider = ({ children }: { children: React.ReactNode }) => {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  const openTab = (id: string, title: string, component: React.ReactNode) => {
    if (!tabs.find((t) => t.id === id)) {
      setTabs((prev) => [...prev, { id, title, component }]);
    } else {
      setTabs((prev) => prev.map((t) => t.id === id ? { ...t, component } : t));
    }
    setActiveTabId(id);
  };

  const closeTab = (id: string) => {
    setTabs((prev) => prev.filter((t) => t.id !== id));
    if (activeTabId === id) {
      setActiveTabId(null);
    }
  };

  return (
    <WindowManagerContext.Provider value={{ tabs, activeTabId, openTab, closeTab, setActiveTabId }}>
      {children}
    </WindowManagerContext.Provider>
  );
};

export const useWindowManager = () => {
  const context = useContext(WindowManagerContext);
  if (!context) throw new Error('useWindowManager must be used within WindowManagerProvider');
  return context;
};
