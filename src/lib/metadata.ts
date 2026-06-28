import type { Metadata } from "next";
import { DEFAULT_OG_IMAGE_ALT, DEFAULT_OG_IMAGE_PATH } from "@/lib/room-og/copy";

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
      images: [
        {
          url: DEFAULT_OG_IMAGE_PATH,
          alt: DEFAULT_OG_IMAGE_ALT,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: input.openGraphTitle,
      description: openGraphDescription,
      images: [DEFAULT_OG_IMAGE_PATH],
    },
  };
}
