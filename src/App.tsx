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

  React.useEffect(() => {
    localStorage.setItem('isMobileMenuOpen', JSON.stringify(isMobileMenuOpen));
  }, [isMobileMenuOpen]);

  React.useEffect(() => {
    localStorage.setItem('isProfileOpen', JSON.stringify(isProfileOpen));
  }, [isProfileOpen]);

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
          <header className="sticky top-0 z-40 w-full border-b border-divider bg-background/80 backdrop-blur-xl">
            <nav className="px-4 sm:px-6">
              <div className="flex h-16 items-center justify-between">
                {/* Logo and Mobile Menu Button */}
                <div className="flex items-center gap-4">
                  <Link 
                    to="/" 
                    className="flex items-center gap-2 font-semibold tracking-tight hover:opacity-90 transition-opacity"
                  >
                    <TradeTrackerLogo className="h-5 w-5" />
                    <AnimatedBrandName />
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
                            ? 'text-primary bg-primary/10' 
                            : 'text-foreground/70 hover:text-foreground hover:bg-content2/40'
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
                    className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-md border border-primary-200 bg-background/60 hover:bg-background/80 min-h-0 min-w-0"
                    startContent={<Icon icon="lucide:user" className="h-4 w-4" />}
                  >
                    <span className="font-medium text-sm leading-none">Aniket Mahato</span>
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
                  <div className="space-y-1 px-4 py-3">
                    {navItems.map((item) => {
                      const isActive = location.pathname === item.path;
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors
                            ${isActive 
                              ? 'text-primary bg-primary/10' 
                              : 'text-foreground/70 hover:text-foreground hover:bg-content2/40'
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
                        <span className="font-medium">John Trader</span>
                        <span className="text-xs text-foreground/60">Pro Account</span>
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
          <main ref={mainContentRef} className={`flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full ${isMainContentFullscreen ? 'overflow-auto' : ''}`}>
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

          <ProfileSettingsModal isOpen={isProfileOpen} onOpenChange={setIsProfileOpen} />
        </div>
      </GlobalFilterProvider>
    </PortfolioProvider>
  );
}