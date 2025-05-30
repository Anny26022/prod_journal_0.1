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
  isEditMode: boolean;
  onEditRow: (month: string) => void;
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

export const TaxTable: React.FC<TaxTableProps> = ({ isEditMode, onEditRow, trades = [], taxesByMonth, setTaxesByMonth }) => {
  const { portfolioSize } = usePortfolio();
  const [taxBreakupSums, setTaxBreakupSums] = useState<{ [month: string]: number }>({});
  const [taxWarningByMonth, setTaxWarningByMonth] = useState<{ [month: string]: string }>({});

  // Group trades by month
  const monthOrder = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const monthlyMap: Record<string, Trade[]> = {};
  trades.forEach(trade => {
    const d = new Date(trade.date);
    const month = d.toLocaleString('default', { month: 'long' });
    if (!monthlyMap[month]) monthlyMap[month] = [];
    monthlyMap[month].push(trade);
  });

  const tableData = monthOrder.map(month => {
    const monthTrades = monthlyMap[month] || [];
    const totalTrades = monthTrades.length;
    const winTrades = monthTrades.filter(t => t.plRs > 0);
    const lossTrades = monthTrades.filter(t => t.plRs < 0);
    const winRate = totalTrades > 0 ? (winTrades.length / totalTrades) * 100 : 0;
    const avgProfit = winTrades.length > 0 ? (winTrades.reduce((sum, t) => sum + (t.plRs || 0), 0) / winTrades.length) : 0;
    const avgLoss = lossTrades.length > 0 ? (lossTrades.reduce((sum, t) => sum + (t.plRs || 0), 0) / lossTrades.length) : 0;
    const grossPL = monthTrades.reduce((sum, t) => sum + (t.plRs || 0), 0);
    const taxes = taxesByMonth[month] ?? 0;
    const netPL = grossPL - taxes;
    const taxPercent = grossPL !== 0 ? (taxes / Math.abs(grossPL)) * 100 : 0;
    const grossPFImpact = portfolioSize > 0 ? (grossPL / portfolioSize) * 100 : 0;
    const netPFImpact = portfolioSize > 0 ? ((grossPL - taxes) / portfolioSize) * 100 : 0;
    return {
      month,
      totalTrades,
      winRate: totalTrades > 0 ? winRate.toFixed(2) + "%" : "#N/A",
      avgProfit: winTrades.length > 0 ? avgProfit.toFixed(2) : "#DIV/0!",
      avgLoss: lossTrades.length > 0 ? avgLoss.toFixed(2) : "#DIV/0!",
      grossPL,
      taxes,
      netPL,
      taxPercent: grossPL !== 0 ? taxPercent.toFixed(2) + "%" : "0.00%",
      grossPFImpact: grossPFImpact.toFixed(2) + "%",
      netPFImpact: netPFImpact.toFixed(2) + "%",
      returnPercent: "-",
    };
  });

  // Helper to update breakup sum for a month (to be called from modal or parent)
  const updateTaxBreakupSum = (month: string, sum: number) => {
    setTaxBreakupSums(prev => ({ ...prev, [month]: sum }));
  };

  const handleCellChange = (index: number, field: keyof TaxData, value: string | number) => {
    if (field === 'taxes') {
      const month = tableData[index].month;
      const breakupSum = taxBreakupSums[month];
      let numValue = Number(value);
      if (breakupSum !== undefined && numValue > breakupSum) {
        numValue = breakupSum;
        setTaxWarningByMonth(prev => ({ ...prev, [month]: "Taxes cannot exceed the sum of detailed charges." }));
      } else {
        setTaxWarningByMonth(prev => ({ ...prev, [month]: "" }));
      }
      setTaxesByMonth(prev => ({ ...prev, [month]: numValue }));
    }
  };
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };
  
  const renderCell = (item: TaxData, columnKey: string, index: number) => {
    const cellValue = item[columnKey as keyof TaxData];
    
    if (isEditMode) {
      if (columnKey === 'month') {
        return cellValue;
      }
      
      if (columnKey === 'actions') {
        return (
          <div className="flex justify-end">
            <Button
              isIconOnly
              size="sm"
              variant="light"
              onPress={() => onEditRow(item.month)}
            >
              <Icon icon="lucide:edit-3" className="text-primary" />
            </Button>
          </div>
        );
      }
      
      if (columnKey === 'taxes') {
        return (
          <div>
            <Input
              size="sm"
              variant="bordered"
              value={cellValue.toString()}
              onChange={e => handleCellChange(index, 'taxes', e.target.value)}
              classNames={{ inputWrapper: "h-8 min-h-0", input: "text-sm" }}
              startContent={<span className="text-default-400">₹</span>}
              type="number"
              min={0}
            />
            {taxWarningByMonth[item.month] && (
              <div style={{color: 'red', fontSize: '0.9em'}}>{taxWarningByMonth[item.month]}</div>
            )}
          </div>
        );
      }
      
      return (
        <Input
          size="sm"
          variant="bordered"
          value={cellValue.toString()}
          onChange={(e) => handleCellChange(index, columnKey as keyof TaxData, e.target.value)}
          classNames={{
            inputWrapper: "h-8 min-h-0",
            input: "text-sm"
          }}
        />
      );
    }
    
    switch (columnKey) {
      case "month":
        return (
          <div className="font-medium">{cellValue}</div>
        );
      case "totalTrades":
        return cellValue;
      case "winRate":
      case "avgProfit":
      case "avgLoss":
      case "taxPercent":
      case "grossPFImpact":
      case "netPFImpact":
      case "returnPercent":
        const value = cellValue.toString();
        const isNegative = value.includes('-');
        const isInvalid = value.includes('#');
        
        if (isInvalid) {
          return <span className="text-default-400">{value}</span>;
        }
        
        return (
          <span className={isNegative ? "text-danger" : "text-success"}>
            {value}
          </span>
        );
      case "grossPL":
      case "taxes":
      case "netPL":
        const numValue = cellValue as number;
        return (
          <span className={numValue < 0 ? "text-danger" : "text-success"}>
            {formatCurrency(numValue)}
          </span>
        );
      case "actions":
        return (
          <div className="flex justify-end">
            <Tooltip content="View Details">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => onEditRow(item.month)}
              >
                <Icon icon="lucide:eye" className="text-default-600" />
              </Button>
            </Tooltip>
          </div>
        );
      default:
        return cellValue;
    }
  };
  
  return (
    <div className="overflow-x-auto">
      <Table 
        aria-label="Tax data table"
        removeWrapper
        isHeaderSticky
        classNames={{
          base: "max-h-[600px]",
        }}
      >
        <TableHeader>
          <TableColumn key="month">Month</TableColumn>
          <TableColumn key="totalTrades">Total Trades</TableColumn>
          <TableColumn key="winRate">Win Rate</TableColumn>
          <TableColumn key="avgProfit">Avg. Profit (₹)</TableColumn>
          <TableColumn key="avgLoss">Avg. Loss (₹)</TableColumn>
          <TableColumn key="grossPL">Gross P/L (₹)</TableColumn>
          <TableColumn key="taxes">Taxes (₹)</TableColumn>
          <TableColumn key="netPL">Net P/L (₹)</TableColumn>
          <TableColumn key="taxPercent">Tax %</TableColumn>
          <TableColumn key="grossPFImpact">Gross PF Impact</TableColumn>
          <TableColumn key="netPFImpact">Net PF Impact</TableColumn>
          <TableColumn key="returnPercent">% Return</TableColumn>
          <TableColumn key="actions" align="end">Actions</TableColumn>
        </TableHeader>
        <TableBody items={tableData}>
          {(item) => {
            const index = tableData.findIndex((row) => row.month === item.month);
            return (
              <TableRow 
                key={item.month}
                className={index % 2 === 0 ? "bg-content1/30" : ""}
              >
                {(columnKey) => (
                  <TableCell>{renderCell(item, columnKey.toString(), index)}</TableCell>
                )}
              </TableRow>
            );
          }}
        </TableBody>
      </Table>
    </div>
  );
};