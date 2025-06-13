import React from 'react';
import { User } from '@/lib/db/schema';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface UserProfileProps {
  user: User | null;
}

export function UserProfile({ user }: UserProfileProps) {
  if (!user) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="text-sm text-neutral-600 dark:text-neutral-400"
      >
        Anonymous
      </Button>
    );
  }

  const initials = user.name 
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <div className="flex items-center gap-2">
      <Avatar className="h-8 w-8">
        <AvatarImage src={user.image || undefined} alt={user.name || 'User'} />
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>
      <span className="text-sm text-neutral-600 dark:text-neutral-400 hidden sm:block">
        {user.name || 'User'}
      </span>
    </div>
  );
} 