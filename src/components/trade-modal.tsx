import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Checkbox,
  Select,
  SelectItem,
  Textarea,
  Divider,
  Tabs,
  Tab
} from "@heroui/react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { Trade } from "../types/trade";
import { generateId } from "../utils/helpers";
import { useVirtualizer } from "@tanstack/react-virtual";
import { usePriceTicks } from "../hooks/usePriceTicks";
import {
  calcAvgEntry,
  calcPositionSize,
  calcAllocation,
  calcSLPercent,
  calcOpenQty,
  calcExitedQty,
  calcAvgExitPrice,
  calcStockMove,
  calcRewardRisk,
  calcHoldingDays,
  calcRealisedAmount,
  calcPLRs,
  calcPFImpact,
  calcCummPf,
  calcUnrealizedPL,
  calcRealizedPL_FIFO
} from "../utils/tradeCalculations";
import { usePortfolio } from "../utils/PortfolioContext";
import { useTrades } from "../hooks/use-trades";
import { validateTrade, TradeIssue } from "../utils/tradeValidations";

  // Debounce helper
  const useDebounce = <T,>(value: T, delay: number): T => {
    const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

    React.useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);

    return debouncedValue;
  };

  interface TradeModalProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    trade?: Trade;
    onSave: (trade: Trade) => void;
    mode: "add" | "edit";
    symbol?: string;
  }

  type TradeModalFormData = Trade & { slPercent: number };

  const defaultTrade: TradeModalFormData = {
    id: "",
    tradeNo: "",
    date: new Date().toISOString().split("T")[0],
    name: "",
    entry: 0,
    avgEntry: 0,
    sl: 0,
    tsl: 0,
    buySell: "Buy",
    cmp: 0,
    setup: "",
    baseDuration: "",
    initialQty: 0,
    pyramid1Price: 0,
    pyramid1Qty: 0,
    pyramid1Date: "",
    pyramid2Price: 0,
    pyramid2Qty: 0,
    pyramid2Date: "",
    positionSize: 0,
    allocation: 0,
    exit1Price: 0,
    exit1Qty: 0,
    exit1Date: "",
    exit2Price: 0,
    exit2Qty: 0,
    exit2Date: "",
    exit3Price: 0,
    exit3Qty: 0,
    exit3Date: "",
    openQty: 0,
    exitedQty: 0,
    avgExitPrice: 0,
    stockMove: 0,
    rewardRisk: 0,
    holdingDays: 0,
    positionStatus: "Open",
    realisedAmount: 0,
    plRs: 0,
    pfImpact: 0,
    cummPf: 0,
    planFollowed: true,
    exitTrigger: "",
    proficiencyGrowthAreas: "",
    slPercent: 0,
    openHeat: 0
  };

  interface TradeEntry {
    price: number;
    qty: number;
  }

  const recalculateTrade = (
    trade: Partial<TradeModalFormData>, 
    defaultPortfolioSize: number,
    getPortfolioSize?: (month: string, year: number) => number
  ): TradeModalFormData => {
    // Safely parse and filter entries
    const entries: TradeEntry[] = [
      { price: Number(trade.entry || 0), qty: Number(trade.initialQty || 0) },
      { price: Number(trade.pyramid1Price || 0), qty: Number(trade.pyramid1Qty || 0) },
      { price: Number(trade.pyramid2Price || 0), qty: Number(trade.pyramid2Qty || 0) }
    ].filter(e => e.qty > 0 && e.price > 0);

    const avgEntry = entries.length > 0 ? calcAvgEntry(entries) : Number(trade.entry) || 0;
    const totalQty = entries.reduce((sum, e) => sum + e.qty, 0);
    const positionSize = totalQty > 0 ? calcPositionSize(avgEntry, totalQty) : 0;
    // Get the portfolio size for the trade's month/year
    let tradePortfolioSize = defaultPortfolioSize;
    if (trade.date && getPortfolioSize) {
      const tradeDate = new Date(trade.date);
      const month = tradeDate.toLocaleString('default', { month: 'short' });
      const year = tradeDate.getFullYear();
      const monthlyPortfolioSize = getPortfolioSize(month, year);
      if (monthlyPortfolioSize !== undefined) {
        tradePortfolioSize = monthlyPortfolioSize;
      }
    }
    
    const allocation = positionSize > 0 && tradePortfolioSize > 0 ? 
      calcAllocation(positionSize, tradePortfolioSize) : 0;
    
    // Calculate exits
    const exit1Qty = Number(trade.exit1Qty || 0);
    const exit2Qty = Number(trade.exit2Qty || 0);
    const exit3Qty = Number(trade.exit3Qty || 0);
    
    const exitedQty = calcExitedQty(exit1Qty, exit2Qty, exit3Qty);
    const openQty = Math.max(0, totalQty - exitedQty);
    
    const exits: TradeEntry[] = [
      { price: Number(trade.exit1Price || 0), qty: exit1Qty },
      { price: Number(trade.exit2Price || 0), qty: exit2Qty },
      { price: Number(trade.exit3Price || 0), qty: exit3Qty }
    ].filter(e => e.qty > 0 && e.price > 0);
    
    const avgExitPrice = exits.length > 0 ? calcAvgExitPrice(exits) : 0;
    const stockMove = avgEntry > 0 ? calcStockMove(avgEntry, avgExitPrice, Number(trade.cmp || 0), openQty, exitedQty, trade.positionStatus || 'Open', trade.buySell || 'Buy') : 0;
    
    // Calculate SL percentage
    const entryPrice = Number(trade.entry) || 0;
    const slPrice = Number(trade.sl) || 0;
    const slPercent = entryPrice > 0 && slPrice > 0 ? calcSLPercent(slPrice, entryPrice) : 0;
    
    // Calculate reward/risk
    const cmp = Number(trade.cmp) || 0;
    const rewardRisk = entryPrice > 0 && slPrice > 0 ? calcRewardRisk(cmp, entryPrice, slPrice, trade.positionStatus || 'Open', avgExitPrice, openQty, exitedQty, trade.buySell || 'Buy') : 0;
    
    // Calculate holding period
    const entryDate = trade.date || '';
    const exitDate = trade.exit1Date || '';
    const holdingDays = entryDate && exitDate ? calcHoldingDays(entryDate, exitDate) : 0;
    
    // Calculate P&L
    const realisedAmount = exitedQty > 0 ? calcRealisedAmount(exitedQty, avgExitPrice) : 0;
    // Build entry and exit lots for FIFO
    const entryLots = [
      { price: Number(trade.entry || 0), qty: Number(trade.initialQty || 0) },
      { price: Number(trade.pyramid1Price || 0), qty: Number(trade.pyramid1Qty || 0) },
      { price: Number(trade.pyramid2Price || 0), qty: Number(trade.pyramid2Qty || 0) }
    ].filter(e => e.qty > 0 && e.price > 0);
    const exitLots = [
      { price: Number(trade.exit1Price || 0), qty: exit1Qty },
      { price: Number(trade.exit2Price || 0), qty: exit2Qty },
      { price: Number(trade.exit3Price || 0), qty: exit3Qty }
    ].filter(e => e.qty > 0 && e.price > 0);
    const plRs = exitedQty > 0 ? calcRealizedPL_FIFO(entryLots, exitLots, trade.buySell as 'Buy' | 'Sell') : 0;
    const pfImpact = tradePortfolioSize > 0 ? calcPFImpact(plRs, tradePortfolioSize) : 0;
    
    return {
      ...(trade as TradeModalFormData),
      avgEntry,
      positionSize,
      allocation,
      exitedQty,
      openQty,
      avgExitPrice,
      stockMove,
      slPercent,
      rewardRisk,
      holdingDays,
      realisedAmount,
      plRs,
      pfImpact
    };
  };

  export const TradeModal: React.FC<TradeModalProps> = React.memo(({
    isOpen,
    onOpenChange,
    trade,
    onSave,
    mode,
    symbol: initialSymbol = "",
  }) => {
    console.log("[TradeModal] Initial Symbol:", initialSymbol); // Log initial symbol
    const { latestPrice } = usePriceTicks(initialSymbol);
    
    // Update CMP when latest price changes
    React.useEffect(() => {
      if (latestPrice?.close && latestPrice.close > 0) {
        console.log("[TradeModal] Updating CMP with latest price:", latestPrice.close);
        handleChange('cmp', latestPrice.close);
      }
    }, [latestPrice]);
    const { portfolioSize, getPortfolioSize } = usePortfolio();
    const { trades } = useTrades();
    // Reset form when symbol changes
    React.useEffect(() => {
      if (initialSymbol && mode === 'add') {
        handleChange('name', initialSymbol);
      }
    }, [initialSymbol, mode]);

  // Unique key for sessionStorage
  const sessionKey = React.useMemo(() => {
    if (mode === 'edit' && trade?.id) return `tradeModal_edit_${trade.id}`;
    if (mode === 'add') return 'tradeModal_add';
    return 'tradeModal';
  }, [mode, trade]);

  // Compute next trade number for add mode
  const nextTradeNo = React.useMemo(() => {
    if (!trades || trades.length === 0) return "1";
    const nums = trades.map(t => parseInt(t.tradeNo, 10)).filter(n => !isNaN(n));
    return nums.length > 0 ? String(Math.max(...nums) + 1) : "1";
  }, [trades]);

  // Load formData from sessionStorage if present
  const [formData, setFormData] = React.useState<TradeModalFormData>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem(sessionKey + '_formData');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    if (trade) {
      return { ...defaultTrade, ...trade, slPercent: (trade as any).slPercent || 0 };
    } else if (mode === 'add') {
      return { ...defaultTrade, tradeNo: nextTradeNo };
    } else {
      return defaultTrade;
    }
  });
  const [isDirty, setIsDirty] = React.useState<boolean>(false);
  const [activeTab, setActiveTab] = React.useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem(sessionKey + '_activeTab');
      if (saved) return saved;
    }
    return 'basic';
  });

  // Save formData and tab to sessionStorage on change
  React.useEffect(() => {
    sessionStorage.setItem(sessionKey + '_formData', JSON.stringify(formData));
  }, [formData, sessionKey]);
  React.useEffect(() => {
    sessionStorage.setItem(sessionKey + '_activeTab', activeTab);
  }, [activeTab, sessionKey]);

  // Clear sessionStorage on close
  React.useEffect(() => {
    if (!isOpen) {
      sessionStorage.removeItem(sessionKey + '_formData');
      sessionStorage.removeItem(sessionKey + '_activeTab');
    }
  }, [isOpen, sessionKey]);

  // Define which fields should be calculated and read-only
  const calculatedFieldNames = React.useMemo(() => [
    // Calculated fields
    'riskReward', 'riskPerShare', 'totalRisk', 'positionSize', 'totalQty',
    'totalInvestment', 'exit1Amount', 'exit2Amount', 'exit3Amount', 'totalExitAmount',
    'pnl', 'pnlPercent', 'roi', 'avgEntry', 'allocation', 'slPercent', 'exitedQty',
    'openQty', 'avgExitPrice', 'stockMove', 'rewardRisk', 'holdingDays',
    'realisedAmount', 'plRs', 'pfImpact', 'cummPf'
  ], []);
  
  const debouncedFormData = useDebounce(formData, 300);

  // Virtualization setup for form fields
  const parentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (trade) {
      setFormData({ ...defaultTrade, ...trade, slPercent: (trade as any).slPercent || 0 });
    } else if (mode === 'add') {
      setFormData({ ...defaultTrade, tradeNo: nextTradeNo });
    } else {
      setFormData(defaultTrade);
    }
  }, [trade, mode, nextTradeNo]);

  // Auto-calculate derived fields when form data changes
  React.useEffect(() => {
    // Skip calculation if form is not dirty and in edit mode
    if (!isDirty && mode === 'edit') return;
    
    // Use a timeout to debounce rapid updates
    const timer = setTimeout(() => {
      setFormData(prevData => {
        // Create a copy of the previous data
        const updatedData = { ...prevData };
        
        // Recalculate all fields using the recalculateTrade function
        const recalculated = recalculateTrade(updatedData, portfolioSize, getPortfolioSize);
        
        // Only update if there are actual changes to prevent infinite loops
        const hasChanges = Object.keys(recalculated).some(key => 
          JSON.stringify(recalculated[key as keyof Trade]) !== JSON.stringify(updatedData[key as keyof Trade])
        );
        
        return hasChanges ? { ...updatedData, ...recalculated } : updatedData;
      });
    }, 100); // 100ms debounce
    
    return () => clearTimeout(timer);
  }, [
    formData.entry,
    formData.initialQty,
    formData.pyramid1Price,
    formData.pyramid1Qty,
    formData.pyramid2Price,
    formData.pyramid2Qty,
    formData.exit1Price,
    formData.exit1Qty,
    formData.exit2Price,
    formData.exit2Qty,
    formData.exit3Price,
    formData.exit3Qty,
    formData.sl,
    formData.cmp,
    formData.date,
    formData.exit1Date,
    portfolioSize,
    isDirty,
    mode
  ]);

  // Handle form field changes
  const handleChange = React.useCallback((field: keyof TradeModalFormData, value: any) => {
    // Prevent any changes to calculated fields
    if (calculatedFieldNames.includes(field as string)) {
      console.warn(`Attempted to modify read-only field: ${field}`);
      return;
    }
    
    // Convert numeric fields to numbers
    const numericFields = [
      'entry', 'sl', 'tsl', 'cmp', 'initialQty', 
      'pyramid1Price', 'pyramid1Qty', 'pyramid2Price', 'pyramid2Qty',
      'exit1Price', 'exit1Qty', 'exit2Price', 'exit2Qty', 'exit3Price', 'exit3Qty'
    ];
    
    const processedValue = numericFields.includes(field as string) 
      ? Number(value) || 0 
      : value;
    
    setIsDirty(true);
    setFormData(prev => ({
      ...prev,
      [field]: processedValue
    }));
  }, [calculatedFieldNames]);

  // Calculate values when form is submitted
  const calculateValues = React.useCallback(() => {
    // Use the recalculateTrade function to ensure all fields are up to date
    const recalculated = recalculateTrade(formData, portfolioSize, getPortfolioSize);
    
    // Update form data with recalculated values
    setFormData(prev => ({
      ...prev,
      ...recalculated
    }));
    
    return recalculated;
  }, [formData, portfolioSize, getPortfolioSize]);

  const [validationIssues, setValidationIssues] = React.useState<TradeIssue[]>([]);

  // Add useEffect to validate on form changes
  React.useEffect(() => {
    const issues = validateTrade(formData);
    setValidationIssues(issues);
  }, [formData]);

  // Modify handleSubmit to check for errors
  const handleSubmit = React.useCallback(() => {
    const issues = validateTrade(formData);
    setValidationIssues(issues);
    
    // If there are any errors (not just warnings), prevent save
    if (issues.some(issue => issue.type === 'error')) {
      return; // Don't save if there are errors
    }

    calculateValues();
    const newTrade = {
      ...debouncedFormData,
      id: debouncedFormData.id || generateId()
    };
    const recalculated = recalculateTrade(newTrade, portfolioSize, getPortfolioSize);
    onSave(recalculated);
  }, [debouncedFormData, calculateValues, onSave, portfolioSize, formData, getPortfolioSize]);

  const modalMotionProps = React.useMemo(() => ({
        variants: {
          enter: {
            opacity: 1,
            scale: 1,
        y: 0,
            transition: {
          duration: 0.2,
              ease: [0.16, 1, 0.3, 1]
            }
          },
          exit: {
            opacity: 0,
            scale: 0.98,
        y: 10,
            transition: {
          duration: 0.15,
              ease: [0.16, 1, 0.3, 1]
            }
          }
        },
    initial: { opacity: 0, scale: 0.98, y: 10 }
  }), []);

  const basicFields = React.useMemo(() => [
    { name: "tradeNo", label: "Trade No.", type: "text" },
    { name: "date", label: "Date", type: "date" },
    { name: "name", label: "Stock/Asset Name", type: "text" },
    { name: "entry", label: "Entry Price (₹)", type: "number", unit: "₹" },
    { name: "sl", label: "Stop Loss (SL) (₹)", type: "number", unit: "₹" },
    { name: "tsl", label: "Trailing SL (TSL) (₹)", type: "number", unit: "₹" },
    { name: "cmp", label: "Current Market Price (₹)", type: "number", unit: "₹" },
    { name: "buySell", label: "Buy/Sell", type: "select", options: ["Buy", "Sell"] },
    { name: "initialQty", label: "Initial Quantity (qty)", type: "number", unit: "qty" },
    { 
      name: "setup", 
      label: "Setup", 
      type: "select", 
      options: [
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
      ] 
    },
    { name: "baseDuration", label: "Base Duration", type: "text" },
    { name: "positionStatus", label: "Position Status", type: "select", options: ["Open", "Closed", "Partial"] },
    { name: "planFollowed", label: "Plan Followed", type: "checkbox" },
    { 
      name: "exitTrigger", 
      label: "Exit Trigger", 
      type: "select",
      options: [
        "Breakeven exit",
        "Market Pressure",
        "R multiples",
        "Random",
        "SL",
        "Target",
        "Trailing SL"
      ]
    },
    { 
      name: "proficiencyGrowthAreas", 
      label: "Proficiency Growth Areas", 
      type: "select",
      options: [
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
        "Shifted SL Quickly",
        "Too Early Entry",
        "Too Tight SL"
      ]
    }
  ], []);

  const advancedFields = React.useMemo(() => [
    // Pyramid 1
    { name: "pyramid1Price", label: "Pyramid-1 Price (₹)", type: "number", unit: "₹" },
    { name: "pyramid1Qty", label: "Pyramid-1 Quantity (qty)", type: "number", unit: "qty" },
    { name: "pyramid1Date", label: "Pyramid-1 Date", type: "date" },
    
    // Pyramid 2
    { name: "pyramid2Price", label: "Pyramid-2 Price (₹)", type: "number", unit: "₹" },
    { name: "pyramid2Qty", label: "Pyramid-2 Quantity (qty)", type: "number", unit: "qty" },
    { name: "pyramid2Date", label: "Pyramid-2 Date", type: "date" },
    
    // Exit 1
    { name: "exit1Price", label: "Exit-1 Price (₹)", type: "number", unit: "₹" },
    { name: "exit1Qty", label: "Exit-1 Quantity (qty)", type: "number", unit: "qty" },
    { name: "exit1Date", label: "Exit-1 Date", type: "date" },
    
    // Exit 2
    { name: "exit2Price", label: "Exit-2 Price (₹)", type: "number", unit: "₹" },
    { name: "exit2Qty", label: "Exit-2 Quantity (qty)", type: "number", unit: "qty" },
    { name: "exit2Date", label: "Exit-2 Date", type: "date" },
    
    // Exit 3
    { name: "exit3Price", label: "Exit-3 Price (₹)", type: "number", unit: "₹" },
    { name: "exit3Qty", label: "Exit-3 Quantity (qty)", type: "number", unit: "qty" },
    { name: "exit3Date", label: "Exit-3 Date", type: "date" }
  ], []);

  const calculatedFields = [
    // Entry and Position
    { name: "avgEntry", label: "Avg. Entry (₹)", type: "calculated", unit: "₹" },
    { name: "positionSize", label: "Position Size (₹)", type: "calculated", unit: "₹" },
    { name: "allocation", label: "Allocation (%)", type: "calculated", unit: "%" },
    
    // Exit and Position Status
    { name: "openQty", label: "Open Qty (qty)", type: "calculated", unit: "qty" },
    { name: "exitedQty", label: "Exited Qty (qty)", type: "calculated", unit: "qty" },
    { name: "avgExitPrice", label: "Avg. Exit (₹)", type: "calculated", unit: "₹" },
    
    // Performance Metrics
    { name: "stockMove", label: "Stock Move (₹)", type: "calculated", unit: "₹" },
    { name: "slPercent", label: "SL (%)", type: "calculated", unit: "%" },
    { name: "rewardRisk", label: "Reward/Risk (x)", type: "calculated", unit: "x" },
    { name: "holdingDays", label: "Holding Days", type: "calculated", unit: "days" },
    { name: "realisedAmount", label: "Realised (₹)", type: "calculated", unit: "₹" },
    { name: "plRs", label: "P/L (₹)", type: "calculated", unit: "₹" },
    { name: "pfImpact", label: "PF Impact (%)", type: "calculated", unit: "%" },
    { name: "cummPf", label: "Cumulative PF (%)", type: "calculated", unit: "%" }
  ];

  const currentFields = activeTab === "basic" ? basicFields : advancedFields;
  
  const rowVirtualizer = useVirtualizer({
    count: currentFields.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 5
  });

  const renderField = React.useCallback((field: any) => {
    // If it's a calculated field, always render as read-only with consistent styling
    if (calculatedFieldNames.includes(field.name)) {
      const value = formData[field.name as keyof TradeModalFormData];
      let displayValue = value?.toString() || "0";
      
      // Format numbers to 2 decimal places if they're numeric
      if (typeof value === 'number') {
        displayValue = value.toFixed(2);
        if (field.unit === '%' || field.percentage) {
          displayValue = `${displayValue}%`;
        } else if (field.unit === '₹' || field.currency) {
          displayValue = `₹${displayValue}`;
        } else if (field.unit) {
          displayValue = `${displayValue} ${field.unit}`;
        }
      }
      
      return (
        <div key={field.name} className="flex flex-col gap-1">
          <label className="text-sm font-medium text-foreground-600">
            {field.label}
          </label>
          <div className="p-2 rounded-md bg-default-100 border-1 border-default-200 min-h-[40px] flex items-center">
            {displayValue}
          </div>
        </div>
      );
    }

    switch (field.type) {
      case "number":
        return (
          <Input
            key={field.name}
            label={field.label}
            type="number"
            value={formData[field.name]?.toString() ?? "0"}
            onValueChange={(value) => handleChange(field.name, Number(value))}
            variant="bordered"
            startContent={field.unit === '₹' && <span className="text-default-400">₹</span>}
            endContent={field.unit && field.unit !== '₹' && <span className="text-default-400">{field.unit}</span>}
            className="transform-gpu"
          />
        );
      case "date":
        return (
          <Input
            key={field.name}
            label={field.label}
            type="date"
            value={formData[field.name] || ""}
            onValueChange={(value) => handleChange(field.name, value)}
            variant="bordered"
            className="transform-gpu"
          />
        );
      case "select":
        return (
          <Select
            key={field.name}
            label={field.label}
            selectedKeys={[formData[field.name]]}
            onChange={(e) => handleChange(field.name, e.target.value)}
            variant="bordered"
            className="transform-gpu"
          >
            {field.options.map((opt: string) => (
              <SelectItem key={opt}>{opt}</SelectItem>
            ))}
          </Select>
        );
      default:
        return (
          <Input
            key={field.name}
            label={field.label}
            value={formData[field.name] || ""}
            onValueChange={(value) => handleChange(field.name, value)}
            variant="bordered"
            className="transform-gpu"
          />
        );
    }
  }, [formData, handleChange, calculatedFieldNames]);

  const renderFields = () => (
    <div 
      ref={parentRef}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[60vh] overflow-auto"
      style={{
        height: `${rowVirtualizer.getTotalSize()}px`,
        position: 'relative'
      }}
    >
      {rowVirtualizer.getVirtualItems().map((virtualRow) => (
        <div
          key={virtualRow.index}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: virtualRow.size,
            transform: `translateY(${virtualRow.start}px)`
          }}
        >
          {renderField(currentFields[virtualRow.index])}
        </div>
      ))}
    </div>
  );

  return (
    <Modal 
      isOpen={isOpen} 
      onOpenChange={onOpenChange}
      size="4xl"
      scrollBehavior="inside"
      motionProps={modalMotionProps}
      classNames={{
        base: "transform-gpu",
        wrapper: "transform-gpu"
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                  {mode === "add" ? "Add New Trade" : "Edit Trade"}
                </h3>
                <Tabs 
                  selectedKey={activeTab}
                  onSelectionChange={(key) => setActiveTab(key as string)}
                  aria-label="Options" 
                  color="primary"
                  size="sm"
                  classNames={{
                    tabList: "bg-content2/50 p-0.5 rounded-lg",
                    cursor: "bg-primary rounded-md",
                    tab: "px-3 py-1 data-[selected=true]:text-white"
                  }}
                >
                  <Tab key="basic" title="Basic" />
                  <Tab key="advanced" title="Advanced" />
                </Tabs>
              </div>
            </ModalHeader>
            <Divider />
            <ModalBody>
              {/* Summary Card Section: Show key calculated metrics at the top */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div className="p-3 rounded-md bg-default-100 border border-default-200">
                  <div className="text-xs text-foreground-400 mb-1">Avg. Entry (₹)</div>
                  <div className="font-semibold">{formData.avgEntry?.toFixed(2) ?? '0.00'}</div>
                </div>
                <div className="p-3 rounded-md bg-default-100 border border-default-200">
                  <div className="text-xs text-foreground-400 mb-1">Position Size (₹)</div>
                  <div className="font-semibold">{formData.positionSize?.toFixed(2) ?? '0.00'}</div>
                </div>
                <div className="p-3 rounded-md bg-default-100 border border-default-200">
                  <div className="text-xs text-foreground-400 mb-1">Allocation (%)</div>
                  <div className="font-semibold">{formData.allocation?.toFixed(2) ?? '0.00'}%</div>
                </div>
                <div className="p-3 rounded-md bg-default-100 border border-default-200">
                  <div className="text-xs text-foreground-400 mb-1">Open Qty (qty)</div>
                  <div className="font-semibold">{formData.openQty ?? 0}</div>
                </div>
                <div className="p-3 rounded-md bg-default-100 border border-default-200">
                  <div className="text-xs text-foreground-400 mb-1">Exited Qty (qty)</div>
                  <div className="font-semibold">{formData.exitedQty ?? 0}</div>
                </div>
                <div className="p-3 rounded-md bg-default-100 border border-default-200">
                  <div className="text-xs text-foreground-400 mb-1">Avg. Exit (₹)</div>
                  <div className="font-semibold">{formData.avgExitPrice?.toFixed(2) ?? '0.00'}</div>
                </div>
                <div className="p-3 rounded-md bg-default-100 border border-default-200">
                  <div className="text-xs text-foreground-400 mb-1">Stock Move (₹)</div>
                  <div className="font-semibold">{formData.stockMove?.toFixed(2) ?? '0.00'}</div>
                </div>
                <div className="p-3 rounded-md bg-default-100 border border-default-200">
                  <div className="text-xs text-foreground-400 mb-1">SL (%)</div>
                  <div className="font-semibold">{formData.slPercent?.toFixed(2) ?? '0.00'}%</div>
                </div>
                <div className="p-3 rounded-md bg-default-100 border border-default-200">
                  <div className="text-xs text-foreground-400 mb-1">Reward/Risk (x)</div>
                  <div className="font-semibold">{formData.rewardRisk?.toFixed(2) ?? '0.00'}</div>
                </div>
                <div className="p-3 rounded-md bg-default-100 border border-default-200">
                  <div className="text-xs text-foreground-400 mb-1">Holding Days</div>
                  <div className="font-semibold">{formData.holdingDays ?? 0}</div>
                </div>
                <div className="p-3 rounded-md bg-default-100 border border-default-200">
                  <div className="text-xs text-foreground-400 mb-1">Realised (₹)</div>
                  <div className="font-semibold">{formData.realisedAmount?.toFixed(2) ?? '0.00'}</div>
                </div>
                {/* FIX: Use plRs for P/L (₹) */}
                <div className="p-3 rounded-md bg-default-100 border border-default-200">
                  <div className="text-xs text-foreground-400 mb-1">P/L (₹)</div>
                  <div className="font-semibold">{formData.plRs?.toFixed(2) ?? '0.00'}</div>
                </div>
                <div className="p-3 rounded-md bg-default-100 border border-default-200">
                  <div className="text-xs text-foreground-400 mb-1">PF Impact (%)</div>
                  <div className="font-semibold">{formData.pfImpact?.toFixed(2) ?? '0.00'}%</div>
                </div>
                <div className="p-3 rounded-md bg-default-100 border border-default-200">
                  <div className="text-xs text-foreground-400 mb-1">Cumulative PF (%)</div>
                  <div className="font-semibold">{formData.cummPf?.toFixed(2) ?? '0.00'}%</div>
                </div>
              </div>

              {/* Add Validation Messages below summary cards */}
              {validationIssues.length > 0 && (
                <div className="mb-6">
                  {validationIssues.map((issue, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-md mb-2 flex items-center gap-2 ${
                        issue.type === 'error' 
                          ? 'bg-danger-50 border border-danger-200 text-danger-700'
                          : 'bg-warning-50 border border-warning-200 text-warning-700'
                      }`}
                    >
                      <Icon 
                        icon={issue.type === 'error' ? "lucide:alert-circle" : "lucide:alert-triangle"} 
                        className={issue.type === 'error' ? "text-danger-500" : "text-warning-500"}
                      />
                      <span className="text-sm">{issue.message}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Form Fields */}
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  className="transform-gpu"
                >
                  {renderFields()}
                </motion.div>
              </AnimatePresence>
            </ModalBody>
            <Divider />
            <ModalFooter>
              <Button variant="flat" onPress={onClose}>
                Cancel
              </Button>
                <Button 
                  color="primary" 
                onPress={handleSubmit}
                  isDisabled={validationIssues.some(issue => issue.type === 'error')}
                  startContent={<Icon icon={mode === "add" ? "lucide:plus" : "lucide:save"} />}
                >
                  {mode === "add" ? "Add Trade" : "Save Changes"}
                </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
});

TradeModal.displayName = "TradeModal";