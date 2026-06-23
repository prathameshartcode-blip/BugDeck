"use client";

import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/providers/theme-provider";
import { motion } from "framer-motion";

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative flex items-center justify-center p-2 rounded-lg border border-border hover:bg-accent hover:text-accent-foreground transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
      aria-label="Toggle Theme"
      id="theme-toggle-btn"
    >
      <motion.div
        initial={false}
        animate={{ rotate: theme === "dark" ? 0 : 90, scale: theme === "dark" ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className="absolute"
      >
        <Moon className="h-4 w-4" />
      </motion.div>
      <motion.div
        initial={false}
        animate={{ rotate: theme === "light" ? 0 : -90, scale: theme === "light" ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <Sun className="h-4 w-4" />
      </motion.div>
    </button>
  );
};
