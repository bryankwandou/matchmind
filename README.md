# MatchMind — Real-Time World Cup AI Companion

Live deployed URL: **https://matchmind-omega.vercel.app**

MatchMind turns every moment of the 2026 World Cup into a conversation. When a goal happens, the odds shift, or a red card changes the game, MatchMind gives you a clear, human explanation in seconds — powered by TxLINE live data and Groq AI.

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

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2.9 (App Router, TypeScript) |
| Styling | Tailwind CSS v4, custom CSS variables |
| Animations | Framer Motion v12 (160+ animation instances) |
| AI | Groq SDK — llama-3.3-70b-versatile (commentary), llama-3.1-8b-instant (previews) |
| Live data | TxLINE by TxODDS — on-chain/off-chain hybrid |
| Blockchain | Solana (mainnet subscription, wallet adapter) |
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
git clone https://github.com/nayrbryanGaming/matchmind
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
- **GitHub**: https://github.com/nayrbryanGaming/matchmind
- **Hackathon**: Superteam Earn — Consumer & Fan Experiences Track 2 ($16K)
- **Deadline**: July 19, 2026
