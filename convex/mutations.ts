import { v } from "convex/values";
import { mutation } from "./_generated/server";

// Create a new chat
export const createChat = mutation({
  args: {
    title: v.string(),
    userId: v.string(),
    visibility: v.union(v.literal("public"), v.literal("private")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("chats", {
      title: args.title,
      userId: args.userId,
      visibility: args.visibility,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update chat title
export const updateChatTitle = mutation({
  args: {
    chatId: v.id("chats"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.chatId, {
      title: args.title,
      updatedAt: Date.now(),
    });
  },
});

// Update chat visibility
export const updateChatVisibility = mutation({
  args: {
    chatId: v.id("chats"),
    visibility: v.union(v.literal("public"), v.literal("private")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.chatId, {
      visibility: args.visibility,
      updatedAt: Date.now(),
    });
  },
});

// Delete chat and all its messages
export const deleteChat = mutation({
  args: { chatId: v.id("chats") },
  handler: async (ctx, args) => {
    // Delete all messages in the chat
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
      .collect();
    
    for (const message of messages) {
      await ctx.db.delete(message._id);
    }
    
    // Delete the chat
    await ctx.db.delete(args.chatId);
  },
});

// Create a new message
export const createMessage = mutation({
  args: {
    chatId: v.id("chats"),
    role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
    content: v.string(),
    parts: v.optional(v.array(v.any())),
    experimental_attachments: v.optional(v.array(v.any())),
    annotations: v.optional(v.array(v.any())),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("messages", {
      chatId: args.chatId,
      role: args.role,
      content: args.content,
      parts: args.parts,
      experimental_attachments: args.experimental_attachments,
      annotations: args.annotations,
      userId: args.userId,
      createdAt: Date.now(),
    });
  },
});

// Delete messages after a specific timestamp
export const deleteMessagesAfterTimestamp = mutation({
  args: {
    chatId: v.id("chats"),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chat_and_created", (q) => q.eq("chatId", args.chatId))
      .filter((q) => q.gt(q.field("createdAt"), args.timestamp))
      .collect();
    
    for (const message of messages) {
      await ctx.db.delete(message._id);
    }
  },
});

// Create or update user
export const upsertUser = mutation({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    const now = Date.now();
    
    if (existingUser) {
      await ctx.db.patch(existingUser._id, {
        name: args.name,
        image: args.image,
        updatedAt: now,
      });
      return existingUser._id;
    } else {
      return await ctx.db.insert("users", {
        email: args.email,
        name: args.name,
        image: args.image,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// Update user settings
export const updateUserSettings = mutation({
  args: {
    userId: v.string(),
    preferences: v.object({
      name: v.optional(v.string()),
      occupation: v.optional(v.string()),
      traits: v.optional(v.array(v.string())),
      boringTheme: v.optional(v.boolean()),
      hidePersonalInfo: v.optional(v.boolean()),
      disableThematicBreaks: v.optional(v.boolean()),
      statsForNerds: v.optional(v.boolean()),
      mainFont: v.optional(v.string()),
      codeFont: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const existingSettings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    const now = Date.now();
    
    if (existingSettings) {
      await ctx.db.patch(existingSettings._id, {
        preferences: args.preferences,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("userSettings", {
        userId: args.userId,
        preferences: args.preferences,
        updatedAt: now,
      });
    }
  },
}); 