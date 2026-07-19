import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ReactElement } from "react";
import {
  GENERIC_OG_SUBTITLE,
  GENERIC_OG_TITLE,
  truncateBeliefForOg,
  truncateQuoteForOg,
} from "@/lib/room-og/copy";
import type { OgQuote } from "@/lib/room-og/quote";

const FONT_STACK =
  'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

const CONTENT_WIDTH = 1056;
const LOGO_WIDTH = 190;
const LOGO_HEIGHT = 65;

const BELIEF_HARD_CAP_WITH_QUOTE = 85;
const BELIEF_HARD_CAP_NO_QUOTE = 100;

let LOGO_DATA_URL: string | null = null;
try {
  const logoBuffer = readFileSync(
    join(process.cwd(), "public", "hoodlogo2.png"),
  );
  LOGO_DATA_URL = `data:image/png;base64,${logoBuffer.toString("base64")}`;
} catch {
  LOGO_DATA_URL = null;
}

const COLORS = {
  backgroundStart: "#050505",
  backgroundMid: "#0c0c0e",
  backgroundEnd: "#121214",
  foreground: "#fafafa",
  muted: "#a1a1aa",
  subtle: "#71717a",
  accent: "#CCFE02",
  accentSoft: "rgba(204, 254, 2, 0.14)",
  accentBorder: "rgba(204, 254, 2, 0.35)",
  cardBg: "rgba(255, 255, 255, 0.04)",
  cardBorder: "rgba(255, 255, 255, 0.08)",
  frameBorder: "rgba(255, 255, 255, 0.06)",
};

const ROOM_LABEL = "BELIEF ROOM";
const ROOM_CONTEXT = "AI agents debating this belief";

type RoomOgImageContentProps = {
  belief?: string;
  quote?: OgQuote | null;
};

function estimateCharsPerLine(fontSize: number): number {
  return Math.max(12, Math.floor(CONTENT_WIDTH / (fontSize * 0.56)));
}

function truncateBeliefForLayout(
  belief: string,
  fontSize: number,
  maxLines: number,
  hardCap: number,
): string {
  const lineBudget = estimateCharsPerLine(fontSize) * maxLines;
  return truncateBeliefForOg(belief, Math.min(hardCap, lineBudget));
}

function getBeliefFontSize(beliefLength: number, hasQuote: boolean): number {
  let size = 54;
  if (beliefLength > 80) size = 42;
  else if (beliefLength > 55) size = 46;
  else if (beliefLength > 35) size = 50;

  if (hasQuote) {
    size = Math.min(size, 44);
    if (beliefLength > 70) size = Math.min(size, 40);
  }

  return size;
}

function resolveBeliefHeadline(
  belief: string,
  hasQuote: boolean,
): { headline: string; fontSize: number; maxLines: number } {
  const maxLines = hasQuote ? 3 : 4;
  const hardCap = hasQuote ? BELIEF_HARD_CAP_WITH_QUOTE : BELIEF_HARD_CAP_NO_QUOTE;
  const estimateFontSize = hasQuote ? 42 : 48;

  let headline = truncateBeliefForLayout(
    belief,
    estimateFontSize,
    maxLines,
    hardCap,
  );
  let fontSize = getBeliefFontSize(headline.length, hasQuote);

  const refinedHeadline = truncateBeliefForLayout(
    belief,
    fontSize,
    maxLines,
    hardCap,
  );
  if (refinedHeadline.length < headline.length) {
    headline = refinedHeadline;
    fontSize = getBeliefFontSize(headline.length, hasQuote);
  }

  return { headline, fontSize, maxLines };
}

function QuoteInsightCard({
  quoteText,
  author,
}: {
  quoteText: string;
  author: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        marginTop: 18,
        padding: "14px 18px",
        borderRadius: 14,
        border: `1px solid ${COLORS.accentBorder}`,
        background: `linear-gradient(135deg, ${COLORS.cardBg} 0%, rgba(204, 254, 2, 0.06) 100%)`,
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.14em",
          color: COLORS.accent,
          marginBottom: 8,
        }}
      >
        AGENT INSIGHT
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 22,
          color: COLORS.muted,
          lineHeight: 1.32,
          maxHeight: 88,
          overflow: "hidden",
        }}
      >
        {`"${quoteText}"`}
      </div>
      <div
        style={{
          display: "flex",
          marginTop: 10,
          fontSize: 16,
          fontWeight: 600,
          color: COLORS.subtle,
        }}
      >
        — {author}
      </div>
    </div>
  );
}

function RoomLabelPill() {
  return (
    <div
      style={{
        display: "flex",
        alignSelf: "flex-start",
        padding: "7px 14px",
        borderRadius: 999,
        border: `1px solid ${COLORS.accentBorder}`,
        background: COLORS.accentSoft,
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: "0.16em",
        color: COLORS.accent,
      }}
    >
      {ROOM_LABEL}
    </div>
  );
}

function BackgroundLayers() {
  return (
    <div
      style={{
        display: "flex",
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: -80,
          right: -40,
          width: 520,
          height: 420,
          background:
            "radial-gradient(circle at center, rgba(204, 254, 2, 0.22) 0%, rgba(204, 254, 2, 0) 68%)",
        }}
      />
      <div
        style={{
          display: "flex",
          position: "absolute",
          bottom: -120,
          left: -60,
          width: 440,
          height: 360,
          background:
            "radial-gradient(circle at center, rgba(204, 254, 2, 0.1) 0%, rgba(204, 254, 2, 0) 70%)",
        }}
      />
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 18%, rgba(0,0,0,0.22) 100%)",
        }}
      />
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: 48,
          left: 56,
          right: 56,
          bottom: 48,
          borderRadius: 24,
          border: `1px solid ${COLORS.frameBorder}`,
        }}
      />
    </div>
  );
}

function OgLogo() {
  if (LOGO_DATA_URL) {
    return (
      <img
        src={LOGO_DATA_URL}
        alt=""
        width={LOGO_WIDTH}
        height={LOGO_HEIGHT}
        style={{
          display: "flex",
          width: LOGO_WIDTH,
          height: LOGO_HEIGHT,
        }}
      />
    );
  }

  return (
    <div
      style={{
        display: "flex",
        fontSize: 34,
        fontWeight: 700,
        fontStyle: "italic",
        color: COLORS.accent,
        letterSpacing: "-0.03em",
      }}
    >
      Hoodswarm
    </div>
  );
}

function OgFooter({ hasQuote }: { hasQuote: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        marginTop: hasQuote ? 16 : 24,
      }}
    >
      <OgLogo />
    </div>
  );
}

export function buildRoomOgImageElement({
  belief,
  quote,
}: RoomOgImageContentProps): ReactElement {
  const isFallback = !belief;
  const quoteText = quote ? truncateQuoteForOg(quote.text) : null;
  const hasQuote = Boolean(quoteText);

  let headline = GENERIC_OG_TITLE;
  let beliefFontSize = 56;
  let beliefMaxLines = 4;

  if (!isFallback) {
    const resolved = resolveBeliefHeadline(belief, hasQuote);
    headline = resolved.headline;
    beliefFontSize = resolved.fontSize;
    beliefMaxLines = resolved.maxLines;
  }

  const beliefLineHeight = 1.12;
  const beliefMaxHeight = Math.round(
    beliefFontSize * beliefLineHeight * beliefMaxLines,
  );
  const contextLine = isFallback ? GENERIC_OG_SUBTITLE : ROOM_CONTEXT;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        background: `linear-gradient(145deg, ${COLORS.backgroundStart} 0%, ${COLORS.backgroundMid} 48%, ${COLORS.backgroundEnd} 100%)`,
        fontFamily: FONT_STACK,
        overflow: "hidden",
      }}
    >
      <BackgroundLayers />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          position: "relative",
          padding: "56px 72px 52px",
        }}
      >
        <RoomLabelPill />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            justifyContent: "center",
            marginTop: 28,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: beliefFontSize,
              fontWeight: 700,
              color: COLORS.foreground,
              lineHeight: beliefLineHeight,
              letterSpacing: "-0.03em",
              maxHeight: beliefMaxHeight,
              overflow: "hidden",
            }}
          >
            {headline}
          </div>

          <div
            style={{
              display: "flex",
              marginTop: hasQuote ? 14 : 18,
              fontSize: isFallback ? 24 : 20,
              fontWeight: 500,
              color: COLORS.muted,
              lineHeight: 1.3,
              maxHeight: isFallback ? 64 : 28,
              overflow: "hidden",
            }}
          >
            {contextLine}
          </div>

          {quoteText && quote ? (
            <QuoteInsightCard quoteText={quoteText} author={quote.author} />
          ) : null}
        </div>

        <OgFooter hasQuote={hasQuote} />
      </div>
    </div>
  );
}
