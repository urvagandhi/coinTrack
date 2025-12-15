# Zerodha Positions Architecture

> [!IMPORTANT]
> **Trust the Broker**: This system uses Zerodha's computed values (`pnl`, `m2m`, `value`) as the authoritative source of truth. We do not recompute these values unless they are missing.

## 1. Data Flow Overview
1. **Fetch**: `ZerodhaBrokerService` fetches raw JSON from Zerodha API.
2. **Persist**: Raw data is mapped to `CachedPosition` and saved to MongoDB (raw fields preserved).
3. **Sync**: `PortfolioSyncService` updates the cache, ensuring changes in P&L/MTM are detected via checksums.
4. **Serve**: `PortfolioSummaryService` normalizes the data into `SummaryPositionDTO` for the frontend.
5. **Display**: Frontend displays values directly without recomputation.

## 2. Response Structure (Frontend Contract)

**Endpoint**: `/portfolio/summary` (Positions Section)

```json
{
  "symbol": "RELIANCE",
  "broker_quantity_map": {"ZERODHA": 10},
  "total_quantity": 10.0,
  "average_buy_price": 2400.00,
  "current_price": 2450.00,
  "previous_close": 2430.00,
  "invested_value": 24000.00,
  "current_value": 24500.00,
  "unrealized_pl": 500.00,
  "day_gain": 50.00,
  "day_gain_percent": 0.21,
  "position_type": "NET",
  "derivative": false,
  "raw": {
     "pnl": 500.00,
     "m2m": 50.00,
     "value": 24500.00,
     "buy_quantity": 10
     /* Contains ALL Zerodha raw fields (Pass-Through) */
  }
}
```

**Notes**:
- `previous_close` is the mapping from Zerodha’s raw `close_price`.
- `current_value` uses raw `value` if present, otherwise computes `quantity * last_price` (safe compute).
- `day_gain_percent` is computed logic `(m2m / invested_value) * 100` since broker doesn't provide it for positions.

## 3. Detailed Component Logic

### 3.1 Raw DTO (`ZerodhaPositionRaw` & Pass-Through)
Strict mapping of Zerodha `/portfolio/positions` (**Net Segment**).
*Note: Zerodha returns `net` (open positions) and `day` (today's activity). This integration implementation explicitly extracts and uses the `net` segment by default (actual open positions).*
- **Fields**: `tradingsymbol`, `exchange`, `quantity`, `overnight_quantity`, `average_price`, `last_price`, `pnl`, `m2m`, `value`.
- **Pass-Through Policy**: The backend explicitly preserves **ALL** fields returned by Zerodha (including any extended or future fields) in a generic `raw` map.
- **Optional Fields**: Fields like `value`, `buy_quantity`, `sell_quantity`, etc., are optional and are persisted exactly as returned (including `null` if acceptable by schema, or missing from map).

### 3.2 Persistence (`CachedPosition`)
Stores strict Zerodha values to ensure auditability.
- **Key Fields**: `pnl`, `mtm`, `aggregateBuyPrice`, `lastPrice`.
- **Raw Payload**: A full `rawData` map is stored to persist the exact JSON payload returned by the broker for every position.
- **Metadata**: `apiVersion="v3"`, `lastUpdated`.

### 3.3 Service Logic (`PortfolioSummaryServiceImpl`)
- **Rule 1 (Broker Values)**:
    - Use `pnl` and `m2m` from raw if provided — they are broker computed.
- **Rule 2 (Safe Computation)**:
    - If `raw.value != null` → `currentValue = raw.value`.
    - Else → `currentValue = quantity * last_price` (Safe Compute).
    - `investedValue = quantity * average_price`.
- **Rule 3 (Fallbacks)**:
    - `dayGainPercent`:
        - **Logic**: Compute only if `investedValue > 0`.
        - **Formula**: `(m2m / investedValue) * 100`.
        - **Default**: `0` if `investedValue <= 0` (safe failure).
- **Rule 4 (Derivative Detection)**:
    - `derivative = raw.instrument_type is not null`.
    - This ensures F&O positions are correctly marked based on confirmed API metadata.

### 3.4 Sync Logic (`PortfolioSyncServiceImpl`)
- Checksum includes: `symbol`, `quantity`, `buyPrice`, `pnl`, `mtm`, `value`, `netQuantity`, `overnightQuantity`.
- Ensures that even if quantity doesn't change, a change in P&L triggers a db update.

## 4. Edge Cases & Handling
- **Zero Price**: If `last_price` is 0, we treat it as "no data" for safe display.
- **Corrupt Data**: Positions with `quantity == 0` AND `pnl == 0` are filtered out during fetch.
- **Derivatives**: Set `derivative` true if `instrument_type` is present (uses confirmed fields returned by the API like product code/instrument meta, not inferred heuristics).
- **F&O Fields**: `instrument_type`, `strike_price`, `option_type`, `expiry_date` are populated if available.
- **Day Gain %**: Computed safely (based on m2m relative to invested value) and displayed. We do not suppress it backend-side; UI can choose to handle extreme swings.

## 5. Verification
- **Net vs Day**: Compare `net` positions vs `day` positions to ensure correct mapping (we persist `net`).
- **P&L/MTM Check**: Match positions P&L/MTM on Kite UI with API response.
- **Derivatives Test**: Test derivatives positions (F&O) to verify `instrument_type` usage triggers `derivative=true`.
- **Automated**: Checksums updates on every sync loop if market is open.
