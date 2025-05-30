import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Table, 
  TableHeader, 
  TableColumn, 
  TableBody, 
  TableRow, 
  TableCell,
  Button,
  useDisclosure,
  Tooltip,
  Pagination,
  Input,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Chip,
  Card,
  CardBody,
  User,
  SortDescriptor as HeroSortDescriptor
} from "@heroui/react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { TradeModal } from "./trade-modal";
import { DeleteConfirmModal } from "./delete-confirm-modal";
import { useTrades, SortDescriptor } from "../hooks/use-trades";
import { format } from 'date-fns';
import { usePortfolio } from "../utils/PortfolioContext";
import { tableRowVariants, springTransition } from "../utils/animations";
import { calcSLPercent } from "../utils/tradeCalculations";

const csvUrl = new URL('/name_sector_industry.csv', import.meta.url).href;

// Format a date string to a readable format
const formatDate = (dateString: string) => {
  try {
    return format(new Date(dateString), 'MMM d, yyyy');
  } catch (e) {
    return dateString;
  }
};

// Format a number as currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

import { Trade } from "../types/trade";

export interface TradeJournalProps {
  title?: string;
  statsTitle?: {
    totalTrades?: string;
    openPositions?: string;
    winRate?: string;
    totalPL?: string;
  };
  toggleFullscreen?: () => void;
  isFullscreen?: boolean;
}

export const TradeJournal = React.memo(function TradeJournal({ 
  title = "Trade Journal",
  statsTitle = {
    totalTrades: "Total Trades",
    openPositions: "Open Positions",
    winRate: "Win Rate",
    totalPL: "Total P/L"
  },
  toggleFullscreen,
  isFullscreen
}: TradeJournalProps) {
  const { 
    trades, 
    addTrade, 
    updateTrade, 
    deleteTrade, 
    isLoading, 
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    sortDescriptor,
    setSortDescriptor,
    visibleColumns,
    setVisibleColumns
  } = useTrades();
  
  const { isOpen: isAddOpen, onOpen: onAddOpen, onOpenChange: onAddOpenChange } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onOpenChange: onEditOpenChange } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onOpenChange: onDeleteOpenChange } = useDisclosure();
  const { portfolioSize } = usePortfolio();
  
  const [selectedTrade, setSelectedTrade] = React.useState<Trade | null>(null);
  const [page, setPage] = React.useState(1);
  const rowsPerPage = 10;
  
  const pages = Math.ceil(trades.length / rowsPerPage);
  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return trades.slice(start, end);
  }, [page, trades, rowsPerPage]);

  // Single source of truth for column definitions
  const allColumns = React.useMemo(() => [
    { key: "tradeNo", label: "Trade No.", sortable: true },
    { key: "date", label: "Date", sortable: true },
    { key: "name", label: "Name" },
    { key: "setup", label: "Setup" },
    { key: "buySell", label: "Buy/Sell", sortable: true },
    { key: "entry", label: "Entry (₹)", sortable: true },
    { key: "avgEntry", label: "Avg. Entry (₹)", sortable: true },
    { key: "sl", label: "SL (₹)", sortable: true },
    { key: "slPercent", label: "SL %", sortable: true },
    { key: "tsl", label: "TSL (₹)", sortable: true },
    { key: "cmp", label: "CMP (₹)", sortable: true },
    { key: "initialQty", label: "Initial Qty", sortable: true },
    { key: "pyramid1Price", label: "P1 Price (₹)", sortable: true },
    { key: "pyramid1Qty", label: "P1 Qty", sortable: true },
    { key: "pyramid1Date", label: "P1 Date", sortable: true },
    { key: "pyramid2Price", label: "P2 Price (₹)", sortable: true },
    { key: "pyramid2Qty", label: "P2 Qty", sortable: true },
    { key: "pyramid2Date", label: "P2 Date", sortable: true },
    { key: "positionSize", label: "Pos. Size", sortable: true },
    { key: "allocation", label: "Allocation (%)", sortable: true },
    { key: "exit1Price", label: "E1 Price (₹)", sortable: true },
    { key: "exit1Qty", label: "E1 Qty", sortable: true },
    { key: "exit1Date", label: "E1 Date", sortable: true },
    { key: "exit2Price", label: "E2 Price (₹)", sortable: true },
    { key: "exit2Qty", label: "E2 Qty", sortable: true },
    { key: "exit2Date", label: "E2 Date", sortable: true },
    { key: "exit3Price", label: "E3 Price (₹)", sortable: true },
    { key: "exit3Qty", label: "E3 Qty", sortable: true },
    { key: "exit3Date", label: "E3 Date", sortable: true },
    { key: "openQty", label: "Open Qty", sortable: true },
    { key: "exitedQty", label: "Exited Qty", sortable: true },
    { key: "avgExitPrice", label: "Avg. Exit (₹)", sortable: true },
    { key: "stockMove", label: "Stock Move (%)", sortable: true },
    { key: "openHeat", label: "Open Heat (%)", sortable: true },
    { key: "rewardRisk", label: "R:R", sortable: true },
    { key: "holdingDays", label: "Holding Days", sortable: true },
    { key: "positionStatus", label: "Status", sortable: true },
    { key: "realisedAmount", label: "Realised (₹)", sortable: true },
    { key: "plRs", label: "P/L (₹)", sortable: true },
    { key: "pfImpact", label: "PF Impact (%)", sortable: true },
    { key: "cummPf", label: "Cumm. PF (%)", sortable: true },
    { key: "planFollowed", label: "Plan Followed", sortable: true },
    { key: "exitTrigger", label: "Exit Trigger" },
    { key: "proficiencyGrowthAreas", label: "Growth Areas" },
    { key: "actions", label: "Actions", sortable: false },
  ], []);

  const headerColumns = React.useMemo(() => {
    return allColumns.filter(col => visibleColumns.includes(col.key));
  }, [allColumns, visibleColumns]);

  const handleEdit = (trade: Trade) => {
    setSelectedTrade(trade);
    onEditOpen();
  };

  const handleDelete = (trade: Trade) => {
    setSelectedTrade(trade);
    onDeleteOpen();
  };

  const handleAddTrade = (trade: Trade) => {
    addTrade(trade);
    onAddOpenChange();
  };

  const handleUpdateTrade = (trade: Trade) => {
    updateTrade(trade);
    onEditOpenChange();
  };

  const handleDeleteConfirm = () => {
    if (selectedTrade) {
      deleteTrade(selectedTrade.id);
      onDeleteOpenChange();
    }
  };

  const [editingId, setEditingId] = React.useState<string | null>(null);

  // List of calculated fields that should not be editable
  const nonEditableFields = [
    // Calculated fields
    'avgEntry', 'positionSize', 'allocation', 'openQty', 'exitedQty',
    'avgExitPrice', 'stockMove', 'slPercent', 'openHeat', 'rewardRisk',
    'holdingDays', 'realisedAmount', 'plRs', 'pfImpact', 'cummPf'
    // initialQty is now editable
  ];

  // Check if a field is editable
  const isEditable = (field: string) => !nonEditableFields.includes(field);

  const handleInlineEditSave = async (tradeId: string, field: keyof Trade, value: any) => {
    try {
      // Prevent editing of non-editable fields
      if (!isEditable(field as string)) {
        console.warn(`Field ${field} is not editable`);
        return;
      }
      
      const tradeToUpdate = trades.find(t => t.id === tradeId);
      if (!tradeToUpdate) {
        console.error(`Trade with id ${tradeId} not found`);
        return;
      }

      // Parse value based on field type
      let parsedValue: any = value;
      if (typeof tradeToUpdate[field] === 'number') {
        parsedValue = Number(value) || 0;
      } else if (field.endsWith('Date') && value) {
        parsedValue = new Date(value).toISOString();
      } else if (field === 'planFollowed') {
        parsedValue = Boolean(value);
      }

      // Create updated trade with the new value
      const updatedTrade = { ...tradeToUpdate, [field]: parsedValue };
    
      // Recalculate dependent fields if needed
      if (['entry', 'sl', 'tsl', 'initialQty', 'pyramid1Qty', 'pyramid2Qty', 
           'exit1Qty', 'exit2Qty', 'exit3Qty', 'pyramid1Price', 'pyramid2Price',
           'exit1Price', 'exit2Price', 'exit3Price', 'cmp'].includes(field as string)) {
        
        // Recalculate position size if quantities or prices change
        const totalQty = updatedTrade.initialQty + 
                       (updatedTrade.pyramid1Qty || 0) + 
                       (updatedTrade.pyramid2Qty || 0);
        
        // Recalculate average entry price
        let totalCost = updatedTrade.entry * updatedTrade.initialQty;
        let totalQtyCalc = updatedTrade.initialQty;
        
        if (updatedTrade.pyramid1Qty && updatedTrade.pyramid1Price) {
          totalCost += updatedTrade.pyramid1Qty * updatedTrade.pyramid1Price;
          totalQtyCalc += updatedTrade.pyramid1Qty;
        }
        
        if (updatedTrade.pyramid2Qty && updatedTrade.pyramid2Price) {
          totalCost += updatedTrade.pyramid2Qty * updatedTrade.pyramid2Price;
          totalQtyCalc += updatedTrade.pyramid2Qty;
        }
        
        const avgEntry = totalQtyCalc > 0 ? totalCost / totalQtyCalc : 0;
        updatedTrade.avgEntry = avgEntry;
        
        // Recalculate position size
        updatedTrade.positionSize = avgEntry * totalQty;
        
        // Recalculate allocation based on portfolio size
        updatedTrade.allocation = portfolioSize > 0 ? 
          (updatedTrade.positionSize / portfolioSize) * 100 : 0;
        
        // Recalculate SL percentage
        if (updatedTrade.entry && updatedTrade.sl) {
          updatedTrade.slPercent = Math.abs((updatedTrade.entry - updatedTrade.sl) / updatedTrade.entry) * 100;
        }
        
        // Recalculate open and exited quantities
        const exitedQty = (updatedTrade.exit1Qty || 0) + 
                         (updatedTrade.exit2Qty || 0) + 
                         (updatedTrade.exit3Qty || 0);
        
        updatedTrade.openQty = Math.max(0, totalQty - exitedQty);
        updatedTrade.exitedQty = Math.min(totalQty, exitedQty);
        
        // Recalculate average exit price if exit quantities or prices change
        if (['exit1Qty', 'exit2Qty', 'exit3Qty', 'exit1Price', 'exit2Price', 'exit3Price'].includes(field as string)) {
          let totalExitValue = 0;
          let totalExitQty = 0;
          
          if (updatedTrade.exit1Qty && updatedTrade.exit1Price) {
            totalExitValue += updatedTrade.exit1Qty * updatedTrade.exit1Price;
            totalExitQty += updatedTrade.exit1Qty;
          }
          
          if (updatedTrade.exit2Qty && updatedTrade.exit2Price) {
            totalExitValue += updatedTrade.exit2Qty * updatedTrade.exit2Price;
            totalExitQty += updatedTrade.exit2Qty;
          }
          
          if (updatedTrade.exit3Qty && updatedTrade.exit3Price) {
            totalExitValue += updatedTrade.exit3Qty * updatedTrade.exit3Price;
            totalExitQty += updatedTrade.exit3Qty;
          }
          
          updatedTrade.avgExitPrice = totalExitQty > 0 ? totalExitValue / totalExitQty : 0;
          
          // Calculate realised amount and P/L
          if (totalExitQty > 0) {
            const entryValue = updatedTrade.avgEntry * totalExitQty;
            const exitValue = updatedTrade.avgExitPrice * totalExitQty;
            updatedTrade.realisedAmount = exitValue;
            updatedTrade.plRs = updatedTrade.buySell === 'Buy' ? 
              exitValue - entryValue : 
              entryValue - exitValue;
              
            // Calculate portfolio impact
            updatedTrade.pfImpact = portfolioSize > 0 ? 
              (updatedTrade.plRs / portfolioSize) * 100 : 0;
          }
        }
        
        // Calculate stock move if CMP changes
        if (field === 'cmp' && updatedTrade.cmp && updatedTrade.entry) {
          updatedTrade.stockMove = ((updatedTrade.cmp - updatedTrade.entry) / updatedTrade.entry) * 100;
        }
        
        // Update position status
        if (updatedTrade.openQty <= 0) {
          updatedTrade.positionStatus = 'Closed';
        } else if (updatedTrade.exitedQty > 0) {
          updatedTrade.positionStatus = 'Partial';
        } else {
          updatedTrade.positionStatus = 'Open';
        }
      }

      // Validation: Pyramid/Exit dates cannot be before entry date
      if ([
        'pyramid1Date', 'pyramid2Date', 'exit1Date', 'exit2Date', 'exit3Date'
      ].includes(field as string)) {
        const entryDate = new Date(tradeToUpdate.date);
        const newDate = new Date(parsedValue);
        if (newDate < entryDate) {
          window.alert('Pyramid/Exit date cannot be earlier than Entry date.');
          return;
        }
      }

      try {
        // Update the trade in the state
        await updateTrade(updatedTrade);
        setEditingId(null); // Clear editing state
        console.log('Trade updated successfully:', updatedTrade);
      } catch (error) {
        console.error('Error updating trade:', error);
        // Optionally show an error message to the user
      }
    } catch (error) {
      console.error('Error in handleInlineEditSave:', error);
    }
  };



  // Format cell value based on its type
  const formatCellValue = (value: any, key: string) => {
    if (value === undefined || value === null || value === '') return '-';
    
    // Format dates
    if (key.endsWith('Date')) {
      return formatDate(value as string);
    }
    
    // Format currency values
    if ([
      'entry', 'avgEntry', 'sl', 'tsl', 'cmp', 'pyramid1Price', 'pyramid2Price', 
      'exit1Price', 'exit2Price', 'exit3Price', 'avgExitPrice', 'realisedAmount', 'plRs'
    ].includes(key)) {
      return formatCurrency(Number(value));
    }
    
    // Format percentage values
    if (['slPercent', 'openHeat', 'allocation', 'pfImpact', 'cummPf', 'stockMove'].includes(key)) {
      return `${Number(value).toFixed(2)}%`;
    }
    
    // Format reward/risk ratio
    if (key === 'rewardRisk') {
      return Number(value).toFixed(2) + 'x';
    }
    
    // Format boolean values
    if (key === 'planFollowed') {
      return value ? 'Yes' : 'No';
    }
    
    return String(value);
  };

  // Add color to P/L values
  const getValueColor = (value: any, key: string) => {
    if (key !== 'plRs') return '';
    const numValue = Number(value);
    return numValue < 0 ? 'text-danger' : numValue > 0 ? 'text-success' : '';
  };

  const renderCell = (trade: Trade, columnKey: string) => {
    const cellValue = trade[columnKey as keyof Trade];

    // Skip rendering for non-editable fields
    if (!isEditable(columnKey)) {
      return (
        <div className={`py-1 px-2 ${getValueColor(cellValue, columnKey)}`}>
          {formatCellValue(cellValue, columnKey)}
        </div>
      );
    }

    // Handle special cell types
    if (columnKey === 'buySell') {
      return (
        <BuySellCell 
          value={trade.buySell} 
          onSave={(value) => handleInlineEditSave(trade.id, 'buySell', value)} 
        />
      );
    }

    if (columnKey === 'positionStatus') {
      return (
        <PositionStatusCell 
          value={trade.positionStatus} 
          onSave={(value) => handleInlineEditSave(trade.id, 'positionStatus', value)} 
        />
      );
    }

    if (columnKey === 'name') {
      const fieldsForTooltip = allColumns.slice(allColumns.findIndex(col => col.key === "initialQty"));
      const tooltipContent = (
        <div className="p-3 text-xs max-w-2xl break-words">
          <h4 className="font-semibold text-sm mb-2">Trade Details: {trade.name}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {fieldsForTooltip.map(col => {
              if (col.key === "actions") return null;
              let value = trade[col.key as keyof Trade];
              if (["pyramid1Date", "pyramid2Date", "exit1Date", "exit2Date", "exit3Date"].includes(col.key)) {
                value = value ? formatDate(value as string) : "-";
              } else if (["entry", "avgEntry", "sl", "tsl", "cmp", "pyramid1Price", "pyramid2Price", "exit1Price", "exit2Price", "exit3Price", "avgExitPrice", "realisedAmount", "plRs"].includes(col.key)) {
                value = formatCurrency(value as number);
              } else if (["pfImpact", "cummPf", "rewardRisk", "stockMove", "openHeat", "allocation"].includes(col.key)) {
                let originalValue = Number(value);
                value = `${originalValue.toFixed(2)}`;
                if (col.key !== "rewardRisk" && !(col.key.includes("Price") || col.key.includes("Amount") || col.key.includes("Rs"))) {
                   value += "%" 
                }
              } else if (col.key === "planFollowed") {
                value = trade.planFollowed ? "Yes" : "No";
              } else if (value === undefined || value === null || value === ""){
                value = "-";
              }
              return (
                <div key={col.key} className="bg-content2/40 dark:bg-content2/30 p-1.5 rounded shadow-sm overflow-hidden text-ellipsis whitespace-nowrap">
                  <span className="font-medium text-default-700 dark:text-default-300">{col.label}: </span>
                  <span className="text-default-600 dark:text-default-400">{String(value)}</span>
                </div>
              );
            })}
          </div>
        </div>
      );
      
      return (
        <Tooltip 
          content={tooltipContent} 
          placement="right-start" 
          delay={0}
          closeDelay={0}
          radius="sm"
          shadow="md"
          classNames={{ content: "bg-content1 border border-divider" }}
        >
          <div className="max-w-[200px] cursor-default">
            <NameCell 
              value={trade.name} 
              onSave={(value) => handleInlineEditSave(trade.id, "name", value)} 
            />
          </div>
        </Tooltip>
      );
    }

    if (columnKey === 'setup') {
      return (
        <SetupCell 
          value={trade.setup || ''} 
          onSave={(value) => handleInlineEditSave(trade.id, 'setup', value)} 
        />
      );
    }

    if (columnKey === 'exitTrigger') {
      return (
        <ExitTriggerCell 
          value={trade.exitTrigger || ''} 
          onSave={(value) => handleInlineEditSave(trade.id, 'exitTrigger', value)} 
        />
      );
    }

    if (columnKey === 'proficiencyGrowthAreas') {
      return (
        <ProficiencyGrowthAreasCell 
          value={trade.proficiencyGrowthAreas || ''} 
          onSave={(value) => handleInlineEditSave(trade.id, 'proficiencyGrowthAreas', value)} 
        />
      );
    }

    if (columnKey === 'planFollowed') {
      return (
        <PlanFollowedCell 
          value={trade.planFollowed} 
          onSave={(value) => handleInlineEditSave(trade.id, 'planFollowed', value)} 
        />
      );
    }



    switch (columnKey) {
      // Text fields - only allow editing non-required fields
      case "exitTrigger":
      case "proficiencyGrowthAreas":
      case "baseDuration":
      case "pyramid1Date":
      case "pyramid2Date":
      case "exit1Date":
      case "exit2Date":
      case "exit3Date":
        return (
          <EditableCell
            value={cellValue as string}
            onSave={(value) => handleInlineEditSave(trade.id, columnKey as keyof Trade, value)}
            type="date"
          />
        );
        
      // Trade number (editable)
      case "tradeNo":
        return (
          <EditableCell 
            value={cellValue as string} 
            onSave={(value) => handleInlineEditSave(trade.id, columnKey as keyof Trade, value)} 
          />
        );
        
      // Date field (editable with date picker)
      case "date":
        return (
          <EditableCell 
            value={cellValue as string} 
            onSave={(value) => handleInlineEditSave(trade.id, columnKey as keyof Trade, value)}
            type="date"
          />
        );
        
      // Stock/Asset Name (editable)
      case "name":
        return (
          <EditableCell 
            value={cellValue as string} 
            onSave={(value) => handleInlineEditSave(trade.id, columnKey as keyof Trade, value)} 
          />
        );
        
      // Exit Trigger field (editable with dropdown)
      case "exitTrigger":
        return (
          <EditableCell 
            value={cellValue as string} 
            onSave={(value) => handleInlineEditSave(trade.id, columnKey as keyof Trade, value)}
            type="select"
            options={[
              "Breakeven exit",
              "Market Pressure",
              "R multiples",
              "Random",
              "SL",
              "Target",
              "Trailing SL"
            ]}
          />
        );
        
      // Setup field (editable with dropdown)
      case "setup":
        return (
          <EditableCell 
            value={cellValue as string} 
            onSave={(value) => handleInlineEditSave(trade.id, columnKey as keyof Trade, value)}
            type="select"
            options={[
              "ITB",
              "Chop BO",
              "IPO Base",
              "3/5/8",
              "21/50",
              "Breakout",
              "Pullback",
              "Reversal",
              "Continuation",
              "Gap Fill",
              "OTB",
              "Stage 2",
              "ONP BO",
              "EP",
              "Pivot Bo",
              "Cheat",
              "Flag",
              "Other"
            ]}
          />
        );
        
      // Proficiency Growth Areas field (editable with dropdown)
      case "proficiencyGrowthAreas":
        return (
          <EditableCell 
            value={cellValue as string} 
            onSave={(value) => handleInlineEditSave(trade.id, columnKey as keyof Trade, value)}
            type="select"
            options={[
              "Biased Analysis",
              "Booked Early",
              "Didn't Book Loss",
              "FOMO",
              "Illiquid Stock",
              "Illogical SL",
              "Lack of Patience",
              "Late Entry",
              "Momentum-less stock",
              "Overconfidence",
              "Overtrading",
              "Poor Exit",
              "Poor Po Size",
              "Poor Sector",
              "Poor Stock",
              "Shifted SL Suickly",
              "Too Early Entry",
              "Too Tight SL"
            ]}
          />
        );
        
      // Entry and SL fields (editable)
      case "entry":
      case "sl":
        return (
          <EditableCell 
            value={cellValue as number} 
            onSave={(value) => handleInlineEditSave(trade.id, columnKey as keyof Trade, value)} 
            type="price"
          />
        );
        
      // Other price fields
      case "tsl":
      case "cmp":
      case "pyramid1Price":
      case "pyramid2Price":
      case "exit1Price":
      case "exit2Price":
      case "exit3Price":
      case "avgEntry":
      case "avgExitPrice":
      case "positionSize":
      case "realisedAmount":
      case "plRs":
        return (
          <EditableCell 
            value={cellValue as number} 
            onSave={(value) => handleInlineEditSave(trade.id, columnKey as keyof Trade, value)} 
            type="price"
            colorValue={columnKey === 'plRs'}
          />
        );
        
      // Number fields with percentage
      case "slPercent":
      case "openHeat":
      case "allocation":
      case "pfImpact":
      case "cummPf":
      case "stockMove":
      case "rewardRisk":
        return (
          <EditableCell 
            value={cellValue as number} 
            onSave={(value) => handleInlineEditSave(trade.id, columnKey as keyof Trade, value)} 
            type="number"
          />
        );
        
      // Quantity fields - only pyramid and exit quantities are editable
      case "pyramid1Qty":
      case "pyramid2Qty":
      case "exit1Qty":
      case "exit2Qty":
      case "exit3Qty":
        return (
          <EditableCell 
            value={cellValue as number} 
            onSave={(value) => handleInlineEditSave(trade.id, columnKey as keyof Trade, value)} 
            type="number"
            min={0}
          />
        );
        
      // Non-editable quantity fields
      case "initialQty":
      case "openQty":
      case "exitedQty":
      case "holdingDays":
        return (
          <div className="py-1 px-2 text-right">
            {formatCellValue(cellValue, columnKey)}
          </div>
        );
      case "date":
      case "pyramid1Date":
      case "pyramid2Date":
      case "exit1Date":
      case "exit2Date":
      case "exit3Date":
        return <EditableCell value={cellValue as string} type="date" onSave={(value) => handleInlineEditSave(trade.id, columnKey as keyof Trade, value)} />;
      case "entry":
      case "avgEntry":
      case "sl":
      case "tsl":
      case "cmp":
      case "pyramid1Price":
      case "pyramid2Price":
      case "exit1Price":
      case "exit2Price":
      case "exit3Price":
      case "avgExitPrice":
      case "realisedAmount":
      case "plRs":
        return <EditableCell value={cellValue as number} type="price" onSave={(value) => handleInlineEditSave(trade.id, columnKey as keyof Trade, value)} />;
      case "initialQty":
      case "pyramid1Qty":
      case "pyramid2Qty":
      case "positionSize":
      case "exit1Qty":
      case "exit2Qty":
      case "exit3Qty":
      case "openQty":
      case "exitedQty":
      case "holdingDays":
        return <EditableCell value={cellValue as number} type="number" onSave={(value) => handleInlineEditSave(trade.id, columnKey as keyof Trade, value)} />;
      case "allocation":
      case "stockMove":
      case "openHeat":
      case "pfImpact":
      case "cummPf":
      case "rewardRisk":
        return <EditableCell value={cellValue as number} type="number" onSave={(value) => handleInlineEditSave(trade.id, columnKey as keyof Trade, value)} />;
      case "buySell":
        return <BuySellCell value={trade.buySell} onSave={(value) => handleInlineEditSave(trade.id, "buySell", value)} />;
      case "positionStatus":
        return <PositionStatusCell value={trade.positionStatus} onSave={(value) => handleInlineEditSave(trade.id, "positionStatus", value)} />;
      case "planFollowed":
        return <PlanFollowedCell value={trade.planFollowed} onSave={(value) => handleInlineEditSave(trade.id, "planFollowed", value)} />;
      case "slPercent":
        const slPercent = calcSLPercent(trade.sl, trade.entry);
        return (
          <div className="text-right font-medium text-small">
            {slPercent > 0 ? `${slPercent.toFixed(2)}%` : "-"}
          </div>
        );
      case "actions":
        return (
          <div className="flex items-center justify-end gap-2">
            <Tooltip content="Edit trade (modal)">
              <Button isIconOnly size="sm" variant="light" onPress={() => handleEdit(trade)}>
                <Icon icon="lucide:edit-3" className="w-4 h-4" />
              </Button>
            </Tooltip>
            <Tooltip content="Delete trade">
              <Button isIconOnly size="sm" variant="light" color="danger" onPress={() => handleDelete(trade)}>
                <Icon icon="lucide:trash-2" className="w-4 h-4" />
              </Button>
            </Tooltip>
          </div>
        );
      default:
        const val = trade[columnKey as keyof Trade];
        return val !== undefined && val !== null ? String(val) : "-";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 mb-6">
        <AnimatePresence>
          {/* <div>
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          </div> */}
          <div className="flex flex-row justify-between items-center gap-4 w-full">
            <div className="flex items-center gap-3 flex-1">
              <Input
                classNames={{
                  base: "max-w-[300px]",
                  inputWrapper: "h-9 bg-content2/40"
                }}
                placeholder="Search trades..."
                startContent={<Icon icon="lucide:search" className="text-default-400" />}
                value={searchQuery}
                onValueChange={setSearchQuery}
                size="sm"
              />
              <Dropdown>
                <DropdownTrigger>
                  <Button 
                    variant="flat" 
                    size="sm" 
                    endContent={<Icon icon="lucide:chevron-down" className="text-sm" />}
                  >
                    Status: {statusFilter || "All"}
                  </Button>
                </DropdownTrigger>
                <DropdownMenu 
                  aria-label="Status filter"
                  selectionMode="single"
                  selectedKeys={statusFilter ? [statusFilter] : []}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    setStatusFilter(selected === "All" ? "" : selected);
                  }}
                >
                  <DropdownItem key="All">All</DropdownItem>
                  <DropdownItem key="Open">Open</DropdownItem>
                  <DropdownItem key="Closed">Closed</DropdownItem>
                  <DropdownItem key="Partial">Partial</DropdownItem>
                </DropdownMenu>
              </Dropdown>
              <Dropdown>
                <DropdownTrigger>
                  <Button 
                    variant="flat" 
                    size="sm" 
                    endContent={<Icon icon="lucide:chevron-down" className="text-sm" />}
                  >
                    Columns
                  </Button>
                </DropdownTrigger>
                <DropdownMenu 
                  aria-label="Columns selection"
                  closeOnSelect={false}
                  selectionMode="multiple"
                  selectedKeys={new Set(visibleColumns)}
                  onSelectionChange={(keys) => setVisibleColumns(Array.from(keys as Set<string>))}
                >
                  {allColumns.filter(col => col.key !== "actions").map((column) => (
                    <DropdownItem key={column.key} className="capitalize">
                      {column.label}
                    </DropdownItem>
                  ))}
                </DropdownMenu>
              </Dropdown>
            </div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2"
            >
              {toggleFullscreen && (
                <Tooltip content={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"} placement="bottom">
                  <Button 
                    isIconOnly
                    variant="flat" 
                    size="sm" 
                    onPress={toggleFullscreen}
                    className="shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <Icon icon={isFullscreen ? "lucide:minimize-2" : "lucide:maximize-2"} className="text-lg" />
                  </Button>
                </Tooltip>
              )}
              <Button 
                isIconOnly
                color="primary" 
                onPress={onAddOpen}
                size="sm"
                className="bg-primary shadow-sm hover:shadow-md transition-all duration-200"
              >
                <Icon icon="lucide:plus" className="text-lg" />
              </Button>
            </motion.div>
          </div>
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          title={statsTitle.totalTrades} 
          value={trades.length.toString()} 
          icon="lucide:list" 
          color="primary"
        />
        <StatsCard 
          title={statsTitle.openPositions} 
          value={trades.filter(t => t.positionStatus === "Open").length.toString()} 
          icon="lucide:activity" 
          color="warning"
        />
        <StatsCard 
          title={statsTitle.winRate} 
          value={
            trades.length > 0
              ? ((trades.filter(t => t.plRs > 0).length / trades.length) * 100).toFixed(2) + '%'
              : '0.00%'
          }
          icon="lucide:target" 
          color="success"
        />
        <StatsCard 
          title={statsTitle.totalPL} 
          value={formatCurrency(trades.reduce((sum, trade) => sum + trade.plRs, 0))} 
          icon="lucide:trending-up" 
          color={trades.reduce((sum, trade) => sum + trade.plRs, 0) >= 0 ? "success" : "danger"}
        />
      </div>

      <Card className="border border-divider">
        <CardBody className="p-0">
          <div className="relative">
          <Table
            aria-label="Trade journal table"
            bottomContent={
              pages > 0 ? (
                <div className="flex w-full justify-center py-2">
                  <Pagination
                    isCompact
                    showControls
                    showShadow
                    color="primary"
                    page={page}
                    total={pages}
                    onChange={setPage}
                  />
                </div>
              ) : null
            }
            classNames={{
              wrapper: "min-h-[222px] p-0",
              th: "bg-transparent border-b border-divider text-xs font-medium text-default-500 uppercase tracking-wider",
              td: "py-2.5 text-sm",
              base: "max-w-full"
            }}
            sortDescriptor={sortDescriptor as HeroSortDescriptor}
            onSortChange={setSortDescriptor as (descriptor: HeroSortDescriptor) => void}
          >
            <TableHeader columns={headerColumns}>
              {(column) => (
                <TableColumn 
                  key={column.key} 
                  align={column.key === "actions" ? "end" : "start"}
                  allowsSorting={column.sortable}
                >
                  {column.label}
                </TableColumn>
              )}
            </TableHeader>
            <TableBody items={items} isLoading={isLoading} emptyContent={isLoading ? " " : "No trades found. Add your first trade!"}>
              {(item) => (
                <TableRow key={item.id} className="hover:bg-default-50 dark:hover:bg-default-900/30">
                  {headerColumns.map((column) => (
                    <TableCell key={`${item.id}-${column.key}`}>
                      {renderCell(item, column.key)}
                    </TableCell>
                  ))}
                </TableRow>
              )}
            </TableBody>
          </Table>
          </div>
        </CardBody>
      </Card>

      <AnimatePresence>
        {isAddOpen && (
          <TradeModal
            isOpen={isAddOpen}
            onOpenChange={onAddOpenChange}
            onSave={handleAddTrade}
            mode="add"
          />
        )}

        {selectedTrade && (
          <>
            <TradeModal
              isOpen={isEditOpen}
              onOpenChange={onEditOpenChange}
              trade={selectedTrade}
              onSave={handleUpdateTrade}
              mode="edit"
            />
            
            <DeleteConfirmModal
              isOpen={isDeleteOpen}
              onOpenChange={onDeleteOpenChange}
              onDelete={handleDeleteConfirm}
              tradeName={selectedTrade.name}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
});

interface StatsCardProps {
  title: string;
  value: string;
  icon: string;
  color: "primary" | "success" | "warning" | "danger";
}

const StatsCard: React.FC<StatsCardProps> = React.memo(({ title, value, icon, color }) => {
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
                {value}
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

interface EditableCellProps {
  value: string | number;
  onSave: (value: string | number) => void;
  type?: "text" | "number" | "price" | "date" | "select";
  colorValue?: boolean;
  min?: number;
  max?: number;
  options?: string[];
}

const EditableCell: React.FC<EditableCellProps> = React.memo(({ 
  value, 
  onSave, 
  type = "text", 
  colorValue = false,
  min,
  max,
  options
}) => {
  const [isEditing, setIsEditing] = React.useState(false);
  
  // Format date as dd-mm-yyyy for display and editing
  const formatDateForDisplay = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).replace(/\//g, '-');
    } catch (e) {
      return dateStr;
    }
  };

  // Convert dd-mm-yyyy to yyyy-mm-dd for the native date input
  const convertToISODate = (displayDate: string) => {
    try {
      const [day, month, year] = displayDate.split('-');
      return `${year}-${month}-${day}`;
    } catch (e) {
      return '';
    }
  };

  // Convert yyyy-mm-dd to ISO string
  const convertToFullISO = (dateStr: string) => {
    try {
      return new Date(dateStr).toISOString();
    } catch (e) {
      return '';
    }
  };

  const getInitialEditValue = () => {
    if (type === 'date' && value) {
      return formatDateForDisplay(value as string);
    }
    return String(value ?? '');
  };

  const [editValue, setEditValue] = React.useState(getInitialEditValue());
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  React.useEffect(() => {
    setEditValue(getInitialEditValue());
  }, [value, type]);

  const handleSave = () => {
    setIsEditing(false);
    if (type === "number" || type === "price") {
      onSave(Number(editValue));
    } else if (type === "date") {
      if (editValue) {
        // Convert the dd-mm-yyyy to ISO string
        const isoDate = convertToFullISO(convertToISODate(editValue));
        onSave(isoDate);
      } else {
        onSave("");
      }
    } else {
      onSave(editValue);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isoDate = e.target.value; // yyyy-mm-dd
    if (isoDate) {
      const displayDate = formatDateForDisplay(isoDate);
      setEditValue(displayDate);
      onSave(convertToFullISO(isoDate));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setEditValue(String(value));
    }
  };

  const getValueColor = () => {
    if (!colorValue || type !== "price") return "";
    const numValue = Number(value);
    return numValue < 0 ? "text-danger" : numValue > 0 ? "text-success" : "";
  };

  const handleFocus = () => {
    if (!isEditing) setIsEditing(true);
  };

  const inputTypeForHero = (): "text" | "number" | "date" => {
    if (type === "price") return "number";
    if (type === "select") return "text";
    return type as "text" | "number" | "date";
  };

  return (
    <motion.div
      className="relative"
      initial={false}
      animate={{ height: "auto" }}
      transition={{ duration: 0.2 }}
    >
      <AnimatePresence mode="wait">
        {type === "date" ? (
          <input
            type="date"
            className="h-7 px-2 rounded-md border border-divider bg-content1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 hover:bg-content2/40 transition-colors cursor-pointer w-[130px]"
            value={convertToISODate(editValue)}
            onChange={handleDateChange}
          />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {isEditing ? (
              <Input
                ref={inputRef}
                type={inputTypeForHero()}
                value={editValue}
                onValueChange={setEditValue}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                size="sm"
                variant="bordered"
                classNames={{
                  base: "w-full max-w-[160px]",
                  input: "text-right font-medium text-small py-0",
                  inputWrapper: "h-7 min-h-unit-7 bg-content1 shadow-sm"
                }}
                startContent={type === "price" && <span className="text-default-400 text-small">₹</span>}
                step={type === "price" ? "0.05" : undefined}
                min={min !== undefined ? min : (type === "price" ? 0 : undefined)}
                max={max !== undefined ? max : undefined}
              />
            ) : (
              <motion.div
                className="py-1 px-2 rounded-md cursor-text hover:bg-content2/40 transition-colors w-full max-w-[160px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  setEditValue(String(value));
                  setIsEditing(true);
                }}
                tabIndex={0}
                onFocus={handleFocus}
              >
                <div className="flex items-center gap-1">
                  {type === "price" && <span className="text-default-400 text-small">₹</span>}
                  <span className={`font-medium text-small ${getValueColor()}`}>
                    {type === "price" ? formatCurrency(value as number) : String(value)}
                  </span>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

interface StockCellProps {
  name: string;
  setup: string;
  onSave: (field: "name" | "setup", value: string | number) => void;
}

const StockCell: React.FC<StockCellProps> = ({ name, setup, onSave }) => {
  return (
    <div className="flex flex-col gap-1">
      <div className="max-w-[200px]">
        <EditableCell
          value={name}
          onSave={(value) => onSave("name", value)}
        />
      </div>
    </div>
  );
};

interface BuySellCellProps {
  value: "Buy" | "Sell";
  onSave: (value: "Buy" | "Sell") => void;
}

const BuySellCell: React.FC<BuySellCellProps> = ({ value, onSave }) => {
  return (
    <Dropdown>
      <DropdownTrigger>
        <Button
          size="sm"
          variant={value === "Buy" ? "flat" : "bordered"}
          color={value === "Buy" ? "success" : "danger"}
          className="min-w-[80px] h-7"
          endContent={<Icon icon="lucide:chevron-down" className="w-3.5 h-3.5" />}
        >
          {value}
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Buy/Sell selection"
        selectionMode="single"
        selectedKeys={[value]}
        onSelectionChange={(keys) => {
          const selected = Array.from(keys)[0] as "Buy" | "Sell";
          onSave(selected);
        }}
      >
        <DropdownItem key="Buy">Buy</DropdownItem>
        <DropdownItem key="Sell">Sell</DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
};

interface PositionStatusCellProps {
  value: "Open" | "Closed" | "Partial";
  onSave: (value: "Open" | "Closed" | "Partial") => void;
}

const PositionStatusCell: React.FC<PositionStatusCellProps> = ({ value, onSave }) => {
  return (
    <Dropdown>
      <DropdownTrigger>
        <Button
          size="sm"
          variant="flat"
          color={
            value === "Open" ? "primary" :
            value === "Closed" ? "success" : "warning"
          }
          className="min-w-[90px] h-7 capitalize"
          endContent={<Icon icon="lucide:chevron-down" className="w-3.5 h-3.5" />}
        >
          {value}
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Position status selection"
        selectionMode="single"
        selectedKeys={[value]}
        onSelectionChange={(keys) => {
          const selected = Array.from(keys)[0] as "Open" | "Closed" | "Partial";
          onSave(selected);
        }}
      >
        <DropdownItem key="Open">Open</DropdownItem>
        <DropdownItem key="Closed">Closed</DropdownItem>
        <DropdownItem key="Partial">Partial</DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
};

interface ProficiencyGrowthAreasCellProps {
  value: string;
  onSave: (value: string) => void;
}

const PROFICIENCY_GROWTH_AREAS = [
  'Booked Early',
  'Didn\'t Book Loss',
  'FOMO',
  'Illiquid Stock',
  'Illogical SL',
  'Lack of Patience',
  'Late Entry',
  'Momentum-less stock',
  'Overconfidence',
  'Overtrading',
  'Poor Exit',
  'Poor Po Size',
  'Poor Sector',
  'Poor Stock',
  'Shifted SL Suickly',
  'Too Early Entry',
  'Too Tight SL'
];

const ProficiencyGrowthAreasCell: React.FC<ProficiencyGrowthAreasCellProps> = React.memo(({ value, onSave }) => {
  return (
    <Dropdown>
      <DropdownTrigger>
        <Button
          size="sm"
          variant="flat"
          color="default"
          className="min-w-[180px] h-7 justify-between"
          endContent={<Icon icon="lucide:chevron-down" className="w-3.5 h-3.5" />}
        >
          {value || <span className="text-default-400">Select Growth Area</span>}
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Growth areas selection"
        selectionMode="single"
        selectedKeys={value ? [value] : []}
        onSelectionChange={(keys) => {
          const selected = Array.from(keys)[0] as string;
          if (selected) {
            onSave(selected);
          }
        }}
        className="max-h-[300px] overflow-y-auto"
      >
        {PROFICIENCY_GROWTH_AREAS.map((area) => (
          <DropdownItem key={area}>
            {area}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
});

interface NameCellProps {
  value: string;
  onSave: (value: string) => void;
}

const NameCell: React.FC<NameCellProps> = React.memo(({ value, onSave }) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(value);
  const [showDropdown, setShowDropdown] = React.useState(false);
  const [filtered, setFiltered] = React.useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = React.useState(-1);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Move stockNames state and effect here
  const [stockNames, setStockNames] = React.useState<string[]>([]);
  React.useEffect(() => {
    async function loadStockNames() {
      const response = await fetch(csvUrl);
      const csvText = await response.text();
      const Papa = (await import('papaparse')).default;
      Papa.parse(csvText, {
        header: true,
        complete: (results) => {
          const names = (results.data as any[]).map(row => row['Stock Name']).filter(Boolean);
          setStockNames(names);
        }
      });
    }
    loadStockNames();
  }, []);

  // Function to find closest matching stock name
  const findClosestMatch = (input: string): string | null => {
    if (!input || !stockNames.length) return null;
    
    const inputLower = input.toLowerCase();
    let bestMatch = null;
    let bestScore = 0;

    // First try exact prefix match
    const exactPrefixMatch = stockNames.find(name => 
      name.toLowerCase().startsWith(inputLower)
    );
    if (exactPrefixMatch) return exactPrefixMatch;

    // Then try contains match
    const containsMatch = stockNames.find(name => 
      name.toLowerCase().includes(inputLower)
    );
    if (containsMatch) return containsMatch;

    // Finally try fuzzy match
    for (const name of stockNames) {
      const nameLower = name.toLowerCase();
      let score = 0;
      let inputIndex = 0;

      // Calculate similarity score
      for (let i = 0; i < nameLower.length && inputIndex < inputLower.length; i++) {
        if (nameLower[i] === inputLower[inputIndex]) {
          score++;
          inputIndex++;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = name;
      }
    }

    // Only return match if it's reasonably similar
    return bestScore > (inputLower.length / 2) ? bestMatch : null;
  };

  React.useEffect(() => {
    if (isEditing && editValue) {
      const matches = stockNames.filter(n => 
        n.toLowerCase().includes(editValue.toLowerCase())
      );
      setFiltered(matches.slice(0, 10));
      setShowDropdown(matches.length > 0);
      setSelectedIndex(-1);
    } else {
      setShowDropdown(false);
    }
  }, [editValue, isEditing, stockNames]);

  const handleSave = (val?: string) => {
    const finalValue = val ?? editValue;
    if (finalValue.trim()) {
      // Check if the value exists in stockNames
      const exactMatch = stockNames.find(
        name => name.toLowerCase() === finalValue.toLowerCase()
      );
      
      if (exactMatch) {
        onSave(exactMatch); // Use the exact case from database
      } else {
        // Try to find closest match
        const closestMatch = findClosestMatch(finalValue);
        if (closestMatch) {
          const confirmed = window.confirm(
            `"${finalValue}" not found. Did you mean "${closestMatch}"?`
          );
          if (confirmed) {
            onSave(closestMatch);
          } else {
            setEditValue(value); // Revert to previous value if user declines
          }
        } else {
          window.alert(`"${finalValue}" is not a valid stock name.`);
          setEditValue(value); // Revert to previous value
        }
      }
    }
    setIsEditing(false);
    setShowDropdown(false);
    setSelectedIndex(-1);
  };

  // Scroll selected item into view
  React.useEffect(() => {
    if (selectedIndex >= 0 && dropdownRef.current) {
      const selectedElement = document.getElementById(`stock-suggestion-${selectedIndex}`);
      if (selectedElement) {
        selectedElement.scrollIntoView({ 
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [selectedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => {
          const next = prev + 1;
          return next >= filtered.length ? 0 : next;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => {
          const next = prev - 1;
          return next < 0 ? filtered.length - 1 : next;
        });
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSave(filtered[selectedIndex]);
        } else if (filtered.length === 1) {
          handleSave(filtered[0]);
        } else {
          handleSave();
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
      case 'Tab':
        if (selectedIndex >= 0) {
          e.preventDefault();
          handleSave(filtered[selectedIndex]);
        }
        break;
    }
  };

  if (isEditing) {
    return (
      <div className="relative min-w-[220px]">
        <input
          ref={inputRef}
          type="text"
          className="w-full min-w-[220px] px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-primary"
          value={editValue}
          onChange={e => setEditValue(e.target.value)}
          onBlur={() => setTimeout(() => handleSave(), 100)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
        {showDropdown && (
          <div
            ref={dropdownRef}
            className="absolute z-10 left-0 right-0 min-w-[220px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow max-h-48 overflow-y-auto overflow-x-auto mt-1"
            role="listbox"
            tabIndex={-1}
          >
            {filtered.map((name, i) => (
              <div
                key={name}
                id={`stock-suggestion-${i}`}
                role="option"
                aria-selected={i === selectedIndex}
                className={`px-3 py-1.5 text-sm cursor-pointer whitespace-nowrap ${
                  i === selectedIndex
                    ? 'bg-blue-100 dark:bg-blue-900'
                    : 'hover:bg-blue-50 dark:hover:bg-blue-800'
                }`}
                onMouseDown={() => handleSave(name)}
                onMouseEnter={() => setSelectedIndex(i)}
              >
                {name}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      className="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-text"
      onClick={() => setIsEditing(true)}
    >
      {value || <span className="text-gray-400">Stock name</span>}
    </div>
  );
});

interface SetupCellProps {
  value: string;
  onSave: (value: string) => void;
}

const SetupCell: React.FC<SetupCellProps> = React.memo(({ value, onSave }) => {
  return (
    <Dropdown>
      <DropdownTrigger>
        <Button
          size="sm"
          variant="flat"
          color="primary"
          className="min-w-[120px] h-7 justify-between"
          endContent={<Icon icon="lucide:chevron-down" className="w-3.5 h-3.5" />}
        >
          {value || <span className="text-default-400">Setup</span>}
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Setup type selection"
        selectionMode="single"
        selectedKeys={value ? [value] : []}
        onSelectionChange={(keys) => {
          const selected = Array.from(keys)[0] as string;
          if (selected) {
            onSave(selected);
          }
        }}
      >
        {SETUP_OPTIONS.map((option) => (
          <DropdownItem key={option}>
            {option}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
});

interface ExitTriggerCellProps {
  value: string;
  onSave: (value: string) => void;
}

const SETUP_OPTIONS = [
  'ITB',
  'Chop BO',
  'IPO Base',
  '3/5/8',
  '21/50',
  'Breakout',
  'Pullback',
  'Reversal',
  'Continuation',
  'Gap Fill',
  'OTB',
  'Stage 2',
  'ONP BO',
  'EP',
  'Pivot Bo',
  'Cheat',
  'Flag',
  'Other'
];

const EXIT_TRIGGER_OPTIONS = [
  'Breakeven exit',
  'Market Pressure',
  'R multiples',
  'Random',
  'SL',
  'Target',
  'Trailing SL exit',
  'Broke key MA\'s',
  'Panic sell',
  'Early sell off',
  'Failed BO'
];

const ExitTriggerCell: React.FC<ExitTriggerCellProps> = React.memo(({ value, onSave }) => {
  return (
    <Dropdown>
      <DropdownTrigger>
        <Button
          size="sm"
          variant="flat"
          color="default"
          className="min-w-[150px] h-7 justify-between"
          endContent={<Icon icon="lucide:chevron-down" className="w-3.5 h-3.5" />}
        >
          {value || <span className="text-default-400">Select Exit Trigger</span>}
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Exit trigger selection"
        selectionMode="single"
        selectedKeys={value ? [value] : []}
        onSelectionChange={(keys) => {
          const selected = Array.from(keys)[0] as string;
          if (selected) {
            onSave(selected);
          }
        }}
      >
        {EXIT_TRIGGER_OPTIONS.map((option) => (
          <DropdownItem key={option}>
            {option}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
});

interface PlanFollowedCellProps {
  value: boolean;
  onSave: (value: boolean) => void;
}

const PlanFollowedCell: React.FC<PlanFollowedCellProps> = ({ value, onSave }) => {
  const displayValue = value ? "Yes" : "No";
  return (
    <Dropdown>
      <DropdownTrigger>
        <Button
          size="sm"
          variant="flat"
          color={value ? "success" : "danger"}
          className="min-w-[70px] h-7"
          endContent={<Icon icon="lucide:chevron-down" className="w-3.5 h-3.5" />}
        >
          {displayValue}
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Plan followed selection"
        selectionMode="single"
        selectedKeys={[displayValue]}
        onSelectionChange={(keys) => {
          const selectedKey = Array.from(keys)[0] as string;
          onSave(selectedKey === "Yes");
        }}
      >
        <DropdownItem key="Yes">Yes</DropdownItem>
        <DropdownItem key="No">No</DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
};

export default TradeJournal;