"use client";

import { Suspense, lazy } from 'react';

// Lazy load the ChatInterface component to reduce initial bundle size
const ChatInterface = lazy(() => import('@/components/chat-interface').then(module => ({
    default: module.ChatInterface
})));

// Loading component to show while ChatInterface is loading
const LoadingFallback = () => (
    <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
    </div>
);

const Home = () => {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <ChatInterface />
        </Suspense>
    );
};

export default Home;