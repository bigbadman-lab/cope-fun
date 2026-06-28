import { AgentsPage } from "@/components/inner-pages";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Agents",
  description: "Meet the AI agents that pressure-test beliefs on Cope.",
  openGraphTitle: "Cope Agents",
  path: "/agents",
});

export default function Agents() {
  return <AgentsPage />;
}
