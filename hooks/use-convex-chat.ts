import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

// Hook for real-time chat messages
export function useChatMessages(chatId: string | null) {
  return useQuery(
    api.queries.subscribeToChatMessages,
    chatId ? { chatId: chatId as any } : "skip"
  );
}

// Hook for user chats with pagination
export function useUserChats(userId: string | null, limit = 20) {
  return useQuery(
    api.queries.getChatsByUserId,
    userId ? { userId, limit, startingAfter: undefined, endingBefore: undefined } : "skip"
  );
}

// Hook for creating messages
export function useCreateMessage() {
  return useMutation(api.mutations.createMessage);
}

// Hook for creating chats
export function useCreateChat() {
  return useMutation(api.mutations.createChat);
}

// Hook for updating chat title
export function useUpdateChatTitle() {
  return useMutation(api.mutations.updateChatTitle);
}

// Hook for updating chat visibility
export function useUpdateChatVisibility() {
  return useMutation(api.mutations.updateChatVisibility);
}

// Hook for deleting chat
export function useDeleteChat() {
  return useMutation(api.mutations.deleteChat);
}

// Hook for user settings
export function useUserSettings(userId: string | null) {
  return useQuery(
    api.queries.getUserSettings,
    userId ? { userId } : "skip"
  );
}

// Hook for updating user settings
export function useUpdateUserSettings() {
  return useMutation(api.mutations.updateUserSettings);
} 