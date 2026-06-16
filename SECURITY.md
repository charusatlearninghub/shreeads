# Security Posture

## Continuous Security Checks
GitHub Actions workflow `.github/workflows/security.yml` runs on every push, PR, and nightly at 03:00 UTC:

| Job | Purpose |
| --- | --- |
| **dependency-audit** | `npm/bun audit` — fails on high/critical CVEs in dependencies |
| **sast-codeql** | GitHub CodeQL static analysis (`security-and-quality` query suite) for JS/TS |
| **secret-scan** | Gitleaks scan for committed credentials |
| **headers-check** | Nightly probe of the production URL for required security headers |

Findings appear under the repository **Security** tab. New issues block merges before release.

## Browser Security Headers
Set via meta tags in `index.html` (Lovable hosting does not expose a custom-header config; meta-tag equivalents are honored by browsers for the directives below):

- `Content-Security-Policy` — `default-src 'self'`, restricts scripts/styles, allows YouTube/Vimeo frames, blocks `<object>`, upgrades insecure requests, locks `frame-ancestors` to `'self'` (replacement for `X-Frame-Options: SAMEORIGIN`, which browsers no longer honor via meta).
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` — disables geolocation, microphone, camera, payment by default.

> Note: `X-Frame-Options` cannot be set via `<meta>` — modern browsers only honor it as an HTTP header. CSP `frame-ancestors 'self'` is its strict-superset replacement and IS enforced from meta.

## Session & Cookie Hardening
This SPA uses Supabase Auth, which stores the JWT in `localStorage` (no application cookies are issued — so `HttpOnly` / `Secure` / `SameSite` flags do not apply at the application layer). The hardening we DO apply:

- **Global sign-out** — `supabase.auth.signOut({ scope: 'global' })` revokes refresh tokens on **all** devices, not just the current one.
- **One-device policy** — `device_registrations` table + `DeviceBlocker` enforces single-active-device per user.
- **Short-lived signed URLs** — video/software downloads use 15-minute signed URLs (never direct storage exposure).
- **HTTPS-only** — enforced by Lovable hosting; CSP includes `upgrade-insecure-requests`.
- **RLS everywhere** — every public table has Row Level Security with policies scoped to `auth.uid()`.
- **HIBP leaked-password protection** — enabled at the auth provider level.

## Re-Scanning
- Lovable: **Security** tab → re-run scanners (Aikido / Wiz / Supabase linter / agent scanner).
- GitHub: Actions tab → run `Security Checks` workflow manually, or wait for the nightly run.
