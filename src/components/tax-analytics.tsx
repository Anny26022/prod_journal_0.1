import React, { useCallback } from "react";
import { 
  Card, 
  CardBody, 
  CardHeader, 
  Divider, 
  Button,
  Tabs,
  Tab,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Tooltip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Input
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";
import { TaxSummaryChart } from "./tax/tax-summary-chart";
import { TaxMetricsCards } from "./tax/tax-metrics-cards";
import { TaxTable } from "./tax/tax-table";
import { TaxEditModal } from "./tax/tax-edit-modal";
import { useTrades } from "../hooks/use-trades";
import { supabase, SINGLE_USER_ID } from '../utils/supabaseClient';

// Editable Text Component
const EditableText: React.FC<{
  value: string | number;
  onSave: (value: string) => void;
  isEditing: boolean;
  type?: "text" | "number";
  className?: string;
  prefix?: string;
}> = ({ value, onSave, isEditing, type = "text", className = "", prefix = "" }) => {
  const [editValue, setEditValue] = React.useState(value.toString());
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleBlur = () => {
    onSave(editValue);
  };

  if (!isEditing) {
    return (
      <motion.span 
        className={`inline-block ${className}`}
        initial={{ opacity: 0.8 }}
        animate={{ opacity: 1 }}
        whileHover={{ scale: 1.02 }}
      >
        {prefix}{value}
      </motion.span>
    );
  }

  return (
    <Input
      ref={inputRef}
      type={type}
      value={editValue}
      onValueChange={setEditValue}
      onBlur={handleBlur}
      size="sm"
      variant="bordered"
      className={`max-w-[120px] ${className}`}
      classNames={{
        input: "text-right",
        inputWrapper: "h-8 min-h-unit-8"
      }}
      startContent={prefix ? <span className="text-default-400">{prefix}</span> : undefined}
    />
  );
};

// Supabase helpers
async function fetchTaxData() {
  const { data, error } = await supabase
    .from('tax_data')
    .select('data')
    .eq('id', SINGLE_USER_ID)
    .single();
  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching tax data:', error);
  }
  return data?.data || {};
}

async function upsertTaxData(taxData: any) {
  const { error } = await supabase
    .from('tax_data')
    .upsert({ id: SINGLE_USER_ID, data: taxData }, { onConflict: 'id' });
  if (error) console.error('Supabase upsert error:', error);
}

export const TaxAnalytics: React.FC = () => {
  const { trades } = useTrades();
  // Get all unique years from trades
  const tradeYears = Array.from(new Set(trades.map(t => new Date(t.date).getFullYear()))).sort((a, b) => b - a);
  const defaultYear = tradeYears.length > 0 ? String(tradeYears[0]) : String(new Date().getFullYear());
  const [selectedYear, setSelectedYear] = React.useState(defaultYear);
  const [isEditMode, setIsEditMode] = React.useState(false);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedMonth, setSelectedMonth] = React.useState<string | null>(null);
  const monthOrder = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const [taxesByMonth, setTaxesByMonth] = React.useState<{ [month: string]: number }>({});
  
  // Function to load tax data for the selected year
  const loadTaxData = useCallback(() => {
    fetchTaxData().then((allTaxData) => {
      const yearData = allTaxData[selectedYear] || {};
      if (Object.keys(yearData).length > 0) {
        setTaxesByMonth(prev => ({ ...prev, ...yearData }));
      } else {
        const initialData: { [month: string]: number } = {};
        monthOrder.forEach(month => { initialData[month] = 0; });
        setTaxesByMonth(initialData);
      }
    });
  }, [selectedYear]);

  // Load tax data on mount and when selectedYear changes
  React.useEffect(() => {
    loadTaxData();
    
    // Add event listener for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'taxData') {
        loadTaxData();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadTaxData]);
  
  // Save tax data to Supabase when it changes
  React.useEffect(() => {
    if (Object.keys(taxesByMonth).length > 0 && selectedYear) {
      fetchTaxData().then((allTaxData) => {
        const currentData = { ...allTaxData };
        currentData[selectedYear] = { ...taxesByMonth };
        upsertTaxData(currentData);
      });
    }
  }, [taxesByMonth, selectedYear]);
  
  // Initialize months with 0 if they don't exist
  React.useEffect(() => {
    const initial: { [month: string]: number } = {};
    let needsUpdate = false;
    
    monthOrder.forEach(month => {
      if (!(month in taxesByMonth)) {
        initial[month] = 0;
        needsUpdate = true;
      }
    });
    
    if (needsUpdate) {
      setTaxesByMonth(prev => ({ ...initial, ...prev }));
    }
  }, [trades, taxesByMonth]);

  const tradesForYear = trades.filter(t => t.date.startsWith(selectedYear));
  const closedTrades = tradesForYear
    .filter(t => t.positionStatus === "Closed" || t.positionStatus === "Partial")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const cummPfs = closedTrades.map(t => t.cummPf).filter(v => typeof v === 'number' && !isNaN(v));
  let runningMax = -Infinity;
  let maxDrawdown = 0;
  cummPfs.forEach(pf => {
    if (pf > runningMax) runningMax = pf;
    const dd = runningMax !== 0 ? ((runningMax - pf) / Math.abs(runningMax)) * 100 : 0;
    if (dd > maxDrawdown) maxDrawdown = dd;
  });
  const drawdown = maxDrawdown;
  const maxCummPF = cummPfs.length ? Math.max(...cummPfs) : 0;
  const minCummPF = cummPfs.length ? Math.min(...cummPfs) : 0;
  const totalGrossPL = tradesForYear.reduce((sum, t) => sum + (t.plRs || 0), 0);
  const totalTaxes = monthOrder.reduce((sum, m) => sum + (taxesByMonth[m] || 0), 0);
  const totalNetPL = totalGrossPL - totalTaxes;
  const formatCurrency = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  const formatPercent = (value: number) => value.toFixed(2) + "%";

  return (
    <div className="space-y-6">
      <motion.div 
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-3">
          <Dropdown>
            <DropdownTrigger>
              <Button 
                variant="flat" 
                endContent={<Icon icon="lucide:chevron-down" className="text-sm" />}
                size="sm"
                className="font-medium"
              >
                {selectedYear}
              </Button>
            </DropdownTrigger>
            <DropdownMenu 
              aria-label="Year selection" 
              selectionMode="single"
              selectedKeys={[selectedYear]}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                setSelectedYear(selected);
              }}
            >
              {tradeYears.map((year) => (
                <DropdownItem key={year}>{year}</DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            color="primary"
            variant={isEditMode ? "solid" : "flat"}
            onPress={() => setIsEditMode(!isEditMode)}
            startContent={<Icon icon={isEditMode ? "lucide:check" : "lucide:edit-3"} />}
            size="sm"
            className="font-medium"
          >
            {isEditMode ? "Save Changes" : "Edit Data"}
          </Button>
          <Button
            variant="flat"
            startContent={<Icon icon="lucide:download" />}
            size="sm"
            className="font-medium"
          >
            Export
          </Button>
        </div>
      </motion.div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex justify-between items-center">
            <h3 className="text-xl font-semibold tracking-tight">Tax Summary</h3>
            <Tabs 
              aria-label="Chart options" 
              size="sm" 
              color="primary"
              classNames={{
                tabList: "bg-content2/50 p-0.5 rounded-lg",
                cursor: "bg-primary rounded-md",
                tab: "px-3 py-1 data-[selected=true]:text-white font-medium"
              }}
            >
              <Tab key="gross" title="Gross P/L" />
              <Tab key="net" title="Net P/L" />
              <Tab key="taxes" title="Taxes" />
            </Tabs>
          </CardHeader>
          <Divider />
          <CardBody>
            <TaxSummaryChart />
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <h3 className="text-xl font-semibold tracking-tight">Tax Metrics</h3>
          </CardHeader>
          <Divider />
          <CardBody className="space-y-4">
            <div className="space-y-4">
              <motion.div className="flex justify-between items-center" whileHover={{ scale: 1.01 }}>
                <span className="text-sm font-medium text-default-600">Max Cumm PF</span>
                <span className="font-semibold text-right">{formatPercent(maxCummPF)}</span>
              </motion.div>
              <motion.div className="flex justify-between items-center" whileHover={{ scale: 1.01 }}>
                <span className="text-sm font-medium text-default-600">Min Cumm PF</span>
                <span className="font-semibold text-right">{formatPercent(minCummPF)}</span>
              </motion.div>
              <motion.div className="flex justify-between items-center" whileHover={{ scale: 1.01 }}>
                <span className="text-sm font-medium text-default-600">Drawdown</span>
                <span className="font-semibold text-right">{formatPercent(drawdown)}</span>
              </motion.div>
            </div>
            <Divider />
            <div className="space-y-4">
              <motion.div className="flex justify-between items-center" whileHover={{ scale: 1.01 }}>
                <span className="text-sm font-medium text-default-600">Total Gross P/L</span>
                <span className="font-semibold text-right">{formatCurrency(totalGrossPL)}</span>
              </motion.div>
              <motion.div className="flex justify-between items-center" whileHover={{ scale: 1.01 }}>
                <span className="text-sm font-medium text-default-600">Total Taxes</span>
                <span className="font-semibold text-danger text-right">{formatCurrency(totalTaxes)}</span>
              </motion.div>
              <motion.div className="flex justify-between items-center" whileHover={{ scale: 1.01 }}>
                <span className="text-sm font-medium text-default-600">Total Net P/L</span>
                <span className="font-semibold text-success text-right">{formatCurrency(totalNetPL)}</span>
              </motion.div>
            </div>
            <Divider />
            <Button 
              color="primary" 
              variant="flat" 
              fullWidth
              startContent={<Icon icon="lucide:file-text" />}
              onPress={() => {}}
              className="font-medium"
            >
              Generate Tax Report
            </Button>
          </CardBody>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <h3 className="text-xl font-semibold tracking-tight">Monthly Tax Breakdown</h3>
        </CardHeader>
        <Divider />
        <CardBody>
          <TaxTable 
            isEditMode={isEditMode} 
            onEditRow={(month) => {
              setSelectedMonth(month);
              setIsModalOpen(true);
            }}
            trades={tradesForYear}
            taxesByMonth={taxesByMonth}
            setTaxesByMonth={setTaxesByMonth}
          />
        </CardBody>
      </Card>
      <TaxEditModal 
        isOpen={isModalOpen} 
        onOpenChange={setIsModalOpen}
        month={selectedMonth}
      />
    </div>
  );
};

export default TaxAnalytics;