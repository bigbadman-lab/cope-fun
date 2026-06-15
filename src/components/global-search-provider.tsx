"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { GlobalSearchOverlay } from "./global-search-overlay";

type GlobalSearchContextValue = {
  open: boolean;
  openSearch: () => void;
  closeSearch: () => void;
  toggleSearch: () => void;
};

const GlobalSearchContext = createContext<GlobalSearchContextValue | null>(
  null,
);

export function useGlobalSearch() {
  const context = useContext(GlobalSearchContext);
  if (!context) {
    throw new Error("useGlobalSearch must be used within GlobalSearchProvider");
  }
  return context;
}

export function GlobalSearchProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  const openSearch = useCallback(() => setOpen(true), []);
  const closeSearch = useCallback(() => setOpen(false), []);
  const toggleSearch = useCallback(() => setOpen((current) => !current), []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        toggleSearch();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSearch]);

  return (
    <GlobalSearchContext.Provider
      value={{ open, openSearch, closeSearch, toggleSearch }}
    >
      {children}
      {open && <GlobalSearchOverlay onClose={closeSearch} />}
    </GlobalSearchContext.Provider>
  );
}
