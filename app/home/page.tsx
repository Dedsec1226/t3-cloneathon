"use client";

import { Suspense, lazy, useState, useEffect } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useSidebarStore } from '@/lib/sidebar-store';
import { useUser } from '@clerk/nextjs';
import { useCreateChat } from '@/hooks/use-convex-chat';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// Lazy load the ChatInterface component to reduce initial bundle size
const ChatInterface = lazy(() => import('@/components/chat-interface').then(module => ({
    default: module.ChatInterface
})));

// Immediate loading skeleton that shows instantly
const InstantLoadingSkeleton = () => (
    <div className="flex h-screen flex-col bg-background">
        <TooltipProvider>
            {/* Simple skeleton navbar */}
            <div className="fixed top-0 left-0 right-0 z-30 flex justify-between items-center p-3 bg-background/95 backdrop-blur-sm">
                <div className="flex-1" />
                <div className="h-8 bg-secondary/50 rounded-lg w-24 animate-pulse"></div>
                <div className="flex-1 flex justify-end">
                    <div className="h-8 w-8 bg-secondary/50 rounded-full animate-pulse"></div>
                </div>
            </div>
            <div className="flex flex-1 flex-col bg-gradient-to-br from-background to-background/95 pt-16">
                <div className="flex flex-1 flex-col">
                    <div className="flex items-center justify-center flex-1 px-4">
                        <div className="w-full max-w-3xl mx-auto">
                            {/* Welcome message skeleton */}
                            <div className="text-center mb-8">
                                <div className="h-8 bg-secondary/50 rounded-lg w-64 mx-auto mb-4 animate-pulse"></div>
                                <div className="h-4 bg-secondary/30 rounded w-48 mx-auto animate-pulse"></div>
                            </div>
                            
                            {/* Category buttons skeleton */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <div key={i} className="h-12 bg-secondary/40 rounded-lg animate-pulse"></div>
                                ))}
                            </div>
                            
                            {/* Sample questions skeleton */}
                            <div className="space-y-2 mb-8">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="h-8 bg-secondary/30 rounded-md animate-pulse"></div>
                                ))}
                            </div>
                            
                            {/* Search input skeleton */}
                            <div className="h-12 bg-secondary/50 rounded-lg animate-pulse"></div>
                        </div>
                    </div>
                </div>
            </div>
        </TooltipProvider>
    </div>
);

// Enhanced loading component with better UX
const LoadingFallback = () => (
    <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
            <p className="text-sm text-muted-foreground">Loading chat interface...</p>
        </div>
    </div>
);

const Home = () => {
    const [showInstantUI, setShowInstantUI] = useState(true);
    const { toggleSidebar } = useSidebarStore();
    const { user } = useUser();
    const createChat = useCreateChat();
    const router = useRouter();

    // Show instant UI for a brief moment, then load the full component
    useEffect(() => {
        const timer = setTimeout(() => {
            setShowInstantUI(false);
        }, 100); // Show instant UI for 100ms to ensure immediate render

        return () => clearTimeout(timer);
    }, []);

    // Keyboard shortcuts implementation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Cmd+K for search (will be handled by ChatInterface when loaded)
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                // Search functionality is handled by ChatInterface component
                return;
            }

            // Cmd+Shift+O for new chat
            if (e.key === 'O' && e.shiftKey && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleNewChat();
                return;
            }

            // Cmd+B for toggle sidebar
            if (e.key === 'b' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                toggleSidebar();
                return;
            }
        };

        const handleNewChat = async () => {
            if (!user) {
                toast.error("Please sign in to create a new chat");
                return;
            }

            try {
                const chatId = await createChat({
                    title: "New Conversation",
                    userId: user.id,
                    visibility: "private"
                });
                
                toast.success("New chat created!");
                router.push(`/search/${chatId}`);
            } catch (error) {
                console.error("Error creating new chat:", error);
                toast.error("Failed to create new chat");
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [user, createChat, router, toggleSidebar]);

    // Show instant skeleton first for immediate perceived performance
    if (showInstantUI) {
        return <InstantLoadingSkeleton />;
    }

    return (
        <Suspense fallback={<LoadingFallback />}>
            <ChatInterface />
        </Suspense>
    );
};

export default Home;