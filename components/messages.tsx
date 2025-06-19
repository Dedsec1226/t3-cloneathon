import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Message } from '@/components/message';
import { UIMessage } from '@ai-sdk/ui-utils';
import { ReasoningPartView } from '@/components/reasoning-part';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { RefreshCw, Copy } from 'lucide-react';
import { MarkdownRenderer } from '@/components/markdown';
import ToolInvocationListView from '@/components/tool-invocation-list-view';
import { deleteTrailingMessages } from '@/app/actions';
import { toast } from 'sonner';
import { updateChatVisibility } from '@/app/actions';
import { invalidateChatsCache } from '@/lib/utils';
import { Share } from 'lucide-react';

// Define interface for part, messageIndex and partIndex objects
interface PartInfo {
  part: UIMessage["parts"][number];
  messageIndex: number;
  partIndex: number;
}

interface MessagesProps {
  messages: UIMessage[];
  lastUserMessageIndex: number;
  input: string;
  setInput: (value: string) => void;
  setMessages: (messages: UIMessage[] | ((prevMessages: UIMessage[]) => UIMessage[])) => void;
  append: (message: UIMessage, options?: unknown) => Promise<string | null | undefined>;
  reload: () => Promise<string | null | undefined>;
  suggestedQuestions: string[];
  setSuggestedQuestions: (questions: string[]) => void;
  status: string;
  error: Error | null; // Add error from useChat
  user?: { id: string; name?: string; email?: string }; // Add user prop
  selectedVisibilityType?: 'public' | 'private'; // Add visibility type
  chatId?: string; // Add chatId prop
  onVisibilityChange?: (visibility: 'public' | 'private') => void; // Add visibility change handler
  initialMessages?: UIMessage[]; // Add initial messages prop to detect existing chat
  isOwner?: boolean; // Add ownership prop
  isStoppedByUser?: boolean;
}

// Create a consistent logo header component to reuse
const T3LogoHeader = () => (
  <div className="flex items-center gap-2 mb-2">
    <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center">
      <span className="text-xs font-bold text-accent-foreground">T3</span>
    </div>
    <h2 className="text-lg font-semibold font-syne text-neutral-800 dark:text-neutral-200">
      T3 AI
    </h2>
  </div>
);

const Messages: React.FC<MessagesProps> = ({
  messages,
  lastUserMessageIndex,
  setMessages,
  append,
  suggestedQuestions,
  setSuggestedQuestions,
  reload,
  status,
  error,
  user,
  selectedVisibilityType = 'private',
  chatId,
  onVisibilityChange,
  initialMessages,
  isOwner,
  isStoppedByUser
}) => {
  // Track visibility state for each reasoning section using messageIndex-partIndex as key
  const [reasoningVisibilityMap, setReasoningVisibilityMap] = useState<Record<string, boolean>>({});
  const [reasoningFullscreenMap, setReasoningFullscreenMap] = useState<Record<string, boolean>>({});
  const reasoningScrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [hasInitialScrolled, setHasInitialScrolled] = useState(false);
  const [hoveredMessageIndex, setHoveredMessageIndex] = useState<number | null>(null);

  // Add event listeners for action button visibility
  useEffect(() => {
    const handleShowActionButtons = (event: any) => {
      setHoveredMessageIndex(event.detail.messageIndex);
    };
    
    const handleHideActionButtons = (event: any) => {
      setHoveredMessageIndex(null);
    };
    
    window.addEventListener('showActionButtons', handleShowActionButtons);
    window.addEventListener('hideActionButtons', handleHideActionButtons);
    
    return () => {
      window.removeEventListener('showActionButtons', handleShowActionButtons);
      window.removeEventListener('hideActionButtons', handleHideActionButtons);
    };
  }, []);

  // Scroll to bottom immediately (without animation) when opening existing chat
  useEffect(() => {
    if (initialMessages && initialMessages.length > 0 && !hasInitialScrolled && messagesEndRef.current) {
      // Use scrollTo with instant behavior for existing chats
      messagesEndRef.current.scrollIntoView({ behavior: 'instant' });
      setHasInitialScrolled(true);
    }
  }, [initialMessages, hasInitialScrolled]);

  // Filter messages to only show the ones we want to display
  const memoizedMessages = useMemo(() => {
    return messages.filter((message) => {
      // Keep all user messages
      if (message.role === 'user') return true;

      // For assistant messages
      if (message.role === 'assistant') {
        // Keep messages that have tool invocations
        if (message.parts?.some((part: any) => part.type === 'tool-invocation')) {
          return true;
        }
        // Keep messages that have text parts but no tool invocations
        if (message.parts?.some((part: any) => part.type === 'text') ||
          !message.parts?.some((part: any) => part.type === 'tool-invocation')) {
          return true;
        }
        return false;
      }
      return false;
    });
  }, [messages]);

  // Check if the last message is from a user and we're expecting an AI response
  const isWaitingForResponse = useMemo(() => {
    const lastMessage = memoizedMessages[memoizedMessages.length - 1];
    return lastMessage?.role === 'user' && (status === 'submitted' || status === 'streaming');
  }, [memoizedMessages, status]);

  // DISABLED: Incomplete response detection completely turned off
  const isMissingAssistantResponse = useMemo(() => {
    // Always return false - never show "Incomplete Response" message
    return false;
  }, []);

  // Handle rendering of message parts
  const renderPart = (
    part: UIMessage["parts"][number],
    messageIndex: number,
    partIndex: number,
    parts: UIMessage["parts"],
    message: UIMessage,
  ): React.ReactNode => {
    // Case 1: Skip rendering text parts that should be superseded by tool invocations
    if (part.type === "text") {
      // For empty text parts in a streaming message, show loading animation
      if ((!part.text || part.text.trim() === "") && status === 'streaming') {
        
                        return (
          <div key={`${messageIndex}-${partIndex}-loading`} className="flex flex-col min-h-[calc(50vh-14rem)]">
            <T3LogoHeader />
            <div className="flex space-x-2 ml-8 mt-2">
              <div className="w-2 h-2 rounded-full bg-neutral-400 dark:bg-neutral-600 animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 rounded-full bg-neutral-400 dark:bg-neutral-600 animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 rounded-full bg-neutral-400 dark:bg-neutral-600 animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        );
      }
      
      // Skip empty text parts entirely for non-streaming states
      if (!part.text || part.text.trim() === "") return null;

      // Detect text sandwiched between step-start and tool-invocation
      const prevPart = parts[partIndex - 1];
      const nextPart = parts[partIndex + 1];
      if (prevPart?.type === 'step-start' && nextPart?.type === 'tool-invocation') {
        console.log("Text between step-start and tool-invocation:", JSON.stringify({
          text: part.text,
          partIndex,
          messageIndex
        }));
        
        // Extract this text but don't render it in its original position
        return null;
      }
    }

    switch (part.type) {
      case "text":        
        return (
          <div key={`${messageIndex}-${partIndex}-text`}>
            <div className="prose prose-neutral dark:prose-invert max-w-none prose-pre:overflow-x-auto assistant-text-content">
              <MarkdownRenderer content={part.text} />
            </div>

            {/* Add buttons below the text with visible labels */}
            {status === 'ready' && (
              <div className="flex items-center gap-3 mt-3">
                {/* Only show reload for owners OR unauthenticated users on private chats */}
                {((user && isOwner) || (!user && selectedVisibilityType === 'private')) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      try {
                        const lastUserMessage = messages.findLast(m => m.role === 'user');
                        if (!lastUserMessage) return;

                        // Step 1: Delete trailing messages if user is authenticated
                        if (user && lastUserMessage.id) {
                          await deleteTrailingMessages({
                            id: lastUserMessage.id,
                          });
                        }

                        // Step 2: Update local state to remove assistant messages
                        const newMessages = [];
                        // Find the index of the last user message
                        for (let i = 0; i < messages.length; i++) {
                          newMessages.push(messages[i]);
                          if (messages[i].id === lastUserMessage.id) {
                            break;
                          }
                        }

                        // Step 3: Update UI state
                        setMessages(newMessages);
                        setSuggestedQuestions([]);

                        // Step 4: Reload
                        await reload();
                      } catch (error) {
                        console.error("Error in reload:", error);
                      }
                    }}
                    className="h-8 px-2 text-xs rounded-full"
                  >
                    <RefreshCw className="h-3.5 w-3.5 mr-2" />
                    Rewrite
                  </Button>
                )}
                {/* Only show share for authenticated owners */}
                {user && isOwner && chatId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      if (!chatId) return;

                      const sharePromise = async () => {
                        // First, update visibility to public if needed
                        if (selectedVisibilityType === 'private') {
                          await updateChatVisibility(chatId, 'public');
                          invalidateChatsCache();
                          // If there's an onVisibilityChange handler, call it
                          if (typeof onVisibilityChange === 'function') {
                            onVisibilityChange('public');
                          }
                        }

                        // Then copy the share link
                        const shareUrl = `https://t3.ai/search/${chatId}`;
                        await navigator.clipboard.writeText(shareUrl);
                        
                        return selectedVisibilityType === 'private' 
                          ? "Chat made public and link copied to clipboard"
                          : "Share link copied to clipboard";
                      };

                      toast.promise(sharePromise(), {
                        loading: selectedVisibilityType === 'private' 
                          ? "Making chat public and copying link..." 
                          : "Copying share link...",
                        success: (message) => message,
                        error: "Failed to share chat"
                      });
                    }}
                    className="h-8 px-2 text-xs rounded-full"
                  >
                    <Share className="size-4.5! mr-2 font-bold fill-neutral-900 dark:fill-neutral-100" />
                    Share
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(part.text);
                    toast.success("Copied to clipboard");
                  }}
                  className="h-8 px-2 text-xs rounded-full"
                >
                  <Copy className="h-3.5 w-3.5 mr-2" />
                  Copy
                </Button>
              </div>
            )}
          </div>
        );
      case "reasoning": {
        const sectionKey = `${messageIndex}-${partIndex}`;
        const hasParallelToolInvocation = parts.some((p: UIMessage["parts"][number]) => p.type === 'tool-invocation');
        const isComplete = parts.some((p: UIMessage["parts"][number], i: number) => i > partIndex && (p.type === "text" || p.type === "tool-invocation"));
        const parallelTool = hasParallelToolInvocation
          ? (parts.find((p: UIMessage["parts"][number]) => p.type === 'tool-invocation')?.toolInvocation?.toolName ?? null)
          : null;

        // Separate expanded and fullscreen states
        const isExpanded = reasoningVisibilityMap[sectionKey] ?? !isComplete;
        const isFullscreen = reasoningFullscreenMap[sectionKey] ?? false;

        // Separate setters for each state
        const setIsExpanded = (v: boolean) => setReasoningVisibilityMap(prev => ({ ...prev, [sectionKey]: v }));
        const setIsFullscreen = (v: boolean) => setReasoningFullscreenMap(prev => ({ ...prev, [sectionKey]: v }));

        return (
          <ReasoningPartView
            key={sectionKey}
            part={part as any}
            sectionKey={sectionKey}
            isComplete={isComplete}
            duration={null}
            parallelTool={parallelTool}
            isExpanded={isExpanded}
            isFullscreen={isFullscreen}
            setIsExpanded={setIsExpanded}
            setIsFullscreen={setIsFullscreen}
          />
        );
      }
      case "step-start": {
        const firstStepStartIndex = parts.findIndex(p => p.type === 'step-start');
        if (partIndex === firstStepStartIndex) {
          // Render logo and title for the first step-start with action buttons to the side
          return (
            <div key={`${messageIndex}-${partIndex}-step-start-logo`}>
              <div className="flex items-center justify-between">
                <T3LogoHeader />
                {/* Add action buttons to the side of T3 header */}
                <div className={`flex items-center gap-1 transition-opacity action-buttons ${hoveredMessageIndex === messageIndex ? 'opacity-100' : 'opacity-0'}`} data-for-message={messageIndex}>
                {/* Only show retry/edit button for owners OR unauthenticated users on private chats */}
                {((user && isOwner) || (!user && selectedVisibilityType === 'private')) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      try {
                        const lastUserMessage = messages.findLast(m => m.role === 'user');
                        if (!lastUserMessage) return;

                        // Step 1: Delete trailing messages if user is authenticated
                        if (user && lastUserMessage.id) {
                          await deleteTrailingMessages({
                            id: lastUserMessage.id,
                          });
                        }

                        // Step 2: Update local state to remove assistant messages
                        const newMessages = [];
                        // Find the index of the last user message
                        for (let i = 0; i < messages.length; i++) {
                          newMessages.push(messages[i]);
                          if (messages[i].id === lastUserMessage.id) {
                            break;
                          }
                        }

                        // Step 3: Update UI state
                        setMessages(newMessages);
                        setSuggestedQuestions([]);

                        // Step 4: Reload
                        await reload();
                      } catch (error) {
                        console.error("Error in reload:", error);
                      }
                    }}
                    disabled={status === 'submitted' || status === 'streaming'}
                    className="h-8 w-8 p-0 text-xs"
                    aria-label="Retry message"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                )}
                {((user && isOwner) || (!user && selectedVisibilityType === 'private')) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      // Edit functionality - you may need to pass this as a prop
                      console.log("Edit functionality would go here");
                    }}
                    disabled={status === 'submitted' || status === 'streaming'}
                    className="h-8 w-8 p-0 text-xs"
                    aria-label="Edit message"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"></path>
                    </svg>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // Copy the last user message
                    const lastUserMessage = messages.findLast(m => m.role === 'user');
                    if (lastUserMessage?.content) {
                      navigator.clipboard.writeText(lastUserMessage.content);
                      toast.success("Copied to clipboard");
                    }
                  }}
                  className="h-8 w-8 p-0 text-xs"
                  aria-label="Copy message"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                </div>
              </div>
            </div>
          );
        }
        // For subsequent step-start parts, render an empty div
        return (
          <div key={`${messageIndex}-${partIndex}-step-start`}></div>
        );
      }
      case "tool-invocation":
        return (
          <ToolInvocationListView
            key={`${messageIndex}-${partIndex}-tool`}
            toolInvocations={[part.toolInvocation]}
            message={message}
            annotations={message.annotations}
          />
        );
      default:
        return null;
    }
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      // Scroll when status changes to submitted/streaming (new user input) or when new messages are added
      if (status === 'streaming' || status === 'submitted') {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      } else if (hasInitialScrolled && memoizedMessages.length > 0) {
        // Also scroll for message updates when not in initial load
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [memoizedMessages.length, status, hasInitialScrolled]);

  // Add effect for auto-scrolling reasoning content
  useEffect(() => {
    // Find active reasoning parts that are not complete
    const activeReasoning = messages.flatMap((message, messageIndex) =>
      (message.parts || [])
        .map((part: any, partIndex: number) => ({ part, messageIndex, partIndex }))
        .filter(({ part }: PartInfo) => part.type === "reasoning")
        .filter(({ messageIndex, partIndex }: PartInfo) => {
          const message = messages[messageIndex];
          // Check if reasoning is complete
          return !(message.parts || []).some((p: any, i: number) =>
            i > partIndex && (p.type === "text" || p.type === "tool-invocation")
          );
        })
    );

    // Auto-scroll when active reasoning
    if (activeReasoning.length > 0 && reasoningScrollRef.current) {
      reasoningScrollRef.current.scrollTop = reasoningScrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (memoizedMessages.length === 0) {
    return null;
  }

  // Render error message if there is an error
  const handleRetry = async () => {
    try {
      const lastUserMessage = messages.findLast(m => m.role === 'user');
      if (!lastUserMessage) return;

      // Step 1: Delete trailing messages if user is authenticated
      if (user && lastUserMessage.id) {
        await deleteTrailingMessages({
          id: lastUserMessage.id,
        });
      }

      // Step 2: Update local state to remove assistant messages
      const newMessages = [];
      // Find the index of the last user message
      for (let i = 0; i < messages.length; i++) {
        newMessages.push(messages[i]);
        if (messages[i].id === lastUserMessage.id) {
          break;
        }
      }

      // Step 3: Update UI state
      setMessages(newMessages);
      setSuggestedQuestions([]);

      // Step 4: Reload
      await reload();
    } catch (error) {
      console.error("Error in retry:", error);
    }
  };

  return (
    <div className="space-y-0 mb-32 flex flex-col">
      <div className="flex-grow">
        {memoizedMessages.map((message, i) => (
          <div key={i} className="mb-4">
            <Message
              message={message}
              index={i}
              lastUserMessageIndex={lastUserMessageIndex}
              renderPart={renderPart}
              status={status}
              messages={messages}
              setMessages={setMessages}
              append={append}
              setSuggestedQuestions={setSuggestedQuestions}
              suggestedQuestions={suggestedQuestions}
              user={user}
              selectedVisibilityType={selectedVisibilityType}
              reload={reload}
              isLastMessage={i === memoizedMessages.length - 1}
              error={error}
              isMissingAssistantResponse={isMissingAssistantResponse}
              handleRetry={handleRetry}
              isOwner={isOwner}
              hoveredMessageIndex={hoveredMessageIndex}
            />
          </div>
        ))}
      </div>

      {/* Loading animation when status is submitted with min-height to reserve space */}
      {status === 'submitted' && (
        <div className="flex items-start min-h-[calc(50vh-14rem)]">
          <div className="w-full">
            <T3LogoHeader />
            <div className="flex space-x-2 ml-8 mt-2">
              <div className="w-2 h-2 rounded-full bg-neutral-400 dark:bg-neutral-600 animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 rounded-full bg-neutral-400 dark:bg-neutral-600 animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 rounded-full bg-neutral-400 dark:bg-neutral-600 animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      )}

      {/* Reserve space for empty/streaming assistant message */}
      {status === 'streaming' && isWaitingForResponse && (
        <div className="min-h-[calc(50vh-14rem)] mt-2">
          <T3LogoHeader />
          {/* Content will be populated by the streaming message */}
        </div>
      )}

      {/* Show "Stopped by user" message when user stops generation */}
      {isStoppedByUser && status === 'ready' && (
        <div className="w-full mx-auto px-2 sm:px-4 mb-4">
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 text-red-700 dark:text-red-300 text-sm font-medium">
            Stopped by user
          </div>
        </div>
      )}

      <div ref={reasoningScrollRef} />
      <div ref={messagesEndRef} />
    </div>
  );
};

export default Messages; 