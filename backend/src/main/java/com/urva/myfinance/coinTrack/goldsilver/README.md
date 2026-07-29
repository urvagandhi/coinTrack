# Gold & Silver Investment Management Module (v2.0.0 — Live Purity-Based Rates)

## Overview
The Gold & Silver module provides a robust, user-scoped tracking system for physical and scheme-based precious metal investments. Version 2 supersedes flat rate entry by introducing **live market rate fetching computed per-purity**, enabling 22K gold or 925 silver holdings to be priced off their purity-adjusted live market rates rather than a single flat spot rate.

## Key Features & Domain Concepts

### 1. Spot vs. Retail Premium Concept
Free metal price APIs (such as GoldAPI.io) return global spot rates (London Bullion benchmark) converted to target currency (INR). Indian retail market prices run higher due to import duties (~15%) and local dealer premiums.
- **Configurable Local Premium**: `MetalRateSettings` allows per-user tuning of local premium percentages (`goldLocalPremiumPercent` & `silverLocalPremiumPercent`, default `15.00%`).
- **Effective Base Rate Calculation**: `effectiveBaseRate = baseRatePerGram * (1 + localPremiumPercent / 100)`.

### 2. Structured Reference Data (`PurityOption`)
Purities are structured reference options rather than free-text strings:
- **System Defaults**: Seeded on startup for standard variants:
  - Gold: 24K (0.999), 22K (0.916), 18K (0.750)
  - Silver: 999 Silver (0.999), 925 Silver (0.925)
- **Custom Purities**: Users can define custom purity factors (e.g. regional alloys). Every holding references a `purityFactor` to compute per-purity live valuations: `currentMarketRate = effectiveBaseRate * purityFactor`.

### 3. Rate Modes (`LIVE` vs `MANUAL`)
- **`LIVE` (Default)**: Automatically updated whenever a new `MetalRateSnapshot` is persisted by the scheduler or force refresh.
- **`MANUAL`**: Pinned by the user for custom quotes/jeweller overrides. Untouched by automated scheduler recomputation.

### 4. Fetching, Caching & Quota Management
- **Provider Abstraction**: `MetalPriceProvider` interface decouples service logic from `GoldApiIoProvider`.
- **Scheduled Caching (`MetalRateFetchScheduler`)**: Cron job (default `0 0 10 * * *` / daily at 10 AM) fetches rates once globally for the entire application. Before each fetch, performs a **quota guard** (via `/api/stat`) and **health check** (via `/api/status`).
- **Quota Management (`GoldApiUsageService`)**: Monitors the 100 req/month GoldAPI limit. Configurable via `goldapi.monthly-limit` and `goldapi.safety-buffer` (default 5). Both scheduled and manual refreshes are blocked when usage exceeds `limit - buffer`. Usage stats are cached for 30 minutes to avoid burning API calls on monitoring.
- **Health Check**: Pre-flight health check via GoldAPI `/api/status` endpoint. If the service reports unhealthy, rate fetches are skipped and cached rates are preserved.
- **Server-Side Force Refresh Rate Limiting**: `POST /api/gold-silver/rates/refresh` enforces a minimum 30-minute gap between external provider calls across the deployment.
- **Stale-Rate Fallback**: If external API calls fail (network issue or quota limit), the previous snapshot is retained with `isStale = true` and `rateStale`/`rateAsOf` flags are propagated to DTOs for transparent UI rendering.

## Core Logic & Calculation Chain
1. `metalAmount = ratePerGram * netWeight`
2. `makingChargeAmount = metalAmount * (makingChargePercent / 100)`
3. `totalAmount = metalAmount + makingChargeAmount + stoneOtherCharges`
4. `gstAmount = totalAmount * (gstPercent / 100)`
5. `netAmount = totalAmount + gstAmount`
6. `currentMarketRate = effectiveBaseRate * purityFactor` (for `LIVE` mode)
7. `currentValue = currentMarketRate * netWeight`
8. `profitLoss = currentValue - netAmount`
9. `returnPercent = (profitLoss / netAmount) * 100`

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/gold-silver/rates/current` | Get latest cached metal rate snapshots & staleness status |
| POST | `/api/gold-silver/rates/refresh` | Manual force refresh (quota-guarded + health-checked) |
| GET | `/api/gold-silver/rates/usage` | Get GoldAPI quota usage stats (today, month, remaining) |
| GET | `/api/gold-silver/rates/health` | Check GoldAPI service health status |
| GET / PUT | `/api/gold-silver/rate-settings` | Get / update user's local premium settings |
| PATCH | `/api/gold-silver/{id}/rate-mode` | Switch holding between `LIVE` and `MANUAL` rate modes |
| GET / POST | `/api/gold-silver/purity-options` | Fetch available purities or create custom purity option |
| PATCH | `/api/gold-silver/market-rate` | Bulk update rate for `MANUAL`-mode records only |

## Collections
- `gold_silver_investments`: Investment records
- `metal_purity_options`: Purity reference data
- `metal_rate_snapshots`: Global cached rate history
- `metal_rate_settings`: User local premium settings
