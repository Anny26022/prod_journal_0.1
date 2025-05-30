import React from "react";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Tooltip, Input, Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { useTrades } from "../hooks/use-trades";
import { usePortfolio } from "../utils/PortfolioContext";
import { useCapitalChanges } from "../hooks/use-capital-changes";
import { calcXIRR } from "../utils/tradeCalculations";

interface MonthlyData {
  month: string;
  addedWithdrawn: number;
  startingCapital: number;
  pl: number;
  plPercentage: number;
  finalCapital: number;
  yearPlPercentage: string;
  trades: number;
  winPercentage: number;
  avgGain: number;
  avgLoss: number;
  avgRR: number;
  biggestImpact: number;
  smallestLoss: number;
  avgHoldingDays: number;
  cagr: number;
  rollingReturn1M: number;
  rollingReturn3M: number;
  rollingReturn6M: number;
  rollingReturn12M: number;
}

export const MonthlyPerformanceTable: React.FC = () => {
  const { trades } = useTrades();
  const { portfolioSize } = usePortfolio();
  const { monthlyCapital, capitalChanges, addCapitalChange, updateCapitalChange } = useCapitalChanges(trades, portfolioSize);
  const [yearlyStartingCapital, setYearlyStartingCapital] = React.useState(portfolioSize);

  // Inline editing state
  const [editingCell, setEditingCell] = React.useState<{ row: number; col: string } | null>(null);
  const [editingValue, setEditingValue] = React.useState<string>("");

  // Build monthly data from trades with proper date handling
  const monthOrder = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const monthlyMap: Record<string, { trades: typeof trades; date: Date }> = {};
  
  trades.forEach(trade => {
    const d = new Date(trade.date);
    const month = d.toLocaleString('default', { month: 'short' });
    if (!monthlyMap[month]) {
      monthlyMap[month] = { trades: [], date: d };
    }
    monthlyMap[month].trades.push(trade);
  });

  // Sort trades by date within each month
  Object.values(monthlyMap).forEach(monthData => {
    monthData.trades.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  });

  // Calculate initial monthly data with rolling capital
  const initialMonthlyData = monthOrder.map((month, i) => {
    const monthData = monthlyMap[month] || { trades: [], date: new Date() };
    const monthTrades = monthData.trades;
    const tradesCount = monthTrades.length;
    const winTrades = monthTrades.filter(t => t.plRs > 0);
    const lossTrades = monthTrades.filter(t => t.plRs < 0);
    const winPercentage = tradesCount > 0 ? (winTrades.length / tradesCount) * 100 : 0;
    const avgGain = winTrades.length > 0 ? winTrades.reduce((sum, t) => sum + (t.stockMove || 0), 0) / winTrades.length : 0;
    const avgLoss = lossTrades.length > 0 ? lossTrades.reduce((sum, t) => sum + (t.stockMove || 0), 0) / lossTrades.length : 0;
    const avgRR = tradesCount > 0 ? monthTrades.reduce((sum, t) => sum + (t.rewardRisk || 0), 0) / tradesCount : 0;
    const avgHoldingDays = tradesCount > 0 ? monthTrades.reduce((sum, t) => sum + (t.holdingDays || 0), 0) / tradesCount : 0;

    // Find corresponding monthly capital data
    const monthCapital = monthlyCapital.find(mc => mc.month === month) || {
      startingCapital: 0,
      deposits: 0,
      withdrawals: 0,
      pl: 0,
      finalCapital: 0
    };

    // For months with no trades, show '-' for most stats and set finalCapital to 0
    return {
      month,
      addedWithdrawn: monthCapital.deposits - monthCapital.withdrawals,
      startingCapital: monthCapital.startingCapital,
      pl: tradesCount > 0 ? monthCapital.pl : '-',
      plPercentage: tradesCount > 0 ? 0 : '-',
      finalCapital: tradesCount > 0 ? monthCapital.finalCapital : 0,
      yearPlPercentage: '',
      trades: tradesCount > 0 ? tradesCount : '-',
      winPercentage: tradesCount > 0 ? winPercentage : '-',
      avgGain: tradesCount > 0 ? avgGain : '-',
      avgLoss: tradesCount > 0 ? avgLoss : '-',
      avgRR: tradesCount > 0 ? avgRR : '-',
      biggestImpact: 0,
      smallestLoss: 0,
      avgHoldingDays: tradesCount > 0 ? avgHoldingDays : '-',
      cagr: 0,
      rollingReturn1M: 0,
      rollingReturn3M: 0,
      rollingReturn6M: 0,
      rollingReturn12M: 0
    };
  });

  // Effect to update yearly starting capital when portfolio size changes
  React.useEffect(() => {
    setYearlyStartingCapital(portfolioSize);
  }, [portfolioSize]);

  const computedData = React.useMemo(() => {
    const currentYear = new Date().getFullYear();
    
    return initialMonthlyData.map((row, i) => {
      const startingCapital = row.startingCapital;
      const pl = row.pl;
      const finalCapital = row.finalCapital;
      const monthIndex = monthOrder.indexOf(row.month);
      const currentDate = new Date(currentYear, monthIndex, 1);
      
      // Get all capital changes up to this month
      const relevantChanges = capitalChanges
        .filter(change => new Date(change.date) <= currentDate)
        .map(change => ({
          date: new Date(change.date),
          amount: change.type === 'deposit' ? change.amount : -change.amount
        }));

      // Calculate XIRR for different time periods
      const startOfYear = new Date(currentYear, 0, 1);
      const xirrYTD = (typeof startingCapital === 'number' && typeof finalCapital === 'number' && startingCapital !== 0)
        ? calcXIRR(startOfYear, yearlyStartingCapital, currentDate, finalCapital, relevantChanges)
        : 0;

      // Calculate rolling returns only if we have the required previous months' data
      let xirr1M = 0;
      let xirr3M = 0;
      let xirr6M = 0;
      let xirr12M = 0;

      // 1-month return
      if (i > 0 && initialMonthlyData[i-1] && typeof initialMonthlyData[i-1].finalCapital === 'number' && typeof finalCapital === 'number') {
        const prevMonth = new Date(currentYear, monthIndex - 1, 1);
        xirr1M = calcXIRR(
          prevMonth,
          initialMonthlyData[i-1].finalCapital,
          currentDate,
          finalCapital,
          relevantChanges.filter(c => c.date >= prevMonth)
        );
      }

      // 3-month return
      if (i >= 2 && initialMonthlyData[i-3] && typeof initialMonthlyData[i-3].finalCapital === 'number' && typeof finalCapital === 'number') {
        const prev3Month = new Date(currentYear, monthIndex - 3, 1);
        xirr3M = calcXIRR(
          prev3Month,
          initialMonthlyData[i-3].finalCapital,
          currentDate,
          finalCapital,
          relevantChanges.filter(c => c.date >= prev3Month)
        );
      }

      // 6-month return
      if (i >= 5 && initialMonthlyData[i-6] && typeof initialMonthlyData[i-6].finalCapital === 'number' && typeof finalCapital === 'number') {
        const prev6Month = new Date(currentYear, monthIndex - 6, 1);
        xirr6M = calcXIRR(
          prev6Month,
          initialMonthlyData[i-6].finalCapital,
          currentDate,
          finalCapital,
          relevantChanges.filter(c => c.date >= prev6Month)
        );
      }

      // 12-month return
      if (i >= 11 && initialMonthlyData[i-12] && typeof initialMonthlyData[i-12].finalCapital === 'number' && typeof finalCapital === 'number') {
        const prev12Month = new Date(currentYear, monthIndex - 12, 1);
        xirr12M = calcXIRR(
          prev12Month,
          initialMonthlyData[i-12].finalCapital,
          currentDate,
          finalCapital,
          relevantChanges.filter(c => c.date >= prev12Month)
        );
      }

      return {
        ...row,
        plPercentage: (typeof startingCapital === 'number' && typeof pl === 'number' && startingCapital !== 0)
          ? (pl / startingCapital) * 100
          : '-',
        cagr: xirrYTD,
        rollingReturn1M: xirr1M,
        rollingReturn3M: xirr3M,
        rollingReturn6M: xirr6M,
        rollingReturn12M: xirr12M
      };
    });
  }, [initialMonthlyData, yearlyStartingCapital, capitalChanges, monthOrder]);
  
  // Ensure we have valid data before rendering the table
  if (!computedData || computedData.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <p>No data available</p>
      </div>
    );
  }

  // Helper to get the date string for the first day of a month/year
  const getMonthDateString = (month: string, year: number) => {
    const monthIndex = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].indexOf(month);
    return new Date(year, monthIndex, 1).toISOString();
  };

  // Handler for saving the edited value
  const handleSaveAddedWithdrawn = (rowIndex: number, month: string, year: number) => {
    const value = Number(editingValue);
    if (isNaN(value)) return;
    // Find if a capital change exists for this month
    const monthDate = getMonthDateString(month, year);
    // Find any capital change for this month (assume only one per month for this UI)
    const existingChange = capitalChanges.find(change => {
      const d = new Date(change.date);
      return d.getFullYear() === year && d.getMonth() === new Date(monthDate).getMonth();
    });
    if (existingChange) {
      // Update
      updateCapitalChange({
        ...existingChange,
        amount: Math.abs(value),
        type: value >= 0 ? 'deposit' : 'withdrawal',
        date: monthDate,
        description: 'Manual edit from performance table'
      });
    } else {
      // Add
      addCapitalChange({
        amount: Math.abs(value),
        type: value >= 0 ? 'deposit' : 'withdrawal',
        date: monthDate,
        description: 'Manual edit from performance table'
      });
    }
    setEditingCell(null);
    setEditingValue("");
  };
  const columns = [
    {
      key: 'month',
      label: (
        <div className="flex items-center gap-1">
          Month
          <Tooltip content="Calendar month for the data row." placement="top">
            <Icon icon="lucide:info" className="text-base text-foreground-400 cursor-pointer" />
          </Tooltip>
        </div>
      )
    },
    {
      key: 'addedWithdrawn',
      label: (
        <div className="flex items-center gap-1">
          Added/Withdrawn
          <Tooltip
            content={
              <div className="max-w-xs text-xs p-1">
                <b>Assumption:</b><br />
                For XIRR calculation, all additions and withdrawals are assumed to occur on the <b>first day of the month</b>, even if the actual cash flow happened mid-month.<br /><br />
                This may slightly affect the accuracy of annualized returns if you have frequent mid-month capital changes.
              </div>
            }
            placement="top"
          >
            <Icon icon="lucide:info" className="text-base text-foreground-400 cursor-pointer" />
          </Tooltip>
        </div>
      )
    },
    {
      key: 'startingCapital',
      label: (
        <div className="flex items-center gap-1">
          Starting Capital
          <Tooltip content="Capital at the start of the month, before trades and capital changes." placement="top">
            <Icon icon="lucide:info" className="text-base text-foreground-400 cursor-pointer" />
          </Tooltip>
        </div>
      )
    },
    {
      key: 'pl',
      label: (
        <div className="flex items-center gap-1">
          P/L
          <Tooltip content="Total profit or loss from all trades closed in this month." placement="top">
            <Icon icon="lucide:info" className="text-base text-foreground-400 cursor-pointer" />
          </Tooltip>
        </div>
      )
    },
    {
      key: 'plPercentage',
      label: (
        <div className="flex items-center gap-1">
          % P/L
          <Tooltip content="Profit or loss as a percentage of starting capital for the month." placement="top">
            <Icon icon="lucide:info" className="text-base text-foreground-400 cursor-pointer" />
          </Tooltip>
        </div>
      )
    },
    {
      key: 'finalCapital',
      label: (
        <div className="flex items-center gap-1">
          Final Capital
          <Tooltip content="Capital at the end of the month, after trades and capital changes." placement="top">
            <Icon icon="lucide:info" className="text-base text-foreground-400 cursor-pointer" />
          </Tooltip>
        </div>
      )
    },
    {
      key: 'cagr',
      label: (
        <div className="flex items-center gap-1">
          YTD Return %
          <Tooltip
            content={
              <div className="max-w-xs text-xs p-1">
                <b>Year-to-Date Return</b> calculated using XIRR (Extended Internal Rate of Return)<br /><br />
                <ul className="list-disc pl-4">
                  <li>Accounts for the timing and size of all cash flows</li>
                  <li>Includes deposits and withdrawals</li>
                  <li>More accurate than simple percentage returns</li>
                  <li>Annualized return from start of year to current month</li>
                </ul>
                <br />
                <span className="text-foreground-400">Uses XIRR calculation which considers the timing of all cash flows</span>
              </div>
            }
            placement="top"
          >
            <Icon icon="lucide:info" className="text-base text-foreground-400 cursor-pointer" />
          </Tooltip>
        </div>
      )
    },
    {
      key: 'rollingReturn1M',
      label: (
        <div className="flex items-center gap-1">
          1M Return %
          <Tooltip
            content={
              <div className="max-w-xs text-xs p-1">
                <b>1-Month Return</b> calculated using XIRR<br /><br />
                <ul className="list-disc pl-4">
                  <li>Considers all cash flows in the last month</li>
                  <li>Accounts for timing of deposits/withdrawals</li>
                  <li>More accurate than simple month-over-month return</li>
                </ul>
              </div>
            }
            placement="top"
          >
            <Icon icon="lucide:info" className="text-base text-foreground-400 cursor-pointer" />
          </Tooltip>
        </div>
      )
    },
    {
      key: 'rollingReturn3M',
      label: (
        <div className="flex items-center gap-1">
          3M Return %
          <Tooltip
            content={
              <div className="max-w-xs text-xs p-1">
                <b>3-Month Return</b> calculated using XIRR<br /><br />
                <ul className="list-disc pl-4">
                  <li>Considers all cash flows in the last 3 months</li>
                  <li>Accounts for timing of deposits/withdrawals</li>
                  <li>Annualized return over the 3-month period</li>
                </ul>
              </div>
            }
            placement="top"
          >
            <Icon icon="lucide:info" className="text-base text-foreground-400 cursor-pointer" />
          </Tooltip>
        </div>
      )
    },
    {
      key: 'rollingReturn6M',
      label: (
        <div className="flex items-center gap-1">
          6M Return %
          <Tooltip
            content={
              <div className="max-w-xs text-xs p-1">
                <b>6-Month Return</b> calculated using XIRR<br /><br />
                <ul className="list-disc pl-4">
                  <li>Considers all cash flows in the last 6 months</li>
                  <li>Accounts for timing of deposits/withdrawals</li>
                  <li>Annualized return over the 6-month period</li>
                </ul>
              </div>
            }
            placement="top"
          >
            <Icon icon="lucide:info" className="text-base text-foreground-400 cursor-pointer" />
          </Tooltip>
        </div>
      )
    },
    {
      key: 'rollingReturn12M',
      label: (
        <div className="flex items-center gap-1">
          12M Return %
          <Tooltip
            content={
              <div className="max-w-xs text-xs p-1">
                <b>12-Month Return</b> calculated using XIRR<br /><br />
                <ul className="list-disc pl-4">
                  <li>Considers all cash flows in the last 12 months</li>
                  <li>Accounts for timing of deposits/withdrawals</li>
                  <li>True annual return considering all capital changes</li>
                </ul>
              </div>
            }
            placement="top"
          >
            <Icon icon="lucide:info" className="text-base text-foreground-400 cursor-pointer" />
          </Tooltip>
        </div>
      )
    },
    {
      key: 'trades',
      label: (
        <div className="flex items-center gap-1">
          Trades
          <Tooltip content="Number of trades closed in this month." placement="top">
            <Icon icon="lucide:info" className="text-base text-foreground-400 cursor-pointer" />
          </Tooltip>
        </div>
      )
    },
    {
      key: 'winPercentage',
      label: (
        <div className="flex items-center gap-1">
          % Win
          <Tooltip content="Percentage of trades closed with a profit in this month." placement="top">
            <Icon icon="lucide:info" className="text-base text-foreground-400 cursor-pointer" />
          </Tooltip>
        </div>
      )
    },
    {
      key: 'avgGain',
      label: (
        <div className="flex items-center gap-1">
          Avg Gain
          <Tooltip content="Average percentage gain for winning trades in this month." placement="top">
            <Icon icon="lucide:info" className="text-base text-foreground-400 cursor-pointer" />
          </Tooltip>
        </div>
      )
    },
    {
      key: 'avgLoss',
      label: (
        <div className="flex items-center gap-1">
          Avg Loss
          <Tooltip content="Average percentage loss for losing trades in this month." placement="top">
            <Icon icon="lucide:info" className="text-base text-foreground-400 cursor-pointer" />
          </Tooltip>
        </div>
      )
    },
    {
      key: 'avgRR',
      label: (
        <div className="flex items-center gap-1">
          Avg R:R
          <Tooltip content="Average reward-to-risk ratio for trades in this month." placement="top">
            <Icon icon="lucide:info" className="text-base text-foreground-400 cursor-pointer" />
          </Tooltip>
        </div>
      )
    },
    {
      key: 'avgHoldingDays',
      label: (
        <div className="flex items-center gap-1">
          Avg Days
          <Tooltip content="Average holding period (in days) for trades closed in this month." placement="top">
            <Icon icon="lucide:info" className="text-base text-foreground-400 cursor-pointer" />
          </Tooltip>
        </div>
      )
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="overflow-x-auto rounded-lg border border-default-200 dark:border-default-100">
        <Table 
          aria-label="Monthly performance table"
          classNames={{
            base: "min-w-[1200px]",
            th: "bg-default-100 dark:bg-default-800 text-foreground-600 dark:text-foreground-300 text-xs font-medium uppercase",
            td: "py-3 px-4 border-b border-default-200 dark:border-default-700"
          }}
        >
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn key={column.key} className="whitespace-nowrap">
                {column.label}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody items={computedData}>
            {(item) => (
              <TableRow key={item.month} className="group hover:bg-default-50 dark:hover:bg-default-800/60">
                {(columnKey) => {
                  if (columnKey === 'yearPlPercentage') return null;
                  const rowIndex = computedData.findIndex(d => d.month === item.month);
                const isEditing = editingCell && editingCell.row === rowIndex && editingCell.col === columnKey;
                    const value = item[columnKey as keyof typeof item];
                    if (columnKey === 'addedWithdrawn') {
                  if (isEditing) {
                    // Find the year for this month from monthlyCapital
                    const monthCapital = monthlyCapital.find(mc => mc.month === item.month);
                    const year = monthCapital ? monthCapital.year : new Date().getFullYear();
                        return (
                      <TableCell key={`${item.month}-${String(columnKey)}`}> 
                          <Input
                            autoFocus
                            size="sm"
                            variant="bordered"
                          value={editingValue}
                          onChange={e => setEditingValue(e.target.value)}
                          onBlur={() => handleSaveAddedWithdrawn(rowIndex, item.month, year)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              handleSaveAddedWithdrawn(rowIndex, item.month, year);
                            }
                          }}
                            classNames={{
                              inputWrapper: "h-8 min-h-0 bg-background dark:bg-default-100 border-default-300 dark:border-default-700 hover:border-primary dark:hover:border-primary focus-within:border-primary dark:focus-within:border-primary",
                              input: "text-sm text-foreground dark:text-foreground-200"
                            }}
                          />
                      </TableCell>
                        );
                      }
                  const numValue = Number(value);
                      return (
                    <TableCell
                      key={`${item.month}-${String(columnKey)}`}
                      className="cursor-pointer"
                      onClick={() => {
                        setEditingCell({ row: rowIndex, col: columnKey });
                        setEditingValue(numValue === 0 ? "" : String(numValue));
                      }}
                    >
                      <motion.div whileHover={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 400, damping: 10 }}>
                        {numValue === 0 ? (
                          <span className="text-foreground-500 dark:text-foreground-400">-</span>
                        ) : (
                          <span className={numValue < 0 ? "text-danger-600 dark:text-danger-400" : "text-success-600 dark:text-success-400"}>
                            {numValue < 0 ? `Withdrawn ₹${Math.abs(numValue).toLocaleString()}` : `Added ₹${numValue.toLocaleString()}`}
                        </span>
                        )}
                      </motion.div>
                    </TableCell>
                  );
                }
                
                if (columnKey === 'month') {
                  return (
                    <TableCell key={`${item.month}-${String(columnKey)}`}>
                      <span className="font-medium text-foreground dark:text-foreground-200">{value}</span>
                    </TableCell>
                      );
                    }
                    
                    if (columnKey === 'pl' || columnKey === 'plPercentage' || 
                        (typeof columnKey === 'string' && (columnKey === 'cagr' || columnKey.startsWith('rollingReturn')))) {
                      return (
                    <TableCell key={`${item.month}-${String(columnKey)}`}>
                        <span className={`${value !== '-' && Number(value) >= 0 ? "text-success-600 dark:text-success-400" : value !== '-' ? "text-danger-600 dark:text-danger-400" : ''}`}>
                          {value === '-' ? '-' : (columnKey === 'pl' ? Number(value).toLocaleString() : `${Number(value).toFixed(2)}%`)}
                        </span>
                    </TableCell>
                      );
                    }
                    
                    if (columnKey === 'winPercentage') {
                      return (
                    <TableCell key={`${item.month}-${String(columnKey)}`}>
                        <div className="flex items-center gap-1 text-foreground dark:text-foreground-200">
                          {value === '-' ? '-' : (
                            <>
                              {Number(value) > 0 ? (
                                <Icon icon="lucide:check" className="text-success-600 dark:text-success-400 w-3 h-3" />
                              ) : (
                                <Icon icon="lucide:x" className="text-danger-600 dark:text-danger-400 w-3 h-3" />
                              )}
                              {Number(value).toFixed(2)}%
                            </>
                          )}
                        </div>
                    </TableCell>
                      );
                    }
                    
                    if (columnKey === 'avgGain') {
                  return (
                    <TableCell key={`${item.month}-${String(columnKey)}`}>
                      {value === '-' ? '-' : (
                        Number(value) > 0 ? (
                          <span className="text-success-600 dark:text-success-400">{Number(value).toFixed(2)}%</span>
                        ) : <span className="text-foreground-500 dark:text-foreground-400">-</span>
                      )}
                    </TableCell>
                  );
                    }
                    
                    if (columnKey === 'avgLoss') {
                  return (
                    <TableCell key={`${item.month}-${String(columnKey)}`}>
                      {value === '-' ? '-' : (
                        <span className="text-danger-600 dark:text-danger-400">{Number(value).toFixed(2)}%</span>
                      )}
                    </TableCell>
                  );
                    }
                    
                    if (columnKey === 'avgRR') {
                      return (
                    <TableCell key={`${item.month}-${String(columnKey)}`}>
                        <span className={`${value !== '-' && Number(value) >= 0 ? "text-success-600 dark:text-success-400" : value !== '-' ? "text-danger-600 dark:text-danger-400" : ''}`}>
                          {value === '-' ? '-' : Number(value).toFixed(2)}
                        </span>
                    </TableCell>
                      );
                    }
                    
                    if (columnKey === 'startingCapital' || columnKey === 'finalCapital') {
                  return (
                    <TableCell key={`${item.month}-${String(columnKey)}`}>
                      <span className="text-foreground dark:text-foreground-200">{value === '-' ? '-' : Number(value).toLocaleString()}</span>
                    </TableCell>
                  );
                }
                
                if (columnKey === 'avgHoldingDays') {
                  return (
                    <TableCell key={`${item.month}-${String(columnKey)}`}>
                      {value === '-' ? '-' : Number(value).toFixed(2)}
                    </TableCell>
                  );
                }
                
                if (columnKey === 'trades') {
                  return (
                    <TableCell key={`${item.month}-${String(columnKey)}`}>
                      {value === '-' ? '-' : value}
                    </TableCell>
                  );
                }
                
                return (
                  <TableCell key={`${item.month}-${String(columnKey)}`}>
                    <span className="text-foreground dark:text-foreground-200">{value}</span>
                    </TableCell>
                  );
                }}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}; 
