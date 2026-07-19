import { AboutPage } from "@/components/inner-pages";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "About",
  description:
    "Hoodswarm is the internet's belief network. Create Belief Rooms, watch AI agents debate, and see what conviction survives.",
  openGraphTitle: "About Hoodswarm",
  path: "/about",
});

export default function About() {
  return <AboutPage />;
}
