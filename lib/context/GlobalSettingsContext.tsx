"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getGlobalSettings, updateGlobalSettings, GlobalSettings } from "../services/globalSettingsService";

interface GlobalSettingsContextType {
  settings: GlobalSettings | null;
  loading: boolean;
  updateSettings: (updates: Partial<GlobalSettings>) => Promise<void>;
}

const GlobalSettingsContext = createContext<GlobalSettingsContextType | undefined>(undefined);

export function GlobalSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    setLoading(true);
    // Subscribe to real-time updates
    unsub = getGlobalSettings((data) => {
      setSettings(data);
      setLoading(false);
    });
    return () => {
      if (unsub) unsub();
    };
  }, []);

  const updateSettings = async (updates: Partial<GlobalSettings>) => {
    if (!settings) return;
    await updateGlobalSettings({ ...settings, ...updates });
  };

  return (
    <GlobalSettingsContext.Provider value={{ settings, loading, updateSettings }}>
      {children}
    </GlobalSettingsContext.Provider>
  );
}

export function useGlobalSettings() {
  const ctx = useContext(GlobalSettingsContext);
  if (!ctx) throw new Error("useGlobalSettings must be used within GlobalSettingsProvider");
  return ctx;
}
