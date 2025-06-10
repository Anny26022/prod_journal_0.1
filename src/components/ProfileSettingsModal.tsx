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
import { useTruePortfolio } from "../utils/TruePortfolioContext";
import { YearlyStartingCapitalModal } from "./YearlyStartingCapitalModal";
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
    yearlyStartingCapitals,
    setYearlyStartingCapital,
    getYearlyStartingCapital,
    monthlyStartingCapitalOverrides,
    setMonthlyStartingCapitalOverride,
    removeMonthlyStartingCapitalOverride,
    getMonthlyStartingCapitalOverride,
    capitalChanges,
    addCapitalChange,
    updateCapitalChange,
    deleteCapitalChange,
    portfolioSize
  } = useTruePortfolio();

  const { trades } = useTrades();
  
  const [selectedTab, setSelectedTab] = useState('yearly');
  const [isYearlyCapitalModalOpen, setIsYearlyCapitalModalOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(months[new Date().getMonth()]);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [editingCell, setEditingCell] = useState<{month: string, year: number} | null>(null);
  const [editValue, setEditValue] = useState('');
  const [newCapitalAmount, setNewCapitalAmount] = useState('');
  const [newCapitalType, setNewCapitalType] = useState<'deposit' | 'withdrawal'>('deposit');
  const [newCapitalDescription, setNewCapitalDescription] = useState('');

  // Monthly overrides state
  const [overrideMonth, setOverrideMonth] = useState(months[new Date().getMonth()]);
  const [overrideYear, setOverrideYear] = useState(currentYear);
  const [overrideAmount, setOverrideAmount] = useState('');

  const handleAddCapitalChange = () => {
    const amount = parseFloat(newCapitalAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    const monthIndex = months.indexOf(selectedMonth);
    const date = new Date(selectedYear, monthIndex, 1).toISOString();

    addCapitalChange({
      amount: newCapitalType === 'deposit' ? amount : -amount,
      type: newCapitalType,
      date,
      description: newCapitalDescription || `${newCapitalType === 'deposit' ? 'Deposit' : 'Withdrawal'} for ${selectedMonth} ${selectedYear}`
    });

    setNewCapitalAmount('');
    setNewCapitalDescription('');
  };
  
  const handleEditCapitalChange = (changeId: string) => {
    const change = capitalChanges.find(c => c.id === changeId);
    if (change) {
      const date = new Date(change.date);
      const month = date.toLocaleString('default', { month: 'short' });
      const year = date.getFullYear();
      setEditingCell({ month, year });
      setEditValue((change.type === 'deposit' ? change.amount : -change.amount).toString());
    }
  };

  const handleSaveCapitalChange = () => {
    if (!editingCell) return;

    const value = Number(editValue);
    if (isNaN(value)) return;

    const monthIndex = months.indexOf(editingCell.month);
    const date = new Date(editingCell.year, monthIndex, 1).toISOString();

    // Find existing change for this month/year
    const existingChange = capitalChanges.find(change => {
      const changeDate = new Date(change.date);
      return changeDate.getFullYear() === editingCell.year &&
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
          description: 'Added from settings'
        });
      }
    }

    setEditingCell(null);
    setEditValue('');
  };

  const handleAddMonthlyOverride = () => {
    const amount = parseFloat(overrideAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setMonthlyStartingCapitalOverride(overrideMonth, overrideYear, amount);
    setOverrideAmount('');
  };

  const handleRemoveMonthlyOverride = (month: string, year: number) => {
    removeMonthlyStartingCapitalOverride(month, year);
  };

  // Memoize sorted arrays to prevent unnecessary re-renders
  const sortedCapitalChanges = React.useMemo(() =>
    [...capitalChanges].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [capitalChanges]
  );

  const sortedYearlyCapitals = React.useMemo(() =>
    [...yearlyStartingCapitals].sort((a, b) => b.year - a.year),
    [yearlyStartingCapitals]
  );

  const sortedMonthlyOverrides = React.useMemo(() =>
    [...monthlyStartingCapitalOverrides].sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return months.indexOf(b.month) - months.indexOf(a.month);
    }),
    [monthlyStartingCapitalOverrides, months]
  );

  return (
    <Modal 
      isOpen={isOpen} 
      onOpenChange={onOpenChange}
      size="2xl"
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Icon icon="lucide:settings" className="text-primary" />
                <span>Portfolio Settings</span>
              </div>
            </ModalHeader>
            <ModalBody>
              <Input
                label="Your Name"
                value={userName}
                onValueChange={setUserName}
                className="mb-4"
                startContent={<Icon icon="lucide:user" className="text-default-400" />}
              />
              <Tabs
                selectedKey={selectedTab}
                onSelectionChange={(key) => setSelectedTab(key as string)}
                aria-label="Portfolio settings tabs"
              >
                <Tab key="yearly" title="Yearly Starting Capital">
                  <div className="py-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-foreground-500">
                          Set starting capital for January of each year. This forms the foundation for true portfolio calculations.
                        </p>
                      </div>
                      <Button
                        color="primary"
                        onPress={() => setIsYearlyCapitalModalOpen(true)}
                        startContent={<Icon icon="lucide:plus" />}
                      >
                        Manage Years
                      </Button>
                    </div>

                    {sortedYearlyCapitals.length === 0 ? (
                      <div className="text-center py-8 text-default-500">
                        <Icon icon="lucide:calendar-x" className="text-4xl mb-2 mx-auto" />
                        <p>No yearly starting capitals set yet.</p>
                        <p className="text-sm">Click "Manage Years" to get started.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {sortedYearlyCapitals.map((yearData) => (
                          <div
                            key={yearData.year}
                            className="flex items-center justify-between p-4 border border-divider rounded-lg bg-default-50 dark:bg-default-100"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex flex-col">
                                <span className="font-semibold text-lg">{yearData.year}</span>
                                <span className="text-xs text-default-500">
                                  Updated: {new Date(yearData.updatedAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-xl text-success">
                                ₹{yearData.startingCapital.toLocaleString()}
                              </span>
                              <div className="text-xs text-default-500">Starting Capital</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Tab>
                <Tab key="capital" title="Capital Changes">
                  <div className="py-4 space-y-4">
                    <p className="text-sm text-foreground-500">
                      Add deposits and withdrawals to track capital changes throughout the year.
                    </p>

                    {/* Add New Capital Change */}
                    <div className="border border-divider rounded-lg p-4 bg-default-50 dark:bg-default-100">
                      <h4 className="font-semibold mb-3">Add Capital Change</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Select
                          label="Month"
                          selectedKeys={[selectedMonth]}
                          onChange={(e) => setSelectedMonth(e.target.value)}
                        >
                          {months.map(month => (
                            <SelectItem key={month} value={month}>
                              {month}
                            </SelectItem>
                          ))}
                        </Select>
                        <Select
                          label="Year"
                          selectedKeys={[selectedYear.toString()]}
                          onChange={(e) => setSelectedYear(Number(e.target.value))}
                        >
                          {years.map(year => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </Select>
                        <Select
                          label="Type"
                          selectedKeys={[newCapitalType]}
                          onChange={(e) => setNewCapitalType(e.target.value as 'deposit' | 'withdrawal')}
                        >
                          <SelectItem key="deposit" value="deposit">Deposit</SelectItem>
                          <SelectItem key="withdrawal" value="withdrawal">Withdrawal</SelectItem>
                        </Select>
                        <Input
                          label="Amount"
                          type="number"
                          value={newCapitalAmount}
                          onValueChange={setNewCapitalAmount}
                          min="0"
                          step="1000"
                          startContent={<span className="text-default-400">₹</span>}
                        />
                        <Input
                          label="Description (Optional)"
                          value={newCapitalDescription}
                          onValueChange={setNewCapitalDescription}
                          className="md:col-span-2"
                        />
                        <div className="md:col-span-2">
                          <Button
                            color="primary"
                            onPress={handleAddCapitalChange}
                            isDisabled={!newCapitalAmount}
                            startContent={<Icon icon="lucide:plus" />}
                          >
                            Add {newCapitalType === 'deposit' ? 'Deposit' : 'Withdrawal'}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Existing Capital Changes */}
                    <div>
                      <h4 className="font-semibold mb-3">Capital Changes History</h4>
                      {sortedCapitalChanges.length === 0 ? (
                        <div className="text-center py-8 text-default-500">
                          <Icon icon="lucide:banknote" className="text-4xl mb-2 mx-auto" />
                          <p>No capital changes recorded yet.</p>
                          <p className="text-sm">Add your first deposit or withdrawal above.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {sortedCapitalChanges.map((change) => {
                            const date = new Date(change.date);
                            const month = date.toLocaleString('default', { month: 'short' });
                            const year = date.getFullYear();

                            return (
                              <div key={change.id} className="flex items-center gap-3 p-3 border border-divider rounded-lg">
                                <div className="flex-shrink-0">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                    change.type === 'deposit'
                                      ? 'bg-success-100 text-success-600 dark:bg-success-900 dark:text-success-300'
                                      : 'bg-danger-100 text-danger-600 dark:bg-danger-900 dark:text-danger-300'
                                  }`}>
                                    <Icon
                                      icon={change.type === 'deposit' ? 'lucide:arrow-down' : 'lucide:arrow-up'}
                                      className="w-5 h-5"
                                    />
                                  </div>
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{month} {year}</span>
                                    <span className={`text-sm px-2 py-1 rounded-full ${
                                      change.type === 'deposit'
                                        ? 'bg-success-100 text-success-700 dark:bg-success-900 dark:text-success-300'
                                        : 'bg-danger-100 text-danger-700 dark:bg-danger-900 dark:text-danger-300'
                                    }`}>
                                      {change.type === 'deposit' ? 'Deposit' : 'Withdrawal'}
                                    </span>
                                  </div>
                                  <div className="text-sm text-default-500 mt-1">
                                    {change.description || 'No description'}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className={`font-bold text-lg ${
                                    change.type === 'deposit' ? 'text-success' : 'text-danger'
                                  }`}>
                                    {change.type === 'deposit' ? '+' : '-'}₹{Math.abs(change.amount).toLocaleString()}
                                  </div>
                                  <div className="flex gap-1 mt-1">
                                    <Button
                                      size="sm"
                                      variant="flat"
                                      onPress={() => handleEditCapitalChange(change.id)}
                                      startContent={<Icon icon="lucide:edit" className="w-3 h-3" />}
                                    >
                                      Edit
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="flat"
                                      color="danger"
                                      onPress={() => deleteCapitalChange(change.id)}
                                      startContent={<Icon icon="lucide:trash" className="w-3 h-3" />}
                                    >
                                      Delete
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </Tab>
                <Tab key="monthly" title="Monthly Overrides">
                  <div className="py-4 space-y-4">
                    <p className="text-sm text-foreground-500">
                      Override starting capital for specific months. This allows you to manually set the starting capital for any month, overriding the automatic calculation.
                    </p>

                    {/* Add New Monthly Override */}
                    <div className="border border-divider rounded-lg p-4 bg-default-50 dark:bg-default-100">
                      <h4 className="font-semibold mb-3">Add Monthly Override</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <Select
                          label="Month"
                          selectedKeys={[overrideMonth]}
                          onChange={(e) => setOverrideMonth(e.target.value)}
                        >
                          {months.map(month => (
                            <SelectItem key={month} value={month}>
                              {month}
                            </SelectItem>
                          ))}
                        </Select>
                        <Select
                          label="Year"
                          selectedKeys={[overrideYear.toString()]}
                          onChange={(e) => setOverrideYear(Number(e.target.value))}
                        >
                          {years.map(year => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </Select>
                        <Input
                          label="Starting Capital"
                          type="number"
                          value={overrideAmount}
                          onValueChange={setOverrideAmount}
                          min="0"
                          step="1000"
                          startContent={<span className="text-default-400">₹</span>}
                        />
                        <div className="md:col-span-3">
                          <Button
                            color="primary"
                            onPress={handleAddMonthlyOverride}
                            isDisabled={!overrideAmount}
                            startContent={<Icon icon="lucide:calendar-plus" />}
                          >
                            Set Monthly Override
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Existing Monthly Overrides */}
                    <div>
                      <h4 className="font-semibold mb-3">Monthly Overrides</h4>
                      {sortedMonthlyOverrides.length === 0 ? (
                        <div className="text-center py-8 text-default-500">
                          <Icon icon="lucide:calendar-check" className="text-4xl mb-2 mx-auto" />
                          <p>No monthly overrides set yet.</p>
                          <p className="text-sm">Add an override above to manually set starting capital for specific months.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {sortedMonthlyOverrides.map((override) => (
                            <div key={override.id} className="flex items-center gap-3 p-3 border border-divider rounded-lg">
                              <div className="flex-shrink-0">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-300">
                                  <Icon icon="lucide:calendar" className="w-5 h-5" />
                                </div>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{override.month} {override.year}</span>
                                  <span className="text-sm px-2 py-1 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300">
                                    Override
                                  </span>
                                </div>
                                <div className="text-sm text-default-500 mt-1">
                                  Updated: {new Date(override.updatedAt).toLocaleDateString()}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-lg text-primary">
                                  ₹{override.startingCapital.toLocaleString()}
                                </div>
                                <div className="flex gap-1 mt-1">
                                  <Button
                                    size="sm"
                                    variant="flat"
                                    color="danger"
                                    onPress={() => handleRemoveMonthlyOverride(override.month, override.year)}
                                    startContent={<Icon icon="lucide:trash" className="w-3 h-3" />}
                                  >
                                    Remove
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
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

            {/* Yearly Starting Capital Modal */}
            <YearlyStartingCapitalModal
              isOpen={isYearlyCapitalModalOpen}
              onOpenChange={setIsYearlyCapitalModalOpen}
            />
          </>
        )}
      </ModalContent>
    </Modal>
  );
}; 