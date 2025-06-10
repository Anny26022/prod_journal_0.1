import React, { useEffect, useState } from 'react';
import { useTruePortfolio } from '../utils/TruePortfolioContext';
import { TruePortfolioSetup } from './TruePortfolioSetup';

export const TruePortfolioSetupManager: React.FC = () => {
  const { yearlyStartingCapitals } = useTruePortfolio();
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [hasCheckedSetup, setHasCheckedSetup] = useState(false);

  // Check if setup is needed - only show once when app loads
  useEffect(() => {
    if (!hasCheckedSetup) {
      if (yearlyStartingCapitals.length === 0) {
        setIsSetupModalOpen(true);
      }
      setHasCheckedSetup(true);
    }
  }, [yearlyStartingCapitals, hasCheckedSetup]);

  // Close modal when user adds starting capital
  useEffect(() => {
    if (hasCheckedSetup && yearlyStartingCapitals.length > 0 && isSetupModalOpen) {
      setIsSetupModalOpen(false);
    }
  }, [yearlyStartingCapitals, hasCheckedSetup, isSetupModalOpen]);

  return (
    <TruePortfolioSetup
      isOpen={isSetupModalOpen}
      onOpenChange={setIsSetupModalOpen}
    />
  );
};
