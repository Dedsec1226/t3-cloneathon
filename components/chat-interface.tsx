"use client";
// Conditionally import KaTeX CSS only when needed


import { useChat, UseChatOptions } from '@ai-sdk/react';
import { UIMessage } from '@ai-sdk/ui-utils';
import { parseAsString, useQueryState } from 'nuqs';
import { toast } from 'sonner';
import React, {
    memo,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import FormComponent from '@/components/ui/form-component';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { cn, SearchGroupId } from '@/lib/utils';
import { getCurrentUser, suggestQuestions, updateChatVisibility } from '@/app/actions';
import Messages from '@/components/messages';
import { v4 as uuidv4 } from 'uuid';
import { User } from '@/lib/db/schema';
import { ChatHistoryDialog } from '@/components/chat-history-dialog';
import { useAutoResume } from '@/hooks/use-auto-resume';
import { useRouter } from 'next/navigation';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Navbar } from '@/components/navbar';

// import { SignInPromptDialog } from '@/components/sign-in-prompt-dialog';

interface Attachment {
    name: string;
    contentType: string;
    url: string;
    size: number;
}

interface ChatInterfaceProps {
    initialChatId?: string;
    initialMessages?: UIMessage[];
    initialVisibility?: 'public' | 'private';
    isOwner?: boolean;
}

const ChatInterface = memo(({ initialChatId, initialMessages, initialVisibility = 'private', isOwner = true }: ChatInterfaceProps): React.JSX.Element => {
    const router = useRouter();
    const [query] = useQueryState('query', parseAsString.withDefault(''))
    const [q] = useQueryState('q', parseAsString.withDefault(''))

    // Use localStorage hook directly for model selection with a default
    const [selectedModel, setSelectedModel] = useLocalStorage('t3-selected-model', 't3-4o');

    const initialState = useMemo(() => ({
        query: query || q,
    }), [query, q]);

    const lastSubmittedQueryRef = useRef(initialState.query);
    const bottomRef = useRef<HTMLDivElement>(null);
    const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const initializedRef = useRef(false);
    const [selectedGroup, setSelectedGroup] = useLocalStorage<SearchGroupId>('t3-selected-group-v2', null);
    const [selectedCategoryButton, setSelectedCategoryButton] = useState<string | null>(null);
    const [hasSubmitted, setHasSubmitted] = React.useState(false);
    
    const [hasManuallyScrolled, setHasManuallyScrolled] = useState(false);
    const [showScrollToBottom, setShowScrollToBottom] = useState(false);
    const isAutoScrollingRef = useRef(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [user, setUser] = useState<User | null>(null);

    // Generate random UUID once for greeting selection
    const greetingUuidRef = useRef<string>(uuidv4());

    // Memoized greeting to prevent flickering - default to fast generic greeting
    const personalizedGreeting = useMemo(() => {
        // Always return fast default initially
        if (!user?.name) return "What do you want to explore?";
        
        // Only calculate personalized greeting after user is loaded
        const firstName = user.name.trim().split(' ')[0];
        if (!firstName) return "What do you want to explore?";
        
        const greetings = [
            `Hey ${firstName}! Let's dive in!`,
            `${firstName}, what's the question?`,
            `Ready ${firstName}? Ask me anything!`,
            `Go ahead ${firstName}, I'm listening!`,
            `${firstName}, fire away!`,
            `What's cooking, ${firstName}?`,
            `${firstName}, let's explore together!`,
            `Hit me ${firstName}!`,
            `${firstName}, what's the mystery?`,
            `Shoot ${firstName}, what's up?`
        ];
        
        // Use user ID + random UUID for truly random but stable greeting
        const seed = user.id + greetingUuidRef.current;
        const seedHash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return greetings[seedHash % greetings.length];
    }, [user?.name, user?.id]);

    // Sign-in prompt dialog state
    // const [showSignInPrompt, setShowSignInPrompt] = useState(false);
    const [hasShownSignInPrompt, setHasShownSignInPrompt] = useLocalStorage('t3-signin-prompt-shown', false);
    const signInTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Generate a consistent ID for new chats
    const chatId = useMemo(() => initialChatId ?? uuidv4(), [initialChatId]);

    // COMPLETELY override toast library to prevent ANY error messages
    useEffect(() => {
        // Override toast.error globally to prevent any error toasts
        const originalToastError = toast.error;
        toast.error = (message: any, options?: any) => {
            console.warn("🔇 BLOCKED TOAST ERROR:", message, options);
            // Do nothing - completely block all error toasts
            return '' as any;
        };

        // Also handle global errors
        const handleGlobalError = (event: ErrorEvent) => {
            console.warn("🔇 Blocked global error:", event.message);
            event.preventDefault();
            event.stopPropagation();
            return false;
        };

        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            console.warn("🔇 Blocked unhandled rejection:", event.reason);
            event.preventDefault();
            return false;
        };

        window.addEventListener('error', handleGlobalError);
        window.addEventListener('unhandledrejection', handleUnhandledRejection);

        return () => {
            // Restore original toast.error when component unmounts
            toast.error = originalToastError;
            window.removeEventListener('error', handleGlobalError);
            window.removeEventListener('unhandledrejection', handleUnhandledRejection);
        };
    }, []);

    // Fetch user data in background without blocking render
    useEffect(() => {
        const fetchUser = async () => {
            try {
                // Use setTimeout to defer this operation after the next render
                setTimeout(async () => {
                    const userData = await getCurrentUser();
                    if (userData) {
                        setUser(userData as User);
                    }
                }, 0);
            } catch (error) {
                console.error("Error fetching user:", error);
            }
        };

        fetchUser();
    }, []);

    // Timer for sign-in prompt for unauthenticated users
    useEffect(() => {
        // If user becomes authenticated, reset the prompt flag and clear timer
        if (user) {
            if (signInTimerRef.current) {
                clearTimeout(signInTimerRef.current);
                signInTimerRef.current = null;
            }
            // Reset the flag so it can show again in future sessions if they log out
            setHasShownSignInPrompt(false);
            return;
        }

        // Only start timer if user is not authenticated and hasn't been shown the prompt yet
        if (!user && !hasShownSignInPrompt) {
            // Clear any existing timer
            if (signInTimerRef.current) {
                clearTimeout(signInTimerRef.current);
            }

            // Set timer for 1 minute (60000 ms)
            // For testing, you can reduce this to a shorter time like 5000 ms (5 seconds)
            signInTimerRef.current = setTimeout(() => {
                // setShowSignInPrompt(true);
                setHasShownSignInPrompt(true);
            }, 60000);
        }

        // Cleanup timer on unmount
        return () => {
            if (signInTimerRef.current) {
                clearTimeout(signInTimerRef.current);
            }
        };
    }, [user, hasShownSignInPrompt, setHasShownSignInPrompt]);

    type VisibilityType = 'public' | 'private';

    const [selectedVisibilityType, setSelectedVisibilityType] = useState<VisibilityType>(initialVisibility);

    const chatOptions: UseChatOptions = useMemo(() => ({
        id: chatId,
        api: '/api/search', // Use single endpoint that handles routing based on group parameter
        experimental_throttle: selectedModel.includes('gemini') ? 30 : 0, // Throttle Gemini for ChatGPT-like experience
        maxSteps: 1,
        streamProtocol: 'data',
        fetch: async (url, options) => {
            // Custom fetch with better error handling
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 60000); // 1 minute timeout for faster responses
                
                const response = await fetch(url, {
                    ...options,
                    signal: controller.signal,
                });
                
                clearTimeout(timeoutId);
                return response;
            } catch (error) {
                // Suppress common streaming errors
                if (error instanceof Error && (
                    error.name === 'AbortError' ||
                    error.message.includes('Incomplete') ||
                    error.message.includes('stream') ||
                    error.message.includes('aborted')
                )) {
                    console.warn("🔇 Suppressed fetch error:", error.message);
                    // Return a minimal successful response to avoid error cascade
                    return new Response('', { status: 200 });
                }
                throw error;
            }
        },
        body: {
            id: chatId,
            model: selectedModel,
            group: selectedGroup,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            ...(initialChatId ? { chat_id: initialChatId } : {}),
            selectedVisibilityType,
        },
        onRequest: (options: any) => {
            console.log("🚀 CHAT REQUEST:", {
                selectedGroup,
                model: selectedModel,
                bodyGroup: options.body ? JSON.parse(options.body as string).group : 'no body',
                url: options.url
            });
        },
        onFinish: async (message, { finishReason }) => {
            console.log("✅ [STREAM FINISHED]:", finishReason, "Content length:", message.content?.length || 0);
            
            // Accept any response that has content, regardless of finish reason
            // This prevents false "Incomplete Response" errors for valid responses
            const hasValidContent = message.content && message.content.trim().length > 0;
            
            if (!hasValidContent) {
                console.warn("⚠️ Response finished without content, finish reason:", finishReason);
                return;
            }
            
            console.log("✅ Response completed successfully with content - no errors expected");
            
            // Only generate suggested questions if authenticated user or private chat
            // and the response has content (don't be strict about finish reason)
            if (hasValidContent && (user || selectedVisibilityType === 'private')) {
                const newHistory = [
                    { id: uuidv4(), role: "user" as const, content: lastSubmittedQueryRef.current, parts: [{ type: "text" as const, text: lastSubmittedQueryRef.current }] },
                    { id: uuidv4(), role: "assistant" as const, content: message.content, parts: [{ type: "text" as const, text: message.content }] },
                ];
                try {
                    const { questions } = await suggestQuestions(newHistory);
                    setSuggestedQuestions(questions);
                } catch (error) {
                    console.error("Error generating suggested questions:", error);
                }
            }
        },
        onError: (error) => {
            console.error('Chat error:', error);
            toast.error('Something went wrong. Please try again.');
        },
        initialMessages: initialMessages,
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }), [chatId, initialChatId]); // Only recreate useChat when chatId changes, not on model/group changes

    // Wrap useChat in try-catch to prevent any internal errors from bubbling up
    let chatHookResult;
    try {
        chatHookResult = useChat(chatOptions);
    } catch (error) {
        console.warn("🔇 BLOCKED useChat error:", error);
        // Provide fallback values if useChat fails
        chatHookResult = {
            input: '',
            messages: [],
            setInput: () => {},
            append: async () => null,
            handleSubmit: () => {},
            setMessages: () => {},
            reload: async () => null,
            stop: () => {},
            data: undefined,
            status: 'ready' as const,
            error: null,
            experimental_resume: async () => null
        };
    }

    const {
        input,
        messages,
        setInput,
        append,
        handleSubmit,
        setMessages,
        reload,
        stop,
        data,
        status,
        error,
        experimental_resume
    } = chatHookResult;

    // **DEBUG: Log selectedGroup changes**
    useEffect(() => {
        console.log("🔄 SELECTED GROUP CHANGED:", selectedGroup, "Messages count:", messages.length);
    }, [selectedGroup, messages.length]);
    
    // **DEBUG: Log when useChat would have been recreated (but now shouldn't be)**
    useEffect(() => {
        console.log("🔧 Model/Group changed, but useChat should NOT reset:", { selectedModel, selectedGroup, selectedVisibilityType });
    }, [selectedModel, selectedGroup, selectedVisibilityType]);

    useAutoResume({
        autoResume: true,
        initialMessages: initialMessages || [],
        experimental_resume,
        data,
        setMessages,
    });

    useEffect(() => {
        if (user && status === 'streaming' && messages.length > 0) {
            console.log("[chatId]:", chatId);
            // Note: Cache invalidation would go here if available
        }
    }, [user, status, router, chatId, initialChatId, messages.length]);

    // **SIMPLIFIED: Only manage scroll classes without complex state changes**
    useEffect(() => {
        const isEmptyState = status === 'ready' && messages.length === 0 && !hasSubmitted;
        
        if (isEmptyState) {
            document.documentElement.classList.add('no-scroll');
            document.body.classList.add('no-scroll');
        } else {
            document.documentElement.classList.remove('no-scroll');
            document.body.classList.remove('no-scroll');
        }
        
        return () => {
            document.documentElement.classList.remove('no-scroll');
            document.body.classList.remove('no-scroll');
        };
    }, [status, messages.length, hasSubmitted]);

    useEffect(() => {
        if (!initializedRef.current && initialState.query && !messages.length && !initialChatId) {
            initializedRef.current = true;
            console.log("[initial query]:", initialState.query);
            append({
                content: initialState.query,
                role: 'user'
            });
        }
    }, [initialState.query, append, setInput, messages.length, initialChatId]);

    // Generate suggested questions when opening a chat directly
    useEffect(() => {
        const generateSuggestionsForInitialMessages = async () => {
            // Only generate if we have initial messages, no suggested questions yet, 
            // user is authenticated or chat is private, and status is not streaming
            if (initialMessages && initialMessages.length >= 2 &&
                !suggestedQuestions.length &&
                (user || selectedVisibilityType === 'private') &&
                status === 'ready'
            ) {
                const lastUserMessage = initialMessages.filter(m => m.role === 'user').pop();
                const lastAssistantMessage = initialMessages.filter(m => m.role === 'assistant').pop();

                if (lastUserMessage && lastAssistantMessage) {
                    const newHistory = [
                        { id: uuidv4(), role: "user" as const, content: lastUserMessage.content, parts: [{ type: "text" as const, text: lastUserMessage.content }] },
                        { id: uuidv4(), role: "assistant" as const, content: lastAssistantMessage.content, parts: [{ type: "text" as const, text: lastAssistantMessage.content }] },
                    ];
                    try {
                        const { questions } = await suggestQuestions(newHistory);
                        setSuggestedQuestions(questions);
                    } catch (error) {
                        console.error("Error generating suggested questions:", error);
                    }
                }
            }
        };

        generateSuggestionsForInitialMessages();
    }, [initialMessages, suggestedQuestions.length, status, user, selectedVisibilityType]);

    // Reset suggested questions when status changes to streaming
    useEffect(() => {
        if (status === 'streaming') {
            // Clear suggested questions when a new message is being streamed
            setSuggestedQuestions([]);
        }
    }, [status]);

    // Auto-focus input field when streaming ends
    useEffect(() => {
        // Focus input when streaming ends and there are messages
        if (status === 'ready' && messages.length > 0 && inputRef.current) {
            // Small delay to ensure the streaming animation is complete
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, [status, messages.length]);

    const lastUserMessageIndex = useMemo(() => {
        for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i].role === 'user') {
                return i;
            }
        }
        return -1;
    }, [messages]);

    // **SIMPLIFIED: Reset manual scroll state when streaming starts**
    useEffect(() => {
        if (status === 'streaming') {
            setHasManuallyScrolled(false);
        }
    }, [status]);

    // **SIMPLIFIED: Much more conservative scroll handling to prevent screen bouncing**
    useEffect(() => {
        let scrollTimeout: NodeJS.Timeout;

        const handleScroll = () => {
            const currentScrollTop = window.scrollY;
            const scrollHeight = document.documentElement.scrollHeight;
            const clientHeight = window.innerHeight;
            const isAtBottom = currentScrollTop + clientHeight >= scrollHeight - 50;

            // Update scroll-to-bottom button visibility
            setShowScrollToBottom(!isAtBottom && messages.length > 0);

            // Track manual scrolling during streaming
            if (status === 'streaming' && !isAutoScrollingRef.current) {
                if (!isAtBottom) {
                    setHasManuallyScrolled(true);
                } else {
                    setHasManuallyScrolled(false);
                }
            }
        };

        // Use passive scroll listener with throttling
        let scrollThrottle: NodeJS.Timeout;
        const throttledScroll = () => {
            if (scrollThrottle) return;
            scrollThrottle = setTimeout(() => {
                handleScroll();
                scrollThrottle = null as any;
            }, 100);
        };

        window.addEventListener('scroll', throttledScroll, { passive: true });

        // **VERY CONSERVATIVE auto-scroll: Only when streaming, user at bottom, and not manually scrolled**
        if (status === 'streaming' && !hasManuallyScrolled && bottomRef.current) {
            scrollTimeout = setTimeout(() => {
                if (!hasManuallyScrolled && bottomRef.current) {
                    isAutoScrollingRef.current = true;
                    
                    // Use smooth scroll but with reduced frequency
                    bottomRef.current.scrollIntoView({ 
                        behavior: "smooth", 
                        block: "end",
                        inline: "nearest"
                    });
                    
                    setTimeout(() => {
                        isAutoScrollingRef.current = false;
                    }, 300);
                }
            }, 1000); // Much longer delay
        }

        return () => {
            window.removeEventListener('scroll', throttledScroll);
            if (scrollTimeout) clearTimeout(scrollTimeout);
            if (scrollThrottle) clearTimeout(scrollThrottle);
        };
    }, [messages.length, status, hasManuallyScrolled]); // Simplified dependencies

    // Scroll to bottom function
    const scrollToBottom = useCallback(() => {
        setHasManuallyScrolled(false);
        setShowScrollToBottom(false);
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    // Dialog management state
    const [commandDialogOpen, setCommandDialogOpen] = useState(false);
    const [anyDialogOpen, setAnyDialogOpen] = useState(false);

    useEffect(() => {
        // Track the command dialog state in our broader dialog tracking
        setAnyDialogOpen(commandDialogOpen);
    }, [commandDialogOpen]);

    // Force reset dialog states on mount to clear any stuck states
    useEffect(() => {
        setCommandDialogOpen(false);
        setAnyDialogOpen(false);
    }, []);

    // Keyboard shortcut for command dialog
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setCommandDialogOpen((open) => !open);
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    // Define the model change handler
    const handleModelChange = useCallback((model: string) => {
        setSelectedModel(model);
    }, [setSelectedModel]);

    const resetSuggestedQuestions = useCallback(() => {
        setSuggestedQuestions([]);
    }, []);

    // Handle visibility change
    const handleVisibilityChange = useCallback(async (visibility: VisibilityType) => {
        if (!chatId) return;

        try {
            await updateChatVisibility(chatId, visibility);
            setSelectedVisibilityType(visibility);
            toast.success(`Chat is now ${visibility}`);
            // Note: Cache invalidation would go here if available
        } catch (error) {
            console.error('Error updating chat visibility:', error);
            toast.error('Failed to update chat visibility');
        }
    }, [chatId]);
    
    // **SIMPLIFIED: Just manage streaming class without complex state**
    useEffect(() => {
        if (status === 'streaming') {
            document.documentElement.classList.add('streaming-active');
            document.body.classList.add('streaming-active');
        } else {
            document.documentElement.classList.remove('streaming-active');
            document.body.classList.remove('streaming-active');
        }
        
        return () => {
            document.documentElement.classList.remove('streaming-active');
            document.body.classList.remove('streaming-active');
        };
    }, [status]);

    return (
        <TooltipProvider>
            <div className="flex flex-col font-sans! items-center h-screen bg-background text-foreground transition-all duration-500">
                <Navbar
                    isDialogOpen={anyDialogOpen}
                    chatId={initialChatId || (messages.length > 0 ? chatId : null)}
                    selectedVisibilityType={selectedVisibilityType}
                    onVisibilityChange={handleVisibilityChange}
                    status={status}
                    user={user}
                    onHistoryClick={() => setCommandDialogOpen(true)}
                    isOwner={isOwner}
                    selectedModel={selectedModel}
                    setSelectedModel={handleModelChange}
                />

                {/* Chat History Dialog */}
                <div className="dialog-layer">
                    <ChatHistoryDialog
                        open={commandDialogOpen}
                        onOpenChange={(open: boolean) => {
                            setCommandDialogOpen(open);
                            setAnyDialogOpen(open);
                        }}
                        user={user}
                    />
                </div>

                {/* Sign-in Prompt Dialog */}
                {/* <SignInPromptDialog
                    open={showSignInPrompt}
                    onOpenChange={(open) => {
                        setShowSignInPrompt(open);
                        if (!open) {
                            setHasShownSignInPrompt(true);
                        }
                    }}
                /> */}

                {/* FIXED: Use consistent layout that doesn't jump between states */}
                <div className="flex-1 w-full relative overflow-hidden content-layer">
                    {/* Main scrollable content area with consistent positioning */}
                    <div className={`h-full ${
                        status === 'ready' && messages.length === 0
                        ? 'flex flex-col justify-between px-4' 
                        : 'overflow-y-auto pt-20 pb-32'
                    }`}>
                    
                    {/* Content wrapper - centers empty state, flows normally for messages */}
                    <div className={`${
                        status === 'ready' && messages.length === 0
                        ? 'flex-1 flex items-center justify-center' 
                        : 'w-full max-w-[95%] sm:max-w-2xl mx-auto space-y-6 p-2 sm:p-4'
                    } transition-all duration-300`}>
                        
                        {/* Empty state content */}
                        {status === 'ready' && messages.length === 0 && !input.trim() && (
                            <div className="w-full max-w-2xl mx-auto space-y-4 px-2 pt-[calc(max(2vh,0.5rem))] pb-6 duration-300 animate-in fade-in-50 zoom-in-95 sm:px-8">
                                <h1 className="text-4xl font-semibold text-left">
                                    How can I help you?
                                </h1>

                                {/* Category buttons */}
                                <div className="flex flex-row flex-wrap gap-2.5 text-sm max-sm:justify-evenly">
                                    {[
                                        { 
                                            group: 'analysis', 
                                            icon: (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sparkles max-sm:block">
                                                    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"></path>
                                                    <path d="M20 3v4"></path>
                                                    <path d="M22 5h-4"></path>
                                                    <path d="M4 17v2"></path>
                                                    <path d="M5 18H3"></path>
                                                </svg>
                                            ), 
                                            label: 'Create' 
                                        },
                                        { 
                                            group: 'analysis', 
                                            icon: (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-newspaper max-sm:block">
                                                    <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"></path>
                                                    <path d="M18 14h-8"></path>
                                                    <path d="M15 18h-5"></path>
                                                    <path d="M10 6h8v4h-8V6Z"></path>
                                                </svg>
                                            ), 
                                            label: 'Explore' 
                                        },
                                        { 
                                            group: 'analysis', 
                                            icon: (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-code max-sm:block">
                                                    <polyline points="16 18 22 12 16 6"></polyline>
                                                    <polyline points="8 6 2 12 8 18"></polyline>
                                                </svg>
                                            ), 
                                            label: 'Code' 
                                        },
                                        { 
                                            group: 'analysis', 
                                            icon: (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-graduation-cap max-sm:block">
                                                    <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"></path>
                                                    <path d="M22 10v6"></path>
                                                    <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"></path>
                                                </svg>
                                            ), 
                                            label: 'Learn' 
                                        }
                                    ].map((item, index) => (
                                        <button
                                            key={item.group + index}
                                            className={`justify-center whitespace-nowrap text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 ${
                                                selectedCategoryButton === item.label
                                                    ? 'border-reflect button-reflect bg-[rgb(162,59,103)] p-2 text-primary-foreground shadow hover:bg-[#d56698] active:bg-[rgb(162,59,103)] disabled:hover:bg-[rgb(162,59,103)] disabled:active:bg-[rgb(162,59,103)] dark:bg-primary/20 dark:hover:bg-pink-800/70 dark:active:bg-pink-800/40 disabled:dark:hover:bg-primary/20 disabled:dark:active:bg-primary/20'
                                                    : 'bg-primary text-primary-foreground shadow hover:bg-primary/90'
                                            } h-9 flex items-center gap-1 rounded-xl px-5 py-2 font-semibold outline-1 outline-secondary/70 backdrop-blur-xl data-[selected=false]:bg-secondary/30 data-[selected=false]:text-secondary-foreground/90 data-[selected=false]:outline data-[selected=false]:hover:bg-secondary max-sm:size-16 max-sm:flex-col sm:gap-2 sm:rounded-full`}
                                            data-selected={selectedCategoryButton === item.label ? 'true' : 'false'}
                                            onClick={() => {
                                                // Toggle behavior: if already selected, unselect it; otherwise select it
                                                if (selectedCategoryButton === item.label) {
                                                    setSelectedCategoryButton(null);
                                                    setSelectedGroup(null);
                                                } else {
                                                    setSelectedCategoryButton(item.label);
                                                    setSelectedGroup(item.group as any);
                                                }
                                                inputRef.current?.focus();
                                            }}
                                        >
                                            {item.icon}
                                            <div>{item.label}</div>
                                        </button>
                                    ))}
                                </div>
                                
                                {/* Sample questions */}
                                <div className="flex flex-col text-foreground">
                                    {[
                                        "How does AI work?",
                                        "Are black holes real?",
                                        "How many Rs are in the word \"strawberry\"?",
                                        "What is the meaning of life?"
                                    ].map((question, index) => (
                                        <div key={question} className="flex items-start gap-2 py-1">
                                            <button
                                                className="w-full rounded-md py-1.5 text-left text-sm text-secondary-foreground hover:bg-secondary/50 sm:px-3"
                                                onClick={() => {
                                                    setInput(question);
                                                    setHasSubmitted(true);
                                                    // Focus the input and set cursor to end
                                                    setTimeout(() => {
                                                        if (inputRef.current) {
                                                            inputRef.current.focus();
                                                            inputRef.current.setSelectionRange(question.length, question.length);
                                                        }
                                                    }, 0);
                                                }}
                                            >
                                                <span>{question}</span>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                        </div>
                    )}

                    {/* Messages */}
                    {messages.length > 0 && (
                        <Messages
                            messages={messages as UIMessage[]}
                            lastUserMessageIndex={lastUserMessageIndex}
                            input={input}
                            setInput={setInput}
                            setMessages={setMessages as (messages: UIMessage[] | ((prevMessages: UIMessage[]) => UIMessage[])) => void}
                            append={append as (message: UIMessage, options?: unknown) => Promise<string | null | undefined>}
                            reload={reload}
                            suggestedQuestions={suggestedQuestions}
                            setSuggestedQuestions={setSuggestedQuestions}
                            status={status}
                            error={error ?? null}
                            user={user ? { id: user.id, name: user.name ?? undefined, email: user.email ?? undefined } : undefined}
                            selectedVisibilityType={selectedVisibilityType}
                            chatId={initialChatId || (messages.length > 0 ? chatId : undefined)}
                            onVisibilityChange={handleVisibilityChange}
                            initialMessages={initialMessages}
                            isOwner={isOwner}
                        />
                    )}

                    <div ref={bottomRef} />
                    </div>

                    {/* Terms notice - positioned at bottom for empty state */}
                    {status === 'ready' && messages.length === 0 && !hasSubmitted && (
                        // Show terms only if form will be shown
                        (user && isOwner) || 
                        !initialChatId || 
                        (!user && selectedVisibilityType === 'private')
                    ) && (
                        <div className="pb-4 px-4">
                            <div className="w-full flex justify-center">
                                <div className="prose max-w-none rounded-t-md border border-secondary/40 bg-chat-background/50 py-2 px-6 text-sm text-secondary-foreground/80 backdrop-blur-md blur-fallback:bg-chat-background text-center inline-block mx-auto">
                                    <span className="font-semibold text-center block">Make sure you agree to our <a href="/terms-of-service" className="text-foreground hover:text-primary dark:hover:text-muted-foreground underline font-semibold">Terms</a> and our <a href="/privacy-policy" className="text-foreground hover:text-primary dark:hover:text-muted-foreground underline font-semibold">Privacy Policy</a></span>
                                </div>
                            </div>
                        </div>
                    )}
                    </div>

                    {/* Scroll to bottom button */}
                    <AnimatePresence>
                        {showScrollToBottom && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                transition={{ duration: 0.2 }}
                                className="fixed bottom-32 right-6 z-40"
                            >
                                <button
                                    onClick={scrollToBottom}
                                    className="flex items-center justify-center w-10 h-10 bg-background border border-border/50 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 backdrop-blur-sm"
                                    aria-label="Scroll to bottom"
                                >
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="text-muted-foreground"
                                    >
                                        <path d="m6 9 6 6 6-6" />
                                    </svg>
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* FIXED: Form is now always fixed to bottom - no more layout jumping */}
                    {((user && isOwner) || 
                      !initialChatId || 
                      (!user && selectedVisibilityType === 'private')) && (
                        <div className="fixed bottom-0 left-0 right-0 form-layer bg-gradient-to-t from-background via-background/95 to-background/80 backdrop-blur-sm border-t border-border/30 force-pointer-events fix-hit-testing">
                            <div className="w-full max-w-3xl mx-auto px-4 pt-3">
                            <FormComponent
                                chatId={chatId}
                                input={input}
                                user={user!}
                                setInput={setInput}
                                attachments={attachments}
                                setAttachments={setAttachments}
                                handleSubmit={handleSubmit}
                                fileInputRef={fileInputRef}
                                inputRef={inputRef}
                                stop={stop}
                                messages={messages as any}
                                append={append}
                                selectedModel={selectedModel}
                                setSelectedModel={handleModelChange}
                                resetSuggestedQuestions={resetSuggestedQuestions}
                                lastSubmittedQueryRef={lastSubmittedQueryRef}
                                selectedGroup={selectedGroup}
                                setSelectedGroup={setSelectedGroup}
                                showExperimentalModels={messages.length === 0 && !hasSubmitted}
                                status={status}
                                setHasSubmitted={setHasSubmitted}
                            />
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </TooltipProvider>
    );
});

// Add a display name for the memoized component for better debugging
ChatInterface.displayName = "ChatInterface";

export { ChatInterface }; 