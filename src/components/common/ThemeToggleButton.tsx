import { Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

interface ThemeToggleButtonProps {
  className?: string;
}

export function ThemeToggleButton({ className }: ThemeToggleButtonProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={toggleTheme}
      className={cn(
        "relative inline-flex h-8 w-16 items-center rounded-full transition-colors",
        "border border-[var(--admin-border)]",
        isDark
          ? "bg-[var(--admin-surfaceMuted)]"
          : "bg-[var(--admin-primarySoft)]",
        className
      )}
    >
      {/* sliding thumb */}
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={cn(
          "absolute left-0.5 top-0.5 flex h-6 w-6 items-center justify-center rounded-full",
          "bg-[var(--admin-surfaceAlt)] text-[var(--admin-primary)]",
          isDark && "translate-x-7 text-[var(--admin-accent)]"
        )}
      >
        {isDark ? (
          <Moon className="h-3.5 w-3.5" />
        ) : (
          <Sun className="h-3.5 w-3.5" />
        )}
      </motion.span>
    </button>
  );
}
