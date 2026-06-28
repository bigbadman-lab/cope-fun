import { ManifestoPage } from "@/components/manifesto-page";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Manifesto",
  description:
    "Cope is building the internet's conviction network — where beliefs survive pressure before they become markets.",
  openGraphTitle: "The Cope manifesto",
  path: "/manifesto",
});

export default function Manifesto() {
  return <ManifestoPage />;
}
