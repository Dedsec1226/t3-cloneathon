import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Globe, Book, Youtube, MessageCircle, BarChart3, Hash } from 'lucide-react';
import { RedditLogo, XLogo } from '@phosphor-icons/react';

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
  { id: 'web', name: 'Web', icon: Globe, description: 'Search the web', show: false },
  { id: 'academic', name: 'Academic', icon: Book, description: 'Academic research', show: true },
  { id: 'youtube', name: 'YouTube', icon: Youtube, description: 'YouTube videos', show: true },
  { id: 'reddit', name: 'Reddit', icon: RedditLogo, description: 'Reddit discussions', show: true },
  { id: 'x', name: 'X', icon: XLogo, description: 'X (Twitter) posts', show: true },
  { id: 'analysis', name: 'Analytics', icon: BarChart3, description: 'Data analysis', show: true },
  { id: 'memory', name: 'Memory', icon: Hash, description: 'Personal memory', show: true, requireAuth: true },
];

export function invalidateChatsCache() {
  // Placeholder implementation for cache invalidation
  console.log('Cache invalidated');
} 