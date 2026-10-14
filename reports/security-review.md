# Application security review — 2026-10-14

## Scope and outcome

Reviewed authentication and recovery, account roles, all API routes, server-rendered
admin/customer pages, checkout and wallet accounting, payment webhooks, supplier
requests, guest tracking, public inputs, response headers, dependencies and tracked
source files. Changes are local; this review does not certify the deployed host,
database network policy, operator devices or resistance to every possible attack.

No production customer data was changed, no real payments were made and supplier
dispatch remains paused. Security integration checks use a guarded local MongoDB
replica set and a separate production server with fake keys and email delivery off.

## Fixed findings

| Severity | Finding | Fix |
| --- | --- | --- |
| Critical | NOWPayments accepted any supplied signature when its secret was absent. | Missing secret now rejects every notification. Signatures require the expected hex format and use a constant-time comparison. |
| High | Crypto callbacks were not tied to a stored invoice or expected currency/amount; top-up ownership came from a caller-visible reference. | Server-created invoice records bind amount, owner, invoice ID and one payment ID. Only finished payments credit or fulfill; underpayments, wrong amounts/currencies and reused payment identities are rejected. |
| High | Recovery tokens were stored in plain text and consumed through a read-then-save sequence. Existing JWT sessions survived a reset. | Tokens are hashed, time-limited and consumed atomically. Reset increments a session version, checked against the database on subsequent authenticated requests. Password/token fields are excluded from ordinary user queries. |
| High | Credential login lacked brute-force controls and accepted unchecked credential value types. | Strict credential validation, bcrypt comparison for missing users and shared database throttles for login/account and trusted client identity. New/reset passwords reject bcrypt's UTF-8 truncation boundary. |
| High | Admin page data fetching relied on parent layout/proxy checks. | Every admin page checks current database authorization before querying its data. API authorization remains inside handlers; role claims alone cannot grant admin access. |
| High | Custom mutation APIs had no consistent cross-site request guard or streamed body-size bound. | Route-local wrappers reject foreign origins and cross-site browser requests, enforce JSON for nonempty custom API bodies, bound streamed input, throttle requests and return private/no-store responses. Signed payment callbacks remain exempt from browser-origin checks, not signature verification. Auth.js retains its own CSRF protocol with a separate body bound. |
| Medium | Customer order responses included internal provider and processor fields. Guest ID/email lookup disclosed order information without mailbox proof. | Explicit customer DTOs omit internal fields. Guests receive a private signed tracking link at the checkout email; knowing an order ID/email alone no longer returns its details. Missing and matching lookups receive the same public response. |
| Medium | Links sent to providers were not constrained to the selected social platform. Login callback paths allowed backslash normalization. | HTTPS social-domain validation, credential/port rejection and handle normalization. Callback paths reject external/protocol-relative URLs, backslashes and control characters. |
| Medium | Payment and verification URL fallback trusted the incoming request host. | Configured canonical application origin; production rejects absent or non-HTTPS configuration, except loopback testing. |
| Medium | No consistent browser policy against script injection, framing or private-link referrer leakage. | Per-response nonce CSP with strict script policy, frame denial, no-referrer, MIME sniffing prevention, restricted browser permissions and production HSTS. HTML renders dynamically and is not shared-cacheable so nonces are not reused. Inline styles remain allowed for the existing animation/UI libraries; production script eval is disabled. |
| High | Installed Next.js version had published security advisories. An unused production CLI pulled in vulnerable tooling. | Next.js and its lint config updated to 16.3.8; unused shadcn CLI removed; source-map-js constrained to a patched version. Production npm audit reports zero known advisories. |

Wallet updates also reject invalid/non-integer amounts and initialize processor
idempotency indexes. Payment callbacks reload orders after confirming payment,
instead of attempting fulfillment with an unpaid in-memory snapshot. Supplier and
mail API requests reject redirects to prevent credentials following a redirect.

## Verification

- Production build, TypeScript and ESLint.
- `test:security`: real credential login, customer/admin authorization, role-claim
  forgery, private DTOs, guest mailbox proof, origin/body guards, concurrent rate
  limits, forged signatures, exact invoice binding, underpayment/replay rejection,
  concurrent top-up credits, server-priced wallet checkout, one-use password reset,
  old-session revocation, CSP nonce uniqueness and middleware/RSC bypass attempts.
- Existing catalog, routing, supplier, benefits and admin regression suites.
- Browser checks of all 49 public page URLs in the production test server:
  HTTP success throughout, no runtime/CSP errors, desktop dropdown interaction
  and mobile width without horizontal overflow.
  Third-party image fetching was network-restricted in the isolated server, so
  these checks do not certify external asset availability.
- Tracked-text scan for private-key blocks, Stripe live keys and AWS access-key
  formats found no matches. This is pattern coverage, not proof that no secret of
  any format has ever appeared in Git history.

## Remaining deployment responsibilities

1. Deploy/restart to load the patched framework and guards. Use `next start` for
   production; never expose the development server publicly.
2. Configure the canonical HTTPS URL (`APP_URL` or the auth URL) and a strong authentication secret. The
   application refuses production startup with an authentication secret shorter
   than 32 bytes. Server URL settings take precedence over build-time public URL
   settings. Do not publish webhook secrets or supplier keys.
3. Set `SECURITY_CLIENT_IP_HEADER` only to a header your trusted ingress overwrites.
   Otherwise the app deliberately uses shared fallback limits. The current local
   configuration has no trusted-IP header set; production traffic needs this
   configured to avoid unrelated customers sharing a rate bucket.
4. Use ingress/CDN request limits and DDoS protection. App-level limits cannot stop
   a large network flood or protect resources before traffic reaches the app.
5. Restrict database network access and use a least-privileged application database
   account, encrypted backups and separate test/production credentials. No live
   firewall, hosting-account or database-role policy was changed by this review.
6. Configure transactional email before launch: password recovery, email verification
   and guest tracking need it. Queued private links remain confidential operational
   data; restrict access to the database and mail provider.
7. Protect operator accounts with strong unique passwords and MFA at Google,
   hosting, payment, database and supplier providers. The app's local credential
   login does not implement a second authentication factor.
8. Review disputes, chargebacks and top-up reversals operationally. They are not
   equivalent to ordinary order refunds; this audit does not claim an automated
   fraud/chargeback management system.
9. Leave `ENABLE_TEST_ENDPOINT` unset in production. It only reveals test status
   when explicitly enabled and the configured database is loopback-only `_test`.

Five npm high-severity entries remain in **development-only** lint dependencies
(`braces`, `micromatch`, `fast-glob` and their Next lint parents). As checked today,
the newest upstream braces/micromatch releases still carry the advisory, and npm's
suggested change downgrades the Next lint configuration to a different major.
That downgrade was not applied. These packages process trusted repository paths
during linting and are not in the production dependency tree. Build in a trusted
environment, omit development dependencies from the runtime image, and recheck
the full audit when upstream publishes a fix.

## Reference material

- [Next.js security advisories](https://github.com/vercel/next.js/security/advisories)
- [Next.js response headers](https://nextjs.org/docs/app/api-reference/config/next-config-js/headers)
- [Next.js CSP and per-request nonce guidance](https://nextjs.org/docs/app/guides/content-security-policy)
- [Auth.js configuration and callbacks](https://authjs.dev/reference/core)
- [NOWPayments API and IPN signature documentation](https://documenter.getpostman.com/view/7907941/S1a32n38)

This is a tested hardening pass, not a claim that the site cannot be hacked.
