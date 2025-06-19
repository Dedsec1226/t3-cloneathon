// Convex database integration functions
import { convex } from '@/lib/convex';
import { api } from '@/convex/_generated/api';

export async function getChatsByUserId(params: {
  id: string;
  limit: number;
  startingAfter: string | null;
  endingBefore: string | null;
}): Promise<{ chats: any[], hasMore: boolean }> {
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
      chatId: params.id as any,
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
      chatId: params.chatId as any,
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
      id: params.id as any,
    });
  } catch (error) {
    console.error('Error fetching chat:', error);
    return null;
  }
}

export async function getMessageById(params: { id: string }): Promise<any[]> {
  try {
    return await convex.query(api.queries.getMessageById, {
      id: params.id as any,
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
      chatId: params.chatId as any,
      timestamp: params.timestamp.getTime(),
    });
  } catch (error) {
    console.error('Error deleting messages:', error);
    return null;
  }
}

export async function updateChatTitleById(params: { 
  chatId: string; 
  title: string 
}) {
  try {
    return await convex.mutation(api.mutations.updateChatTitle, {
      chatId: params.chatId as any,
      title: params.title,
    });
  } catch (error) {
    console.error('Error updating chat title:', error);
    return null;
  }
} 