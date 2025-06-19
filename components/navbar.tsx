/* eslint-disable @next/next/no-img-element */
import React, { useState, memo, useEffect } from 'react';
import { Globe, Lock, Copy, Check, Cpu, MessageCircle, Book, Youtube, BarChart3, Brain, Telescope } from 'lucide-react';
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
import { Linkedin, MessageCircle, Share, MessageSquare } from 'lucide-react';
import { ClassicLoader } from '@/components/ui/loading';
import { AnimatePresence, motion } from 'framer-motion';
import { Message } from 'ai';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { SearchGroup, SearchGroupId, searchGroups } from '@/lib/utils';

// Route icon component for group selector
const RouteIcon = ({ size = 14, className }: { size?: number; className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="6" cy="19" r="3"/>
        <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/>
        <circle cx="18" cy="5" r="3"/>
    </svg>
);

type VisibilityType = 'public' | 'private';

interface NavbarProps {
    isDialogOpen: boolean;
    chatId: string;
    selectedVisibilityType: VisibilityType;
    onVisibilityChange: (visibility: VisibilityType) => Promise<void>;
    status: 'submitted' | 'streaming' | 'ready' | 'error';
    user: User | null;
    onHistoryClick: () => void;
    isOwner?: boolean;
    selectedModel: string;
    setSelectedModel: (model: string) => void;
    selectedGroup?: SearchGroupId;
    setSelectedGroup?: (group: SearchGroupId) => void;
}

const Navbar = memo(({
    isDialogOpen,
    chatId,
    selectedVisibilityType,
    onVisibilityChange,
    status,
    user,
    onHistoryClick,
    isOwner = true,
    selectedModel,
    setSelectedModel,
    selectedGroup = null,
    setSelectedGroup
}: NavbarProps) => {
    const [mounted, setMounted] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [privateDropdownOpen, setPrivateDropdownOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isChangingVisibility, setIsChangingVisibility] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

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
        if (!chatId || !shareUrl) return;
        const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        window.open(linkedInUrl, '_blank', 'noopener,noreferrer');
    };

    const handleShareTwitter = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!chatId || !shareUrl) return;
        const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}`;
        window.open(twitterUrl, '_blank', 'noopener,noreferrer');
    };

    const handleShareReddit = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!chatId || !shareUrl) return;
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

    // Define the actual group selector IDs
    const actualGroupIds = ['academic', 'youtube', 'reddit', 'x', 'analysis', 'memory'];

    // Prevent hydration mismatch by not rendering theme-dependent content until mounted
    if (!mounted) {
        return (
            <motion.div 
                className="fixed top-0 left-0 right-0 navbar-layer flex justify-between items-center p-3 bg-background fix-hit-testing"
            >
                <div className="flex-1" />
                <div className="flex items-center justify-center">
                    {/* Placeholder content during hydration */}
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8" /> {/* Group selector placeholder */}
                    <div className="w-8 h-8" /> {/* Theme toggle placeholder */}
                    <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700" /> {/* User profile placeholder */}
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div 
            className="fixed top-0 left-0 right-0 navbar-layer flex justify-between items-center p-3 bg-background fix-hit-testing"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{ opacity: 1 }}
        >
            {/* Left side spacer */}
            <div className="flex-1" />
            
            {/* Center content - privacy/sharing controls */}
            <div className="flex-1 flex justify-center items-center">
                {isOwner && (
                    <AnimatePresence>
                        <motion.div
                            className="flex items-center gap-3"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.2 }}
                            style={{ opacity: 1 }}
                        >
                                {selectedVisibilityType === 'public' ? (
                                <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="secondary"
                                            className="rounded-lg pointer-events-auto flex items-center gap-2 px-4 py-2 text-sm bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all duration-75 focus:outline-none! focus:ring-0!"
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
                                            <header className="text-center">
                                                <h4 className="text-sm font-semibold">
                                                    {chatId ? 'Share Conversation' : 'Public Chat Mode'}
                                                </h4>
                                                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                                                    {chatId ? 'This conversation is public' : 'New messages will be public'}
                                                </p>
                                                </header>

                                            <div className="flex items-center gap-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg p-3 border">
                                                <div className="truncate flex-1 text-xs text-neutral-600 dark:text-neutral-400 font-mono">
                                                    {chatId ? shareUrl : 'Share URL will be available after sending your first message'}
                                                    </div>
                                                    <Button
                                                    size="sm"
                                                        variant="ghost"
                                                    className="h-8 px-2 focus:outline-none"
                                                        onClick={handleCopyLink}
                                                        title="Copy to clipboard"
                                                    disabled={!chatId}
                                                    >
                                                        {copied ? (
                                                            <Check size={14} className="text-green-500" />
                                                        ) : (
                                                            <Copy size={14} />
                                                        )}
                                                    </Button>
                                                </div>

                                            <div className="text-center space-y-3">
                                                <p className="text-xs text-neutral-500 dark:text-neutral-400">Share on social media</p>

                                                <div className="flex justify-center gap-3">
                                                        <Button
                                                            variant="outline"
                                                        size="sm"
                                                        className="h-9 w-9 focus:outline-none"
                                                            onClick={handleShareLinkedIn}
                                                            title="Share on LinkedIn"
                                                        disabled={!chatId}
                                                        >
                                                        <Linkedin size={16} />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                        size="sm"
                                                        className="h-9 w-9 focus:outline-none"
                                                            onClick={handleShareTwitter}
                                                        title="Share on X"
                                                        disabled={!chatId}
                                                        >
                                                        <MessageSquare size={16} />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                        size="sm"
                                                        className="h-9 w-9 focus:outline-none"
                                                            onClick={handleShareReddit}
                                                            title="Share on Reddit"
                                                        disabled={!chatId}
                                                        >
                                                        <MessageCircle size={16} />
                                                        </Button>
                                                </div>
                                                
                                                {!chatId && (
                                                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                                                        <p className="text-sm text-blue-800 dark:text-blue-200">
                                                            Your next message will start a public conversation that can be shared with others.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="text-center">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-xs focus:outline-none"
                                                    onClick={() => handleVisibilityChange('private')}
                                                    disabled={isChangingVisibility}
                                                >
                                                    <Lock size={12} className="mr-1" />
                                                    Make Private
                                                </Button>
                                            </div>
                                        </motion.div>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                ) : (
                                <DropdownMenu open={privateDropdownOpen} onOpenChange={setPrivateDropdownOpen}>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="secondary"
                                        className="rounded-lg pointer-events-auto flex items-center gap-2 px-4 py-2 text-sm bg-[#fbe4f4] dark:bg-black/40 border border-[#f3c6e4] dark:border-neutral-700 hover:bg-[#f8d7e8] dark:hover:bg-black/60 transition-all duration-75 focus:outline-none! focus:ring-0!"
                                                disabled={isChangingVisibility}
                                            >
                                                {isChangingVisibility ? (
                                                    <>
                                                        <ClassicLoader size="sm" className="text-[#b83268] dark:text-violet-300" />
                                                    <span className="text-sm font-medium text-[#b83268] dark:text-violet-300">Saving...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Lock size={16} className="text-[#b83268] dark:text-violet-300" />
                                                    <span className="text-sm font-medium text-[#b83268] dark:text-violet-300">Private</span>
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
                                                <h4 className="text-sm font-semibold">
                                                    {chatId ? 'Make Public' : 'Private Chat Mode'}
                                                </h4>
                                                </header>

                                            <div className="text-center space-y-3">
                                                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                                    {chatId 
                                                        ? 'Making this conversation public will allow anyone with the link to view it.'
                                                        : 'Your messages will be private and only visible to you.'
                                                    }
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
                                                        {chatId ? 'Make Public' : 'Switch to Public'}
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

            {/* Right side - group selector, settings, theme toggle and user profile */}
            <div className="flex-1 flex justify-end items-center gap-3">
                {/* Group Selector - simple text display */}
                {setSelectedGroup && selectedGroup && actualGroupIds.includes(selectedGroup) && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setSelectedGroup(null);
                                    toast.success('Chat Mode: Default chat mode');
                                }}
                                className="flex items-center px-3 py-1.5 rounded-md bg-[#fbe4f4] dark:bg-black/40 backdrop-blur-sm hover:bg-[#f8d7e8] dark:hover:bg-black/60 transition-all duration-200 cursor-pointer"
                            >
                                <span className="text-sm font-medium text-[#b83268] dark:text-pink-200">
                                    {searchGroups.find(g => g.id === selectedGroup)?.name || 'Unknown Mode'}
                                </span>
                            </button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="text-white">Click to return to Chat Mode</p>
                        </TooltipContent>
                    </Tooltip>
                )}

                {/* Settings and theme toggle group - always visible and clickable */}
                <div className="force-pointer-events relative z-50 fix-hit-testing">
                    <div className="flex flex-row items-center gap-0.5 rounded-md p-1 transition-all bg-[#fbe4f4] dark:bg-black/40 backdrop-blur-sm">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <a aria-label="Go to settings" role="button" data-state="closed" href="/settings" data-discover="true">
                                    <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-black/10 dark:hover:bg-white/10 disabled:hover:bg-transparent disabled:hover:text-foreground/50 size-8 text-[#b83268] dark:text-pink-200">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4">
                                            <path d="M20 7h-9"></path>
                                            <path d="M14 17H5"></path>
                                            <circle cx="17" cy="17" r="3"></circle>
                                            <circle cx="7" cy="7" r="3"></circle>
                                        </svg>
                                    </button>
                                </a>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="text-white">Settings</p>
                            </TooltipContent>
                        </Tooltip>
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