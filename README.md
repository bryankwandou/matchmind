# MatchMind — Real-Time World Cup AI Companion

Live deployed URL: **https://matchmind-omega.vercel.app**

MatchMind turns every moment of the 2026 World Cup into a conversation. When a goal happens, the odds shift, or a red card changes the game, MatchMind gives you a clear, human explanation in seconds — powered by TxLINE live data and Groq AI. Past the commentary, every call a fan makes leaves an on-chain receipt.

---

## For Judges — 60-Second Walkthrough

**Nothing to install. Open the deployed app and follow this path:**

1. **[matchmind-omega.vercel.app](https://matchmind-omega.vercel.app)** — scroll the landing page. The "Every call leaves a receipt" section (past the commentary) is the differentiator, not a footnote.
2. **Open any live match** → the left panel writes an AI note ~1.5s after each event; the right panel is the live scoreboard from TxLINE. Every commentary bubble has a **Mint moment** button (writes score + minute + odds to Solana).
3. **Open an upcoming match** → the **Call it before kickoff** panel lets you pick the 1X2 against the live TxLINE line. Hits build a streak; a milestone streak offers to mint a fixed-supply badge token.
4. **[/pricing](https://matchmind-omega.vercel.app/pricing)** → the Fan Pass is a **real USDC payment on Solana** (not a mock checkout), with a working coupon field (`WORLDCUP26` = 15% off) and an on-chain receipt.

Everything runs on **one Solana cluster** (devnet by default) — the wallet, moment mint, streak badge, and USDC payment all read a single network config, so nothing ever lands on a different chain.

To run it locally instead, jump to [Local Development](#local-development). The app works with no keys (demo mode mirrors TxLINE's exact response shape).

---

## The Core Idea

Most football apps show you what happened. MatchMind tells you **what it means**.

A casual fan watching Argentina vs France doesn't understand what a shift from 1.95 to 1.40 means. MatchMind translates: "Argentina's win probability just jumped from 51% to 71% — that red card changed everything." It speaks like a knowledgeable friend, not a spreadsheet.

---

## Business Highlights

**Fan direct** — $4/match or $29/tournament pass. Zero friction, pay per value.

**B2B licensing** — White-label widget for media publishers. API access for betting platforms that want verified AI context alongside odds data. On-chain proof from TxLINE makes this data trustable as a source of truth.

**Revenue projection** — 100K MAU at 5% conversion to Fan Pass = ~$150K/month during a World Cup. B2B deals cap at $50K/client/year.

---

## TxLINE Integration

MatchMind uses TxLINE (by TxODDS) as its live data backbone. All data is cryptographically verifiable via Solana on-chain anchoring.

### Subscription

Service Level 1 — World Cup & International Friendlies free tier.

Subscription is completed via the Solana on-chain program (mainnet: `9ExbZjAapQww1vfcisDmrngPinHTEfpjYRWMunJgcKaA`):

```bash
node scripts/txline-subscribe.mjs
node scripts/txline-set-vercel-key.mjs
```

The wallet connect button in the top navigation shows users their connected Solana wallet and enables the subscription flow directly in-browser.

### Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/fixtures/snapshot` | GET | All World Cup fixtures — match list page |
| `/api/scores/snapshot` | GET | Current scores for all live matches |
| `/api/scores/stream` | GET (SSE) | Real-time score + event stream — wired into match detail page |
| `/api/odds/live/{fixtureId}` | GET | Live 1X2 odds — OddsBar component + AI context |
| `/auth/guest/start` | POST | Guest JWT for unauthenticated exploration |
| `/api/token/activate` | POST | Activate subscription after on-chain tx sig |

### How the SSE Stream Works

The match detail page connects to `/api/scores/stream` (our Next.js proxy) via `EventSource`. When TxLINE sends a score update or goal event, MatchMind:

1. Updates the scoreboard in real time (no page refresh)
2. Injects the event into the AI commentary pipeline
3. Groq generates commentary based on event type + current match context
4. Response appears in the live chat feed within ~1 second

### TxLINE Feedback

The documentation is thorough and the IDL-based Anchor integration is clean. Two suggestions:

1. **Devnet activation endpoint**: The devnet program works for testing but `https://txline.txodds.com/api/token/activate` only validates mainnet transaction signatures. A `https://txline-dev.txodds.com/api/token/activate` endpoint would allow full end-to-end testing without mainnet SOL.

2. **Free tier ATA creation**: The free tier (service levels 1 and 12) requires a Token-2022 ATA even though no tokens are transferred. Waiving the ATA requirement for $0 service levels would remove the last friction point.

The data quality and cryptographic verification model are genuinely differentiated. Nothing else in sports data gives you this level of on-chain proof.

---

## The On-Chain Layer

Commentary is the entry point; the product is the accountability layer on top. Three distinct Solana mechanics, all reading one shared network config (`lib/network.ts`, `NEXT_PUBLIC_SOLANA_NETWORK`, devnet by default):

| Feature | On-chain mechanic | Where |
|---------|-------------------|-------|
| **Moment Mint** | Memo transaction carrying score, minute, and odds-at-that-second, signed by the fan's wallet | inline on every commentary bubble |
| **Streak Badge** | Fixed-supply SPL token mint with **mint authority revoked in the same transaction** — one unit, permanently | fires on a milestone streak (5/10/25/50/100) |
| **Fan Pass** | Real USDC `transfer_checked` to the treasury, confirmed on-chain, server-validated coupon codes | `/pricing` |

USDC mint addresses are Circle's official ones — devnet `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`, mainnet `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`. Because the price is a dollar figure, USDC (1:1 peg) means the quoted price is the paid price — no conversion step. Devnet USDC comes from [Circle's faucet](https://faucet.circle.com/); the app links it automatically when a wallet is short.

**Verify it yourself, on-chain:** every mint and payment in the app surfaces its transaction signature with a direct [Solana Explorer](https://explorer.solana.com/?cluster=devnet) link the moment it confirms — the receipt panel keeps the signature after a payment, and each minted moment/badge links straight to its transaction. The devnet USDC mint the checkout uses is [`4zMMC9...DncDU`](https://explorer.solana.com/address/4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU?cluster=devnet). Nothing needs to be taken on faith: connect a devnet wallet, pay, and follow the link the app hands you.

**Live example receipt** (click it — this is a real confirmed devnet transaction in the exact shape Mint moment writes): [`54pEbG76...PfRiKD`](https://explorer.solana.com/tx/54pEbG76HtnP4fYSRspu6ZvrZZTrsG64x8yFYDMA1wLxXAerEWquUyU3fc9kvYKG897tq4T36kMv281h4tPfRiKD?cluster=devnet). Open the Memo instruction and you'll find the fixture, score, minute, and the odds at that second, exactly as described above.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2.9 (App Router, TypeScript) |
| Styling | Tailwind CSS v4, custom CSS variables |
| Animations | Framer Motion v12 (160+ animation instances) |
| AI | Groq SDK — grounded commentary + free-form match Q&A |
| Live data | TxLINE by TxODDS — live scores, odds, SSE event stream |
| Blockchain | Solana — wallet adapter, memo/SPL/USDC on one cluster |
| Deployment | Vercel (auto-deploy from main branch) |

---

## Architecture

```
User browser
    │
    ├── GET /match         → match list (TxLINE /api/fixtures/snapshot)
    ├── GET /match/[id]    → match detail + SSE EventSource
    │
    └── POST /api/ai/commentary
            │
            ├── Input sanitization (OWASP A05 injection prevention)
            ├── Rate limiting (20 req/min/IP, in-memory Map)
            └── Groq llama-3.3-70b-versatile → natural language response

    SSE stream:
    Browser → GET /api/scores/stream (Next.js)
                  │
                  └── If TXLINE_API_KEY set: proxy TxLINE /api/scores/stream
                      Else: mock events every 15s (demo mode)
```

---

## Security

- GROQ_API_KEY and TXLINE_API_KEY are server-side only (never sent to browser)
- All secrets set on Vercel via encrypted env vars (never in CLI args or git)
- Rate limiting: 20 requests/minute per IP on AI commentary endpoint
- Input sanitization strips HTML, limits prompt length to 500 chars
- Security headers: X-Content-Type-Options, X-Frame-Options, Referrer-Policy

---

## Local Development

```bash
git clone https://github.com/bryankwandou/matchmind
cd matchmind
npm install

# Create .env.local
echo "GROQ_API_KEY=your_key_here" > .env.local
echo "TXLINE_API_KEY=your_txline_key" >> .env.local

npm run dev
# → http://localhost:3000
```

The app runs in demo mode without `TXLINE_API_KEY` — mock data mirrors TxLINE's exact response shape.

---

## Submission

- **Deployed URL**: https://matchmind-omega.vercel.app
- **GitHub**: https://github.com/bryankwandou/matchmind
- **Hackathon**: Superteam Earn — Consumer & Fan Experiences Track 2 ($16K)
- **Deadline**: July 19, 2026
