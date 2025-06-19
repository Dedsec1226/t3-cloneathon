/**
 * Generate a unique chat title based on the first user message
 */
export function generateChatTitle(firstMessage: string): string {
  if (!firstMessage || firstMessage.trim().length === 0) {
    return "New Conversation";
  }

  // Clean the message: remove extra whitespace and special characters
  const cleanMessage = firstMessage
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '');

  // Take first meaningful words (filter out very short words)
  const words = cleanMessage
    .split(' ')
    .filter(word => word.length > 2)
    .slice(0, 4);
  
  if (words.length === 0) {
    // Fallback: use first few words even if short
    const allWords = cleanMessage.split(' ').slice(0, 3);
    if (allWords.length === 0) {
      return "New Conversation";
    }
    return allWords.join(' ').substring(0, 40);
  }

  let title = words.join(' ');
  
  // Capitalize first letter
  title = title.charAt(0).toUpperCase() + title.slice(1);
  
  // Limit to 50 characters
  if (title.length > 50) {
    title = title.substring(0, 47) + "...";
  }
  
  return title;
}

/**
 * Extract meaningful content from various message formats
 */
export function extractMessageContent(message: string | Record<string, unknown>): string {
  if (typeof message === 'string') {
    return message;
  }
  
  if (message && typeof message === 'object') {
    // Handle different message structures
    if (message.content) {
      return typeof message.content === 'string' ? message.content : '';
    }
    
    if (message.text) {
      return typeof message.text === 'string' ? message.text : '';
    }
    
    if (message.message) {
      return typeof message.message === 'string' ? message.message : '';
    }
  }
  
  return '';
}

/**
 * Generate fallback titles with variety
 */
export function generateFallbackTitle(): string {
  const fallbacks = [
    "New Conversation",
    "Chat Session",
    "Discussion",
    "Q&A Session",
    "New Topic",
    "Conversation"
  ];
  
  const randomIndex = Math.floor(Math.random() * fallbacks.length);
  return fallbacks[randomIndex];
} 