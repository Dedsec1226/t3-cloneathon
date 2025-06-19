"use client";

import { Menu, Search, Plus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSidebarStore } from "@/lib/sidebar-store";

export default function Sidebar() {
  const { isOpen: sidebarOpen, setSidebarOpen } = useSidebarStore();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  const isDark = resolvedTheme === "dark";

  const sidebarBg = isDark
    ? "bg-[#1a141b] text-gray-100"
    : "bg-[#fbe4f4] text-[#b83268] border border-[#b83268]";
  const toggleGroupBg = isDark ? "bg-black/40" : "bg-[#fbe4f4]";
  const toggleIcon = isDark ? "text-pink-200" : "text-[#b83268]";
  const searchIcon = isDark ? "text-pink-200" : "text-[#b83268]";
  const plusIcon = isDark ? "text-pink-200" : "text-[#b83268]";
  const loginText = isDark ? "text-gray-200" : "text-[#b83268]";
  const loginHover = isDark ? "hover:text-pink-200" : "hover:text-pink-800";
  const newChatBtn = isDark
    ? "bg-gradient-to-b from-[#7a355c] to-[#3a1a2d] text-white"
    : "bg-gradient-to-b from-[#d56698] to-[#b83268] text-white";
  const searchInput = isDark
    ? "bg-transparent outline-none border-none text-gray-300 placeholder-gray-400"
    : "bg-transparent outline-none border-none text-[#b83268] placeholder-[#b83268]/70";
  const searchBarBorder = isDark ? "border-[#3a1a2d]" : "border-[#b83268]";
  const btnClass = "p-1 rounded-md transition flex items-center justify-center";

  return (
    <>
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-64 ${sidebarBg} shadow-lg z-[55] flex flex-col justify-between transform rounded-tr-2xl rounded-br-2xl ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          transition: 'transform 300ms cubic-bezier(0.4, 0.0, 0.2, 1)'
        }}
      >
        <div>
          {/* Header section with consistent spacing */}
          <div className="w-full flex justify-center pt-8 pb-4 bg-inherit">
            <span className={`text-xl font-bold tracking-tight select-none ${isDark ? 'text-pink-200' : 'text-[#b83268]'} drop-shadow-sm`}>
              T3
            </span>
          </div>
          
          {/* Content section with consistent padding */}
          <div className="flex flex-col px-4 space-y-4">
            {/* New Chat button with proper spacing */}
            <button className={`w-full py-3 rounded-xl ${newChatBtn} font-semibold text-sm shadow-sm hover:brightness-110 transition duration-200`}>
              New Chat
            </button>
            
            {/* Search bar with consistent styling */}
            <div className={`w-full flex items-center bg-transparent border-b ${searchBarBorder} py-2`}>
              <Search className={`h-4 w-4 mr-3 ${searchIcon}`} />
              <input
                type="text"
                placeholder="Search your threads..."
                className={`flex-1 text-sm ${searchInput} py-1`}
              />
            </div>
          </div>
        </div>
        {/* Bottom section with consistent padding */}
        <div className="px-4 pb-6">
          <Link href="/login" className={`flex items-center gap-3 ${loginText} ${loginHover} transition duration-200 text-sm p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
              <polyline points="10 17 15 12 10 7"></polyline>
              <line x1="15" x2="3" y1="12" y2="12"></line>
            </svg>
            <span>Login</span>
          </Link>
        </div>
      </div>

      {/* Toggle/Search/Plus */}
      <div className={`fixed top-4 left-4 z-[100] flex items-center gap-1 ${toggleGroupBg} rounded-lg px-2 py-1.5 backdrop-blur-md shadow-sm`}>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={`${btnClass} ${toggleIcon} hover:bg-black/10 dark:hover:bg-white/10`}
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          <Menu className="h-4 w-4" />
        </button>
        <AnimatePresence>
          {!sidebarOpen && (
            <>
              <motion.button
                className={`${btnClass} ${searchIcon} hover:bg-black/10 dark:hover:bg-white/10`}
                initial={{ opacity: 1, x: 0, scaleX: 1 }}
                animate={{ opacity: 1, x: 0, scaleX: 1 }}
                exit={{ opacity: 0, x: -12, scaleX: 0.2 }}
                transition={{ duration: 0.08 }}
              >
                <Search className="h-4 w-4" />
              </motion.button>
              <motion.button
                className={`${btnClass} opacity-40 cursor-not-allowed ${plusIcon}`}
                disabled
                initial={{ opacity: 1, x: 0, scaleX: 1 }}
                animate={{ opacity: 1, x: 0, scaleX: 1 }}
                exit={{ opacity: 0, x: -12, scaleX: 0.2 }}
                transition={{ duration: 0.08 }}
              >
                <Plus className="h-4 w-4" />
              </motion.button>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
