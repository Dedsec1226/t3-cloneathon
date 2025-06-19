"use client";

import { Suspense, lazy } from 'react';
import Sidebar from '@/components/Sidebar';
import { useSidebarStore } from '@/lib/sidebar-store';

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