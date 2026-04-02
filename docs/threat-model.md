# 🔒 Threat Model — Smart Student Information Dashboard

## Assets Being Protected
1. Student PII (names, emails, dates of birth, grades)
2. Authentication credentials
3. Audit trails
4. API access and data integrity

---

## Threats & Controls

| Threat | STRIDE Category | Risk | Control |
|---|---|---|---|
| **Password brute force** | Spoofing | High | bcrypt (12 rounds) + account lockout after 5 failures (15 min) |
| **Session hijacking** | Elevation of Privilege | High | Access tokens in JS memory (not localStorage); refresh tokens in httpOnly cookie |
| **CSRF attack** | Tampering | Medium | SameSite=Lax cookies; CORS restricted to allowed origins |
| **XSS injection** | Tampering | High | Content-Security-Policy header; React escapes HTML; no dangerouslySetInnerHTML |
| **SQL injection** | Tampering | High | Prisma ORM with parameterized queries; no raw SQL (except safe aggregate query) |
| **Privilege escalation** | Elevation of Privilege | High | RBAC enforced at every route via `authorize()` middleware; role stored in JWT |
| **Token replay after logout** | Spoofing | Medium | Refresh tokens stored in DB; invalidated on logout |
| **Rate limiting bypass / DoS** | Denial of Service | Medium | express-rate-limit: 100 req/min global, 10/15min on auth routes |
| **Sensitive data in logs** | Info Disclosure | Medium | Passwords never logged; tokens truncated; structured logging |
| **Man-in-the-middle** | Info Disclosure | High | HTTPS enforced in production (Nginx + TLS); HSTS with 1-year max-age |
| **Insecure direct object reference** | Elevation of Privilege | Medium | Students can only access own records; `req.user` validated server-side |
| **Input validation bypass** | Tampering | High | Zod validation on all request bodies; unknown fields stripped |
| **Secrets in source code** | Info Disclosure | High | `.env` in `.gitignore`; env vars required (throws on missing) |

---

## Trust Zones

```
[Browser] ──HTTPS──> [Nginx/Load Balancer] ──HTTP──> [Express Backend] ──TLS──> [PostgreSQL]
                                                              │
                                                         [Redis] (rate limit store)
```

- Frontend trusts: backend API responses
- Backend trusts: verified JWT claims, validated request bodies
- Database trusts: parameterized queries from Prisma only

---

## Security Best Practices Checklist

- [x] Passwords hashed with bcrypt (12 rounds)
- [x] JWT with short-lived access tokens (15 min)
- [x] Refresh token rotation on each use
- [x] httpOnly Secure SameSite cookies for refresh tokens
- [x] Helmet middleware (CSP, HSTS, XFO, XCTO)
- [x] CORS with allowlist
- [x] Rate limiting (global + auth-specific)
- [x] Account lockout after failed attempts
- [x] Input validation with Zod on all endpoints
- [x] RBAC at route level
- [x] Audit logs for critical operations
- [x] No secrets committed to repo
- [x] Non-root Docker user
- [x] Database connection via env var only

---

## Recommended Production Hardening

1. Enable `COOKIE_SECURE=true` (requires HTTPS)
2. Set `NODE_ENV=production`
3. Use a managed secret store (AWS Secrets Manager, Vault)
4. Enable automatic DB backups
5. Set up Web Application Firewall (Cloudflare, AWS WAF)
6. Run `npm audit` regularly and update dependencies
7. Configure SIEM alerting on failed login spikes
