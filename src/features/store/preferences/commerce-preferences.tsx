"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { CommerceSettings } from "@/domain/commerce-settings";
import { DEFAULT_COMMERCE_SETTINGS } from "@/domain/commerce-settings";

const CommercePreferencesContext = createContext<CommerceSettings>(DEFAULT_COMMERCE_SETTINGS);

export function CommercePreferencesProvider({ value, children }: { value: CommerceSettings; children: ReactNode }) {
  return <CommercePreferencesContext.Provider value={value}>{children}</CommercePreferencesContext.Provider>;
}

export function useCommercePreferences(): CommerceSettings {
  return useContext(CommercePreferencesContext);
}
