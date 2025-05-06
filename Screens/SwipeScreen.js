import React, { useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, Dimensions } from 'react-native';
import FreelancerCard from '../components/FreelancerCard';
import MatchModal from '../components/MatchModal';
import { useMatch } from '../context/MatchContext';
import { useChat } from '../context/ChatContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function SwipeScreen() {
  const { availableFreelancers, addMatch } = useMatch();
  const { addMessage } = useChat();
  const [currentProfile, setCurrentProfile] = useState(availableFreelancers[0]);
  const [showMatch, setShowMatch] = useState(false);
  const [lastMatchedProfile, setLastMatchedProfile] = useState(null);

  const handleSwipe = async (direction, freelancer) => {
    if (direction === 'right') {
      // Add to matches
      await addMatch(freelancer);
      setLastMatchedProfile(freelancer);
      setShowMatch(true);
      
      // Create initial chat message
      await addMessage(freelancer.id, {
        text: `You matched with ${freelancer.name}! Start your conversation.`,
        sender: 'system',
        timestamp: new Date().toISOString()
      });
    }

    // Move to next profile
    const currentIndex = availableFreelancers.indexOf(currentProfile);
    if (currentIndex < availableFreelancers.length - 1) {
      setCurrentProfile(availableFreelancers[currentIndex + 1]);
    } else {
      setCurrentProfile(null);
    }
  };

  const closeMatchModal = () => {
    setShowMatch(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>QuickHire</Text>
      </View>

      {currentProfile ? (
        <FreelancerCard 
          freelancer={currentProfile} 
          onSwipe={handleSwipe} 
        />
      ) : (
        <View style={styles.noMoreProfiles}>
          <Text style={styles.noMoreText}>No more freelancers to show!</Text>
          <Text style={styles.checkBackText}>Check back soon for more options</Text>
        </View>
      )}

      <MatchModal 
        visible={showMatch} 
        onClose={closeMatchModal} 
        freelancer={lastMatchedProfile} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 15,
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#2196F3',
    textShadowColor: '#90caf9',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  noMoreProfiles: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noMoreText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  checkBackText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
