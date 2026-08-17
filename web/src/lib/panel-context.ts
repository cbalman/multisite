import { createContext, useContext } from "react";
import type { Site, User } from "../lib/types";

export type PanelContextValue = {
  user: User;
  site: Site;
  refreshSite: () => Promise<void>;
};

export const PanelContext = createContext<PanelContextValue | null>(null);

export function usePanel(): PanelContextValue {
  const value = useContext(PanelContext);
  if (!value) throw new Error("usePanel debe usarse dentro del panel");
  return value;
}
