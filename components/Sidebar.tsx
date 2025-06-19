"use client";

import { Menu, Search, Plus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSidebarStore } from "@/lib/sidebar-store";
import { useChatSearchStore } from "@/lib/chat-search-store";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { useCreateChat } from "@/hooks/use-convex-chat";
import ChatList from "@/components/ChatList";
import ChatSearch from "@/components/ChatSearch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Sidebar() {
  const router = useRouter();
  const { isOpen: sidebarOpen, setSidebarOpen } = useSidebarStore();
  const { isOpen: isSearchOpen, openSearch, closeSearch } = useChatSearchStore();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useUser();
  const createChat = useCreateChat();

  useEffect(() => setMounted(true), []);
  
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K for search
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        openSearch();
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [openSearch]);
  
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

  const handleNewChat = async () => {
    console.log("New Chat button clicked");
    console.log("User:", user);
    
    if (!user) {
      console.log("No user, showing error toast");
      toast.error("Please sign in to create a new chat");
      return;
    }

    try {
      console.log("Creating new chat...");
      const chatId = await createChat({
        title: "New Conversation",
        userId: user.id,
        visibility: "private"
      });
      
      console.log("Chat created with ID:", chatId);
      toast.success("New chat created!");
      
      // Use router.push for seamless navigation without page refresh
      router.push(`/search/${chatId}`);
    } catch (error) {
      console.error("Error creating new chat:", error);
      toast.error("Failed to create new chat");
    }
  };

  const handleNewChatFromFloat = async () => {
    console.log("Float New Chat button clicked");
    console.log("User:", user);
    
    if (!user) {
      console.log("No user, showing error toast");
      toast.error("Please sign in to create a new chat");
      return;
    }

    try {
      console.log("Creating new chat from float button...");
      const chatId = await createChat({
        title: "New Conversation", 
        userId: user.id,
        visibility: "private"
      });
      
      console.log("Chat created with ID:", chatId);
      toast.success("New chat created!");
      
      // Use router.push for seamless navigation without page refresh
      router.push(`/search/${chatId}`);
    } catch (error) {
      console.error("Error creating new chat:", error);
      toast.error("Failed to create new chat");
    }
  };

  return (
    <>
      {/* Chat Search Interface */}
      <ChatSearch isOpen={isSearchOpen} onClose={closeSearch} />
      
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-64 ${sidebarBg} shadow-lg z-[55] flex flex-col justify-between transform transition-transform duration-200 ease-out rounded-tr-2xl rounded-br-2xl ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header section with consistent spacing */}
          <div className="w-full flex justify-center pt-8 pb-4 bg-inherit">
            <span className={`text-xl font-bold tracking-tight select-none ${isDark ? 'text-pink-200' : 'text-[#b83268]'} drop-shadow-sm`}>
              T3
            </span>
          </div>
          
          {/* Content section with consistent padding */}
          <div className="flex flex-col px-4 space-y-4">
            {/* New Chat button with proper spacing */}
            <button 
              onClick={handleNewChat}
              className={`w-full py-3 rounded-xl ${newChatBtn} font-semibold text-sm shadow-sm hover:brightness-110 transition duration-200`}
            >
              New Chat
            </button>
            
            {/* Search bar with consistent styling */}
            <div className={`w-full flex items-center bg-transparent border-b ${searchBarBorder} py-2`}>
              <Search className={`h-4 w-4 mr-3 ${searchIcon}`} />
              <input
                type="text"
                placeholder="Search your threads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`flex-1 text-sm ${searchInput} py-1`}
              />
            </div>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-hidden px-4 mt-4">
            <ChatList searchQuery={searchQuery} />
          </div>
        </div>

        {/* User Profile - Always at bottom */}
        <div className="p-4">
          {user ? (
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.imageUrl} alt={user.firstName || "User"} />
                <AvatarFallback className={`text-xs ${isDark ? 'bg-pink-900/50 text-pink-200' : 'bg-[#b83268]/20 text-[#b83268]'}`}>
                  {user.firstName?.[0] || user.emailAddresses[0]?.emailAddress?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${isDark ? 'text-pink-200' : 'text-[#b83268]'}`}>
                  {user.firstName || user.emailAddresses[0]?.emailAddress?.split('@')[0]}
                </p>
                <p className={`text-xs truncate ${isDark ? 'text-pink-200/60' : 'text-[#b83268]/60'}`}>
                  {user.emailAddresses[0]?.emailAddress}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <Link 
                href="/sign-in" 
                className={`text-sm ${loginText} ${loginHover} font-medium`}
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Floating Toggle Group */}
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
                onClick={openSearch}
                className={`${btnClass} ${searchIcon} hover:bg-black/10 dark:hover:bg-white/10`}
                initial={{ opacity: 1, x: 0, scaleX: 1 }}
                animate={{ opacity: 1, x: 0, scaleX: 1 }}
                exit={{ opacity: 0, x: -12, scaleX: 0.2 }}
                transition={{ duration: 0.08 }}
              >
                <Search className="h-4 w-4" />
              </motion.button>
              <motion.button
                onClick={handleNewChatFromFloat}
                className={`${btnClass} ${plusIcon} hover:bg-black/10 dark:hover:bg-white/10`}
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