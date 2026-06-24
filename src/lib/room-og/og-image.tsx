import type { ReactElement } from "react";
import {
  GENERIC_OG_SUBTITLE,
  GENERIC_OG_TITLE,
  OG_BELIEF_LABEL,
  OG_BRAND,
  truncateBeliefForOg,
  truncateQuoteForOg,
} from "@/lib/room-og/copy";
import type { OgQuote } from "@/lib/room-og/quote";

const FONT_STACK =
  'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

const COLORS = {
  backgroundStart: "#000000",
  backgroundEnd: "#141414",
  foreground: "#fafafa",
  muted: "#a1a1aa",
  subtle: "#71717a",
  brand: "#52525b",
  accent: "#e8854a",
};

type RoomOgImageContentProps = {
  belief?: string;
  quote?: OgQuote | null;
};

export function buildRoomOgImageElement({
  belief,
  quote,
}: RoomOgImageContentProps): ReactElement {
  const isFallback = !belief;

  const headline = isFallback
    ? GENERIC_OG_TITLE
    : truncateBeliefForOg(belief);
  const subtitle = isFallback ? GENERIC_OG_SUBTITLE : null;
  const quoteText = quote ? truncateQuoteForOg(quote.text) : null;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: `linear-gradient(135deg, ${COLORS.backgroundStart} 0%, ${COLORS.backgroundEnd} 100%)`,
        padding: "64px 72px",
        fontFamily: FONT_STACK,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          justifyContent: "center",
        }}
      >
        {!isFallback ? (
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: "0.18em",
              color: COLORS.accent,
              marginBottom: 28,
            }}
          >
            {OG_BELIEF_LABEL}
          </div>
        ) : null}

        <div
          style={{
            fontSize: isFallback ? 56 : 52,
            fontWeight: 600,
            color: COLORS.foreground,
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
            maxHeight: isFallback ? 140 : 190,
            overflow: "hidden",
          }}
        >
          {headline}
        </div>

        {subtitle ? (
          <div
            style={{
              marginTop: 24,
              fontSize: 28,
              color: COLORS.muted,
              lineHeight: 1.35,
              maxHeight: 80,
              overflow: "hidden",
            }}
          >
            {subtitle}
          </div>
        ) : null}

        {quoteText ? (
          <div
            style={{
              display: "flex",
              marginTop: 40,
              paddingLeft: 20,
              borderLeft: `4px solid ${COLORS.accent}`,
            }}
          >
            <div
              style={{
                fontSize: 28,
                color: COLORS.muted,
                lineHeight: 1.35,
                maxHeight: 120,
                overflow: "hidden",
              }}
            >
              {`"${quoteText}"`}
              <span
                style={{
                  display: "block",
                  marginTop: 12,
                  fontSize: 22,
                  color: COLORS.subtle,
                }}
              >
                — {quote?.author}
              </span>
            </div>
          </div>
        ) : null}
      </div>

      <div
        style={{
          fontSize: 28,
          fontWeight: 600,
          color: COLORS.brand,
          letterSpacing: "-0.02em",
        }}
      >
        {OG_BRAND}
      </div>
    </div>
  );
}
