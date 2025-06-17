/* eslint-disable @next/next/no-img-element */
import React, { useState, memo } from 'react';
import { Globe, Lock, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { UserProfile } from '@/components/user-profile';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';
import { User } from '@/lib/db/schema';
import { LinkedinLogo, RedditLogo, Share, XLogo } from '@phosphor-icons/react';
import { ClassicLoader } from '@/components/ui/loading';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from '@/components/ui/theme-toggle';

type VisibilityType = 'public' | 'private';

interface NavbarProps {
    isDialogOpen: boolean;
    chatId: string | null;
    selectedVisibilityType: VisibilityType;
    onVisibilityChange: (visibility: VisibilityType) => void | Promise<void>;
    status: string;
    user: User | null;
    onHistoryClick: () => void;
    isOwner?: boolean;
}

const Navbar = memo(({
    isDialogOpen,
    chatId,
    selectedVisibilityType,
    onVisibilityChange,
    status,
    user,
    onHistoryClick,
    isOwner = true
}: NavbarProps) => {
    const [copied, setCopied] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [privateDropdownOpen, setPrivateDropdownOpen] = useState(false);
    const [isChangingVisibility, setIsChangingVisibility] = useState(false);

    const handleCopyLink = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!chatId) return;

        const url = `https://t3.ai/search/${chatId}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success("Link copied to clipboard");

        setTimeout(() => setCopied(false), 2000);
    };

    // Generate the share URL
    const shareUrl = chatId ? `https://t3.ai/search/${chatId}` : '';

    // Social media share handlers
    const handleShareLinkedIn = (e: React.MouseEvent) => {
        e.preventDefault();
        const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        window.open(linkedInUrl, '_blank', 'noopener,noreferrer');
    };

    const handleShareTwitter = (e: React.MouseEvent) => {
        e.preventDefault();
        const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}`;
        window.open(twitterUrl, '_blank', 'noopener,noreferrer');
    };

    const handleShareReddit = (e: React.MouseEvent) => {
        e.preventDefault();
        const redditUrl = `https://www.reddit.com/submit?url=${encodeURIComponent(shareUrl)}`;
        window.open(redditUrl, '_blank', 'noopener,noreferrer');
    };

    const handleVisibilityChange = async (newVisibility: VisibilityType) => {
        setIsChangingVisibility(true);
        try {
            await onVisibilityChange(newVisibility);
            // If changing from private to public, open the public dropdown immediately
            if (newVisibility === 'public') {
                setDropdownOpen(true);
            }
        } finally {
            setIsChangingVisibility(false);
            setPrivateDropdownOpen(false);
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            style={{ opacity: 1 }}
            className={cn(
            "fixed top-0 left-0 right-0 z-30 flex justify-between items-center p-3 transition-colors duration-200",
            isDialogOpen
                ? "bg-transparent pointer-events-none"
                : (status === "streaming" || status === 'ready'
                    ? "bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/60"
                    : "bg-background")
            )}
        >
            {/* Empty left side for balance */}
            <div className="flex-1" />
            
            {/* Center content */}
            <div className="flex items-center justify-center">
                {/* Only show visibility controls if there's a chatId and user is authenticated */}
                {chatId && user && isOwner && (
                    <AnimatePresence>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.2 }}
                            style={{ opacity: 1 }}
                        >
                                {selectedVisibilityType === 'public' ? (
                                    /* Public chat - show dropdown for copying link */
                                    <DropdownMenu open={dropdownOpen} onOpenChange={!isChangingVisibility ? setDropdownOpen : undefined}>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="secondary"
                                            className="rounded-lg pointer-events-auto flex items-center gap-2 px-4 py-2 text-sm bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all duration-200 focus:outline-none! focus:ring-0!"
                                                disabled={isChangingVisibility}
                                            >
                                                {isChangingVisibility ? (
                                                    <>
                                                    <ClassicLoader size="sm" className="text-blue-600 dark:text-blue-400" />
                                                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Saving...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                    <Globe size={16} className="text-blue-600 dark:text-blue-400" />
                                                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Public</span>
                                                    </>
                                                )}
                                            </Button>
                                        </DropdownMenuTrigger>
                                    <DropdownMenuContent align="center" className="w-80 p-4">
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.2 }}
                                            style={{ opacity: 1 }}
                                            className="space-y-4"
                                        >
                                                <header className="flex justify-between items-center">
                                                <h4 className="text-sm font-semibold">Share Link</h4>
                                                    <div className="flex gap-2">
                                                        <Button
                                                        variant="outline"
                                                            size="sm"
                                                        className="h-8 text-xs focus:outline-none"
                                                            onClick={() => handleVisibilityChange('private')}
                                                            disabled={isChangingVisibility}
                                                        >
                                                            <Lock size={12} className="mr-1" />
                                                            Make Private
                                                        </Button>
                                                    </div>
                                                </header>

                                            <div className="flex items-center gap-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg p-3 border">
                                                <div className="truncate flex-1 text-xs text-neutral-600 dark:text-neutral-400 font-mono">
                                                        {shareUrl}
                                                    </div>
                                                    <Button
                                                    size="sm"
                                                        variant="ghost"
                                                    className="h-8 px-2 focus:outline-none"
                                                        onClick={handleCopyLink}
                                                        title="Copy to clipboard"
                                                    >
                                                        {copied ? (
                                                            <Check size={14} className="text-green-500" />
                                                        ) : (
                                                            <Copy size={14} />
                                                        )}
                                                    </Button>
                                                </div>

                                            <div className="text-center">
                                                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
                                                    Anyone with this link can view this conversation
                                                        </p>

                                                <div className="flex justify-center gap-2">
                                                        {typeof navigator !== 'undefined' && 'share' in navigator && (
                                                            <Button
                                                                variant="outline"
                                                            size="sm"
                                                            className="h-9 w-9 focus:outline-none"
                                                                onClick={() => {
                                                                    navigator.share({
                                                                    title: 'Shared Conversation',
                                                                        url: shareUrl
                                                                    }).catch(console.error);
                                                                }}
                                                            >
                                                            <Share size={16} />
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="outline"
                                                        size="sm"
                                                        className="h-9 w-9 focus:outline-none"
                                                            onClick={handleShareLinkedIn}
                                                            title="Share on LinkedIn"
                                                        >
                                                        <LinkedinLogo size={16} />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                        size="sm"
                                                        className="h-9 w-9 focus:outline-none"
                                                            onClick={handleShareTwitter}
                                                        title="Share on X"
                                                        >
                                                        <XLogo size={16} />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                        size="sm"
                                                        className="h-9 w-9 focus:outline-none"
                                                            onClick={handleShareReddit}
                                                            title="Share on Reddit"
                                                        >
                                                        <RedditLogo size={16} />
                                                        </Button>
                                                    </div>
                                            </div>
                                        </motion.div>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                ) : (
                                    /* Private chat - dropdown prompt to make public */
                                    <DropdownMenu open={privateDropdownOpen} onOpenChange={!isChangingVisibility ? setPrivateDropdownOpen : undefined}>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="secondary"
                                            className="rounded-lg pointer-events-auto flex items-center gap-2 px-4 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-all duration-200 focus:outline-none"
                                                disabled={isChangingVisibility}
                                            >
                                                {isChangingVisibility ? (
                                                    <>
                                                        <ClassicLoader size="sm" className="text-neutral-500" />
                                                    <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Saving...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Lock size={16} className="text-neutral-500" />
                                                    <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Private</span>
                                                    </>
                                                )}
                                            </Button>
                                        </DropdownMenuTrigger>
                                    <DropdownMenuContent align="center" className="w-80 p-4">
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.2 }}
                                            style={{ opacity: 1 }}
                                            className="space-y-4"
                                        >
                                            <header className="text-center">
                                                <h4 className="text-sm font-semibold">Make Public</h4>
                                                </header>

                                            <div className="text-center space-y-3">
                                                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                                    Making this conversation public will allow anyone with the link to view it.
                                                    </p>
                                                
                                                <div className="flex justify-center gap-3 pt-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-xs focus:outline-none"
                                                        onClick={() => setPrivateDropdownOpen(false)}
                                                        disabled={isChangingVisibility}
                                                    >
                                                        Cancel
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        className="text-xs focus:outline-none bg-blue-600 hover:bg-blue-700"
                                                        onClick={() => handleVisibilityChange('public')}
                                                        disabled={isChangingVisibility}
                                                    >
                                                        <Globe size={12} className="mr-1" />
                                                        Make Public
                                                    </Button>
                                                </div>
                                            </div>
                                        </motion.div>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                        </motion.div>
                    </AnimatePresence>
                )}
            </div>

            {/* Right side - settings, theme toggle and user profile */}
            <div className="flex-1 flex justify-end items-center gap-3">
                {/* Settings and theme toggle group - always visible */}
                <div className="pointer-events-auto">
                    <div className="flex flex-row items-center bg-gradient-noise-top text-muted-foreground gap-0.5 rounded-md p-1 transition-all rounded-bl-xl">
                        <a aria-label="Go to settings" role="button" data-state="closed" href="/settings" data-discover="true">
                            <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-muted/40 hover:text-foreground disabled:hover:bg-transparent disabled:hover:text-foreground/50 size-8 rounded-bl-xl">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-settings2 size-4">
                                    <path d="M20 7h-9"></path>
                                    <path d="M14 17H5"></path>
                                    <circle cx="17" cy="17" r="3"></circle>
                                    <circle cx="7" cy="7" r="3"></circle>
                                </svg>
                            </button>
                        </a>
                        <ThemeToggle />
                    </div>
                </div>
                
                {/* User profile - only show if authenticated */}
                {user && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                        style={{ opacity: 1 }}
                    >
                <UserProfile user={user} />
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
});

Navbar.displayName = 'Navbar';

export { Navbar }; 