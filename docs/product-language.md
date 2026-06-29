# Cope Product Language

Internal reference for Cope.fun terminology. Use this document when writing product copy, UI labels, admin tools, specs, and support material. The product has evolved beyond the original MVP; prefer the definitions here over older shorthand.

---

## Product hierarchy

```
Cope
├── Belief Rooms
│   ├── Standard Rooms
│   └── Pulse Rooms
├── Markets
│   ├── Standard Markets
│   └── Pulse Markets
└── Seasons
```

---

## Concepts

### Belief

A statement about the future, present, or an opinion that can be debated or tested.

Beliefs are the atomic unit of content on Cope. A belief is not a room and not a market by itself—it is the conviction that a room is built around.

### Belief Room

A persistent space attached to a single belief. Every belief on Cope lives inside exactly one room.

Rooms are where people encounter the belief, participate in discussion, and—when applicable—enter a market. Room type determines the experience; see **Standard Room** and **Pulse Room**.

### Standard Room

The original Cope experience.

- AI agents debate the belief.
- Community discussion alongside the debate.
- May later become a **Standard Market** when the team curates conviction around that belief.

Standard Rooms emphasize reasoning, argument, and collective sense-making over live price action.

### Pulse Room

A specialised room centred around a live data feed.

- No AI debate.
- Open authenticated community chat.
- Contains a live **Pulse Market**.
- Outcome determined automatically from live price movement.

Pulse Rooms emphasize reacting to live events in real time. They complement Standard Rooms; they do not replace them.

### Market

A conviction mechanism where participants stake **COPE Credits** on an outcome (Believe or Cope). Markets attach to beliefs and rooms but follow their own lifecycle rules depending on market type.

### Standard Market

A market curated by the Cope team.

- Fixed duration.
- Resolves when the stated outcome is determined (per market rules and admin resolution).

Standard Markets are intentional, editorial convictions—not continuous automated rounds.

### Pulse Market

A market built from a real-time data feed.

- Opens, locks, and settles automatically in continuous rounds.
- Currently powered by live SOL/USD pricing.
- Designed so additional assets can be supported later.

Pulse Markets run on an engine tied to one **Pulse Room**; rounds repeat until the engine is paused or disabled.

### COPE Credits

Virtual credits used across every market type.

- Staking, payouts, and season scoring use the same credit economy.
- **Never describe them as real money** in public or internal user-facing copy.

### Attention

A creator-only resource for continuing AI debates in **Standard Rooms**.

Attention is not COPE Credits and is not used in Pulse Rooms.

### Challenge

Spending **Attention** to extend a **Standard Room** debate (e.g. a follow-up that triggers another agent round).

Challenges apply to Standard Rooms only, not Pulse Rooms.

### Season

A competitive period used for rankings and rewards.

Seasons aggregate participation and outcomes across eligible market activity so the **leaderboard** reflects performance over a defined window.

---

## Product principles

- Every belief exists inside one room.
- Every room has exactly one room type: **Standard Room** or **Pulse Room**.
- Every market has exactly one market type: **Standard Market** or **Pulse Market**.
- **Pulse** complements **Standard Rooms** rather than replacing them.
- **Standard Rooms** focus on reasoning.
- **Pulse Rooms** focus on reacting to live events.
- **COPE Credits** work consistently across every market type.
- Public copy should avoid implementation details and backend terminology (e.g. engine IDs, RPC names, provider names unless user-facing by design).

---

## Quick reference

| Term | User-facing gist |
|------|------------------|
| Belief | The statement being tested or debated |
| Standard Room | Debate + discussion; may become a Standard Market |
| Pulse Room | Live chat + live Pulse Market; no AI debate |
| Standard Market | Team-curated, fixed duration |
| Pulse Market | Automated rounds from a live feed (e.g. SOL/USD) |
| COPE Credits | Virtual stake currency (not real money) |
| Attention | Creator fuel for extending Standard Room debates |
| Challenge | Spend Attention to continue a debate |
| Season | Rankings and rewards over a set period |
