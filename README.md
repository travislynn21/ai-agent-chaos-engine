# AI-Agent Chaos Engineering Framework

A deterministic boundary-verification and chaos testing harness designed specifically for agentic AI architectures running on Kubernetes. This framework is aligned with NIST CAISI's work on secure, interoperable AI agents and NIST's published concerns surrounding agent hijacking and adversarial execution.

## License & Commercial Use

This repository is licensed under the **Business Source License 1.1 (BUSL 1.1)**.

- **Licensor:** TRAVIS L IRWIN
- **Licensed Work:** ai-agent-chaos-engine
- **Change Date:** July 1, 2030
- **Change License:** GPL version 2.0 or later

**Permitted (no commercial license required):** Development, testing, evaluation, security research, academic study, and strictly isolated local or offline validation environments that are not part of any internal business operation or service delivery workflow.

**Requires a commercial license:** Any production use, managed service offering, hosted commercial offering, or internal business use beyond the Additional Use Grant.

For commercial licensing inquiries: `sales@justjackinit.net`

## Core Architectural Invariants

The framework enforces four zero-tolerance behavioral rules across five operational layers:

1. **Layer 1 (Egress):** No unbounded retry amplification under network degradation.
2. **Layer 3 (Context):** No silent provenance downgrade or untracked semantic drift.
3. **Layer 4 (Security):** No unauthorized external mutations during active fault injection.
4. **Layer 5 (Human):** No irreversible tool actions executed while awaiting human policy sign-off.

## Getting Started

### 1. Copy the example configuration

```bash
cp config.yaml.example config.yaml
```

Add `config.yaml` to your `.gitignore` immediately. **Never commit real operational values.**

### 2. Configure your private parameters

Edit `config.yaml` with your actual deployment values. See inline comments for each field.

### 3. Validate fail-closed behavior

The framework is designed to fail closed. If placeholder values remain in `config.yaml` at runtime, the orchestrator will refuse to start and emit a configuration validation error.

## Architecture Overview

See [`docs/architecture.md`](docs/architecture.md) for the three-plane operational model:

- **Discovery Plane** — scans source, containers, service mesh, and SBOMs for cryptographic footprints
- **Policy Plane** — correlates telemetry against NIST FIPS 203/204/205 compliance requirements
- **Execution Plane** — manages runtime migrations, dual-keyed hybrid rollouts, and canary deployments

## CBOM Schema

The framework uses a Cryptographic Bill of Materials (CBOM) schema to track cryptographic asset inventory. See [`schemas/cbom.schema.json`](schemas/cbom.schema.json) and [`examples/sample-cbom.json`](examples/sample-cbom.json).

## Security

**Do not open public GitHub issues for security vulnerabilities.** See [`SECURITY.md`](SECURITY.md) for the private reporting process.

## Reporting & Compliance

- NIST CAISI alignment documented in `docs/architecture.md`
- FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), FIPS 205 (SLH-DSA) compliance mapping in the Policy Plane
- Change Date: **July 1, 2030** — framework converts to GPL version 2.0 or later
