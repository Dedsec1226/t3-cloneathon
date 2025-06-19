// Convex database integration functions
import { convex } from '@/lib/convex';
import { api } from '@/convex/_generated/api';
import { auth } from '@clerk/nextjs/server';
import { Id } from '@/convex/_generated/dataModel';

export async function getChatsByUserId(params: {
  id: string;
  limit: number;
  startingAfter: string | null;
  endingBefore: string | null;
}): Promise<{ chats: unknown[], hasMore: boolean }> {
  try {
    return await convex.query(api.queries.getChatsByUserId, {
      userId: params.id,
      limit: params.limit,
      startingAfter: params.startingAfter || undefined,
      endingBefore: params.endingBefore || undefined,
    });
  } catch (error) {
    console.error('Error fetching chats:', error);
    return { chats: [], hasMore: false };
  }
}

export async function deleteChatById(params: { id: string }) {
  try {
    return await convex.mutation(api.mutations.deleteChat, {
      chatId: params.id as Id<"chats">,
    });
  } catch (error) {
    console.error('Error deleting chat:', error);
    return null;
  }
}

export async function updateChatVisiblityById(params: { 
  chatId: string; 
  visibility: string 
}) {
  try {
    return await convex.mutation(api.mutations.updateChatVisibility, {
      chatId: params.chatId as Id<"chats">,
      visibility: params.visibility as "public" | "private",
    });
  } catch (error) {
    console.error('Error updating chat visibility:', error);
    return null;
  }
}

export async function getChatById(params: { id: string }) {
  try {
    return await convex.query(api.queries.getChatById, {
      id: params.id as Id<"chats">,
    });
  } catch (error) {
    console.error('Error fetching chat:', error);
    return null;
  }
}

export async function getMessageById(params: { id: string }): Promise<unknown[]> {
  try {
    return await convex.query(api.queries.getMessageById, {
      id: params.id as Id<"messages">,
    });
  } catch (error) {
    console.error('Error fetching message:', error);
    return [{
      chatId: 'error-chat-id',
      createdAt: new Date(),
      id: params.id
    }];
  }
}

export async function deleteMessagesByChatIdAfterTimestamp(params: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    return await convex.mutation(api.mutations.deleteMessagesAfterTimestamp, {
      chatId: params.chatId as Id<"chats">,
      timestamp: params.timestamp.getTime(),
    });
  } catch (error) {
    console.error('Error deleting messages:', error);
    return null;
  }
}

export async function createChatIfNotExists(params: { 
  chatId: string; 
  title: string;
  firstUserMessage?: string;
  assistantResponse?: string;
}) {
  try {
    // First, check if the chat exists
    const existingChat = await getChatById({ id: params.chatId });
    
    if (!existingChat) {
      console.log('🔧 Chat does not exist, creating it now...');
      
      // Get the authenticated user ID
      const { userId } = await auth();
      
      if (userId) {
        // Create the chat in the database
        const newChatId = await convex.mutation(api.mutations.createChat, {
          title: params.title,
          userId: userId,
          visibility: "private" as const
        });
        
        console.log('✅ Created new chat with ID:', newChatId);
        
        // Also create the user message in the database if provided
        if (params.firstUserMessage) {
          await convex.mutation(api.mutations.createMessage, {
            chatId: newChatId,
            role: "user" as const,
            content: params.firstUserMessage,
            parts: [{ type: "text", text: params.firstUserMessage }],
            userId: userId,
          });
        }
        
        // Create the assistant message in the database if provided
        if (params.assistantResponse) {
          await convex.mutation(api.mutations.createMessage, {
            chatId: newChatId,
            role: "assistant" as const,
            content: params.assistantResponse,
            parts: [{ type: "text", text: params.assistantResponse }],
            userId: userId,
          });
        }
        
        console.log('✅ Created messages in database');
        return { created: true, chatId: newChatId };
      } else {
        console.log('⚠️ No authenticated user, skipping chat creation');
        return { created: false, chatId: params.chatId };
      }
    }
    
    return { created: false, chatId: params.chatId };
  } catch (error) {
    console.error('Error creating chat if not exists:', error);
    return { created: false, chatId: params.chatId };
  }
}

export async function updateChatTitleById(params: { 
  chatId: string; 
  title: string 
}) {
  try {
    return await convex.mutation(api.mutations.updateChatTitle, {
      chatId: params.chatId as Id<"chats">,
      title: params.title,
    });
  } catch (error) {
    console.error('Error updating chat title:', error);
    return null;
  }
} 