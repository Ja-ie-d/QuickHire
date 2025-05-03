import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Text
} from 'react-native';
import { useMatch } from '../context/MatchContext';
import { useChat } from '../context/ChatContext';
import ChatMessage from '../components/ChatMessage';
import ChatInput from '../components/ChatInput';
import ChatHeader from '../components/ChatHeader';

const ChatScreen = ({ navigation, route }) => {
  const { matches } = useMatch();
  const { chats, addMessage } = useChat();
  const [selectedFreelancer, setSelectedFreelancer] = useState(route.params?.freelancer || null);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    if (route.params?.freelancer) {
      setSelectedFreelancer(route.params.freelancer);
    }
  }, [route.params]);

  useEffect(() => {
    if (selectedFreelancer && chats[selectedFreelancer.id]) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [chats, selectedFreelancer]);

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedFreelancer || isSending) return;

    setIsSending(true);
    try {
      await addMessage(selectedFreelancer.id, message);
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const renderMessage = ({ item, index }) => (
    <ChatMessage
      message={item}
      isCurrentUser={item.isUser}
      key={`message-${item.id}-${index}`}
    />
  );

  if (!selectedFreelancer) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.noChatText}>Select a chat to start messaging</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ChatHeader
        user={selectedFreelancer}
        onBack={() => navigation.goBack()}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.chatContainer}>
            <FlatList
              ref={flatListRef}
              data={chats[selectedFreelancer.id] || []}
              renderItem={renderMessage}
              keyExtractor={(item, index) => `message-${item.id}-${index}`}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
              removeClippedSubviews={true}
              maxToRenderPerBatch={10}
              windowSize={5}
              ListEmptyComponent={
                <View style={styles.centered}>
                  <Text style={styles.emptyChatText}>No messages yet. Start the conversation!</Text>
                </View>
              }
            />
            <ChatInput
              message={message}
              setMessage={setMessage}
              onSend={handleSendMessage}
              isSending={isSending}
            />
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  chatContainer: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noChatText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  emptyChatText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default ChatScreen;