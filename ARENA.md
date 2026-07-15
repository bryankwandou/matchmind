# MatchMind Arena — 6-Day Transformation Sprint

Agentic-football GameFi redesign, executed on the `arena` branch while `main`
stays frozen for hackathon judging. The core thesis is untouched: TxLINE live
data, grounded AI, on-chain receipts, USDC payments. Arena wraps that loop in
a stadium — it never replaces it.

**Ship rule:** every phase ends with a build + Playwright visual pass before
the next phase starts. Merge to `main` only after winners are announced
(Jul 29) or if fully verified with a safety day before the deadline.

---

## Day 1 — Foundation: stadium design language

- [ ] Arena token layer in `globals.css`: `--pitch` (deep grass #07120c base ramp), `--floodlight` (cool white bloom), `--chalk` (line-marking white 60%), `--scoreboard` (amber LED), `--card-yellow` / `--card-red` (booking colors)
- [ ] Field-line grid background: full-page SVG pitch markings (halfway line, center circle, penalty boxes) at 3-4% opacity replacing the plain grid
- [ ] Floodlight glow: radial gradient pair anchored top-left/top-right on every page, brightens on LIVE routes
- [ ] Scoreboard numeric style: `font-variant-numeric` + LED-amber for all scores/odds; one shared `Scoreline` component
- [ ] Tunnel transition: page-to-page wipe (dark → pitch reveal) via framer-motion template on route change
- [ ] Kit-stripe accents: team colors as jersey stripes on fixture cards instead of flat dots
- [ ] Grass texture pass on hero + section backgrounds (subtle noise, no image assets)
- [ ] Ticket-stub shape for pricing cards (notched corners, perforation line)

## Day 2 — The Booth: agents become characters

- [ ] Agent registry `lib/booth.ts`: Scout (feed watcher), The Chalk (market reader), Roastmaster (post-match) — name, role, color, avatar mark, voice rules
- [ ] Avatar marks: three generated SVG crest-style badges (initial + shape language per agent), no external assets
- [ ] Commentary bubbles re-attributed: each AI read is signed by the agent whose domain it belongs to (event → Scout, odds drift → The Chalk, roast → Roastmaster)
- [ ] Booth header on match page: three agent chips with "on air" state, active agent pulses
- [ ] Agent handoff lines: short transition strings when domain changes ("Chalk's got the market...") — template-based, no extra LLM calls
- [ ] Groq personas: per-agent system-prompt variants (same grounding rules, distinct voice) behind the existing tone toggle
- [ ] Ask-the-AI routes to the right agent by question type (price words → Chalk, else Scout)
- [ ] Typing indicator per agent (three-dot in agent color) replacing generic loader

## Day 3 — Caller Career: the GameFi ladder

- [ ] Division ladder `lib/career.ts`: Sunday League → Non-League → Championship → World Class → Legend; thresholds mapped to existing streak/best data (no new storage)
- [ ] Division crest per tier (SVG, laurel + star language), shown beside streak counter
- [ ] Career card on match page sidebar: current division, progress bar to next, best-ever
- [ ] Promotion moment: full-screen stinger (crest slam + floodlight flash) when a division threshold is crossed; milestone badge mint CTA embedded in it
- [ ] Leaderboard regrouped by division on `/api/streak` data; current user pinned
- [ ] Season framing: header shows real World Cup round (Groups/R32/R16...) as "Matchday N" from fixture dates
- [ ] Badge locker: `/locker` page listing minted badges + minted moments for the connected wallet (reads localStorage receipts + explorer links)
- [ ] Share card v2: division crest + streak + last call, stadium-styled

## Day 4 — Landing rebuild: stadium walkout

- [ ] Hero: "Your seat. Your squad. Your record." — pitch camera-angle gradient, agent trio lineup right side replacing the globe
- [ ] Live ticker restyled as stadium LED ribbon (continuous scroll, scoreboard amber)
- [ ] Features section → "Meet the Booth": one card per agent with live sample line
- [ ] OnChain section → "Trophy Room": receipt loop presented as cabinet shelves (moment, badge, pass receipt)
- [ ] HowItWorks → "Four moves, one match" keeps copy, gains touchline chalkboard art (X-O tactics doodles as SVG)
- [ ] AIDemoSection replay reskinned as broadcast booth with agent attribution
- [ ] Stats band → season stats board (matches, response time, divisions climbed)
- [ ] Monetization cards → ticket stubs (Day 1 shape) with turnstile hover
- [ ] Footer → stadium exit board (gate signage typography)

## Day 5 — Match pages: the live stand

- [ ] Match list: fixture cards as fixture-card/panini hybrids — kit stripes, division-relevant "your call" state chip
- [ ] Filter tabs → stadium section signs (STAND A/B style)
- [ ] Match detail: scoreboard header goes full LED (amber digits, flip animation on change)
- [ ] Event timeline → touchline: events plotted on a horizontal pitch strip by minute
- [ ] Streak panel → "Your call" dugout card with division crest
- [ ] Roast card gains Roastmaster avatar + speech-bubble tail
- [ ] Pricing page: ticket-office framing, USDC checkout untouched functionally
- [ ] Mobile pass: every new component at 390px, no horizontal scroll

## Day 6 — Verification, copy, ship decision

- [ ] Full Playwright walk: landing, list, live match, pre match, resolve flow, locker, pricing — screenshot review at every stop
- [ ] Luminance + console-error sweep on all routes
- [ ] Copy pass: every new string natural-human, zero emoji, zero AI-ish
- [ ] Lint + build zero errors; bundle delta check
- [ ] Preview URL smoke test on Vercel branch deploy
- [ ] Decision gate: merge to `main` only if ALL above green AND ≥24h before deadline; otherwise hold until Jul 29
- [ ] Update README + submission "anything else" with Arena preview link if held on branch

---

**Out of scope (explicitly):** token launches, wagering mechanics, anything
that turns calls into paid bets — the career ladder is reputation, not
gambling. Judging-week stability of `main` outranks every item above.
