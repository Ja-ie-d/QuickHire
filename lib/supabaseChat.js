import { supabase } from './supabase';

// Create a new message
export const createMessage = async (senderId, conversationId, content) => {
  const { data, error } = await supabase
    .from('messages')
    .insert([
      {
        sender_id: senderId,
        conversation_id: conversationId,
        content: content,
        created_at: new Date().toISOString()
      },
    ])
    .select();

  if (error) throw error;
  return data[0];
};

// Get messages for a conversation
export const getMessages = async (conversationId) => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
};

// Get or create a conversation between two users
export const getOrCreateConversation = async (user1Id, user2Id) => {
  // First try to find an existing conversation
  const { data: existingConversation, error: findError } = await supabase
    .from('conversations')
    .select('*')
    .or(`and(user1_id.eq.${user1Id},user2_id.eq.${user2Id}),and(user1_id.eq.${user2Id},user2_id.eq.${user1Id})`)
    .single();

  if (findError && findError.code !== 'PGRST116') throw findError;

  if (existingConversation) {
    return existingConversation;
  }

  // If no conversation exists, create a new one
  const { data: newConversation, error: createError } = await supabase
    .from('conversations')
    .insert([
      {
        user1_id: user1Id,
        user2_id: user2Id
      }
    ])
    .select()
    .single();

  if (createError) throw createError;
  return newConversation;
};

// Subscribe to new messages in a conversation
export const subscribeToMessages = (conversationId, callback) => {
  const subscription = supabase
    .channel('messages')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        callback(payload.new);
      }
    )
    .subscribe();

  return subscription;
};

// Get all conversations for a user
export const getConversations = async (userId) => {
  const { data, error } = await supabase
    .from('conversations')
    .select(`
      id,
      user1_id,
      user2_id,
      last_message,
      messages!inner (
        id,
        content,
        created_at,
        sender_id
      )
    `)
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

// Mark messages as read
export const markMessagesAsRead = async (userId, otherUserId) => {
  const { error } = await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('receiver_id', userId)
    .eq('sender_id', otherUserId)
    .eq('is_read', false);

  if (error) throw error;
};

// Get unread message count
export const getUnreadCount = async (userId) => {
  const { data, error } = await supabase
    .from('messages')
    .select('sender_id, count(*)')
    .eq('receiver_id', userId)
    .eq('is_read', false)
    .group('sender_id');

  if (error) throw error;
  return data;
}; 