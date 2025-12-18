# CoinTrack Backend Documentation

> **Location**: `backend/docs/`
> **Status**: Production-Ready
> **Last Updated**: 2025-12-17

---

## Overview

This directory contains comprehensive technical documentation for the CoinTrack backend, covering architecture decisions, data flows, integration guides, and API specifications.

---

## Documentation Index

### Core Architecture

| Document | Description | Size |
|----------|-------------|------|
| [Portfolio Summary Architecture](./Portfolio_Summary_Architecture.md) | Core aggregation logic, calculations, precision specs | 389 lines |

### Zerodha Integration

| Document | Description | Size |
|----------|-------------|------|
| [**Master Integration Guide**](./zerodha/Zerodha_Master_Integration_Guide.md) | Complete Zerodha integration reference | 671 lines |
| [CoinTrack Mapping](./zerodha/Zerodha_CoinTrack_Mapping.md) | Field mapping between Zerodha API and CoinTrack DTOs | 164 lines |
| [Holdings Architecture](./zerodha/Zerodha_Holdings_Architecture.md) | Equity holdings data flow | 124 lines |
| [Positions Architecture](./zerodha/Zerodha_Positions_Architecture.md) | F&O positions data flow | 118 lines |
| [Funds Architecture](./zerodha/Zerodha_Funds_Architecture.md) | Margins and funds data flow | 130 lines |
| [MF Holdings Architecture](./zerodha/Zerodha_MF_Holdings_Architecture.md) | Mutual fund holdings | ~120 lines |
| [MF Orders Architecture](./zerodha/Zerodha_MF_Orders_Architecture.md) | MF order processing | ~115 lines |
| [MF SIPs & Instruments](./zerodha/Zerodha_MF_SIPs_Instruments_Architecture.md) | SIPs and MF scheme catalog | ~180 lines |
| [Portfolio Summary (Zerodha)](./zerodha/Portfolio_Summary_Architecture.md) | Zerodha-specific summary logic | ~135 lines |

---

## Document Categories

### 1. Architecture Documents

Technical specifications for how systems work:

- **Data flow diagrams** - How data moves through the system
- **Calculation formulas** - Exact math used for P&L, Day Gain
- **Precision specifications** - BigDecimal usage, rounding rules
- **Edge case handling** - Zero prices, missing data, IPOs

### 2. Integration Guides

How to work with external APIs:

- **OAuth flows** - Authentication with Zerodha
- **API endpoints** - Complete endpoint reference
- **Error handling** - Retry strategies, fallback logic
- **Rate limiting** - Throttling and mitigation

### 3. Mapping References

Field-by-field mappings:

- **Zerodha → CoinTrack** - How broker fields map to DTOs
- **DTO → Entity** - How DTOs persist to MongoDB
- **Entity → Response** - How data returns to frontend

---

## Quick Reference

### Design Principles

| Principle | Description |
|-----------|-------------|
| **Trust the Broker** | Use Zerodha's computed values (P&L, Day Change) |
| **Raw Pass-Through** | Every DTO includes original API JSON in `raw` field |
| **Zero Frontend Math** | Frontend displays values as-is; no calculations |
| **Holdings-Only Aggregation** | Positions excluded from portfolio summary |

### Key Files

| Purpose | Location |
|---------|----------|
| Portfolio Service | `src/.../portfolio/service/impl/PortfolioSummaryServiceImpl.java` |
| Zerodha Service | `src/.../broker/service/impl/ZerodhaBrokerService.java` |
| Sync Scheduler | `src/.../portfolio/scheduler/PortfolioSyncScheduler.java` |
| Cached Entities | `src/.../portfolio/model/Cached*.java` |

### Environment Variables

| Variable | Description |
|----------|-------------|
| `ENCRYPTION_SECRET` | Key for encrypting API secrets |
| `ENCRYPTION_SALT` | Salt for encryption |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | JWT signing key |

---

## Reading Order

**For new developers:**

1. Start with [Portfolio Summary Architecture](./Portfolio_Summary_Architecture.md)
2. Read [Zerodha Master Integration Guide](./zerodha/Zerodha_Master_Integration_Guide.md)
3. Reference specific docs as needed

**For debugging:**

1. Check [Master Integration Guide - Troubleshooting](./zerodha/Zerodha_Master_Integration_Guide.md#11-troubleshooting-guide)
2. Review relevant architecture doc for data flow
3. Verify mapping in [CoinTrack Mapping](./zerodha/Zerodha_CoinTrack_Mapping.md)

---

## Module READMEs

Each backend module has its own detailed README:

| Module | Location | Description |
|--------|----------|-------------|
| **Broker** | `src/.../broker/README.md` | Broker connections, OAuth, multi-broker support |
| **Common** | `src/.../common/README.md` | Utilities, exceptions, configuration |
| **Portfolio** | `src/.../portfolio/README.md` | Core aggregation, sync, positions |
| **Security** | `src/.../security/README.md` | JWT authentication, TOTP encryption |
| **User** | `src/.../user/README.md` | User management, TOTP 2FA |
| **Notes** | `src/.../notes/README.md` | Personal notes feature |

---

## File Statistics

| Category | Files | Total Lines | Total Size |
|----------|-------|-------------|------------|
| Core Docs | 1 | 389 | 14KB |
| Zerodha Docs | 9 | ~1,600 | 75KB |
| **Total** | **10** | **~2,000** | **~89KB** |

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.1.0 | 2025-12-17 | Added central README index |
| 1.0.0 | 2025-12-14 | Initial documentation structure |
