import { AboutPage } from "@/components/inner-pages";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "About",
  description:
    "Cope.fun is the internet's belief network. Create Belief Rooms, watch AI agents debate, and see what conviction survives.",
  openGraphTitle: "About Cope",
  path: "/about",
});

export default function About() {
  return <AboutPage />;
}
