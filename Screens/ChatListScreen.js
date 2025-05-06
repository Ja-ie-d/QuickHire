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
import { LinearGradient } from 'expo-linear-gradient';

const ChatListScreen = ({ navigation }) => {
  const { matches } = useMatch();
  const { chats } = useChat();

  const renderChatItem = ({ item }) => {
    const chatMessages = chats[item.id] || [];
    const lastMessage = chatMessages[chatMessages.length - 1];

    return (
      <TouchableOpacity
        style={styles.chatItem}
        activeOpacity={0.85}
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
      <LinearGradient colors={["#e0e7ff", "#f8fafc"]} style={styles.headerGradient}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Chats</Text>
        </View>
      </LinearGradient>
      {matches.length > 0 ? (
        <FlatList
          data={matches}
          renderItem={renderChatItem}
          keyExtractor={item => `chat-${item.id}`}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="chatbubbles-outline" size={64} color="#b4b8f8" />
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
  headerGradient: {
    width: '100%',
    paddingBottom: 10,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#a5b4fc',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  header: {
    padding: 24,
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2196F3',
    letterSpacing: 0.5,
  },
  listContent: {
    padding: 16,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 18,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 3,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 18,
    borderWidth: 3,
    borderColor: '#2196F3',
    backgroundColor: '#f2f2f2',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  chatInfo: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2196F3',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  lastMessage: {
    fontSize: 15,
    color: '#666',
    marginTop: 2,
  },
  time: {
    fontSize: 13,
    color: '#bbb',
    marginLeft: 8,
    alignSelf: 'flex-start',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f8fa',
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#888',
    marginTop: 22,
  },
  emptyStateSubtext: {
    fontSize: 15,
    color: '#999',
    textAlign: 'center',
    marginTop: 12,
  },
});

export default ChatListScreen; 