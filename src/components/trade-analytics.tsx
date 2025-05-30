import React from "react";
import { 
  Card, 
  CardBody, 
  CardHeader, 
  Divider,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Tabs,
  Tab
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";
import { PerformanceMetrics } from "./analytics/performance-metrics";
import { TradeStatistics } from "./analytics/trade-statistics";
import { TopPerformers } from "./analytics/top-performers";
import { PerformanceChart } from "./analytics/performance-chart";
import { useTrades } from "../hooks/use-trades";
import { pageVariants, cardVariants, fadeInVariants } from "../utils/animations";

export const TradeAnalytics = React.memo(function TradeAnalytics() {
  const { trades } = useTrades();
  const [selectedPeriod, setSelectedPeriod] = React.useState("YTD");
  const [selectedView, setSelectedView] = React.useState("performance");
  
  const periods = ["1W", "1M", "3M", "6M", "YTD", "1Y", "ALL"];
  
  return (
    <motion.div 
      className="space-y-6"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <motion.div 
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        variants={fadeInVariants}
      >
        <div></div>
        <motion.div 
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Dropdown>
            <DropdownTrigger>
              <Button 
                variant="flat" 
                endContent={<Icon icon="lucide:chevron-down" className="text-sm" />}
                size="sm"
                className="font-medium"
              >
                {selectedPeriod}
              </Button>
            </DropdownTrigger>
            <DropdownMenu 
              aria-label="Time period selection" 
              selectionMode="single"
              selectedKeys={[selectedPeriod]}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                setSelectedPeriod(selected);
              }}
            >
              {periods.map((period) => (
                <DropdownItem key={period}>{period}</DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
          <Button
            variant="flat"
            startContent={<Icon icon="lucide:download" />}
            size="sm"
            className="font-medium"
          >
            Export
          </Button>
        </motion.div>
      </motion.div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          className="lg:col-span-2"
          variants={cardVariants}
          initial="initial"
          animate="animate"
          whileHover="hover"
          whileTap="tap"
        >
          <Card>
            <CardHeader className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold tracking-tight">Portfolio Performance</h3>
                <div className="flex items-center gap-3">
                  <motion.div 
                    className="flex items-center gap-1.5 bg-success-50 dark:bg-success-900/10 px-2 py-1 rounded-md"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                  >
                    <Icon icon="lucide:trending-up" className="text-success-600 dark:text-success-400" />
                    <span className="text-sm text-success-600 dark:text-success-400 font-medium">+6.54%</span>
                  </motion.div>
                  <span className="text-sm text-default-500 font-medium min-w-[40px] text-center">{selectedPeriod}</span>
                </div>
              </div>
            </CardHeader>
            <CardBody>
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedView}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <PerformanceChart trades={trades} />
                </motion.div>
              </AnimatePresence>
            </CardBody>
          </Card>
        </motion.div>
        
        <motion.div
          variants={cardVariants}
          initial="initial"
          animate="animate"
          whileHover="hover"
          whileTap="tap"
        >
          <Card>
            <CardHeader>
              <h3 className="text-xl font-semibold tracking-tight">Performance Metrics</h3>
            </CardHeader>
            <CardBody>
              <PerformanceMetrics trades={trades} isEditing={false} />
            </CardBody>
          </Card>
        </motion.div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          variants={cardVariants}
          initial="initial"
          animate="animate"
          whileHover="hover"
          whileTap="tap"
        >
          <Card>
            <CardHeader>
              <h3 className="text-xl font-semibold tracking-tight">Trade Statistics</h3>
            </CardHeader>
            <Divider />
            <CardBody>
              <TradeStatistics trades={trades} />
            </CardBody>
          </Card>
        </motion.div>
        
        <motion.div
          variants={cardVariants}
          initial="initial"
          animate="animate"
          whileHover="hover"
          whileTap="tap"
        >
          <Card>
            <CardHeader className="flex justify-between items-center">
              <h3 className="text-xl font-semibold tracking-tight">Top Performers</h3>
            </CardHeader>
            <Divider />
            <CardBody>
              <TopPerformers trades={trades} />
            </CardBody>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
});

export default TradeAnalytics;