import React, { useState } from "react";
import { 
  Table, 
  TableHeader, 
  TableColumn, 
  TableBody, 
  TableRow, 
  TableCell,
  Button,
  Tooltip,
  Input
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { Trade } from "../../types/trade";
import { usePortfolio } from "../../utils/PortfolioContext";

interface TaxTableProps {
  trades: Trade[];
  taxesByMonth: { [month: string]: number };
  setTaxesByMonth: React.Dispatch<React.SetStateAction<{ [month: string]: number }>>;
}

interface TaxData {
  month: string;
  totalTrades: number;
  winRate: string;
  avgProfit: string;
  avgLoss: string;
  grossPL: number;
  taxes: number;
  netPL: number;
  taxPercent: string;
  grossPFImpact: string;
  netPFImpact: string;
  returnPercent: string;
}

const taxData: TaxData[] = [
  { 
    month: "January", 
    totalTrades: 9, 
    winRate: "#N/A", 
    avgProfit: "#DIV/0!", 
    avgLoss: "-405.81", 
    grossPL: -3652.27, 
    taxes: 355.00, 
    netPL: -4007.27, 
    taxPercent: "-9.72%", 
    grossPFImpact: "-1.25%", 
    netPFImpact: "-1.37%", 
    returnPercent: "-1.25%" 
  },
  { 
    month: "February", 
    totalTrades: 0, 
    winRate: "#N/A", 
    avgProfit: "#DIV/0!", 
    avgLoss: "-678.72", 
    grossPL: -2714.89, 
    taxes: 93.00, 
    netPL: -2807.89, 
    taxPercent: "-3.43%", 
    grossPFImpact: "-0.94%", 
    netPFImpact: "-0.97%", 
    returnPercent: "-0.94%" 
  },
  { 
    month: "March", 
    totalTrades: 6, 
    winRate: "16.67%", 
    avgProfit: "2925", 
    avgLoss: "-591.68", 
    grossPL: -33.40, 
    taxes: 807.00, 
    netPL: -840.40, 
    taxPercent: "-2416.17%", 
    grossPFImpact: "-0.01%", 
    netPFImpact: "-0.26%", 
    returnPercent: "-0.01%" 
  },
  { 
    month: "April", 
    totalTrades: 12, 
    winRate: "33.33%", 
    avgProfit: "3681.2425", 
    avgLoss: "-508.41", 
    grossPL: 10657.72, 
    taxes: 690.35, 
    netPL: 9967.37, 
    taxPercent: "6.48%", 
    grossPFImpact: "3.47%", 
    netPFImpact: "3.24%", 
    returnPercent: "3.47%" 
  },
  { 
    month: "May", 
    totalTrades: 10, 
    winRate: "40%", 
    avgProfit: "4135.65", 
    avgLoss: "-661.93", 
    grossPL: 12571.03, 
    taxes: 972.52, 
    netPL: 11598.51, 
    taxPercent: "7.74%", 
    grossPFImpact: "3.95%", 
    netPFImpact: "3.65%", 
    returnPercent: "3.95%" 
  },
  { 
    month: "June", 
    totalTrades: 12, 
    winRate: "41.67%", 
    avgProfit: "14710.852", 
    avgLoss: "-993.57", 
    grossPL: 10657.72, 
    taxes: 1786.00, 
    netPL: 8871.72, 
    taxPercent: "16.76%", 
    grossPFImpact: "2.88%", 
    netPFImpact: "2.40%", 
    returnPercent: "17.99%" 
  },
  { 
    month: "July", 
    totalTrades: 16, 
    winRate: "50%", 
    avgProfit: "3690.04375", 
    avgLoss: "-763.42", 
    grossPL: 23413.03, 
    taxes: 2127.47, 
    netPL: 21285.56, 
    taxPercent: "9.09%", 
    grossPFImpact: "5.36%", 
    netPFImpact: "4.87%", 
    returnPercent: "5.36%" 
  },
  { 
    month: "August", 
    totalTrades: 9, 
    winRate: "44.44%", 
    avgProfit: "3042.5425", 
    avgLoss: "-971.99", 
    grossPL: 7310.20, 
    taxes: 768.85, 
    netPL: 6541.35, 
    taxPercent: "10.52%", 
    grossPFImpact: "1.59%", 
    netPFImpact: "1.42%", 
    returnPercent: "1.59%" 
  },
  { 
    month: "September", 
    totalTrades: 14, 
    winRate: "42.86%", 
    avgProfit: "15166.51333", 
    avgLoss: "-759.91", 
    grossPL: 84919.78, 
    taxes: 1750.00, 
    netPL: 83169.78, 
    taxPercent: "2.06%", 
    grossPFImpact: "18.16%", 
    netPFImpact: "17.79%", 
    returnPercent: "18.16%" 
  },
  { 
    month: "October", 
    totalTrades: 7, 
    winRate: "42.86%", 
    avgProfit: "248.73", 
    avgLoss: "-745.72", 
    grossPL: -2236.68, 
    taxes: 2956.00, 
    netPL: -5192.68, 
    taxPercent: "-132.16%", 
    grossPFImpact: "-0.23%", 
    netPFImpact: "-0.54%", 
    returnPercent: "-0.23%" 
  },
  { 
    month: "November", 
    totalTrades: 7, 
    winRate: "42.86%", 
    avgProfit: "1272.236667", 
    avgLoss: "-286.52", 
    grossPL: 2670.62, 
    taxes: 173.00, 
    netPL: 2497.62, 
    taxPercent: "6.48%", 
    grossPFImpact: "0.28%", 
    netPFImpact: "0.26%", 
    returnPercent: "0.28%" 
  },
  { 
    month: "December", 
    totalTrades: 20, 
    winRate: "50%", 
    avgProfit: "2818.115", 
    avgLoss: "-2164.22", 
    grossPL: 6538.92, 
    taxes: 4597.00, 
    netPL: 1941.92, 
    taxPercent: "70.30%", 
    grossPFImpact: "0.69%", 
    netPFImpact: "0.20%", 
    returnPercent: "0.69%" 
  }
];

export const TaxTable: React.FC<TaxTableProps> = ({ trades = [], taxesByMonth, setTaxesByMonth }) => {
  const { portfolioSize, getPortfolioSize } = usePortfolio();
  const [editingCell, setEditingCell] = useState<{ month: string; value: string } | null>(null);

  // Group trades by month
  const monthOrder = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const monthlyMap: Record<string, Trade[]> = {};
  trades.forEach(trade => {
    const d = new Date(trade.date);
    const month = d.toLocaleString('default', { month: 'long' });
    if (!monthlyMap[month]) monthlyMap[month] = [];
    monthlyMap[month].push(trade);
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const handleEditStart = (month: string, value: number) => {
    setEditingCell({ month, value: value.toString() });
  };

  const handleEditChange = (value: string) => {
    if (editingCell) {
      // Only allow positive numbers
      const numValue = value.replace(/[^0-9.]/g, '');
      setEditingCell({ ...editingCell, value: numValue });
    }
  };

  const handleEditComplete = () => {
    if (editingCell) {
      const newValue = parseFloat(editingCell.value);
      if (!isNaN(newValue) && newValue >= 0) {
        setTaxesByMonth(prev => ({
          ...prev,
          [editingCell.month]: newValue
        }));
      }
      setEditingCell(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEditComplete();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  const tableData = monthOrder.map(month => {
    const monthTrades = monthlyMap[month] || [];
    const totalTrades = monthTrades.length;
    const winTrades = monthTrades.filter(t => t.plRs > 0);
    const lossTrades = monthTrades.filter(t => t.plRs < 0);
    const winRate = totalTrades > 0 ? (winTrades.length / totalTrades) * 100 : 0;
    
    // Handle average calculations with N/A
    const avgProfit = winTrades.length > 0 
      ? (winTrades.reduce((sum, t) => sum + (t.plRs || 0), 0) / winTrades.length).toFixed(2)
      : "N/A";
      
    const avgLoss = lossTrades.length > 0 
      ? (lossTrades.reduce((sum, t) => sum + (t.plRs || 0), 0) / lossTrades.length).toFixed(2)
      : "N/A";
      
    const grossPL = monthTrades.reduce((sum, t) => sum + (t.plRs || 0), 0);
    const taxes = taxesByMonth[month] ?? 0;
    const netPL = grossPL - taxes;
    const taxPercent = grossPL !== 0 ? (taxes / Math.abs(grossPL)) * 100 : 0;
    const currentYear = new Date().getFullYear();
    const monthlyPortfolioSize = getPortfolioSize ? getPortfolioSize(month, currentYear) : portfolioSize;
    
    const grossPFImpact = monthlyPortfolioSize > 0 ? (grossPL / monthlyPortfolioSize) * 100 : 0;
    const netPFImpact = monthlyPortfolioSize > 0 ? ((grossPL - taxes) / monthlyPortfolioSize) * 100 : 0;
    
    return {
      month,
      totalTrades,
      winRate: totalTrades > 0 ? winRate.toFixed(2) + "%" : "N/A",
      avgProfit,
      avgLoss,
      grossPL,
      taxes,
      netPL,
      taxPercent: grossPL !== 0 ? taxPercent.toFixed(2) + "%" : "0.00%",
      grossPFImpact: grossPFImpact.toFixed(2) + "%",
      netPFImpact: netPFImpact.toFixed(2) + "%"
    };
  });

  const renderCell = (item: any, columnKey: string) => {
    const cellValue = item[columnKey];
    const isNegative = typeof cellValue === 'number' && cellValue < 0;

    // Special handling for taxes column - always editable
    if (columnKey === "taxes") {
      if (editingCell && editingCell.month === item.month) {
        return (
          <div className="flex items-center">
            <span className="text-default-400 mr-1">₹</span>
            <Input
              type="text"
              value={editingCell.value}
              onValueChange={handleEditChange}
              onBlur={handleEditComplete}
              onKeyDown={handleKeyPress}
              size="sm"
              variant="bordered"
              className="w-28"
              classNames={{
                input: "text-right",
                inputWrapper: "h-8 min-h-unit-8 bg-content2"
              }}
              autoFocus
            />
          </div>
        );
      }
      return (
        <motion.div 
          className="cursor-pointer hover:bg-content2 rounded px-2 py-1 transition-colors"
          onClick={() => handleEditStart(item.month, item.taxes)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {formatCurrency(cellValue)}
        </motion.div>
      );
    }

    // Regular cell rendering with improved styling
    if (typeof cellValue === 'number') {
      if (["grossPL", "netPL"].includes(columnKey)) {
        return (
          <span className={isNegative ? "text-danger" : "text-success"}>
            {formatCurrency(cellValue)}
          </span>
        );
      }
      return cellValue.toFixed(2);
    }

    // Handle percentage values and N/A
    if (typeof cellValue === 'string') {
      if (cellValue === "N/A") {
        return <span className="text-default-400">N/A</span>;
      }
      
      if (cellValue.includes('%')) {
        const value = parseFloat(cellValue);
        return (
          <span className={!isNaN(value) && value < 0 ? "text-danger" : "text-success"}>
            {cellValue}
          </span>
        );
      }
    }

    return cellValue;
  };

  return (
    <Table 
      aria-label="Monthly tax breakdown"
      classNames={{
        base: "border border-divider rounded-lg",
        th: "bg-content2 text-default-700",
        td: "py-3"
      }}
    >
      <TableHeader>
        <TableColumn>Month</TableColumn>
        <TableColumn>Total Trades</TableColumn>
        <TableColumn>Win Rate</TableColumn>
        <TableColumn>Avg Profit</TableColumn>
        <TableColumn>Avg Loss</TableColumn>
        <TableColumn>Gross P/L</TableColumn>
        <TableColumn>Taxes</TableColumn>
        <TableColumn>Net P/L</TableColumn>
        <TableColumn>Tax %</TableColumn>
        <TableColumn>Gross PF Impact</TableColumn>
        <TableColumn>Net PF Impact</TableColumn>
      </TableHeader>
      <TableBody>
        {tableData.map((item) => (
          <TableRow 
            key={item.month}
            className="hover:bg-content1/40 transition-colors"
          >
            <TableCell className="font-medium">{item.month}</TableCell>
            <TableCell>{item.totalTrades}</TableCell>
            <TableCell>{renderCell(item, "winRate")}</TableCell>
            <TableCell>{renderCell(item, "avgProfit")}</TableCell>
            <TableCell>{renderCell(item, "avgLoss")}</TableCell>
            <TableCell>{renderCell(item, "grossPL")}</TableCell>
            <TableCell>{renderCell(item, "taxes")}</TableCell>
            <TableCell>{renderCell(item, "netPL")}</TableCell>
            <TableCell>{renderCell(item, "taxPercent")}</TableCell>
            <TableCell>{renderCell(item, "grossPFImpact")}</TableCell>
            <TableCell>{renderCell(item, "netPFImpact")}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};