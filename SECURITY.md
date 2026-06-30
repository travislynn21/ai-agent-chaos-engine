# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 1.0.x   | ✅         |
| < 1.0.0 | ❌         |

## Reporting a Vulnerability

**Do not open a public GitHub issue for security-related bugs or suspected vulnerabilities.**

Use one of the following private reporting channels:

- **GitHub Private Vulnerability Reporting** — via the repository **Security** tab (must be enabled by the maintainer).
- **Email** — `security@justjackinit.net`

### What to Include

1. A description of the issue and the impacted layer or boundary.
2. Steps to reproduce, proof of concept, or affected configuration.
3. The potential impact — specifically whether the issue could violate fail-closed behavior, provenance guarantees, or execution boundaries.

### Response Expectations

- Acknowledgment within **48 hours**.
- Status update within **5 business days**.
- Coordinated disclosure after a fix or mitigation is available.

## Scope

The following are in scope for security reports:

- Bypass conditions for any of the four zero-tolerance invariants (Egress, Context, Security, Human layers).
- Configuration parsing flaws that allow placeholder values to pass validation in production.
- Provenance chain integrity failures.
- Escrow gate timing attacks or SLA bypass conditions.

Out of scope: issues in third-party dependencies not introduced by this framework.
