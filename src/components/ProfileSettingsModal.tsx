import React, { useState, useEffect } from "react";
import { 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter, 
  Button, 
  Input, 
  Table, 
  TableHeader, 
  TableColumn, 
  TableBody, 
  TableRow, 
  TableCell, 
  Select, 
  SelectItem,
  Tooltip,
  Tabs,
  Tab
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";
import { usePortfolio } from "../utils/PortfolioContext";
import { useCapitalChanges } from "../hooks/use-capital-changes";
import { generateId } from "../utils/helpers";
import { useTrades } from "../hooks/use-trades";

const months = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const currentYear = new Date().getFullYear();
const startYear = 2000;
const endYear = currentYear + 1; // Allow selecting up to one year in the future
const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  userName: string;
  setUserName: (name: string) => void;
}

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({ isOpen, onOpenChange, userName, setUserName }) => {
  const { 
    portfolioSize, 
    monthlyPortfolioSizes, 
    setPortfolioSize, 
    getPortfolioSize,
    getLatestPortfolioSize
  } = usePortfolio();
  
  const { trades } = useTrades();
  const { 
    capitalChanges, 
    addCapitalChange, 
    updateCapitalChange, 
    deleteCapitalChange 
  } = useCapitalChanges(trades, getLatestPortfolioSize());
  
  const [selectedTab, setSelectedTab] = useState('capital');
  const [globalValue, setGlobalValue] = useState(portfolioSize.toString());
  const [selectedMonth, setSelectedMonth] = useState(months[new Date().getMonth()]);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [monthlyValue, setMonthlyValue] = useState('');
  const [editingCell, setEditingCell] = useState<{month: string, year: number} | null>(null);
  const [editValue, setEditValue] = useState('');
  const [deletingItem, setDeletingItem] = useState<{month: string, year: number} | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Update global value when portfolio size changes
  useEffect(() => {
    setGlobalValue(portfolioSize.toString());
  }, [portfolioSize]);

  // Update monthly value when selection changes
  useEffect(() => {
    const size = getPortfolioSize(selectedMonth, selectedYear);
    setMonthlyValue(size.toString());
  }, [selectedMonth, selectedYear, getPortfolioSize]);

  const handleSaveMonthly = () => {
    if (monthlyValue) {
      setPortfolioSize(Number(monthlyValue), selectedMonth, selectedYear);
      setMonthlyValue('');
    }
  };
  
  const handleSaveCapital = () => {
    if (editingCell && editValue !== '') {
      handleSaveCapitalChange(editingCell.month, editingCell.year);
    }
  };

  const handleEditMonthly = (month: string, year: number, value: number) => {
    setEditingCell({ month, year });
    setEditValue(value.toString());
  };

  const saveEdit = () => {
    if (editingCell && editValue) {
      const newValue = Number(editValue);
      if (!isNaN(newValue) && newValue >= 0) {
        setPortfolioSize(newValue, editingCell.month, editingCell.year);
      }
      setEditingCell(null);
      setEditValue('');
    }
  };

  const handleDelete = (month: string, year: number) => {
    setDeletingItem({ month, year });
  };

  const confirmDelete = () => {
    if (deletingItem) {
      setIsDeleting(true);
      // Since setPortfolioSize is synchronous, we don't need .finally()
      setPortfolioSize(0, deletingItem.month, deletingItem.year);
      setIsDeleting(false);
      setDeletingItem(null);
    }
  };

  const cancelDelete = () => {
    setDeletingItem(null);
  };

  const handleEditClick = (month: string, year: number, currentValue: number) => {
    setEditingCell({ month, year });
    
    // Find if there's an existing capital change for this month/year
    const existingChange = capitalChanges.find(change => {
      const date = new Date(change.date);
      return date.getFullYear() === year && 
             date.toLocaleString('default', { month: 'short' }) === month;
    });
    
    if (existingChange) {
      setEditValue((existingChange.amount * (existingChange.type === 'deposit' ? 1 : -1)).toString());
    } else {
      setEditValue('0');
    }
  };
  
  const handleSaveCapitalChange = (month: string, year: number) => {
    const value = Number(editValue);
    if (isNaN(value)) return;
    
    const monthIndex = months.indexOf(month);
    const date = new Date(year, monthIndex, 1).toISOString();
    
    // Find existing change for this month/year
    const existingChange = capitalChanges.find(change => {
      const changeDate = new Date(change.date);
      return changeDate.getFullYear() === year && 
             changeDate.getMonth() === monthIndex;
    });
    
    if (value === 0) {
      // If value is 0, remove the change if it exists
      if (existingChange) {
        deleteCapitalChange(existingChange.id);
      }
    } else {
      const type = value > 0 ? 'deposit' : 'withdrawal';
      const amount = Math.abs(value);
      
      if (existingChange) {
        // Update existing change
        updateCapitalChange({
          ...existingChange,
          amount,
          type,
          description: existingChange.description || 'Updated from settings'
        });
      } else {
        // Add new change
        addCapitalChange({
          amount,
          type,
          date,
          description: 'Added from settings',
          // id will be generated in the useCapitalChanges hook
        });
      }
    }
    
    setEditingCell(null);
    setEditValue('');
  };

  const sortedMonthlySizes = [...monthlyPortfolioSizes]
    .filter(item => item.size > 0) // Only show non-zero values
    .sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return months.indexOf(a.month) - months.indexOf(b.month);
    });

  return (
    <Modal 
      isOpen={isOpen} 
      onOpenChange={onOpenChange}
      size="2xl"
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">Portfolio Settings</ModalHeader>
            <ModalBody>
              <Input
                label="Your Name"
                value={userName}
                onValueChange={setUserName}
                className="mb-4"
              />
              <Tabs 
                selectedKey={selectedTab}
                onSelectionChange={(key) => setSelectedTab(key as string)}
                aria-label="Portfolio settings tabs"
              >
                <Tab key="capital" title="Capital Management">
                  <div className="py-4 space-y-4">
                    <p className="text-sm text-foreground-500">
                      Manage your capital additions and withdrawals by month.
                    </p>
                    <div className="space-y-4">
                      {capitalChanges.map((change) => {
                        const date = new Date(change.date);
                        const month = date.toLocaleString('default', { month: 'short' });
                        const year = date.getFullYear();
                        const isEditing = editingCell?.month === month && editingCell?.year === year;
                        
                        return (
                          <div key={change.id} className="flex items-center gap-2 p-2 border rounded-lg">
                            <div className="flex-1">
                              <div className="font-medium">{month} {year}</div>
                              <div className="text-sm text-foreground-500">
                                {change.type === 'deposit' ? 'Added' : 'Withdrawn'}: ₹{Math.abs(change.amount).toLocaleString()}
                              </div>
                              <div className="text-xs text-foreground-400">
                                {change.description || 'No description'}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="flat" 
                                onPress={() => handleEditClick(month, year, change.amount * (change.type === 'deposit' ? 1 : -1))}
                              >
                                Edit
                              </Button>
                              <Button 
                                size="sm" 
                                variant="flat" 
                                color="danger"
                                onPress={() => deleteCapitalChange(change.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </Tab>
                <Tab key="monthly" title="Monthly Settings">
                  <div className="py-4 space-y-4">
                    <p className="text-sm text-foreground-500">
                      Set custom portfolio sizes for specific months. These will override the default value.
                    </p>
                    <div className="flex gap-2 items-end">
                      <Select
                        label="Month"
                        selectedKeys={[selectedMonth]}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="min-w-[120px]"
                      >
                        {months.map(month => (
                          <SelectItem key={month}>
                            {month}
                          </SelectItem>
                        ))}
                      </Select>
                      <Select
                        label="Year"
                        selectedKeys={[selectedYear.toString()]}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="min-w-[120px]"
                      >
                        {years.map(year => (
                          <SelectItem key={year}>
                            {year}
                          </SelectItem>
                        ))}
                      </Select>
                      <Input
                        label="Portfolio Size"
                        type="number"
                        value={monthlyValue}
                        onValueChange={setMonthlyValue}
                        min={0}
                        startContent={<span className="text-default-400">₹</span>}
                        className="flex-1"
                      />
                      <Button color="primary" onPress={handleSaveMonthly}>
                        Set
                      </Button>
                    </div>
                    
                    <div className="mt-6">
                      <h4 className="text-sm font-medium mb-2">Monthly Portfolio Sizes</h4>
                      <div className="border rounded-lg overflow-hidden">
                        <Table aria-label="Monthly portfolio sizes" removeWrapper>
                          <TableHeader>
                            <TableColumn className="w-1/4">Month</TableColumn>
                            <TableColumn className="w-1/4">Year</TableColumn>
                            <TableColumn className="w-1/3">Portfolio Size</TableColumn>
                            <TableColumn className="w-1/6 text-right">Actions</TableColumn>
                          </TableHeader>
                          <TableBody>
                            {sortedMonthlySizes.length > 0 ? (
                              sortedMonthlySizes.map((item) => (
                                <TableRow 
                                  key={`${item.month}-${item.year}`}
                                  className="group hover:bg-default-50 dark:hover:bg-default-800 transition-colors cursor-pointer"
                                  onClick={() => {
                                    setEditingCell({ month: item.month, year: item.year });
                                    setEditValue(item.size.toString());
                                  }}
                                >
                                  <TableCell className="font-medium">{item.month}</TableCell>
                                  <TableCell>{item.year}</TableCell>
                                  <TableCell>
                                    {editingCell?.month === item.month && editingCell?.year === item.year ? (
                                      <div className="flex items-center gap-2">
                                        <Input
                                          type="number"
                                          value={editValue}
                                          onValueChange={setEditValue}
                                          min={0}
                                          size="sm"
                                          className="w-32"
                                          startContent={<span className="text-xs">₹</span>}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') saveEdit();
                                            if (e.key === 'Escape') setEditingCell(null);
                                          }}
                                          onClick={(e) => e.stopPropagation()}
                                          onFocus={(e) => e.target.select()}
                                          autoFocus
                                        />
                                        <div className="flex gap-1">
                                          <Tooltip content="Save">
                                            <Button 
                                              size="sm" 
                                              variant="flat" 
                                              isIconOnly 
                                              onPress={saveEdit}
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              <Icon icon="lucide:check" className="h-4 w-4" />
                                            </Button>
                                          </Tooltip>
                                          <Tooltip content="Cancel">
                                            <Button 
                                              size="sm" 
                                              variant="flat" 
                                              isIconOnly 
                                              onPress={() => setEditingCell(null)}
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              <Icon icon="lucide:x" className="h-4 w-4" />
                                            </Button>
                                          </Tooltip>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex items-center justify-between">
                                        <span className="font-medium">₹{item.size.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                                        <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                                          <Tooltip content="Edit">
                                            <Button 
                                              size="sm" 
                                              variant="light" 
                                              isIconOnly 
                                              onPress={() => handleEditClick(item.month, item.year, item.size)}
                                              className="text-foreground-500 hover:text-foreground-800 dark:hover:text-foreground-300"
                                            >
                                              <Icon icon="lucide:edit-2" className="h-4 w-4" />
                                            </Button>
                                          </Tooltip>
                                        </div>
                                      </div>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end">
                                      <Tooltip content="Delete">
                                        <Button 
                                          size="sm" 
                                          variant="light" 
                                          color="danger" 
                                          isIconOnly
                                          onPress={() => {
                                            handleDelete(item.month, item.year);
                                          }}
                                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                                          isLoading={isDeleting && deletingItem?.month === item.month && deletingItem?.year === item.year}
                                        >
                                          <Icon icon="lucide:trash-2" className="h-4 w-4" />
                                        </Button>
                                      </Tooltip>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={4} className="text-center py-4 text-foreground-500">
                                  No custom monthly portfolio sizes set
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>
                </Tab>
              </Tabs>
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={onClose}>
                Close
              </Button>
            </ModalFooter>
            
            {/* Delete Confirmation Dialog */}
            <AnimatePresence>
              {deletingItem && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-background dark:bg-default-100 p-6 rounded-lg shadow-lg max-w-sm w-full mx-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h3 className="text-lg font-semibold mb-2">Delete Portfolio Size</h3>
                    <p className="text-foreground-600 dark:text-foreground-400 mb-6">
                      Are you sure you want to delete the portfolio size for {deletingItem.month} {deletingItem.year}?
                      This action cannot be undone.
                    </p>
                    <div className="flex justify-end gap-3">
                      <Button 
                        variant="flat" 
                        onPress={cancelDelete}
                        isDisabled={isDeleting}
                      >
                        Cancel
                      </Button>
                      <Button 
                        color="danger" 
                        onPress={confirmDelete}
                        isLoading={isDeleting}
                      >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                      </Button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}; 