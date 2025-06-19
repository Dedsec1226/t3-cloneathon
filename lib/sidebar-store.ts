import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface SidebarState {
  isOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      isOpen: true, // Default to open
      toggleSidebar: () => set((state) => ({ isOpen: !state.isOpen })),
      setSidebarOpen: (open: boolean) => set({ isOpen: open }),
    }),
    {
      name: 't3-sidebar-state', // Unique key for localStorage
      storage: createJSONStorage(() => localStorage), // Use localStorage for persistence
    }
  )
); 