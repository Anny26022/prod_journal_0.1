import { calcOpenHeat } from "../utils/tradeCalculations";
import { usePortfolio } from "../utils/PortfolioContext";

const { getPortfolioSize } = usePortfolio();

// Calculate open heat for each trade using its respective monthly portfolio size
const openHeat = React.useMemo(() => {
  if (!trades || trades.length === 0) return 0;
  
  // Group trades by month/year
  const tradesByMonth = trades.reduce((acc, trade) => {
    if (trade.positionStatus !== 'Open' && trade.positionStatus !== 'Partial') return acc;
    
    const tradeDate = new Date(trade.date);
    const month = tradeDate.toLocaleString('default', { month: 'short' });
    const year = tradeDate.getFullYear();
    const key = `${year}-${month}`;
    
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(trade);
    return acc;
  }, {} as Record<string, any[]>);
  
  // Calculate total risk across all months
  let totalRisk = 0;
  
  Object.entries(tradesByMonth).forEach(([key, monthTrades]) => {
    const [year, month] = key.split('-');
    const monthlyPortfolioSize = getPortfolioSize(month, parseInt(year)) || portfolioSize;
    
    // Calculate risk for this month's trades using the month's portfolio size
    const monthlyRisk = monthTrades.reduce((sum, trade) => {
      const entryPrice = trade.avgEntry || trade.entry || 0;
      const sl = trade.sl || 0;
      const tsl = trade.tsl || 0;
      const qty = trade.openQty || 0;
      const buySell = trade.buySell || 'Buy';

      // Determine which stop to use (prioritize TSL if it exists)
      let effectiveStop = 0;
      if (tsl > 0) {
        effectiveStop = tsl;
      } else if (sl > 0) {
        effectiveStop = sl;
      } else {
        return sum; // No stop loss set, no risk calculation possible
      }

      if (!entryPrice || !effectiveStop || !qty) return sum;

      let riskPerShare = 0;
      if (buySell === 'Buy') {
        if (effectiveStop >= entryPrice) return sum;
        riskPerShare = entryPrice - effectiveStop;
      } else {
        if (effectiveStop <= entryPrice) return sum;
        riskPerShare = effectiveStop - entryPrice;
      }
      
      return sum + (riskPerShare * qty);
    }, 0);
    
    totalRisk += monthlyRisk;
  });
  
  // Calculate overall open heat as a percentage of the current portfolio size
  return portfolioSize > 0 ? (totalRisk / portfolioSize) * 100 : 0;
}, [trades, portfolioSize, getPortfolioSize]);

<Metric 
  label="Open Heat" 
  value={openHeat.toFixed(2)}
  isPercentage
  tooltip="% of portfolio at risk on open positions (sum of risk per open trade / portfolio size)"
  isEditing={isEditing}
  index={10}
/>