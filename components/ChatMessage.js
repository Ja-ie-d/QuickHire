import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { format } from 'date-fns';

const ChatMessage = memo(({ message, isCurrentUser }) => {
  return (
    <View style={[styles.messageContainer, isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage]}>
      <View style={[styles.messageBubble, isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble]}>
        <Text style={styles.messageText}>{message.text}</Text>
        <Text style={styles.timestamp}>
          {format(new Date(message.timestamp), 'HH:mm')}
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  messageContainer: {
    padding: 8,
    maxWidth: '80%',
  },
  currentUserMessage: {
    alignSelf: 'flex-end',
  },
  otherUserMessage: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 20,
    marginBottom: 4,
  },
  currentUserBubble: {
    backgroundColor: '#007AFF',
  },
  otherUserBubble: {
    backgroundColor: '#E5E5EA',
  },
  messageText: {
    fontSize: 16,
    color: '#000',
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
});

export default ChatMessage; 