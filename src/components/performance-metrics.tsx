import { calcOpenHeat } from "../utils/tradeCalculations";

const openHeat = calcOpenHeat(trades, portfolioSize);

<Metric 
  label="Open Heat" 
  value={openHeat.toFixed(2)}
  isPercentage
  tooltip="% of portfolio at risk on open positions (sum of risk per open trade / portfolio size)"
  isEditing={isEditing}
  index={10}
/> 