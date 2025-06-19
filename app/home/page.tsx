"use client";

import { Suspense, lazy } from 'react';
import Sidebar from '@/components/Sidebar';
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

// Simple loading component with spinner
const LoadingFallback = () => (
    <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
            <p className="text-sm text-muted-foreground">Loading chat interface...</p>
        </div>
    </div>
);

const Home = () => {
    // Sidebar is fixed and overlays content, so do not include it in a flex layout
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
        <>
            <Sidebar />
            <div className="min-h-screen">
                <Suspense fallback={<LoadingFallback />}>
                    <ChatInterface />
                </Suspense>
            </div>
        </>
    );
};

export default Home;