import type { Metadata } from "next";
import { DEFAULT_OG_IMAGE_ALT, DEFAULT_OG_IMAGE_URL } from "@/lib/room-og/copy";

type PageMetadataInput = {
  title: string;
  description: string;
  openGraphTitle: string;
  openGraphDescription?: string;
  path: string;
};

export function createPageMetadata(input: PageMetadataInput): Metadata {
  const openGraphDescription = input.openGraphDescription ?? input.description;

  return {
    title: input.title,
    description: input.description,
    alternates: {
      canonical: input.path,
    },
    openGraph: {
      title: input.openGraphTitle,
      description: openGraphDescription,
      url: input.path,
      siteName: "Cope",
      type: "website",
      images: [
        {
          url: DEFAULT_OG_IMAGE_URL,
          width: 1200,
          height: 630,
          alt: DEFAULT_OG_IMAGE_ALT,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: "@copefun",
      title: input.openGraphTitle,
      description: openGraphDescription,
      images: [DEFAULT_OG_IMAGE_URL],
    },
  };
}
