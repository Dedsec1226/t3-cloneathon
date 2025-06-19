"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useUserChats, useDeleteChat, useUpdateChatTitle } from "@/hooks/use-convex-chat";
import { useTheme } from "next-themes";
import { Globe, Lock, MessageSquare, Trash2, MoreHorizontal, Pencil, Check, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";

interface ChatListProps {
  searchQuery: string;
}

interface Chat {
  _id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  visibility: "public" | "private";
  userId: string;
}

export default function ChatList({ searchQuery }: ChatListProps) {
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // State for managing delete and edit operations
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  // Get user chats and mutations - include forceRefreshKey to force refresh when needed
  const chatsResponse = useUserChats(user?.id || null, 20);
  const deleteChat = useDeleteChat();
  const updateChatTitle = useUpdateChatTitle();
  
  const [mounted, setMounted] = useState(false);
  const [forceRefreshKey, setForceRefreshKey] = useState(0);
  const [deletingChats, setDeletingChats] = useState<Set<string>>(new Set());

  useEffect(() => setMounted(true), []);

  // Debug: Log when chats data changes
  useEffect(() => {
    console.log('ChatList: chatsResponse updated', {
      chatsCount: chatsResponse?.chats?.length || 0,
      hasChats: !!chatsResponse?.chats,
      forceRefreshKey,
      userId: user?.id
    });
  }, [chatsResponse, forceRefreshKey, user?.id]);

  // Listen for chat deletion events from other components
  useEffect(() => {
    const handleChatDeleted = (event: CustomEvent) => {
      console.log('ChatList: Received chat deleted event', event.detail);
      setForceRefreshKey(prev => prev + 1);
      // Remove from deleting set if it was there
      setDeletingChats(prev => {
        const newSet = new Set(prev);
        newSet.delete(event.detail.chatId);
        return newSet;
      });
    };

    window.addEventListener('chat-deleted', handleChatDeleted as EventListener);
    return () => {
      window.removeEventListener('chat-deleted', handleChatDeleted as EventListener);
    };
  }, []);

  // Create a memoized filteredChats that updates when forceRefreshKey changes
  const filteredChats = useMemo(() => {
    if (!chatsResponse?.chats || !Array.isArray(chatsResponse.chats)) return [];
    
    // Include forceRefreshKey in dependency to force re-computation
    const chats = chatsResponse.chats;
    
    // Filter out chats that are currently being deleted
    const nonDeletingChats = chats.filter((chat: Chat) => !deletingChats.has(chat._id));
    
    if (!searchQuery.trim()) return nonDeletingChats;
    
    const query = searchQuery.toLowerCase();
    return nonDeletingChats.filter((chat: Chat) => 
      chat.title.toLowerCase().includes(query)
    );
  }, [chatsResponse?.chats, searchQuery, forceRefreshKey, deletingChats]);

  // Get current chat ID from pathname
  const currentChatId = pathname?.startsWith('/search/') ? pathname.split('/')[2] : null;

  const handleChatClick = (chatId: string) => {
    if (deletingChatId === chatId || editingChatId === chatId) return;
    router.push(`/search/${chatId}`);
  };

  // Handle chat deletion
  const handleDeleteChat = useCallback((e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    setDeletingChatId(chatId);
  }, []);

  const confirmDeleteChat = useCallback(async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    try {
      console.log('Deleting chat:', chatId);
      
      // Add to deleting set for optimistic UI
      setDeletingChats(prev => new Set(prev).add(chatId));
      
      // Show optimistic UI by hiding the deleted chat immediately
      const deletedChatElement = document.querySelector(`[data-chat-id="${chatId}"]`) as HTMLElement;
      if (deletedChatElement) {
        deletedChatElement.style.opacity = '0.5';
        deletedChatElement.style.pointerEvents = 'none';
      }
      
      await deleteChat({ chatId: chatId as Id<"chats"> });
      
      // Success feedback
      toast.success("Chat deleted successfully");
      setDeletingChatId(null);
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('chat-deleted', { 
        detail: { chatId } 
      }));
      
      // Redirect to home if deleting current chat
      if (currentChatId === chatId) {
        router.push('/');
      }
      
      // Force a re-render by updating the refresh key
      setForceRefreshKey(prev => prev + 1);
      
      // Additional fallback: Force component re-render after a delay
      setTimeout(() => {
        setForceRefreshKey(prev => prev + 1);
        setDeletingChats(prev => {
          const newSet = new Set(prev);
          newSet.delete(chatId);
          return newSet;
        });
        console.log('Chat deletion completed, forced refresh');
      }, 500);
      
    } catch (error) {
      console.error("Failed to delete chat:", error);
      toast.error("Failed to delete chat. Please try again.");
      setDeletingChatId(null);
      
      // Remove from deleting set on error
      setDeletingChats(prev => {
        const newSet = new Set(prev);
        newSet.delete(chatId);
        return newSet;
      });
      
      // Restore the UI if deletion failed
      const deletedChatElement = document.querySelector(`[data-chat-id="${chatId}"]`) as HTMLElement;
      if (deletedChatElement) {
        deletedChatElement.style.opacity = '1';
        deletedChatElement.style.pointerEvents = 'auto';
      }
    }
  }, [deleteChat, currentChatId, router]);

  const cancelDeleteChat = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingChatId(null);
  }, []);

  // Handle title editing
  const handleEditTitle = useCallback((e: React.MouseEvent, chatId: string, currentTitle: string) => {
    e.stopPropagation();
    setEditingChatId(chatId);
    setEditingTitle(currentTitle || "");
  }, []);

  const saveEditedTitle = useCallback(async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    
    if (!editingTitle.trim()) {
      toast.error("Title cannot be empty");
      return;
    }

    if (editingTitle.trim().length > 100) {
      toast.error("Title is too long (max 100 characters)");
      return;
    }

    try {
      console.log('Updating chat title:', chatId, editingTitle.trim());
      await updateChatTitle({ 
        chatId: chatId as Id<"chats">, 
        title: editingTitle.trim() 
      });
      toast.success("Chat title updated");
      setEditingChatId(null);
      setEditingTitle("");
    } catch (error) {
      console.error("Failed to update title:", error);
      toast.error("Failed to update title. Please try again.");
    }
  }, [editingTitle, updateChatTitle]);

  const cancelEditTitle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingChatId(null);
    setEditingTitle("");
  }, []);

  const handleTitleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>, chatId: string) => {
    if (e.key === 'Enter') {
      saveEditedTitle(e as unknown as React.MouseEvent, chatId);
    } else if (e.key === 'Escape') {
      cancelEditTitle(e as unknown as React.MouseEvent);
    }
  }, [saveEditedTitle, cancelEditTitle]);

  const generateUniqueTitle = (content: string): string => {
    if (!content || content.trim().length === 0) {
      return "New Conversation";
    }

    // Take first meaningful words from the content
    const words = content
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 2)
      .slice(0, 4);
    
    if (words.length === 0) {
      return "New Conversation";
    }

    let title = words.join(" ");
    
    // Capitalize first letter
    title = title.charAt(0).toUpperCase() + title.slice(1);
    
    // Limit to 50 characters
    if (title.length > 50) {
      title = title.substring(0, 47) + "...";
    }
    
    return title;
  };

  if (!mounted) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-10 bg-black/10 dark:bg-white/10 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <MessageSquare className={`h-8 w-8 mx-auto mb-2 ${isDark ? 'text-pink-200/50' : 'text-[#b83268]/50'}`} />
        <p className={`text-sm ${isDark ? 'text-pink-200/70' : 'text-[#b83268]/70'}`}>
          Sign in to view your chats
        </p>
      </div>
    );
  }

  if (!chatsResponse?.chats || chatsResponse.chats.length === 0) {
    return (
      <div className="text-center py-8">
        <MessageSquare className={`h-8 w-8 mx-auto mb-2 ${isDark ? 'text-pink-200/50' : 'text-[#b83268]/50'}`} />
        <p className={`text-sm ${isDark ? 'text-pink-200/70' : 'text-[#b83268]/70'}`}>
          No conversations yet
        </p>
        <p className={`text-xs mt-1 ${isDark ? 'text-pink-200/50' : 'text-[#b83268]/50'}`}>
          Start a new chat to begin
        </p>
      </div>
    );
  }

  if (filteredChats.length === 0 && searchQuery.trim()) {
    return (
      <div className="text-center py-8">
        <MessageSquare className={`h-8 w-8 mx-auto mb-2 ${isDark ? 'text-pink-200/50' : 'text-[#b83268]/50'}`} />
        <p className={`text-sm ${isDark ? 'text-pink-200/70' : 'text-[#b83268]/70'}`}>
          No chats found
        </p>
        <p className={`text-xs mt-1 ${isDark ? 'text-pink-200/50' : 'text-[#b83268]/50'}`}>
          Try a different search term
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1 overflow-y-auto max-h-full">
      {filteredChats.map((chat: Chat) => {
        const isActive = currentChatId === chat._id;
        const isPublic = chat.visibility === "public";
        const isDeleting = deletingChatId === chat._id;
        const isEditing = editingChatId === chat._id;
        const displayTitle = chat.title || generateUniqueTitle("");
        
        return (
          <div
            key={chat._id}
            data-chat-id={chat._id}
            onClick={() => handleChatClick(chat._id)}
            className={cn(
              "group relative p-3 rounded-lg cursor-pointer transition-all duration-200",
              isActive
                ? isDark
                  ? "bg-pink-900/30 border border-pink-700/50"
                  : "bg-[#b83268]/10 border border-[#b83268]/30"
                : isDark
                ? "hover:bg-white/5 hover:border-white/10"
                : "hover:bg-black/5 hover:border-[#b83268]/20",
              "border border-transparent",
              isDeleting && "bg-destructive/10 border border-destructive/20",
              isEditing && "bg-muted/50 border border-muted-foreground/20"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {isPublic ? (
                    <Globe className={`h-3 w-3 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  ) : (
                    <Lock className={`h-3 w-3 ${isDark ? 'text-pink-200/60' : 'text-[#b83268]/60'}`} />
                  )}
                  
                  {isEditing ? (
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyDown={(e) => handleTitleKeyPress(e, chat._id)}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 bg-transparent border-none outline-none focus:outline-none text-sm font-medium"
                      placeholder="Enter title..."
                      autoFocus
                      maxLength={100}
                    />
                  ) : (
                    <span
                      className={cn(
                        "text-sm font-medium truncate",
                        isActive
                          ? isDark ? "text-pink-200" : "text-[#b83268]"
                          : isDark ? "text-gray-200" : "text-[#b83268]",
                        isDeleting && "text-foreground/70"
                      )}
                    >
                      {isDeleting ? `Delete "${displayTitle}"?` : displayTitle}
                    </span>
                  )}
                </div>
                <p className={`text-xs ${isDark ? 'text-pink-200/50' : 'text-[#b83268]/50'}`}>
                  {formatDistanceToNow(new Date(chat.updatedAt), { addSuffix: true })}
                </p>
              </div>
              
              {/* Action buttons */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {isDeleting ? (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => confirmDeleteChat(e, chat._id)}
                      disabled={deletingChats.has(chat._id)}
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-muted-foreground"
                      onClick={cancelDeleteChat}
                      disabled={deletingChats.has(chat._id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </>
                ) : isEditing ? (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-green-600 hover:text-green-600 hover:bg-green-600/10"
                      onClick={(e) => saveEditedTitle(e, chat._id)}
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-muted-foreground"
                      onClick={cancelEditTitle}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem
                        onClick={(e) => handleEditTitle(e, chat._id, chat.title)}
                        className="text-sm"
                      >
                        <Pencil className="h-3 w-3 mr-2" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => handleDeleteChat(e, chat._id)}
                        className={cn(
                          "text-sm text-destructive focus:text-destructive",
                          "dark:text-red-400 dark:focus:text-red-400 dark:hover:bg-red-500/10"
                        )}
                      >
                        <Trash2 className="h-3 w-3 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
} 