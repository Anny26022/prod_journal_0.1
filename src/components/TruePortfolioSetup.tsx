import React, { useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Card,
  CardBody,
  Divider
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useTruePortfolio } from '../utils/TruePortfolioContext';

interface TruePortfolioSetupProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TruePortfolioSetup: React.FC<TruePortfolioSetupProps> = ({
  isOpen,
  onOpenChange
}) => {
  const { yearlyStartingCapitals, setYearlyStartingCapital } = useTruePortfolio();
  const [startingCapital, setStartingCapital] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());

  const handleSetup = () => {
    const amount = parseFloat(startingCapital);
    const year = parseInt(selectedYear);

    if (isNaN(amount) || isNaN(year) || amount <= 0) {
      alert('Please enter a valid amount and year');
      return;
    }

    setYearlyStartingCapital(year, amount);

    // Clear form and close modal
    setStartingCapital('');
    onOpenChange(false);

    // Show success message
    setTimeout(() => {
      alert('✅ Portfolio setup complete! Your True Portfolio system is now active.');
    }, 500);
  };

  // Check if setup is needed
  const needsSetup = yearlyStartingCapitals.length === 0;

  if (!needsSetup) {
    return null; // Don't show if already set up
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onOpenChange={onOpenChange}
      size="md"
      isDismissable={false}
      hideCloseButton={true}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Icon icon="lucide:rocket" className="text-primary" />
                <span>Welcome to True Portfolio System!</span>
              </div>
            </ModalHeader>
            <ModalBody>
              <Card className="bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20">
                <CardBody className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Icon icon="lucide:info" className="text-primary mt-1 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-primary mb-2">What's New?</h3>
                        <p className="text-sm text-default-600 mb-3">
                          Your trading journal now uses a <strong>True Portfolio System</strong> that automatically calculates your portfolio size based on:
                        </p>
                        <ul className="text-sm text-default-600 space-y-1 ml-4">
                          <li>• <strong>Starting Capital</strong> for each year (January)</li>
                          <li>• <strong>Capital Changes</strong> (deposits/withdrawals)</li>
                          <li>• <strong>Trading P&L</strong> from your actual trades</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Divider className="my-4" />

              <div className="space-y-4">
                <h4 className="font-semibold">Set Your Starting Capital</h4>
                <p className="text-sm text-default-600">
                  Enter your starting capital for January {selectedYear}. This will be the foundation for all portfolio calculations.
                </p>
                
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Year"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    type="number"
                    min="2020"
                    max="2030"
                  />
                  <Input
                    label="Starting Capital"
                    placeholder="e.g., 100000"
                    value={startingCapital}
                    onChange={(e) => setStartingCapital(e.target.value)}
                    type="number"
                    min="0"
                    step="1000"
                    startContent={<span className="text-default-400">₹</span>}
                  />
                </div>

                <div className="bg-warning-50 dark:bg-warning-900/20 p-3 rounded-lg border border-warning-200 dark:border-warning-800">
                  <div className="flex items-start gap-2">
                    <Icon icon="lucide:lightbulb" className="text-warning-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-warning-800 dark:text-warning-200 mb-1">Pro Tip:</p>
                      <p className="text-warning-700 dark:text-warning-300">
                        You can always add more years and manage capital changes later through the Portfolio Settings.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button
                color="primary"
                onPress={handleSetup}
                isDisabled={!startingCapital || !selectedYear}
                startContent={<Icon icon="lucide:check" />}
              >
                Set Up Portfolio
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};
