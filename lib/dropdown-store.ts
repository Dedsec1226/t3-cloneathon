import { create } from 'zustand';

interface DropdownState {
  modelSelectorOpen: boolean;
  filterDropdownOpen: boolean;
  setModelSelectorOpen: (open: boolean) => void;
  setFilterDropdownOpen: (open: boolean) => void;
  toggleModelSelector: () => void;
  toggleFilterDropdown: () => void;
  closeAllDropdowns: () => void;
  forceModelSelectorOpen: () => void;
  handleFilterInteraction: () => void;
}

export const useDropdownStore = create<DropdownState>((set, get) => ({
  modelSelectorOpen: false,
  filterDropdownOpen: false,
  
  setModelSelectorOpen: (open: boolean) => 
    set({ modelSelectorOpen: open }),
  
  setFilterDropdownOpen: (open: boolean) => 
    set({ filterDropdownOpen: open }),
  
  toggleModelSelector: () => 
    set((state) => ({ 
      modelSelectorOpen: !state.modelSelectorOpen,
      // Close filter dropdown when opening model selector
      filterDropdownOpen: false 
    })),
  
  toggleFilterDropdown: () => 
    set((state) => {
      // Force model selector to stay open regardless of filter state
      return {
        filterDropdownOpen: !state.filterDropdownOpen,
        modelSelectorOpen: true // Force open
      };
    }),
  
  closeAllDropdowns: () => 
    set({ modelSelectorOpen: false, filterDropdownOpen: false }),
  
  forceModelSelectorOpen: () => 
    set({ modelSelectorOpen: true }),
  
  handleFilterInteraction: () => 
    set(() => ({
      modelSelectorOpen: true, // Force model selector to stay open
      filterDropdownOpen: true // Keep filter dropdown open too
    })),
})); 