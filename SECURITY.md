# Security Policy — MatchMind

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest (main branch) | Yes |

## Reporting a Vulnerability

If you find a security issue, do not open a public GitHub issue.

Contact: **nayrbryangaming3@gmail.com**  
Subject line: `[SECURITY] MatchMind — <brief description>`

Expected response time: 48 hours.

## Scope

In scope:
- API routes (`/api/matches`, `/api/ai/commentary`)
- Prompt injection via the commentary endpoint
- Authentication bypass (when Solana wallet auth is implemented)
- Secrets exposure in source code or deployment logs

Out of scope:
- Denial-of-service at infrastructure level (Vercel handles this)
- Mock data accuracy
- Third-party services (TxLINE, Groq uptime)

## Security Controls in Place

- Security headers: CSP, HSTS, X-Frame-Options, X-Content-Type-Options
- Rate limiting: 20 requests/min/IP on the LLM endpoint
- Input validation: allowlist-based type and length checks
- Prompt sanitization: special characters stripped before LLM calls
- Secrets: all keys stored in Vercel environment variables, never in source
- `.gitignore` covers all `.env*` files
