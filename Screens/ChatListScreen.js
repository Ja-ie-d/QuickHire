import React from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Text,
  Image
} from 'react-native';
import { useMatch } from '../context/MatchContext';
import { useChat } from '../context/ChatContext';
import { Ionicons } from '@expo/vector-icons';

const ChatListScreen = ({ navigation }) => {
  const { matches } = useMatch();
  const { chats } = useChat();

  const renderChatItem = ({ item }) => {
    const chatMessages = chats[item.id] || [];
    const lastMessage = chatMessages[chatMessages.length - 1];

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => navigation.navigate('Chat', { freelancer: item })}
        key={`chat-${item.id}`}
      >
        <Image
          source={{ uri: item.image_url || 'https://via.placeholder.com/50' }}
          style={styles.profileImage}
        />
        <View style={styles.chatInfo}>
          <Text style={styles.name}>{item.name}</Text>
          {lastMessage && (
            <Text style={styles.lastMessage} numberOfLines={1}>
              {lastMessage.text}
            </Text>
          )}
        </View>
        {lastMessage && (
          <Text style={styles.time}>
            {new Date(lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chats</Text>
      </View>
      {matches.length > 0 ? (
        <FlatList
          data={matches}
          renderItem={renderChatItem}
          keyExtractor={item => `chat-${item.id}`}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
          <Text style={styles.emptyStateText}>No chats yet</Text>
          <Text style={styles.emptyStateSubtext}>
            Swipe right on freelancers to start chatting
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  listContent: {
    padding: 10,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  chatInfo: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
  },
  time: {
    fontSize: 12,
    color: '#999',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default ChatListScreen; 