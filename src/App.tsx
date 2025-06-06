import React, { useRef, useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { Route, Switch, Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@heroui/react";
import { TradeJournal } from "./components/trade-journal";
import { TradeAnalytics } from "./components/trade-analytics";
import { TaxAnalytics } from "./components/tax-analytics";
import { MonthlyPerformanceTable } from "./pages/monthly-performance";
import { ThemeSwitcher } from "./components/theme-switcher";
import { useTheme } from "@heroui/use-theme";
import { PortfolioProvider } from "./utils/PortfolioContext";
import { ProfileSettingsModal } from "./components/ProfileSettingsModal";
import { GlobalFilterProvider, useGlobalFilter } from "./context/GlobalFilterContext";
import { GlobalFilterBar } from "./components/GlobalFilterBar";
import { TradeTrackerLogo } from './components/icons/TradeTrackerLogo';
import { AnimatedBrandName } from './components/AnimatedBrandName';
import DeepAnalyticsPage from "./pages/DeepAnalyticsPage";

export default function App() {
  const location = useLocation();
  const { theme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('isMobileMenuOpen');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });
  const [isProfileOpen, setIsProfileOpen] = React.useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('isProfileOpen');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });

  const mainContentRef = useRef<HTMLElement>(null);
  const [isMainContentFullscreen, setIsMainContentFullscreen] = useState(false);

  const getDefaultUserName = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('userName') || 'Aniket Mahato';
    }
    return 'Aniket Mahato';
  };
  const [userName, setUserName] = React.useState(getDefaultUserName);

  React.useEffect(() => {
    localStorage.setItem('isMobileMenuOpen', JSON.stringify(isMobileMenuOpen));
  }, [isMobileMenuOpen]);

  React.useEffect(() => {
    localStorage.setItem('isProfileOpen', JSON.stringify(isProfileOpen));
  }, [isProfileOpen]);

  React.useEffect(() => {
    localStorage.setItem('userName', userName);
  }, [userName]);

  const handleToggleMainContentFullscreen = () => {
    if (!document.fullscreenElement) {
      mainContentRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsMainContentFullscreen(document.fullscreenElement === mainContentRef.current);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const navItems = [
    { path: "/", name: "Journal", icon: "lucide:book-open" },
    { path: "/analytics", name: "Analytics", icon: "lucide:bar-chart-2" },
    { path: "/tax-analytics", name: "Tax Analytics", icon: "lucide:calculator" },
    { path: "/monthly-performance", name: "Monthly Performance", icon: "lucide:calendar-check" },
    { path: "/deep-analytics", name: "Deep Analytics", icon: "lucide:pie-chart" }
  ];

  return (
    <PortfolioProvider>
      <GlobalFilterProvider>
        <div className="min-h-screen bg-background font-sans antialiased">
          {/* Navigation */}
          <header className="sticky top-0 z-40 w-full border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl backdrop-saturate-150">
            <nav className="px-4 sm:px-6">
              <div className="flex h-16 items-center justify-between">
                {/* Logo and Mobile Menu Button */}
                <div className="flex items-center gap-4">
                  <Link 
                    to="/" 
                    className="flex items-center gap-2 font-semibold tracking-tight text-gray-900 dark:text-white hover:opacity-90 transition-opacity"
                  >
                    <TradeTrackerLogo className="h-5 w-5 text-gray-900 dark:text-white" />
                    <AnimatedBrandName className="text-gray-900 dark:text-white" />
                  </Link>
                  <Button
                    isIconOnly
                    variant="light"
                    size="sm"
                    onPress={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="sm:hidden"
                  >
                    <Icon icon={isMobileMenuOpen ? "lucide:x" : "lucide:menu"} className="h-5 w-5" />
                  </Button>
                </div>

                {/* Desktop Navigation */}
                <div className="hidden sm:flex sm:items-center sm:gap-8">
                  {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center gap-2.5 px-3 py-2 text-sm font-medium transition-colors rounded-lg
                          ${isActive 
                            ? 'text-primary-600 dark:text-primary-400 bg-primary-100 dark:bg-primary-900/30 backdrop-blur-md shadow-md' 
                            : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/50 backdrop-blur-sm transition-all duration-300'
                          }`}
                      >
                        <Icon icon={item.icon} className="h-4 w-4" />
                        {item.name}
                      </Link>
                    );
                  })}
                </div>

                {/* Right Side Actions */}
                <div className="flex items-center gap-3">
                  <ThemeSwitcher />
                  <Button
                    variant="flat"
                    size="sm"
                    onPress={() => setIsProfileOpen(true)}
                    className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full border border-white/20 bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all duration-300 min-h-0 min-w-0 shadow-sm"
                    startContent={<Icon icon="lucide:user" className="h-4 w-4" />}
                  >
                    <span className="font-medium text-sm leading-none">{userName}</span>
                  </Button>
                </div>
              </div>
            </nav>

            {/* Mobile Navigation */}
            <AnimatePresence>
              {isMobileMenuOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="sm:hidden border-t border-divider overflow-hidden"
                >
                  <div className="space-y-1 px-4 py-3 bg-background/30 backdrop-blur-xl">
                    {navItems.map((item) => {
                      const isActive = location.pathname === item.path;
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors
                            ${isActive 
                              ? 'text-primary bg-white/20 backdrop-blur-md shadow-md' 
                              : 'text-foreground/80 hover:text-foreground hover:bg-white/10 backdrop-blur-sm hover:backdrop-blur transition-all duration-300'
                            }`}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Icon icon={item.icon} className="h-4 w-4" />
                          {item.name}
                        </Link>
                      );
                    })}
                    <Button
                      variant="flat"
                      size="sm"
                      onPress={() => {
                        setIsProfileOpen(true);
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full mt-4 justify-start"
                      startContent={<Icon icon="lucide:user" className="h-4 w-4" />}
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{userName}</span>
                      </div>
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </header>

          {/* Global Filter Bar */}
          <GlobalFilterBar />

          {/* Main Content */}
          <main ref={mainContentRef} className={`flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full ${isMainContentFullscreen ? 'overflow-auto' : ''} bg-gradient-to-br from-background/50 to-background/30`}>
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 20 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  transition: {
                    duration: 0.4,
                    ease: [0.22, 1, 0.36, 1],
                    staggerChildren: 0.1
                  }
                }}
                exit={{ 
                  opacity: 0, 
                  y: -20,
                  transition: {
                    duration: 0.3,
                    ease: [0.22, 1, 0.36, 1]
                  }
                }}
                className="w-full"
              >
                <Switch location={location}>
                  <Route exact path="/" render={(props) => <TradeJournal {...props} toggleFullscreen={handleToggleMainContentFullscreen} isFullscreen={isMainContentFullscreen} />} />
                  <Route path="/analytics" component={TradeAnalytics} />
                  <Route path="/tax-analytics" component={TaxAnalytics} />
                  <Route path="/monthly-performance" component={MonthlyPerformanceTable} />
                  <Route path="/deep-analytics" component={DeepAnalyticsPage} />
                </Switch>
              </motion.div>
            </AnimatePresence>
          </main>

          <ProfileSettingsModal
            isOpen={isProfileOpen}
            onOpenChange={setIsProfileOpen}
            userName={userName}
            setUserName={setUserName}
          />
        </div>
      </GlobalFilterProvider>
    </PortfolioProvider>
  );
}