import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import { ThemeToggleButton } from "@/components/common/ThemeToggleButton";
import UserDropdown from "@/components/header/UserDropdown";
import { useSidebar } from "@/contexts/SideBarContext";
import { cn } from "@/lib/utils";
import { getAdminNavigation } from "../navigation";
import ZigmaLogo from "@/images/logo.png";

type MenuKey = "admins" | "masters" | "em-masters" | "sales-masters" | "sales-service" | null;

const AppHeader: React.FC = () => {
  const [openMenu, setOpenMenu] = useState<MenuKey>(null);
  const [scrolled, setScrolled] = useState(false);

  const {
    isMobileOpen,
    toggleSidebar,
    toggleMobileSidebar,
    activeItem,
    setActiveItem,
  } = useSidebar();

  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const { admin, masters, emMasters, salesMasters, salesService, salesColumns } = useMemo(getAdminNavigation, []);

  /* -------------------------------------------------
     Helpers
  ------------------------------------------------- */

  const findPrimaryPath = useCallback(
    (items: { path?: string; subItems?: { path: string }[] }[]) => {
      for (const item of items) {
        if (item.path) return item.path;
        if (item.subItems?.length) return item.subItems[0].path;
      }
      return "/admin";
    },
    []
  );

  const withAdminPrefix = useCallback((path: string) => {
    const normalized = path.startsWith("/") ? path : `/${path}`;
    return normalized.startsWith("/admin")
      ? normalized
      : `/admin${normalized}`;
  }, []);

  /* -------------------------------------------------
     Dashboard entry paths
  ------------------------------------------------- */

  const adminDashboardPath = useMemo(
    () => withAdminPrefix(findPrimaryPath(admin)),
    [admin, findPrimaryPath, withAdminPrefix]
  );

  const mastersDashboardPath = useMemo(
    () => withAdminPrefix(findPrimaryPath(masters)),
    [masters, findPrimaryPath, withAdminPrefix]
  );

  const emMastersDashboardPath = useMemo(
    () => withAdminPrefix(findPrimaryPath(emMasters)),
    [emMasters, findPrimaryPath, withAdminPrefix]
  );

  const salesMastersDashboardPath = useMemo(
    () => withAdminPrefix(findPrimaryPath(salesMasters)),
    [salesMasters, findPrimaryPath, withAdminPrefix]
  );

  const salesServiceDashboardPath = useMemo(
    () => withAdminPrefix(findPrimaryPath(salesService)),
    [salesService, findPrimaryPath, withAdminPrefix]
  );

  const adminItems = admin[0]?.subItems || [];
  const masterItems = masters[0]?.subItems || [];
  const emMasterItems = emMasters[0]?.subItems || [];
  const salesMasterItems = salesMasters[0]?.subItems || [];
  const salesServiceItems = salesService[0]?.subItems || [];
  const salesServiceFirstPath = salesColumns[0]?.items[0]?.path ?? "/admin";

  /* -------------------------------------------------
     Scroll + keyboard effects
  ------------------------------------------------- */

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  /* -------------------------------------------------
     Sidebar toggle
  ------------------------------------------------- */

  const handleSidebarToggle = () => {
    if (window.innerWidth >= 1024) toggleSidebar();
    else toggleMobileSidebar();
  };

  /* -------------------------------------------------
     Menu orchestration logic (IMPORTANT)
  ------------------------------------------------- */

  const showMastersGroup =
    activeItem === "masters" || activeItem === "em-masters";

  const showSalesGroup = activeItem === "sales-masters";
  const showSalesServiceGroup = activeItem === "sales-service";

  const toggleMenu = (menu: MenuKey) => {
    setActiveItem(menu);
    setOpenMenu((prev) => (prev === menu ? null : menu));

    if (menu === "admins") navigate(adminDashboardPath);
    if (menu === "masters") navigate(mastersDashboardPath);
    if (menu === "em-masters") navigate(emMastersDashboardPath);
    if (menu === "sales-masters") navigate(salesMastersDashboardPath);
    if (menu === "sales-service") navigate(withAdminPrefix(salesServiceFirstPath));
  };

  /* -------------------------------------------------
     Menu renderer
  ------------------------------------------------- */

  const renderNavMenu = (
    label: string,
    menuKey: Exclude<MenuKey, null>,
    items: { name: string; path: string }[]
  ) => {
    if (activeItem !== menuKey && !showMastersGroup) return null;

    const isOpen = openMenu === menuKey;

    return (
      <div
        className="relative"
        onMouseEnter={() => setOpenMenu(menuKey)}
        onMouseLeave={() => setOpenMenu(null)}
      >
        <motion.button
          onClick={() => toggleMenu(menuKey)}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className={cn(
            "rounded-2xl px-5 py-2.5 text-sm font-semibold inline-flex items-center gap-2 transition-all",
            isOpen
              ? "bg-gradient-to-r from-[var(--admin-primary)] to-[var(--admin-accent)] text-white shadow-lg"
              : "bg-[var(--admin-surfaceMuted)] text-[var(--admin-text)] hover:bg-[var(--admin-primarySoft)]"
          )}
        >
          {label}
          <motion.svg
            animate={{ rotate: isOpen ? 180 : 0 }}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M6 9l6 6 6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </motion.svg>
        </motion.button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="absolute left-0 mt-3 w-64 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surfaceAlt)]/95 backdrop-blur-xl p-2 shadow-[var(--admin-cardShadow)]"
            >
              <ul className="space-y-1">
                {items.map((item) => (
                  <li key={item.name}>
                    <Link
                      to={withAdminPrefix(item.path)}
                      onClick={() => setOpenMenu(null)}
                      className="block rounded-xl px-4 py-2.5 text-sm font-medium transition hover:bg-[var(--admin-primarySoft)] hover:text-[var(--admin-primary)]"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  /* -------------------------------------------------
     JSX
  ------------------------------------------------- */

  return (
    <header className="sticky top-0 z-[60] w-full bg-white backdrop-blur-xl">
      <div
        className={cn(
          "px-4 lg:px-8 py-4 transition-shadow",
          scrolled && "shadow-xl shadow-[var(--admin-primary)]/5"
        )}
      >
        <div className="flex items-center justify-between gap-4">
          {/* Left */}
          <div className="flex items-center gap-6">
            <button
              onClick={handleSidebarToggle}
              className="p-2.5 rounded-xl bg-[var(--admin-surfaceMuted)] hover:bg-[var(--admin-primarySoft)]"
            >
              {isMobileOpen ? "✕" : "☰"}
            </button>

            <Link
              to="/admindashboard"
              className="hidden lg:flex items-center gap-3"
            >
              <img src={ZigmaLogo} className="h-12 w-12 rounded-2xl" />
              <div>
                <div className="text-xl font-bold bg-gradient-to-r from-[var(--admin-primary)] to-[var(--admin-accent)] bg-clip-text text-transparent">
                  Zigma Admin
                </div>
                <div className="text-[10px] uppercase tracking-wider text-[var(--admin-mutedText)]">
                  Management Portal
                </div>
              </div>
            </Link>

            {/* -------- NAV BAR MENUS -------- */}
            <div className="hidden lg:flex gap-3">
              {activeItem === "admins" &&
                renderNavMenu("Admin", "admins", adminItems)}

              {showMastersGroup && (
                <>
                  {renderNavMenu("Masters", "masters", masterItems)}
                  {renderNavMenu("EM Masters", "em-masters", emMasterItems)}
                </>
              )}

              {showSalesGroup &&
                renderNavMenu("Masters", "sales-masters", salesMasterItems)}

              {showSalesServiceGroup && (
                <div
                  className="relative"
                  onMouseEnter={() => setOpenMenu("sales-service")}
                  onMouseLeave={() => setOpenMenu(null)}
                >
                  <motion.button
                    onClick={() => toggleMenu("sales-service")}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className={cn(
                      "rounded-2xl px-5 py-2.5 text-sm font-semibold inline-flex items-center gap-2 transition-all",
                      openMenu === "sales-service"
                        ? "bg-gradient-to-r from-[var(--admin-primary)] to-[var(--admin-accent)] text-white shadow-lg"
                        : "bg-[var(--admin-surfaceMuted)] text-[var(--admin-text)] hover:bg-[var(--admin-primarySoft)]"
                    )}
                  >
                    Sales
                    <motion.svg
                      animate={{ rotate: openMenu === "sales-service" ? 180 : 0 }}
                      width="16" height="16" viewBox="0 0 24 24" fill="none"
                    >
                      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </motion.svg>
                  </motion.button>

                  <AnimatePresence>
                    {openMenu === "sales-service" && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="absolute left-0 mt-3 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surfaceAlt)]/95 backdrop-blur-xl shadow-[var(--admin-cardShadow)] p-4"
                        style={{ minWidth: "max-content" }}
                      >
                        <div className="flex gap-6">
                          {salesColumns.map((col) => (
                            <div key={col.heading} className="min-w-[160px]">
                              <div className="text-xs font-bold uppercase tracking-wider text-[var(--admin-primary)] mb-2 pb-1 border-b border-[var(--admin-border)]">
                                {col.heading}
                              </div>
                              <ul className="space-y-0.5">
                                {col.items.map((item) => (
                                  <li key={item.name}>
                                    <Link
                                      to={withAdminPrefix(item.path)}
                                      onClick={() => setOpenMenu(null)}
                                      className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-[var(--admin-text)] transition hover:bg-[var(--admin-primarySoft)] hover:text-[var(--admin-primary)] whitespace-nowrap"
                                    >
                                      <span className="w-1 h-1 rounded-full bg-[var(--admin-primary)] opacity-50 flex-shrink-0" />
                                      {item.name}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            <ThemeToggleButton />
            <UserDropdown />
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
