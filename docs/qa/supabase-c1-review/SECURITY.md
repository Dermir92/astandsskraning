# Isolated C1 security dependency correction

Checked 25 October 2026 against official maintainer advisories/releases and npm
registry metadata. Application recovery/replay changes are separate from
`DEPENDENCY_SECURITY.patch`, which compares the preserved pre-review C1 manifests
with the corrected manifests, rather than mixing in the original C1 additions.

| Package | Before this review | Corrected |
| --- | --- | --- |
| next | 16.4.0 | 16.4.3 |
| eslint-config-next | 16.4.0 | 16.4.3 |
| react / react-dom | 19.3.0 | 19.3.1 |
| sharp (resolved dependency) | 0.35.5 | 0.35.5 (retained and verified) |

Official evidence:

- [Next.js 16.4.1 security release](https://github.com/vercel/next.js/releases/tag/v16.4.1): security fixes for the three October advisories.
- [Next.js 16.4.3 stable release](https://github.com/vercel/next.js/releases/tag/v16.4.3): subsequent patch/bug fixes, released 23 October.
- [GHSA-673q-mjm6-r5xr](https://github.com/vercel/next.js/security/advisories/GHSA-673q-mjm6-r5xr): critical `use cache` typed-array RCE, affected 16.0.0–16.4.0, patched 16.4.1.
- [GHSA-2464-fhr4-w9xw](https://github.com/vercel/next.js/security/advisories/GHSA-2464-fhr4-w9xw): critical SVG image-optimization RCE on glibc Linux; patched Next 16.4.1 and sharp at least 0.35.5.
- [GHSA-p3m5-59mp-jv5r](https://github.com/vercel/next.js/security/advisories/GHSA-p3m5-59mp-jv5r): high Server Actions CPU DoS, patched 16.4.1.
- [React RSC GHSA-xqc2-xf4c-x3h3](https://github.com/react/react/security/advisories/GHSA-xqc2-xf4c-x3h3): server-dom 19.3.1 patched. Public React packages are aligned to the same patch; Next's own patched server implementation is still required.

The pre-review lockfile already resolved sharp 0.35.5; no sharp-specific override
or independent image-library upgrade was necessary. The framework itself still
required correction for its bundled server implementation and advisory range.

The safer supported 16.x candidate at the time of this review is pinned 16.4.3,
not the first patched floor or a prerelease. No project source API migration was
required. Bundled Next documentation for client boundaries and upgrades was read.

Executed `npm audit --json` before the change reported one critical vulnerable
package (`next`) with the three advisory entries. Executed after installation:
zero info/low/moderate/high/critical findings across production and development
dependencies. See `audit-before.json`, `audit-after.json`, and
`dependency-tree.json` in this directory. `package-lock.json` includes the actual
patched native/image dependency resolution; manifest versions alone are not the
proof. The pre-existing Supabase/tar override is retained, with no new overrides
or ignored findings.

Audit is registry-dependent and not an exploit test, comprehensive source audit
or guarantee about future advisories. No remaining npm audit findings were
reported in this run. Docker images, Node runtime and host configuration are not
certified by an npm audit; local network-exposure limits still apply.
