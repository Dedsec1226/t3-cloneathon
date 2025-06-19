import { create } from 'zustand';

export interface Chat {
  _id: string;
  title: string;
  visibility: 'public' | 'private';
  updatedAt: number;
  userId: string;
}

interface ChatSearchState {
  // UI State
  isOpen: boolean;
  mounted: boolean;
  
  // Search State
  searchQuery: string;
  filteredChats: Chat[];
  
  // Data State
  chatsData: Chat[];
  isLoading: boolean;
  
  // Actions
  setIsOpen: (open: boolean) => void;
  setMounted: (mounted: boolean) => void;
  setSearchQuery: (query: string) => void;
  setChatsData: (chats: Chat[]) => void;
  setIsLoading: (loading: boolean) => void;
  updateFilteredChats: () => void;
  clearSearchState: () => void;
  openSearch: () => void;
  closeSearch: () => void;
}

export const useChatSearchStore = create<ChatSearchState>((set, get) => ({
  // Initial state
  isOpen: false,
  mounted: false,
  searchQuery: '',
  filteredChats: [],
  chatsData: [],
  isLoading: false,

  // Actions
  setIsOpen: (open: boolean) => set({ isOpen: open }),
  
  setMounted: (mounted: boolean) => set({ mounted }),
  
  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
    // Automatically update filtered chats when search query changes
    get().updateFilteredChats();
  },
  
  setChatsData: (chats: Chat[]) => {
    set({ chatsData: chats });
    // Update filtered chats when data changes
    get().updateFilteredChats();
  },
  
  setIsLoading: (loading: boolean) => set({ isLoading: loading }),
  
  updateFilteredChats: () => {
    const { chatsData, searchQuery } = get();
    
    if (!chatsData || chatsData.length === 0) {
      set({ filteredChats: [] });
      return;
    }
    
    if (!searchQuery.trim()) {
      // Return recent chats when no search query (top 10 most recent)
      const recentChats = [...chatsData]
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, 10);
      set({ filteredChats: recentChats });
      return;
    }

    // Filter chats based on search query
    const query = searchQuery.toLowerCase().trim();
    const filtered = chatsData
      .filter(chat => {
        const title = chat.title?.toLowerCase() || '';
        return title.includes(query);
      })
      .sort((a, b) => b.updatedAt - a.updatedAt);
    
    set({ filteredChats: filtered });
  },
  
  clearSearchState: () => set({ 
    searchQuery: '', 
    filteredChats: [],
    isLoading: false 
  }),
  
  openSearch: () => set({ isOpen: true }),
  
  closeSearch: () => {
    set({ 
      isOpen: false,
      searchQuery: '',
      filteredChats: []
    });
  },
})); 