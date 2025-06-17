import { v } from "convex/values";
import { query } from "./_generated/server";

// Get chats by user ID with pagination
export const getChatsByUserId = query({
  args: {
    userId: v.string(),
    limit: v.number(),
    startingAfter: v.optional(v.string()),
    endingBefore: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let chatsQuery = ctx.db
      .query("chats")
      .withIndex("by_user_and_created", (q) => q.eq("userId", args.userId))
      .order("desc");

    if (args.startingAfter) {
      const startChat = await ctx.db.get(args.startingAfter as any);
      if (startChat && "createdAt" in startChat) {
        chatsQuery = chatsQuery.filter((q) => q.lt(q.field("createdAt"), startChat.createdAt));
      }
    }

    if (args.endingBefore) {
      const endChat = await ctx.db.get(args.endingBefore as any);
      if (endChat && "createdAt" in endChat) {
        chatsQuery = chatsQuery.filter((q) => q.gt(q.field("createdAt"), endChat.createdAt));
      }
    }

    const chats = await chatsQuery.take(args.limit + 1);
    const hasMore = chats.length > args.limit;
    
    return {
      chats: hasMore ? chats.slice(0, -1) : chats,
      hasMore,
    };
  },
});

// Get chat by ID
export const getChatById = query({
  args: { id: v.id("chats") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get messages by chat ID
export const getMessagesByChatId = query({
  args: { chatId: v.id("chats") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_chat_and_created", (q) => q.eq("chatId", args.chatId))
      .order("asc")
      .collect();
  },
});

// Get message by ID
export const getMessageById = query({
  args: { id: v.id("messages") },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.id);
    return message ? [message] : [];
  },
});

// Get user settings
export const getUserSettings = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
  },
});

// Get user by email
export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

// Real-time chat messages subscription
export const subscribeToChatMessages = query({
  args: { chatId: v.id("chats") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_chat_and_created", (q) => q.eq("chatId", args.chatId))
      .order("asc")
      .collect();
  },
});

// Get public chats
export const getPublicChats = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("chats")
      .withIndex("by_visibility", (q) => q.eq("visibility", "public"))
      .order("desc")
      .take(args.limit || 50);
  },
}); 