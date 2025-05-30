import React from "react";
import { 
  Tooltip, 
  Dropdown, 
  DropdownTrigger, 
  DropdownMenu, 
  DropdownItem,
  Button 
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { Trade } from "../../types/trade";

interface TopPerformerProps {
  label: string;
  value: string | number;
  stock?: string;
  date?: string;
  isPercentage?: boolean;
  isPositive?: boolean;
  isNegative?: boolean;
  index?: number;
}

// Format a date string to a readable format
function formatDate(dateString: string) {
  if (!dateString) return "-";
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return dateString;
  }
}

const TopPerformer: React.FC<TopPerformerProps> = ({ 
  label, 
  value, 
  stock, 
  date, 
  isPercentage,
  isPositive,
  isNegative,
  index = 0
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <motion.div 
      className="relative overflow-hidden rounded-lg"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {/* Gradient accent */}
      <motion.div 
        className={`absolute inset-0 bg-gradient-to-r ${
          isPositive 
            ? 'from-success-500/10 via-success-500/5' 
            : isNegative 
            ? 'from-error-500/10 via-error-500/5' 
            : 'from-primary-500/10 via-primary-500/5'
        } to-transparent`}
        initial={{ x: "-100%" }}
        animate={{ x: isHovered ? "0%" : "-100%" }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
      />

      <motion.div 
        className="relative flex justify-between items-center p-3 backdrop-blur-sm bg-background/40 dark:bg-background/20 border border-foreground-200/10 dark:border-foreground-800/20"
        whileHover={{ x: 4 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
      >
        <div className="flex flex-col">
          <span className="text-sm font-medium text-foreground-700 dark:text-foreground-300">
            {label}
          </span>
          {stock && date && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <motion.span 
                className="text-xs font-medium text-foreground-600 dark:text-foreground-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {stock}
              </motion.span>
              <motion.span 
                className="inline-block w-1 h-1 rounded-full bg-foreground-400/50 dark:bg-foreground-600/50"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 }}
              />
              <motion.span 
                className="text-xs text-foreground-500 dark:text-foreground-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {formatDate(date)}
              </motion.span>
            </div>
          )}
        </div>

        <motion.div 
          className={`flex items-center gap-1.5 font-semibold text-sm ${
            isPositive 
              ? 'text-success-600 dark:text-success-400' 
              : isNegative 
              ? 'text-error-600 dark:text-error-400' 
              : 'text-foreground-800 dark:text-foreground-200'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isPositive && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, delay: 0.2 }}
            >
              <Icon icon="lucide:trending-up" className="w-4 h-4" />
            </motion.span>
          )}
          {isNegative && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, delay: 0.2 }}
            >
              <Icon icon="lucide:trending-down" className="w-4 h-4" />
            </motion.span>
          )}
          {isPercentage ? `${value}%` : value}
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

interface TopPerformersProps {
  trades: Trade[];
}

type TimeFilter = "1W" | "1M" | "3M" | "6M" | "YTD" | "1Y" | "ALL";
type MetricFilter = "stockMove" | "pfImpact" | "rewardRisk" | "plRs";

export const TopPerformers: React.FC<TopPerformersProps> = ({ trades }) => {
  const [timeFilter, setTimeFilter] = React.useState<TimeFilter>("ALL");
  const [metricFilter, setMetricFilter] = React.useState<MetricFilter>("stockMove");

  // Filter trades based on time period
  const filteredTrades = React.useMemo(() => {
    if (!trades || trades.length === 0) return [];
    
    const now = new Date();
    const filterDate = new Date();

    switch (timeFilter) {
      case "1W":
        filterDate.setDate(now.getDate() - 7);
        break;
      case "1M":
        filterDate.setMonth(now.getMonth() - 1);
        break;
      case "3M":
        filterDate.setMonth(now.getMonth() - 3);
        break;
      case "6M":
        filterDate.setMonth(now.getMonth() - 6);
        break;
      case "YTD":
        filterDate.setMonth(0, 1);
        break;
      case "1Y":
        filterDate.setFullYear(now.getFullYear() - 1);
        break;
      case "ALL":
      default:
        return trades;
    }

    return trades.filter(trade => new Date(trade.date) >= filterDate);
  }, [trades, timeFilter]);

  // Get top and bottom performers based on selected metric
  const { top, bottom } = React.useMemo(() => {
    if (!filteredTrades.length) return { top: null, bottom: null };

    const sortedTrades = [...filteredTrades].sort((a, b) => {
      const aValue = a[metricFilter] || 0;
      const bValue = b[metricFilter] || 0;
      return bValue - aValue;
    });

    return {
      top: sortedTrades[0],
      bottom: sortedTrades[sortedTrades.length - 1]
    };
  }, [filteredTrades, metricFilter]);

  // Format metric value based on type
  const formatMetricValue = (value: number) => {
    if (metricFilter === "plRs") {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
    }
    return value.toFixed(2);
  };

  // Get metric label
  const getMetricLabel = () => {
    switch (metricFilter) {
      case "stockMove":
        return "Move";
      case "pfImpact":
        return "pf Impact";
      case "rewardRisk":
        return "R:R";
      case "plRs":
        return "P/L";
      default:
        return "";
    }
  };

  if (!trades || trades.length === 0) {
    return (
      <div className="flex items-center justify-center p-4 text-default-500">
        No data available
      </div>
    );
  }

  if (!top || !bottom) {
    return (
      <div className="flex items-center justify-center p-4 text-default-500">
        No trades found for the selected period
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Dropdown>
          <DropdownTrigger>
            <Button 
              variant="flat" 
              size="sm"
              endContent={<Icon icon="lucide:chevron-down" className="text-sm" />}
            >
              {timeFilter}
            </Button>
          </DropdownTrigger>
          <DropdownMenu 
            aria-label="Time filter"
            selectionMode="single"
            selectedKeys={[timeFilter]}
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0] as TimeFilter;
              setTimeFilter(selected);
            }}
          >
            <DropdownItem key="1W">1W</DropdownItem>
            <DropdownItem key="1M">1M</DropdownItem>
            <DropdownItem key="3M">3M</DropdownItem>
            <DropdownItem key="6M">6M</DropdownItem>
            <DropdownItem key="YTD">YTD</DropdownItem>
            <DropdownItem key="1Y">1Y</DropdownItem>
            <DropdownItem key="ALL">ALL</DropdownItem>
          </DropdownMenu>
        </Dropdown>

        <Dropdown>
          <DropdownTrigger>
            <Button 
              variant="flat" 
              size="sm"
              endContent={<Icon icon="lucide:chevron-down" className="text-sm" />}
            >
              {getMetricLabel()}
            </Button>
          </DropdownTrigger>
          <DropdownMenu 
            aria-label="Metric filter"
            selectionMode="single"
            selectedKeys={[metricFilter]}
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0] as MetricFilter;
              setMetricFilter(selected);
            }}
          >
            <DropdownItem key="stockMove">Move</DropdownItem>
            <DropdownItem key="pfImpact">pf Impact</DropdownItem>
            <DropdownItem key="rewardRisk">R:R</DropdownItem>
            <DropdownItem key="plRs">P/L</DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>

      <div className="space-y-2">
        <TopPerformer 
          label={`Highest ${getMetricLabel()}`}
          value={formatMetricValue(top[metricFilter] || 0)}
          stock={top.name}
          date={top.date}
          isPercentage={metricFilter !== "plRs" && metricFilter !== "rewardRisk"}
          isPositive
          index={0}
        />
        <TopPerformer 
          label={`Lowest ${getMetricLabel()}`}
          value={formatMetricValue(bottom[metricFilter] || 0)}
          stock={bottom.name}
          date={bottom.date}
          isPercentage={metricFilter !== "plRs" && metricFilter !== "rewardRisk"}
          isNegative
          index={1}
        />
      </div>
    </div>
  );
};