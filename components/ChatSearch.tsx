"use client";

import React, { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useUserChats } from "@/hooks/use-convex-chat";
import { 
  Search, 
  Clock, 
  Plus, 
  Slash, 
  MessageSquare, 
  Globe, 
  Lock, 
  ArrowRight,
  X
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { useCreateChat } from "@/hooks/use-convex-chat";
import { toast } from "sonner";
import { useChatSearchStore } from "@/lib/chat-search-store";

interface ChatSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatSearch({ isOpen, onClose }: ChatSearchProps) {
  const router = useRouter();
  const { user } = useUser();
  const searchInputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const createChat = useCreateChat();

  // Zustand store
  const {
    mounted,
    searchQuery,
    filteredChats,
    setMounted,
    setSearchQuery,
    setChatsData,
    clearSearchState,
  } = useChatSearchStore();

  // Get chats data from hook
  const chatsResponse = useUserChats(user?.id || '');

  // Update mounted state
  useEffect(() => {
    setMounted(true);
  }, [setMounted]);

  // Update chats data in store when it changes
  useEffect(() => {
    if (chatsResponse?.chats) {
      setChatsData(chatsResponse.chats);
    }
  }, [chatsResponse?.chats, setChatsData]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  // Handle clicks outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  // Clear state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      clearSearchState();
    }
  }, [isOpen, clearSearchState]);

  const handleChatClick = (chatId: string) => {
    router.push(`/search/${chatId}`);
    onClose();
  };

  const handleNewChat = async () => {
    if (!user) {
      toast.error("Please sign in to create a new chat");
      return;
    }

    try {
      const chatId = await createChat({
        title: searchQuery.trim() || "New Conversation",
        userId: user.id,
        visibility: "private"
      });
      
      toast.success("New chat created!");
      router.push(`/search/${chatId}`);
      onClose();
    } catch (error) {
      console.error("Error creating new chat:", error);
      toast.error("Failed to create new chat");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (filteredChats.length > 0 && searchQuery.trim()) {
        // Navigate to first search result
        handleChatClick(filteredChats[0]._id);
      } else {
        // Create new chat
        handleNewChat();
      }
    }
  };

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9998]"
            onClick={onClose}
          />
          
          {/* Search Interface */}
          <motion.div
            ref={containerRef}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[9999] w-full max-w-xl mx-auto px-4"
          >
            <div className="pointer-events-auto flex h-fit w-full flex-col gap-1 rounded-xl bg-popover p-3.5 pt-2.5 text-secondary-foreground shadow-2xl outline outline-1 outline-border/20 backdrop-blur-md dark:outline-white/5">
              
              {/* Search Input */}
              <div className="relative">
                <div className="w-full rounded-t-lg bg-popover">
                  <div className="mr-px flex items-start justify-start pb-2">
                    <div className="mt-0.5 flex items-center text-muted-foreground/75">
                      <Search className="ml-px !size-4" />
                      <Slash className="ml-[3px] !size-4 skew-x-[30deg] opacity-20" />
                      <Plus className="mr-3 !size-4" />
                    </div>
                    <textarea
                      ref={searchInputRef}
                      className="w-full resize-none bg-transparent text-sm placeholder:select-none placeholder:text-muted-foreground/50 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
                      role="searchbox"
                      aria-label="Search threads and messages"
                      placeholder="Search or press Enter to start new chat..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={handleKeyDown}
                      style={{ height: "20px !important" }}
                      rows={1}
                    />
                    {/* Close button */}
                    <button
                      onClick={onClose}
                      className="ml-2 p-1 rounded-md hover:bg-muted/50 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                      aria-label="Close search"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                  <div className="border-b border-border px-3"></div>
                </div>
              </div>

              {/* Search Results */}
              <div className="mt-2.5 max-h-[50vh] space-y-2 overflow-y-auto">
                {!user ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground/70">
                      Sign in to search your chats
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    <div className="flex w-full items-center justify-start gap-1.5 pl-[3px] text-sm text-color-heading">
                      <Clock className="size-3" />
                      {searchQuery.trim() ? 'Search Results' : 'Recent Chats'}
                    </div>
                    
                    {filteredChats.length === 0 ? (
                      <div className="py-4 text-center">
                        {searchQuery.trim() ? (
                          <div>
                            <p className="text-sm text-muted-foreground mb-2">
                              No chats found for &ldquo;{searchQuery}&rdquo;
                            </p>
                            <button
                              onClick={handleNewChat}
                              className="inline-flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              <Plus className="size-3" />
                              Create new chat with this topic
                            </button>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No conversations yet
                          </p>
                        )}
                      </div>
                    ) : (
                      <ul className="flex flex-col gap-0 text-sm text-muted-foreground">
                        {filteredChats.map((chat) => {
                          const isPublic = chat.visibility === "public";
                          const displayTitle = chat.title || "Untitled Chat";
                          
                          return (
                            <li key={chat._id}>
                              <button
                                onClick={() => handleChatClick(chat._id)}
                                className="w-full text-left block rounded-md px-2.5 py-2 hover:bg-accent/30 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 transition-colors"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    {isPublic ? (
                                      <Globe className="size-3 text-blue-500 flex-shrink-0" />
                                    ) : (
                                      <Lock className="size-3 text-muted-foreground/60 flex-shrink-0" />
                                    )}
                                    <span className="truncate">{displayTitle}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground/50">
                                    <span>
                                      {formatDistanceToNow(new Date(chat.updatedAt), { addSuffix: true })}
                                    </span>
                                    <ArrowRight className="size-3" />
                                  </div>
                                </div>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}

                    {/* New Chat Option */}
                    {searchQuery.trim() && (
                      <div className="border-t border-border/50 pt-2 mt-2">
                        <button
                          onClick={handleNewChat}
                          className="w-full text-left block rounded-md px-2.5 py-2 hover:bg-accent/30 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Plus className="size-3 text-blue-500" />
                            <span className="text-sm">
                              Start new chat: &ldquo;{searchQuery.trim().slice(0, 30)}{searchQuery.trim().length > 30 ? '...' : ''}&rdquo;
                            </span>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
} 