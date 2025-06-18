"use client";

import { Menu, Search, LogIn, Plus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function Sidebar({ sidebarOpen, setSidebarOpen }: {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}) {
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
        className={`fixed top-0 left-0 h-full w-64 ${sidebarBg} shadow-lg z-40 flex flex-col justify-between transform transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] rounded-tr-2xl rounded-br-2xl ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          <div className="w-full flex justify-center pt-5 pb-6">
            <span className={`text-lg font-bold tracking-tight select-none ${isDark ? 'text-pink-200' : 'text-[#b83268]'}`}>
              T3.Chat
            </span>
          </div>
          <div className="flex flex-col items-center px-4">
            <button className={`w-full py-2 rounded-xl ${newChatBtn} font-semibold text-base shadow-sm hover:brightness-110 transition mb-6`}>
              New Chat
            </button>
            <div className={`w-full flex items-center bg-transparent border-b ${searchBarBorder} py-1 mb-2`}>
              <Search className={`h-4 w-4 mr-2 ${searchIcon}`} />
              <input
                type="text"
                placeholder="Search your threads..."
                className={`flex-1 text-sm ${searchInput}`}
              />
            </div>
          </div>
        </div>
        <div className="pl-8 pb-6 flex">
          <Link href="/login" className={`flex items-center gap-2 ${loginText} ${loginHover} transition text-base mb-2`}>
            <LogIn className="h-4 w-4" />
            <span>Login</span>
          </Link>
        </div>
      </div>

      {/* Toggle/Search/Plus */}
      <div className={`fixed top-4 left-4 z-[100] flex items-center gap-1 ${toggleGroupBg} rounded-lg px-2 py-1 backdrop-blur-md`}>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={btnClass + ` ${toggleIcon}`}
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          <Menu className="h-4 w-4" />
        </button>
        <AnimatePresence>
          {!sidebarOpen && (
            <>
              <motion.button
                className={btnClass + ` ${searchIcon}`}
                initial={{ opacity: 1, x: 0, scaleX: 1 }}
                animate={{ opacity: 1, x: 0, scaleX: 1 }}
                exit={{ opacity: 0, x: -12, scaleX: 0.2 }}
                transition={{ duration: 0.12 }}
              >
                <Search className="h-4 w-4" />
              </motion.button>
              <motion.button
                className={btnClass + ` opacity-40 cursor-not-allowed ${plusIcon}`}
                disabled
                initial={{ opacity: 1, x: 0, scaleX: 1 }}
                animate={{ opacity: 1, x: 0, scaleX: 1 }}
                exit={{ opacity: 0, x: -12, scaleX: 0.2 }}
                transition={{ duration: 0.12 }}
              >
                <Plus className="h-4 w-4 mx-auto" />
              </motion.button>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
