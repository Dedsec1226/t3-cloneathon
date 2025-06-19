"use client";

import { ChatInterface } from "@/components/chat-interface";
import { notFound } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Id } from "@/convex/_generated/dataModel";
import { use } from "react";

interface SearchPageProps {
  params: Promise<{ chatId: string }>;
}

export default function SearchPage({ params }: SearchPageProps) {
  // Unwrap the params Promise using React.use()
  const { chatId } = use(params);
  const { user } = useUser();
  
  // Use Convex client-side query to fetch chat data
  const chatData = useQuery(api.queries.getChatById, { id: chatId as Id<"chats"> });
  
  // Fetch messages for this chat
  const messagesData = useQuery(api.queries.getMessagesByChatId, { chatId: chatId as Id<"chats"> });
  
  // If no data and not loading, show not found
  if (chatData === null) {
    notFound();
  }
  
  // Show loading state while fetching
  if (chatData === undefined || messagesData === undefined) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Extract necessary data from the chat
  const { 
    _id,
    visibility,
    userId
  } = chatData;

  // Check if user is the owner
  const isOwner = user?.id === userId;

  // Convert Convex messages to UIMessage format
  const initialMessages = messagesData?.map((msg) => ({
    id: msg._id,
    role: msg.role as 'user' | 'assistant' | 'system',
    content: msg.content,
    parts: msg.parts || [{ type: 'text' as const, text: msg.content }],
    createdAt: new Date(msg.createdAt),
    experimental_attachments: msg.experimental_attachments,
    annotations: msg.annotations
  })) || [];

  console.log(`Loading chat ${chatId} with ${initialMessages.length} messages`);

  return (
    <ChatInterface
      initialChatId={_id}
      initialMessages={initialMessages}
      initialVisibility={visibility}
      isOwner={isOwner}
    />
  );
} 