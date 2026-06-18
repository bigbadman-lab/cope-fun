"use client";

import { createContext, useContext, useState } from "react";

type HomepageFooterContextValue = {
  inFlow: boolean;
  setInFlow: (inFlow: boolean) => void;
};

const HomepageFooterContext = createContext<HomepageFooterContextValue | null>(
  null,
);

export function HomepageFooterProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [inFlow, setInFlow] = useState(true);

  return (
    <HomepageFooterContext.Provider value={{ inFlow, setInFlow }}>
      {children}
    </HomepageFooterContext.Provider>
  );
}

export function useHomepageFooterInFlow() {
  return useContext(HomepageFooterContext)?.inFlow ?? false;
}

export function useSetHomepageFooterInFlow() {
  const ctx = useContext(HomepageFooterContext);
  return ctx?.setInFlow ?? null;
}
