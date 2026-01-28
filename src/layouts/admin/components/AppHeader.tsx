import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import { ThemeToggleButton } from "@/components/common/ThemeToggleButton";
import UserDropdown from "@/components/header/UserDropdown";
import { useSidebar } from "@/contexts/SideBarContext";
import { cn } from "@/lib/utils";
import { getAdminNavigation } from "../navigation";
import ZigmaLogo from "@/images/logo.png";

const AppHeader: React.FC = () => {
  const [openMenu, setOpenMenu] = useState<"masters" | "admins" | "em-masters" | null>(null);
  const [scrolled, setScrolled] = useState(false);

  const { isMobileOpen, toggleSidebar, toggleMobileSidebar, activeItem, setActiveItem } =
    useSidebar();

  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const { admin, masters, emMasters } = useMemo(getAdminNavigation, []);

  console.log("Admin Navigation:", { admin, masters, emMasters });
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

  const adminDashboardPath = useMemo(
    () => withAdminPrefix(findPrimaryPath(admin)),
    [admin, findPrimaryPath, withAdminPrefix]
  );
  const mastersDashboardPath = useMemo(
    () => withAdminPrefix(findPrimaryPath(masters)),
    [findPrimaryPath, masters, withAdminPrefix]
  );
  const emMastersDashboardPath = useMemo(
    () => withAdminPrefix(findPrimaryPath(emMasters)),
    [emMasters, findPrimaryPath, withAdminPrefix]
  );

  const adminItems = admin[0]?.subItems || [];
  const masterItems = masters[0]?.subItems || [];
  const emMasterItems = emMasters[0]?.subItems || [];

  /* ---------------- effects ---------------- */

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

  /* ---------------- handlers ---------------- */

  const handleSidebarToggle = () => {
    if (window.innerWidth >= 1024) toggleSidebar();
    else toggleMobileSidebar();
  };

  const toggleMenu = (menu: "masters" | "admins" | "em-masters") => {
    setActiveItem(menu);
    setOpenMenu((prev) => (prev === menu ? null : menu));
  
    if (menu === "admins") navigate(adminDashboardPath);
    if (menu === "masters") navigate(mastersDashboardPath);
    if (menu === "em-masters") navigate(emMastersDashboardPath);
  };

  /* ---------------- render menu ---------------- */

  const renderNavMenu = (
    label: string,
    menuKey: "masters" | "admins" | "em-masters",
    items: { name: string; path: string }[]
  ) => {
    if (activeItem !== menuKey) return null;

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

  /* ---------------- JSX ---------------- */

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

            <Link to="/admindashboard" className="hidden lg:flex items-center gap-3">
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

            <div className="hidden lg:flex gap-3">
              {renderNavMenu("Admin", "admins", adminItems)}
              {renderNavMenu("Masters", "masters", masterItems)}
              {renderNavMenu("EM Masters", "em-masters", emMasterItems)}
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
