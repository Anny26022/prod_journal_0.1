import React, { useMemo } from 'react';
import { Card, CardBody, CardHeader, Divider, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, Tooltip } from "@heroui/react";
import { useTrades } from '../hooks/use-trades';
import { usePortfolio } from '../utils/PortfolioContext';
import { Icon } from '@iconify/react';
import { motion } from "framer-motion"; // Import motion for StatsCard animation
import SetupFrequencyChart from '../components/analytics/SetupFrequencyChart'; // Import the new chart component

// Assuming Trade type is available from useTrades or a common types file
// import { Trade } from '../types/trade'; 

// Placeholder type if not explicitly imported (ensure these match your actual Trade type structure)
interface Trade {
    id: string;
    name: string;
    positionStatus: "Open" | "Closed" | "Partial";
    positionSize: number; // Assuming positionSize is available
    plRs: number; // Add plRs for calculating win/loss stats
    holdingDays: number; // Add holdingDays for hold time stats
    date: string; // Add date for streak calculation
    pfImpact: number; // Add pfImpact for percentage-based calculations
    setup?: string; // Ensure setup is included for the chart
}


const DeepAnalyticsPage: React.FC = () => { // Renamed component
    const { trades, isLoading } = useTrades();
    const { portfolioSize } = usePortfolio();

    // --- Calculations for Deep Analytics --- //
    const analytics = useMemo(() => {
        const closedTrades = trades.filter(trade => trade.positionStatus === 'Closed' || trade.positionStatus === 'Partial');
        const totalTrades = closedTrades.length;

        if (totalTrades === 0) {
            return {
                expectancy: 0,
                profitFactor: 0,
                avgWinHold: 0,
                avgLossHold: 0,
                avgWin: 0,
                avgLoss: 0,
                winStreak: 0,
                lossStreak: 0,
                topWin: 0,
                topLoss: 0,
                avgWinPfImpact: 0,
                avgLossPfImpact: 0,
                totalPositivePfImpact: 0,
                totalAbsoluteNegativePfImpact: 0,
            };
        }

        const winningTrades = closedTrades.filter(trade => trade.plRs > 0);
        const losingTrades = closedTrades.filter(trade => trade.plRs < 0);
        const totalWinningTrades = winningTrades.length;
        const totalLosingTrades = losingTrades.length;

        // Calculate total positive and negative PF Impact
        const totalPositivePfImpact = winningTrades.reduce((sum, trade) => sum + trade.pfImpact, 0);
        const totalAbsoluteNegativePfImpact = losingTrades.reduce((sum, trade) => sum + Math.abs(trade.pfImpact), 0);

        // Calculate average PF Impact for winning and losing trades
        const avgWinPfImpact = totalWinningTrades > 0 ? totalPositivePfImpact / totalWinningTrades : 0;
        const avgLossPfImpact = totalLosingTrades > 0 ? totalAbsoluteNegativePfImpact / totalLosingTrades : 0;

        const winRate = totalTrades > 0 ? totalWinningTrades / totalTrades : 0;
        const lossRate = totalTrades > 0 ? totalLosingTrades / totalTrades : 0;

        // Expectancy (using Average PF Impact and Rates)
        const expectancy = (avgWinPfImpact * winRate) - (avgLossPfImpact * lossRate);

        // Profit Factor (using Total PF Impact)
        const profitFactor = totalAbsoluteNegativePfImpact > 0 ? totalPositivePfImpact / totalAbsoluteNegativePfImpact : totalPositivePfImpact > 0 ? Infinity : 0; // Handle division by zero

        // Recalculate Avg Win/Loss and Top Win/Loss using plRs (these are still useful in absolute terms)
        const totalProfit = winningTrades.reduce((sum, trade) => sum + trade.plRs, 0);
        const totalLoss = losingTrades.reduce((sum, trade) => sum + Math.abs(trade.plRs), 0); // Use absolute for total loss

        const avgWin = totalWinningTrades > 0 ? totalProfit / totalWinningTrades : 0;
        const avgLoss = totalLosingTrades > 0 ? totalLoss / totalLosingTrades : 0; // This will be a positive value

        const avgWinHold = totalWinningTrades > 0 ? winningTrades.reduce((sum, trade) => sum + trade.holdingDays, 0) / totalWinningTrades : 0;
        const avgLossHold = totalLosingTrades > 0 ? losingTrades.reduce((sum, trade) => sum + trade.holdingDays, 0) / totalLosingTrades : 0;

        const topWin = totalWinningTrades > 0 ? Math.max(...winningTrades.map(trade => trade.plRs)) : 0;
        const topLoss = totalLosingTrades > 0 ? Math.min(...losingTrades.map(trade => trade.plRs)) : 0; // Will be a negative value

        // Calculate Win/Loss Streaks (remains based on plRs)
        let currentWinStreak = 0;
        let maxWinStreak = 0;
        let currentLossStreak = 0;
        let maxLossStreak = 0;

        // Iterate through trades in chronological order to calculate streaks
        const sortedTradesByDate = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        for (const trade of sortedTradesByDate) {
            if (trade.positionStatus === 'Closed' || trade.positionStatus === 'Partial') { // Only consider closed or partial trades for streaks
                 if (trade.plRs > 0) {
                    currentWinStreak++;
                    maxLossStreak = Math.max(maxLossStreak, currentLossStreak);
                    currentLossStreak = 0;
                } else if (trade.plRs < 0) {
                    currentLossStreak++;
                    maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
                    currentWinStreak = 0;
                } else { // breakeven or zero P/L
                     maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
                     maxLossStreak = Math.max(maxLossStreak, currentLossStreak);
                     currentWinStreak = 0;
                     currentLossStreak = 0;
                }
            }
        }

        // Account for streaks ending at the last trade
        maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
        maxLossStreak = Math.max(maxLossStreak, currentLossStreak);

        return {
            expectancy: isFinite(expectancy) ? expectancy : 0,
            profitFactor: isFinite(profitFactor) ? profitFactor : (totalPositivePfImpact > 0 ? Infinity : 0),
            avgWinHold: Math.round(avgWinHold),
            avgLossHold: Math.round(avgLossHold),
            avgWin,
            avgLoss,
            winStreak: maxWinStreak,
            lossStreak: maxLossStreak,
            topWin,
            topLoss,

            // Include PF Impact based averages for display in tooltips or potentially elsewhere
            avgWinPfImpact: avgWinPfImpact,
            avgLossPfImpact: avgLossPfImpact,
            totalPositivePfImpact: totalPositivePfImpact,
            totalAbsoluteNegativePfImpact: totalAbsoluteNegativePfImpact,
        };

    }, [trades]);
    // --- End Calculations ---

    // Calculate and sort top allocations
    const topAllocations = useMemo(() => {
        if (!trades || trades.length === 0 || !portfolioSize || portfolioSize <= 0) {
            return [];
        }

        const openAndPartialTrades = trades.filter(trade =>
            trade.positionStatus === 'Open' || trade.positionStatus === 'Partial'
        );

        // Calculate allocation for each open/partial trade
        // Assuming allocation is (positionSize / portfolioSize) * 100
        const tradesWithAllocation = openAndPartialTrades.map(trade => ({
            ...trade,
            calculatedAllocation: trade.positionSize && portfolioSize > 0 
                ? (trade.positionSize / portfolioSize) * 100
                : 0
        }));

        // Sort by calculatedAllocation descending
        return tradesWithAllocation.sort((a, b) => b.calculatedAllocation - a.calculatedAllocation);

    }, [trades, portfolioSize]);

    const columns = [
        { key: "name", label: "Stock/Asset" },
        { key: "positionStatus", label: "Status" },
        { key: "positionSize", label: "Position Size (₹)" },
        { key: "calculatedAllocation", label: "Allocation (%)" },
    ];

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(value);
      };

    const renderCell = (item: Trade & { calculatedAllocation: number }, columnKey: string) => {
        const cellValue = item[columnKey as keyof typeof item];

        switch (columnKey) {
            case 'positionSize':
                return formatCurrency(cellValue as number);
            case 'calculatedAllocation':
                return `${(cellValue as number).toFixed(2)}%`;
            case 'positionStatus':
                return (
                    <span className={`capitalize px-2 py-0.5 rounded-full text-xs font-medium 
                        ${item.positionStatus === 'Open' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                         item.positionStatus === 'Partial' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' :
                         'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                    >
                        {cellValue}
                    </span>
                );
            default:
                return String(cellValue);
        }
    };


    return (
        <div className="p-6 space-y-6">

            {/* Display Stats Cards with calculated values */}
            {!isLoading && (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
                 <StatsCard 
                    title="Expectancy (%)" // Updated title
                    value={
                        <div className="flex items-center gap-1">
                            {analytics.expectancy.toFixed(2)}%
                             <Tooltip 
                                content={`Calculated as: (Average Win PF Impact % * Win Rate) - (Average Loss PF Impact % * Loss Rate)\n\nAvg Win PF Impact: ${analytics.avgWinPfImpact.toFixed(2)}%\nAvg Loss PF Impact: ${analytics.avgLossPfImpact.toFixed(2)}%`}
                                placement="top" 
                                radius="sm" 
                                shadow="md"
                                classNames={{ content: "bg-content1 border border-divider z-50 max-w-xs text-xs" }}
                            >
                                <Icon icon="lucide:info" className="text-base text-foreground-400 cursor-help" />
                            </Tooltip>
                        </div>
                    }
                    icon="lucide:trending-up" 
                    color={analytics.expectancy >= 0 ? "success" : "danger"}
                />
                <StatsCard 
                    title="Profit Factor" 
                    value={
                        <div className="flex items-center gap-1">
                           {isFinite(analytics.profitFactor) ? analytics.profitFactor.toFixed(2) : (analytics.profitFactor === Infinity ? "∞" : "0.00")}
                             <Tooltip 
                                content={`Calculated as: Total Positive PF Impact % / Total Absolute Negative PF Impact %\n\nTotal Positive PF Impact: ${analytics.totalPositivePfImpact.toFixed(2)}%\nTotal Negative PF Impact: ${-analytics.totalAbsoluteNegativePfImpact.toFixed(2)}%`}
                                placement="top" 
                                radius="sm" 
                                shadow="md"
                                classNames={{ content: "bg-content1 border border-divider z-50 max-w-xs text-xs" }}
                            >
                                <Icon icon="lucide:info" className="text-base text-foreground-400 cursor-help" />
                            </Tooltip>
                        </div>
                    }
                    icon="lucide:line-chart" 
                    color={analytics.profitFactor >= 1 ? "success" : "danger"}
                />
                 <StatsCard 
                    title="Avg Win Hold" 
                    value={`${analytics.avgWinHold} Day${analytics.avgWinHold !== 1 ? 's' : ''}`} 
                    icon="lucide:clock" 
                    color="success"
                />
                 <StatsCard 
                    title="Avg Loss Hold" 
                    value={`${analytics.avgLossHold} Day${analytics.avgLossHold !== 1 ? 's' : ''}`} 
                    icon="lucide:clock" 
                    color="danger"
                />
                 <StatsCard 
                    title="Avg Win (₹)" 
                    value={formatCurrency(analytics.avgWin)} 
                    icon="lucide:trending-up" 
                    color="success"
                />
                 <StatsCard 
                    title="Avg Loss (₹)" 
                    value={formatCurrency(-analytics.avgLoss)} // Display as negative for loss
                    icon="lucide:trending-down" 
                    color="danger"
                />
                 <StatsCard 
                    title="Win Streak" 
                    value={analytics.winStreak.toString()} 
                    icon="lucide:medal" 
                    color="primary"
                />
                 <StatsCard 
                    title="Loss Streak" 
                    value={analytics.lossStreak.toString()} 
                    icon="lucide:alert-triangle" 
                    color="danger"
                />
                 <StatsCard 
                    title="Top Win (₹)" 
                    value={formatCurrency(analytics.topWin)} 
                    icon="lucide:star" 
                    color="success"
                />
                 <StatsCard 
                    title="Top Loss (₹)" 
                    value={formatCurrency(analytics.topLoss)} // Already negative
                    icon="lucide:skull" 
                    color="danger"
                />
            </div>
            )}

            {/* Add Setup Frequency Chart */}
            {!isLoading && trades.length > 0 && (
                 <SetupFrequencyChart trades={trades} />
            )}

            <Card className="border border-divider">
                <CardHeader className="flex gap-3 items-center">
                    <Icon icon="lucide:pie-chart" className="text-xl text-primary-500" />
                    <div className="flex flex-col">
                        <p className="text-md font-semibold">Deep Analytics: Top Allocations</p> {/* Updated title for clarity */}
                        <p className="text-sm text-default-500">Largest open/partial positions by portfolio percentage.</p>
                    </div>
                </CardHeader>
                <Divider/>
                <CardBody className="p-0">
                    <Table
                         aria-label="Top Allocations Table"
                         classNames={{
                            wrapper: "min-h-[222px] p-0",
                            th: "bg-transparent border-b border-divider text-xs font-medium text-default-500 uppercase tracking-wider",
                            td: "py-2.5 text-sm",
                            base: "max-w-full"
                          }}
                    >
                        {/* Corrected TableHeader usage */}
                        <TableHeader columns={columns}>
                            {(column) => (
                                <TableColumn key={column.key}>
                                    {column.label}
                                </TableColumn>
                            )}
                        </TableHeader>
                        <TableBody 
                            items={topAllocations} 
                            isLoading={isLoading} 
                            emptyContent={isLoading ? " " : "No open or partial positions to display."}
                        >
                            {(item) => (
                                <TableRow key={item.id}>
                                    {columns.map((column) => (
                                        <TableCell key={`${item.id}-${column.key}`}>
                                            {renderCell(item, column.key)}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardBody>
            </Card>
        </div>
    );
};

interface StatsCardProps { // Added StatsCardProps interface
  title: string;
  value: React.ReactNode; // Allow ReactNode for value to include icon/tooltip
  icon: string;
  color: "primary" | "success" | "warning" | "danger";
}

const StatsCard: React.FC<StatsCardProps> = React.memo(({ title, value, icon, color }) => { // Added StatsCard component
  const getColors = () => {
    switch (color) {
      case "primary":
        return {
          bg: "bg-blue-50 dark:bg-blue-900/10",
          text: "text-blue-700 dark:text-blue-400",
          icon: "text-blue-600 dark:text-blue-400"
        };
      case "success":
        return {
          bg: "bg-emerald-50 dark:bg-emerald-900/10",
          text: "text-emerald-700 dark:text-emerald-400",
          icon: "text-emerald-600 dark:text-emerald-400"
        };
      case "warning":
        return {
          bg: "bg-amber-50 dark:bg-amber-900/10",
          text: "text-amber-700 dark:text-amber-400",
          icon: "text-amber-600 dark:text-amber-400"
        };
      case "danger":
        return {
          bg: "bg-red-50 dark:bg-red-900/10",
          text: "text-red-700 dark:text-red-400",
          icon: "text-red-600 dark:text-red-400"
        };
      default:
        return {
          bg: "bg-gray-50 dark:bg-gray-900/10",
          text: "text-gray-700 dark:text-gray-400",
          icon: "text-gray-600 dark:text-gray-400"
        };
    }
  };

  const colors = getColors();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ 
        y: -2,
        transition: { type: "spring", stiffness: 180, damping: 22 }
      }}
      className="will-change-transform"
    >
      <Card className="border border-gray-100 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900">
        <CardBody className="p-6">
          <motion.div 
            className="flex justify-between items-start will-change-transform"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="space-y-2">
              <motion.p 
                className="text-gray-500 dark:text-gray-400 text-sm font-medium"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                {title}
              </motion.p>
              <motion.p 
                className={`text-2xl font-semibold tracking-tight ${colors.text}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                {value} {/* Render ReactNode value */}
              </motion.p>
            </div>
            <motion.div 
              className={`p-3 rounded-xl ${colors.bg} ${colors.icon}`}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: 0.5,
                type: "spring",
                stiffness: 400,
                damping: 10
              }}
            >
              <Icon icon={icon} className="text-xl" />
            </motion.div>
          </motion.div>
        </CardBody>
      </Card>
    </motion.div>
  );
});

export default DeepAnalyticsPage; // Exporting the renamed component 