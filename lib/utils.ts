import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Book, Youtube, MessageCircle, BarChart3, Brain, MessageSquare } from 'lucide-react';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type SearchGroupId = 'web' | 'academic' | 'youtube' | 'reddit' | 'x' | 'analysis' | 'extreme' | 'memory' | null;

export interface SearchGroup {
  id: SearchGroupId;
  name: string;
  icon: any;
  description: string;
  show: boolean;
  requireAuth?: boolean;
}

export const searchGroups: SearchGroup[] = [
  { id: 'academic', name: 'Academic', icon: Book, description: 'Academic research', show: true },
  { id: 'youtube', name: 'YouTube', icon: Youtube, description: 'YouTube videos', show: true },
  { id: 'reddit', name: 'Reddit', icon: MessageCircle, description: 'Reddit discussions', show: true },
  { id: 'x', name: 'X', icon: MessageSquare, description: 'X (Twitter) posts', show: true },
  { id: 'analysis', name: 'Analytics', icon: BarChart3, description: 'Data analysis', show: true },

  { id: 'memory', name: 'Memory', icon: Brain, description: 'Personal AI memory', show: true, requireAuth: true },
];

export function invalidateChatsCache() {
  // Placeholder implementation for cache invalidation
  console.log('Cache invalidated');
} 