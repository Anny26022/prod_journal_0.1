import React, { useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input } from "@heroui/react";
import { usePortfolio } from "../utils/PortfolioContext";

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({ isOpen, onOpenChange }) => {
  const { portfolioSize, setPortfolioSize } = usePortfolio();
  const [value, setValue] = useState(portfolioSize.toString());

  const handleSave = () => {
    setPortfolioSize(Number(value));
    onOpenChange(false);
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader>Profile Settings</ModalHeader>
            <ModalBody>
              <Input
                label="Initial Capital (Portfolio Size)"
                type="number"
                value={value}
                onValueChange={setValue}
                min={0}
                startContent={<span className="text-default-400">₹</span>}
              />
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={onClose}>Cancel</Button>
              <Button color="primary" onPress={handleSave}>Save</Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}; 