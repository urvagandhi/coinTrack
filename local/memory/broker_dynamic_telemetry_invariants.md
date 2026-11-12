# Broker Subsystem: Dynamic Telemetry & Syndication Architecture

## Core Requirement Noted
The user explicitly specified that all presentations in the broker subsystem must be **100% dynamic and backend-driven** when connected in production:

1. **Syndicated Channels Checklist & Feeds**:
   - `Equity Holdings`, `Mutual Funds`, `Positions & F&O`, `Available Margin` must be populated dynamically based on:
     - `BrokerCapability` supported by the specific adapter (`BrokerCapabilityChecker`).
     - What the user's account actually holds and is syndicating from the broker.
     - Live stream state (`Streaming`, `Syncing`, `Idle`, `Unsupported`) rather than hardcoded labels.

2. **Handshake Progress Stages**:
   - The token exchange loading stages:
     - `Exchanging request authorization token`
     - `Verifying AES-256-GCM encrypted signature`
     - `Establishing read-only portfolio telemetry`
   - Must reflect actual asynchronous backend handshake stages (via SSE, polling, or structured progress events) rather than mock timers.

3. **Diagnostics & Telemetry Metrics**:
   - `Last Synced`: Real timestamp and elapsed relative interval from `SyncStatusResponse.BrokerSyncStatus.lastSuccessAt`.
   - `Protocol`: Real adapter protocol (e.g. `Kite Connect v3`, `Upstox Pro V2`, `SmartAPI Direct`).
   - `Security Mode`: Real backend enforcement flag (`Read-Only Sync`).
   - `Gateway Health`: Real ping/health check state from `BrokerAdapter` (latency, operational status).

## Invariants & Design Token Consistency
- Keep the pure `font-sans`, neutral surfaces, status dots, and quiet hairline chrome from the `/unslop` pass.
- Retain the `/design-lab/brokers` interactive simulator for development and regression testing.
