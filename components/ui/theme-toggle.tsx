"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const isDark = theme === "dark";

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // SVG paths for smooth morphing
  const sunPath = "M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0";
  const moonPath = "M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z";

  // Sun rays paths
  const sunRays = [
    "M12 2v2",
    "M12 20v2", 
    "m4.93 4.93 1.41 1.41",
    "m17.66 17.66 1.41 1.41",
    "M2 12h2",
    "M20 12h2",
    "m6.34 17.66-1.41 1.41",
    "m19.07 4.93-1.41 1.41"
  ];

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
      onClick={() => theme === "dark" ? setTheme("light") : setTheme("dark")}
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
        className="absolute size-4"
        initial={false}
        animate={{
          rotate: isDark ? 0 : 180,
        }}
        transition={{
          duration: 0.25,
          ease: [0.23, 1, 0.32, 1]
        }}
      >
        {/* Sun rays - show in dark mode (when we want to indicate we can switch to light) */}
        <motion.g
          initial={false}
          animate={{
            opacity: isDark ? 1 : 0,
            scale: isDark ? 1 : 0.6,
          }}
          transition={{
            duration: 0.2,
            ease: [0.23, 1, 0.32, 1],
            delay: isDark ? 0.05 : 0
          }}
          style={{ transformOrigin: "12px 12px" }}
        >
          {sunRays.map((ray, index) => (
            <motion.path
              key={ray}
              d={ray}
              initial={false}
              animate={{
                opacity: isDark ? 1 : 0,
                strokeWidth: isDark ? 2 : 1,
              }}
              transition={{
                duration: 0.15,
                delay: isDark ? index * 0.015 : 0,
                ease: [0.23, 1, 0.32, 1],
              }}
            />
          ))}
        </motion.g>

        {/* Main shape that morphs between sun circle and moon crescent */}
        <motion.path
          initial={false}
          animate={{
            d: isDark ? sunPath : moonPath,
            opacity: 1,
            rotate: isDark ? 0 : 180,
          }}
          transition={{
            duration: 0.25,
            ease: [0.23, 1, 0.32, 1],
            delay: 0.02
          }}
          fill="none"
          style={{
            transformOrigin: "12px 12px",
          }}
        />
      </motion.svg>
      
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
} 