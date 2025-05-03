import React, { createContext, useContext, useState } from 'react';
import { supabase } from '../lib/supabase';

interface ChatContextType {
  chats: Record<string, any[]>;
  setChats: (chats: Record<string, any[]>) => void;
  addMessage: (freelancerId: string, message: string, isUser?: boolean) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [chats, setChats] = useState<Record<string, any[]>>({});

  const addMessage = async (freelancerId: string, message: string, isUser = true) => {
    setChats(prevChats => ({
      ...prevChats,
      [freelancerId]: [
        ...(prevChats[freelancerId] || []),
        {
          id: Date.now().toString(),
          text: message,
          isUser,
          timestamp: new Date()
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
            created_at: new Date()
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
    <ChatContext.Provider value={{ chats, setChats, addMessage }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
} 