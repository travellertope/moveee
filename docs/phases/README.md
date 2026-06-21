# Moveee — Product Upgrade Phases

Implementation plan for upgrading Moveee based on the comprehensive
PRD (June 2026). Each phase is a self-contained feature set with clear
dependencies.

## Phase Overview

| Phase | Name | Summary | Dependencies |
|-------|------|---------|--------------|
| **1** | [Interest Tagging](./phase-1-interest-tagging.md) | Mandatory interest selection at registration, personalised feed | None |
| **2** | [Credits & Reputation](./phase-2-credits-reputation.md) | Split points into spendable credits + permanent reputation | None |
| **3** | [Directory Knowledge Graph](./phase-3-directory-knowledge-graph.md) | Directory becomes central node for community posts, partner flag | Phase 2 |
| **4** | [Post Templates](./phase-4-post-templates.md) | Unified composer with 9 structured templates, retire standalone submits | Phase 3 |
| **5** | [Public Profiles](./phase-5-public-profiles.md) | `/connect/[username]` with community feed + creative portfolio | Phase 2, 4 |
| **6** | [Partner Perks](./phase-6-partner-perks.md) | Credit redemption: partner QR coupons + admin-approved cash-out | Phase 2, 3 |
| **7** | [Passkeys](./phase-7-passkeys.md) | WebAuthn passkey auth, credit security gates, phone OTP fallback | Phase 2, 6 |

## Dependency Graph

```
Phase 1 (Interests)          Phase 2 (Credits/Reputation)
    │                             │
    │                     ┌───────┼───────┐
    │                     │       │       │
    ▼                     ▼       ▼       ▼
Phase 5 ◄──────── Phase 4    Phase 3    Phase 6
(Profiles)        (Templates)  (Directory) (Perks)
                      │          │         │
                      │          │         │
                      ▼          ▼         ▼
                              Phase 7
                             (Passkeys)
```

## Recommended Build Order

1. **Phase 1 + Phase 2** can be built in parallel (no shared dependencies).
2. **Phase 3** after Phase 2 (needs credits/reputation for earning rules).
3. **Phase 4** after Phase 3 (needs directory linking infrastructure).
4. **Phase 5** after Phase 4 (needs template types for portfolio).
5. **Phase 6** after Phase 2 + 3 (needs credits + partner flag).
6. **Phase 7** after Phase 6 (needs redemption flows to gate).

Phases 5 and 6 can be built in parallel once their dependencies ship.

## Key Architecture Principles

- **Extend, don't destroy**: Every phase builds on existing systems. No
  existing data is deleted; new fields and tables are additive.
- **Directory is the knowledge graph**: All community annotations (reviews,
  takes, showcases) link back to directory entries as the canonical node.
- **Single creation surface**: The unified composer replaces all standalone
  submit pages. Templates enforce quality through required fields.
- **Dual-track economy**: Credits (spendable, daily-capped) vs. Reputation
  (permanent, status-granting). Credits flow out via partner perks or
  fee-heavy cash-out.
- **Passkeys over fingerprinting**: Hardware-bound authentication via
  WebAuthn, not third-party device fingerprinting SDKs.

## Naming Conventions

| Internal value | User-visible label |
|----------------|-------------------|
| `patron` | Connect Pro / Pro |
| `citizen` | Connect Citizen / Citizen |
| `credits` | Moveee Credits |
| `reputation` | Reputation Score |
| `taste-maker` | Taste Maker (reputation tier) |
| `is_partner` | Partner (directory/vendor designation) |
