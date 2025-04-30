import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, SafeAreaView, Dimensions } from 'react-native';
import FreelancerCard from '../components/FreelancerCard';
import MatchModal from '../components/MatchModal';
import { useMatch } from '../context/MatchContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function SwipeScreen() {
  const { availableFreelancers, addMatch } = useMatch();

  const [availableProfiles, setAvailableProfiles] = useState([]);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [showMatch, setShowMatch] = useState(false);
  const [lastMatchedProfile, setLastMatchedProfile] = useState(null);

  useEffect(() => {
    if (availableFreelancers && availableFreelancers.length > 0) {
      setAvailableProfiles([...availableFreelancers]);
      setCurrentProfile(availableFreelancers[0]);
    }
  }, [availableFreelancers]);

  const handleSwipe = (direction) => {
    if (direction === 'right' && currentProfile) {
      addMatch(currentProfile);
      setLastMatchedProfile(currentProfile);
      setShowMatch(true);
    }

    const updatedProfiles = availableProfiles.filter(
      profile => profile.id !== currentProfile?.id
    );

    setAvailableProfiles(updatedProfiles);
    setCurrentProfile(updatedProfiles.length > 0 ? updatedProfiles[0] : null);
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
