import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useMatch } from '../context/MatchContext';
import { useChat } from '../context';

const ChatScreen = () => {
  const { matches } = useMatch();
  const { chats, addMessage, subscribeToMessages } = useChat();

  const [selectedFreelancer, setSelectedFreelancer] = useState(null);
  const [message, setMessage] = useState('');
  const flatListRef = useRef(null);

  useEffect(() => {
    subscribeToMessages();
  }, []);

  useEffect(() => {
    if (selectedFreelancer && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current.scrollToEnd({ animated: true });
      }, 200);
    }
  }, [chats, selectedFreelancer]);

  const handleSendMessage = () => {
    if (!message.trim() || !selectedFreelancer) return;
    addMessage(selectedFreelancer.id, message, true);
    setMessage('');
  };

  const dismissKeyboard = () => Keyboard.dismiss();

  const renderFreelancerItem = ({ item }) => {
    const freelancerChats = chats[item.id] || [];
    const lastMessage = freelancerChats.length > 0
      ? freelancerChats[freelancerChats.length - 1].text
      : "Start chatting...";

    return (
      <TouchableOpacity style={styles.freelancerItem} onPress={() => setSelectedFreelancer(item)}>
        <Image source={{ uri: item.image_url }} style={styles.freelancerAvatar} />
        <View style={styles.freelancerDetails}>
          <Text style={styles.freelancerName}>{item.name}</Text>
          <Text style={styles.lastMessage} numberOfLines={1}>{lastMessage}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderChatMessage = ({ item }) => (
    <View style={[styles.messageContainer, item.isUser ? styles.userMessage : styles.freelancerMessage]}>
      <Text style={[styles.messageText, item.isUser ? styles.userMessageText : styles.freelancerMessageText]}>
        {item.text}
      </Text>
      <Text style={[styles.timestamp, item.isUser ? styles.userTimestamp : styles.freelancerTimestamp]}>
        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );

  const getCurrentChat = () => {
    if (!selectedFreelancer) return [];
    const currentChat = chats[selectedFreelancer.id] || [];
    if (currentChat.length === 0) {
      return [{
        id: '0',
        text: `Hi there! I'm ${selectedFreelancer.name}. How can I help you?`,
        isUser: false,
        timestamp: new Date()
      }];
    }
    return currentChat;
  };

  return (
    <SafeAreaView style={styles.container}>
      {!selectedFreelancer ? (
        <View style={{ flex: 1 }}>
          <View style={styles.freelancerListHeader}>
            <Text style={styles.freelancerListTitle}>Chat</Text>
          </View>
          <FlatList
            data={matches}
            renderItem={renderFreelancerItem}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.freelancerListContent}
          />
        </View>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
          keyboardVerticalOffset={90}
        >
          <TouchableWithoutFeedback onPress={dismissKeyboard}>
            <View style={styles.chatContainer}>
              <View style={styles.header}>
                <TouchableOpacity onPress={() => setSelectedFreelancer(null)}>
                  <FontAwesome name="arrow-left" size={20} color="#007AFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{selectedFreelancer.name}</Text>
              </View>
              <FlatList
                ref={flatListRef}
                data={getCurrentChat()}
                renderItem={renderChatMessage}
                keyExtractor={item => item.id.toString()}
                style={styles.chatList}
                contentContainerStyle={styles.chatListContent}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              />
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Type a message..."
                  value={message}
                  onChangeText={setMessage}
                  returnKeyType="send"
                  onSubmitEditing={handleSendMessage}
                />
                <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
                  <FontAwesome name="send" size={20} color="#007AFF" />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  keyboardAvoidingView: { flex: 1 },
  chatContainer: { flex: 1 },
  freelancerListHeader: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  freelancerListTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  freelancerListContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  freelancerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  freelancerAvatar: {
    width: 65,
    height: 65,
    borderRadius: 32,
    marginRight: 12,
    backgroundColor: '#eee',
  },
  freelancerDetails: { flex: 1, justifyContent: 'center' },
  freelancerName: { fontSize: 18, fontWeight: '600', color: '#333' },
  lastMessage: { color: '#777', fontSize: 14, marginTop: 4 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  headerTitle: { fontSize: 20, marginLeft: 12, fontWeight: 'bold', color: '#333' },
  chatList: { flex: 1, paddingHorizontal: 12 },
  chatListContent: { paddingBottom: 10 },
  messageContainer: { marginVertical: 5, padding: 10, borderRadius: 10, maxWidth: '75%' },
  freelancerMessage: { alignSelf: 'flex-start', backgroundColor: '#eee' },
  userMessage: { alignSelf: 'flex-end', backgroundColor: '#007AFF' },
  freelancerMessageText: { color: '#333', fontSize: 14 },
  userMessageText: { color: '#fff', fontSize: 14 },
  messageText: { fontSize: 14 },
  timestamp: { fontSize: 10, alignSelf: 'flex-end', marginTop: 4 },
  freelancerTimestamp: { color: '#999' },
  userTimestamp: { color: '#ddd' },
  inputContainer: {
    flexDirection: 'row',
    padding: 8,
    borderTopWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 14,
  },
  sendButton: { marginLeft: 8 },
});

export default ChatScreen;
