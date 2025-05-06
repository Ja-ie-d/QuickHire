import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  SafeAreaView,
  StyleSheet,
  FlatList,
  Text,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Platform,
  Keyboard,
  KeyboardAvoidingView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ChatInput from 'components/ChatInput';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ChatScreen = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  const flatListRef = useRef(null);
  const insets = useSafeAreaInsets();
  const HEADER_HEIGHT = 56; // Default header height

  // Handle screen dimension changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });
    
    return () => subscription?.remove();
  }, []);

  const handleSend = () => {
    if (message.trim() === '') return;
    
    // Add the message to the list
    const newMessage = {
      id: Date.now().toString(),
      text: message,
      sender: 'user',
      timestamp: new Date()
    };
    
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setMessage('');
    
    // Simulate sending and receiving a response
    setIsSending(true);
    setTimeout(() => {
      const responseMessage = {
        id: (Date.now() + 1).toString(),
        text: 'This is a sample response to your message.',
        sender: 'other',
        timestamp: new Date()
      };
      setMessages([...updatedMessages, responseMessage]);
      setIsSending(false);
    }, 1500);
  };
  
  // Function to format the timestamp
  const formatTime = (date) => {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Scroll to bottom when keyboard appears
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        if (messages.length > 0 && flatListRef.current) {
          setTimeout(() => {
            flatListRef.current.scrollToEnd({ animated: true });
          }, 100);
        }
      }
    );

    return () => {
      keyboardDidShowListener.remove();
    };
  }, [messages]);

  // Render a message bubble
  const renderMessage = ({ item, index }) => {
    const isUser = item.sender === 'user';
    const showAvatar = !isUser;
    const previousMessage = index > 0 ? messages[index - 1] : null;
    const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;
    
    // Determine if we should group messages (same sender, close in time)
    const isGroupedWithPrevious = previousMessage && 
                                 previousMessage.sender === item.sender &&
                                 (item.timestamp - previousMessage.timestamp) < 60000; // 1 minute
    
    const isGroupedWithNext = nextMessage && 
                             nextMessage.sender === item.sender &&
                             (nextMessage.timestamp - item.timestamp) < 60000; // 1 minute
    
    // Adjust bubble styling based on grouping
    const bubbleStyle = [
      styles.messageBubble,
      isUser ? styles.userBubble : styles.otherBubble,
      isGroupedWithPrevious && (isUser ? styles.userGroupedBubble : styles.otherGroupedBubble),
      !isGroupedWithNext && (isUser ? styles.userLastBubble : styles.otherLastBubble)
    ];
    
    // Show timestamp only for the last message in a group
    const showTimestamp = !isGroupedWithNext;
    
    return (
      <View 
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.otherMessageContainer,
          isGroupedWithPrevious && styles.groupedMessageContainer
        ]}
      >
        <View style={styles.messageContent}>
          <View style={bubbleStyle}>
            <Text style={[
              styles.messageText,
              isUser ? styles.userMessageText : styles.otherMessageText
            ]}>
              {item.text}
            </Text>
          </View>
          
          {showTimestamp && (
            <Text style={[
              styles.timestamp,
              isUser ? styles.userTimestamp : styles.otherTimestamp
            ]}>
              {formatTime(item.timestamp)}
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + HEADER_HEIGHT + 40 : 0}
      >
        <View style={styles.chatContainer}>
          {messages.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>No messages yet</Text>
              <Text style={styles.emptyStateSubtext}>Start a conversation!</Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.messagesContainer}
              showsVerticalScrollIndicator={false}
              initialNumToRender={15}
              maxToRenderPerBatch={10}
              windowSize={10}
              keyboardShouldPersistTaps="handled"
            />
          )}
        </View>
        
        <View style={styles.inputWrapper}>
          <ChatInput
            message={message}
            setMessage={setMessage}
            onSend={handleSend}
            isSending={isSending}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  inputWrapper: {
    width: '100%',
    backgroundColor: '#f8f8f8',
    flexShrink: 1,
  },
  messagesContainer: {
    padding: 12,
    paddingBottom: 20,
  },
  messageContainer: {
    marginBottom: 8,
    maxWidth: '85%',
  },
  messageContent: {
    alignItems: 'flex-end',
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
  },
  groupedMessageContainer: {
    marginBottom: 2,
  },
  messageBubble: {
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 1,
    elevation: 1,
  },
  userBubble: {
    backgroundColor: '#0084ff',
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },
  otherBubble: {
    backgroundColor: '#e9e9eb',
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },
  userGroupedBubble: {
    borderBottomRightRadius: 14,
  },
  otherGroupedBubble: {
    borderBottomLeftRadius: 14,
  },
  userLastBubble: {
    borderBottomRightRadius: 5,
  },
  otherLastBubble: {
    borderBottomLeftRadius: 5,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#000',
  },
  timestamp: {
    fontSize: 11,
    marginTop: 2,
    marginHorizontal: 4,
  },
  userTimestamp: {
    color: '#8e8e93',
    alignSelf: 'flex-end',
  },
  otherTimestamp: {
    color: '#8e8e93',
    alignSelf: 'flex-start',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8e8e93',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 15,
    color: '#8e8e93',
  },
});

export default ChatScreen;