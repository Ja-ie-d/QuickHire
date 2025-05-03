import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [chats, setChats] = useState({});
  const [subscription, setSubscription] = useState(null);

  // Load existing messages and set up real-time subscription
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Load existing messages
        const { data: messages, error } = await supabase
          .from('messages')
          .select('*')
          .or(`user_id.eq.${user.id},freelancer_id.eq.${user.id}`)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error loading messages:', error);
          return;
        }

        // Organize messages by chat
        const organizedChats = {};
        messages.forEach(message => {
          const chatId = message.user_id === user.id ? message.freelancer_id : message.user_id;
          if (!organizedChats[chatId]) {
            organizedChats[chatId] = [];
          }
          organizedChats[chatId].push({
            id: message.id,
            text: message.message,
            isUser: message.user_id === user.id,
            timestamp: message.created_at ? new Date(message.created_at).toISOString() : new Date().toISOString()
          });
        });

        setChats(organizedChats);

        // Set up real-time subscription
        const newSubscription = supabase
          .channel('messages')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'messages',
              filter: `user_id=eq.${user.id} OR freelancer_id=eq.${user.id}`
            },
            (payload) => {
              const { new: newMessage, eventType } = payload;
              const chatId = newMessage.user_id === user.id ? newMessage.freelancer_id : newMessage.user_id;

              if (eventType === 'INSERT') {
                setChats(prevChats => ({
                  ...prevChats,
                  [chatId]: [
                    ...(prevChats[chatId] || []),
                    {
                      id: newMessage.id,
                      text: newMessage.message,
                      isUser: newMessage.user_id === user.id,
                      timestamp: newMessage.created_at ? new Date(newMessage.created_at).toISOString() : new Date().toISOString()
                    }
                  ]
                }));
              }
            }
          )
          .subscribe();

        setSubscription(newSubscription);

        return () => {
          if (subscription) {
            subscription.unsubscribe();
          }
        };
      } catch (error) {
        console.error('Error setting up chat:', error);
      }
    };

    loadMessages();
  }, []);

  const addMessage = async (freelancerId, message, isUser = true) => {
    const timestamp = new Date().toISOString();
    
    setChats(prevChats => ({
      ...prevChats,
      [freelancerId]: [
        ...(prevChats[freelancerId] || []),
        {
          id: Date.now().toString(),
          text: message,
          isUser,
          timestamp
        }
      ]
    }));

    // Save message to database
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { error } = await supabase
          .from('messages')
          .insert({
            user_id: user.id,
            freelancer_id: freelancerId,
            message,
            is_from_user: isUser,
            created_at: timestamp
          });
          
        if (error) {
          console.error('Error saving message:', error);
        }
      }
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  return (
    <ChatContext.Provider value={{ chats, addMessage }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
