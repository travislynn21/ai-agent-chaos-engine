<!-- SPDX-License-Identifier: BSL-1.1 -->
# Architectural Specification

The AI-Agent Chaos Engineering Framework isolates its execution patterns into three distinct operational planes to allow automated verification without exposing production host topologies.

```
[ Discovery Plane ]
  (Scans source, containers, service mesh, SBOMs)
          │
          ▼
[ Policy Plane ]
  (Generates CBOM graph & maps FIPS compliance)
          │
          ▼
[ Execution Plane ]
  (Handles hybrid rollouts, canary checks, rollbacks)
```

## 1. Discovery Plane

Utilizes static and runtime scanning agents to extract cryptographic use footprints from:

- Application source repositories
- Artifact container registries
- Service-mesh configurations
- Software Bills of Materials (SBOMs)

## 2. Policy Plane

Ingests raw discovery telemetry and correlates metadata against an internal dependency graph. Normalizes each asset to verify adherence to NIST post-quantum standards:

| Standard | Algorithm | Role |
|---|---|---|
| FIPS 203 | ML-KEM (Module-Lattice Key Encapsulation Mechanism) | Key establishment |
| FIPS 204 | ML-DSA (Module-Lattice Digital Signature Algorithm) | Primary digital signatures |
| FIPS 205 | SLH-DSA (Stateless-Hash-Based Digital Signature Algorithm) | Conservative backup track |

## 3. Execution Plane

Manages runtime configuration migrations. Orchestrates dual-keyed hybrid trust rollouts and coordinates canary deployments to change cryptographic primitives without violating end-to-end service latency SLAs.

## Four Zero-Tolerance Invariants

| Layer | Invariant | Enforcement |
|---|---|---|
| **Egress (L1)** | No unbounded retry amplification under network degradation | CircuitBreaker + ConnectionPool hard limits |
| **Context (L3)** | No silent provenance downgrade or untracked semantic drift | SHA-256 hash-chained ProvenanceLog + DriftDetector |
| **Security (L4)** | No unauthorized external mutations during active fault injection | FaultInjectionSession write-protection + MutationQuarantine |
| **Human (L5)** | No irreversible tool actions while awaiting human policy sign-off | EscrowGate with SLA timer and auto-rollback on expiry |

## Deployment Model

The framework is Kubernetes-native and deployed via Helm. It operates at the infrastructure layer — no changes to agent application code are required. All enforcement runs as a sidecar or admission webhook depending on the integration mode selected in `config.yaml`.

## Fail-Closed Design

All four invariant layers default to deny. If the framework cannot validate a constraint (e.g., provenance chain is unavailable, circuit breaker state is unknown), it blocks the action and emits a structured audit event rather than allowing execution to proceed.
