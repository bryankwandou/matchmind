# IT Governance — MatchMind

**Frameworks applied:** COBIT 2019 · TOGAF ADM Phase A–D · ISO/IEC 27001 controls

---

## COBIT 2019 — Governance Objectives

### EDM01 — Ensured Governance Framework Setting and Maintenance

| Control | Status | Implementation |
|---------|--------|----------------|
| Governance model defined | DONE | Vercel (deployment) + GitHub (source) + Groq (AI) + TxLINE (data) |
| Roles and responsibilities | DONE | Single owner: nayrbryanGaming (Superteam Earn submission) |
| Stakeholder needs identified | DONE | World Cup fans, Superteam judges, TxODDS sponsors |

### EDM03 — Ensured Risk Optimisation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Groq API key leak | Low | High | Key in env vars only, never committed, .gitignore covers `.env*` |
| LLM prompt injection | Medium | Medium | Input sanitized in `/api/ai/commentary`, fields allowlisted |
| Groq cost overrun | Medium | Medium | Rate limiter: 20 req/min/IP on commentary endpoint |
| TxLINE API downtime | Low | Medium | Mock data fallback in `/api/matches/route.ts` |
| @solana/web3.js CVEs | Low | Low | Packages installed but not yet called in live code paths |
| Vercel cold-start delay | Low | Low | Static homepage prerendered, only API routes are dynamic |

### APO12 — Managed Risk

- Risk register above reviewed at each deployment.
- Unfixable upstream vulns (`@solana/web3.js`) accepted with rationale: no live call paths exist yet; will remediate when wallet connect is implemented.

### BAI03 — Managed Solutions Identification and Build

| Milestone | Target date | Status |
|-----------|-------------|--------|
| Landing page live on Vercel | 2026-06-25 | DONE |
| TxLINE API key integration | 2026-06-27 | PENDING |
| Live match page `/match/[id]` | 2026-06-30 | PENDING |
| Solana wallet connect | 2026-07-05 | PENDING |
| Hackathon submission | 2026-07-19 | TARGET |

### DSS05 — Managed Security Services

| Control | Implementation |
|---------|----------------|
| Security headers | X-Frame-Options, CSP, HSTS, X-Content-Type-Options, Referrer-Policy |
| CORS | Restricted to `NEXT_PUBLIC_APP_URL` on API routes |
| Rate limiting | In-memory limiter on LLM endpoint (20 req/min/IP) |
| Input validation | Allowlist-based type + length checks before LLM call |
| Prompt sanitization | Strip `<>{}` characters, max 80 chars per field |
| Error logging | Errors logged by message only, no stack traces or keys exposed |
| Secrets management | All keys in Vercel environment variables, never in source |

---

## TOGAF ADM — Architecture Decision Records

### ADR-001: Next.js App Router over Pages Router

**Status:** Accepted  
**Context:** Need server components, streaming, and API routes in one framework.  
**Decision:** Use Next.js 16 App Router.  
**Rationale:** Built-in RSC, edge runtime support, Vercel native deployment.  
**Consequence:** Cannot use Pages Router patterns. React Server Components need careful client/server boundary management.

### ADR-002: Groq over OpenAI for AI commentary

**Status:** Accepted  
**Context:** Live sports commentary needs sub-2-second latency. OpenAI averages 3–8s.  
**Decision:** Groq with `llama-3.3-70b-versatile` for commentary, `llama-3.1-8b-instant` for previews.  
**Rationale:** Groq's LPU delivers ~500 tok/s; match events need instant analysis.  
**Consequence:** Tied to Groq's model availability. Fallback: add Anthropic claude-haiku as secondary.

### ADR-003: In-memory rate limiting over Redis

**Status:** Accepted (temporary)  
**Context:** Vercel serverless — no persistent state between cold starts.  
**Decision:** In-memory Map for rate limiting at initial launch.  
**Rationale:** Zero extra infrastructure for hackathon scope. Acceptable for single-region early traffic.  
**Consequence:** Rate limit resets on cold start. Upgrade path: Upstash Redis (`@upstash/ratelimit`) when scaling.

### ADR-004: Mock data fallback for TxLINE

**Status:** Accepted  
**Context:** TxLINE API key may not be set in all environments.  
**Decision:** `/api/matches` returns `MOCK_MATCHES` when `TXLINE_API_KEY` is empty.  
**Rationale:** Enables development and demo without live API credentials.  
**Consequence:** Must ensure mock data is clearly labeled (`source: "mock"`) to judges.

---

## IT Governance Checkpoints

### Before each deployment

- [ ] `npm audit` — no new HIGH or CRITICAL findings
- [ ] TypeScript check passes (`npx tsc --noEmit`)
- [ ] `.env.local` not committed (`git status`)
- [ ] Rate limit config reviewed
- [ ] Vercel env vars up-to-date

### Before hackathon submission (2026-07-19)

- [ ] TxLINE API key set in Vercel production env
- [ ] Live match demo works with real data
- [ ] Demo video recorded showing live event → AI response flow
- [ ] Public GitHub repo — no secrets in history (`git log --all -S "gsk_"`)
- [ ] README complete with architecture diagram
- [ ] Feedback on TxLINE API documented for submission form

---

## Data Classification (ISO 27001 Annex A.8)

| Data type | Sensitivity | Storage | Transit | Retention |
|-----------|------------|---------|---------|-----------|
| TxLINE match data | Public | In-memory (no DB) | HTTPS | Per-request |
| Groq API key | Confidential | Vercel env vars | Never transmitted | Rotate if exposed |
| TxLINE API key | Confidential | Vercel env vars | Never transmitted | Rotate if exposed |
| User team preference | Internal | Browser localStorage (planned) | N/A | User-controlled |
| IP addresses (rate limiting) | Internal | In-memory Map | N/A | 60 seconds |

No PII is collected at this time. No database. No user accounts.
