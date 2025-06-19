import React from 'react';
import { Copy, Check, Brain, Plus, Search, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface MemoryAddResponse {
    id: string;
    data: {
        memory: string;
    };
    event: 'ADD';
}

interface MemorySearchResponse {
    id: string;
    memory: string;
    user_id: string;
    metadata: Record<string, any> | null;
    categories: string[];
    immutable: boolean;
    created_at: string;
    updated_at: string;
    message: string | null;
}

interface MemoryManagerProps {
    result: {
        success: boolean;
        action: 'add' | 'search' | 'get_all';
        memory?: MemoryAddResponse;
        results?: MemorySearchResponse | MemorySearchResponse[];
        message?: string;
        error?: string;
    };
}

export const MemoryManager: React.FC<MemoryManagerProps> = ({ result }) => {
    const [copied, setCopied] = React.useState(false);

    // Handle both single result and array of results
    const getFirstResult = () => {
        if (Array.isArray(result.results)) {
            return result.results[0];
        }
        return result.results;
    };

    const user_id = getFirstResult()?.user_id;

    const handleCopyUserId = async () => {
        await navigator.clipboard.writeText(user_id ?? '');
        setCopied(true);
        toast.success("User ID copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
    };

    const getActionTitle = (action: string) => {
        switch (action) {
            case 'add':
                return 'Memory Stored';
            case 'search':
                return 'Memory Search Results';
            case 'get_all':
                return 'All Memories';
            default:
                return 'Memory Operation';
        }
    };

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'add':
                return Plus;
            case 'search':
                return Search;
            case 'get_all':
                return Brain;
            default:
                return Brain;
        }
    };

    const getMemories = () => {
        if (result.action === 'add' && result.memory) {
            return [{
                id: result.memory.id,
                content: result.memory.data.memory,
                created_at: new Date().toISOString(),
                tags: []
            }];
        }

        if ((result.action === 'search' || result.action === 'get_all') && result.results) {
            // Handle both single result and array of results
            const searchResults = Array.isArray(result.results) ? result.results : [result.results];
            return searchResults.map(searchResult => ({
                id: searchResult.id,
                content: searchResult.memory,
                created_at: searchResult.created_at,
                tags: searchResult.categories || []
            }));
        }

        return [];
    };

    const memories = getMemories();
    const actionTitle = getActionTitle(result.action);
    const ActionIcon = getActionIcon(result.action);

    // Handle error state
    if (!result.success) {
        return (
            <div className="w-full my-1 px-2 py-2 border border-red-200 dark:border-red-800 border-l-red-500 dark:border-l-red-400 border-l-2 rounded-sm bg-red-50/50 dark:bg-red-900/10">
                <div className="font-mono text-xs">
                    <div className="flex items-center gap-1 mb-1">
                        <AlertCircle className="w-3 h-3 text-red-500" />
                        <span className="font-medium text-red-700 dark:text-red-300">Memory Operation Failed</span>
                    </div>
                    <p className="text-[10px] text-red-600 dark:text-red-400 pl-4">
                        {result.error || result.message || 'Unknown error occurred'}
                    </p>
                </div>
            </div>
        );
    }

    const MemoryCard = () => (
        <div className="font-mono text-xs">
            <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1">
                    <ActionIcon className="w-3 h-3 text-violet-500" />
                    <span className="font-medium text-neutral-700 dark:text-neutral-300">{actionTitle}</span>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyUserId}
                    className="h-5 px-1 text-[9px] rounded-sm text-neutral-500 hover:text-violet-500"
                >
                    {user_id?.slice(0, 5)}...{copied ? <Check className="h-2.5 w-2.5 ml-0.5" /> : <Copy className="h-2.5 w-2.5 ml-0.5" />}
                </Button>
            </div>
            
            {memories.length === 0 ? (
                <div className="text-[10px] text-neutral-400 italic">No memories</div>
            ) : (
                <div className="space-y-2">
                    {memories.map((memory) => (
                        <div key={memory.id} className="pl-1.5">
                            <div className="flex items-center gap-1 text-[9px] text-neutral-400 mb-0.5">
                                <div className="w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-600"></div>
                                <span>{formatDistanceToNow(new Date(memory.created_at), { addSuffix: true })}</span>
                            </div>
                            
                            <div className="relative">
                                <div className="absolute left-[-4px] top-0 bottom-0 w-[1px] bg-violet-200 dark:bg-violet-800"></div>
                                <p className="text-[10px] leading-tight border border-neutral-100 dark:border-neutral-800 rounded-sm py-1 px-2 bg-white/80 dark:bg-neutral-900/80 text-neutral-800 dark:text-neutral-200">
                                    {memory.content}
                                </p>
                            </div>

                            {memory.tags && memory.tags.length > 0 && (
                                <div className="flex flex-wrap gap-0.5 mt-1 ml-2">
                                    {memory.tags.map((tag: string, tagIndex: number) => (
                                        <span
                                            key={tagIndex}
                                            className="inline-flex items-center text-[8px] px-1 border border-violet-100 dark:border-violet-900 rounded-full text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20"
                                        >
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className="w-full my-1 px-2 py-2 border border-neutral-200 dark:border-neutral-800 border-l-violet-300 dark:border-l-violet-800 border-l-2 rounded-sm bg-white/50 dark:bg-neutral-900/50">
            <MemoryCard />
        </div>
    );
};

export default MemoryManager; 