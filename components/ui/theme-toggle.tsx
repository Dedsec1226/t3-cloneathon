"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export function ThemeToggle() {
  const { setTheme, theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  
  // Use resolvedTheme for more reliable theme detection
  const isDark = resolvedTheme === "dark";

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    // Simple toggle logic - if currently dark, go to light, otherwise go to dark
    setTheme(isDark ? "light" : "dark");
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-muted/40 hover:text-foreground disabled:hover:bg-transparent disabled:hover:text-foreground/50 group relative size-8"
      >
        <div className="size-4" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-muted/40 hover:text-foreground disabled:hover:bg-transparent disabled:hover:text-foreground/50 group relative size-8"
    >
      <motion.svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-4"
        initial={false}
        animate={{ rotate: isDark ? 0 : 0 }}
        transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Sun rays - fade out when dark */}
        <motion.g
          animate={{
            opacity: isDark ? 0 : 1,
            scale: isDark ? 0.8 : 1,
          }}
          transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
          style={{ transformOrigin: '12px 12px' }}
        >
          <motion.path d="M12 1v6" animate={{ pathLength: isDark ? 0 : 1 }} transition={{ duration: 0.15, delay: isDark ? 0 : 0.05 }} />
          <motion.path d="M12 17v6" animate={{ pathLength: isDark ? 0 : 1 }} transition={{ duration: 0.15, delay: isDark ? 0 : 0.05 }} />
          <motion.path d="m4.22 4.22 4.24 4.24" animate={{ pathLength: isDark ? 0 : 1 }} transition={{ duration: 0.15, delay: isDark ? 0 : 0.08 }} />
          <motion.path d="m15.54 15.54 4.24 4.24" animate={{ pathLength: isDark ? 0 : 1 }} transition={{ duration: 0.15, delay: isDark ? 0 : 0.08 }} />
          <motion.path d="M1 12h6" animate={{ pathLength: isDark ? 0 : 1 }} transition={{ duration: 0.15, delay: isDark ? 0 : 0.1 }} />
          <motion.path d="M17 12h6" animate={{ pathLength: isDark ? 0 : 1 }} transition={{ duration: 0.15, delay: isDark ? 0 : 0.1 }} />
          <motion.path d="m4.22 19.78 4.24-4.24" animate={{ pathLength: isDark ? 0 : 1 }} transition={{ duration: 0.15, delay: isDark ? 0 : 0.12 }} />
          <motion.path d="m15.54 8.46 4.24-4.24" animate={{ pathLength: isDark ? 0 : 1 }} transition={{ duration: 0.15, delay: isDark ? 0 : 0.12 }} />
        </motion.g>
        
        {/* Center circle that morphs into moon */}
        <motion.path
          animate={{
            d: isDark 
              ? "M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"
              : "M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z"
          }}
          transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
          fill={isDark ? "currentColor" : "none"}
        />
        
        {/* Moon crater details - only visible in dark mode */}
        <motion.g
          animate={{
            opacity: isDark ? 0.6 : 0,
            scale: isDark ? 1 : 0.5,
          }}
          transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1], delay: isDark ? 0.1 : 0 }}
          style={{ transformOrigin: '12px 12px' }}
        >
          <circle cx="15" cy="9" r="1" fill="currentColor" opacity="0.4" />
          <circle cx="13" cy="15" r="0.5" fill="currentColor" opacity="0.6" />
          <circle cx="16" cy="13" r="0.3" fill="currentColor" opacity="0.5" />
        </motion.g>
      </motion.svg>
      
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
} 