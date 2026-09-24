/**
 * Holding Entity Model
 * Normalized asset holding shape shared across Broker integrations, MF, and manual assets.
 */
export const createHoldingModel = (rawHolding = {}) => ({
  id: rawHolding.id || rawHolding.instrumentId || rawHolding.symbol || '',
  symbol: rawHolding.symbol || rawHolding.tradingSymbol || rawHolding.name || '',
  name: rawHolding.name || rawHolding.schemeName || rawHolding.symbol || '',
  assetType: rawHolding.assetType || 'EQUITY', // EQUITY, MUTUAL_FUND, FD, EPF, PPF, GOLD, SILVER
  quantity: Number(rawHolding.quantity || rawHolding.units || 0),
  averagePrice: Number(rawHolding.averagePrice || rawHolding.avgNav || rawHolding.buyPrice || 0),
  currentPrice: Number(rawHolding.currentPrice || rawHolding.lastPrice || rawHolding.nav || 0),
  investedValue: Number(rawHolding.investedValue || (rawHolding.quantity * rawHolding.averagePrice) || 0),
  currentValue: Number(rawHolding.currentValue || (rawHolding.quantity * rawHolding.currentPrice) || 0),
  pnl: Number(rawHolding.pnl || rawHolding.unrealizedPnl || 0),
  pnlPercentage: Number(rawHolding.pnlPercentage || rawHolding.returnsPercentage || 0),
  broker: rawHolding.broker || null,
});
