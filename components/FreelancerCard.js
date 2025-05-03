// Match.js
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Image, 
  ScrollView, 
  TouchableOpacity, 
  Modal, 
  StyleSheet,
  Dimensions,
  StatusBar,
  SafeAreaView
} from 'react-native';
import { GestureHandlerRootView, GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
  withTiming, 
  runOnJS,
  interpolate,
  Extrapolation
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import Star from './Star';
import { FontAwesome } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useMatch } from '../context/MatchContext';

// Get device dimensions for responsive layout
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Define swipe threshold constant
const SWIPE_THRESHOLD = 120;

const Match = ({ onMatchCreated }) => {
  const navigation = useNavigation();
  // Use the context
  const { matches, addMatch } = useMatch();
  
  const [freelancers, setFreelancers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [selectedFreelancer, setSelectedFreelancer] = useState(null);
  const [direction, setDirection] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const rotate = useSharedValue(0);
  const cardOpacity = useSharedValue(1);
  const scale = useSharedValue(1);

  // Check authentication status when component mounts
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Reset values when currentIndex changes
  useEffect(() => {
    x.value = 0;
    y.value = 0;
    rotate.value = 0;
    cardOpacity.value = 1;
    scale.value = 1;
    setDirection(null);
    setImageError(false);
  }, [currentIndex]);

  // Check if user is authenticated
  const checkAuthStatus = async () => {
    setIsLoading(true);
    
    // Get the current session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.log('Error getting session:', error.message);
    }
    
    // If no session exists or session is expired, redirect to login
    if (!session) {
      navigation.replace('Login');
      return;
    }
    
    // If authenticated, fetch freelancers
    fetchFreelancers();
  };

  const fetchFreelancers = async () => {
    try {
      const { data, error } = await supabase
        .from('freelancers')
        .select('*')
        .eq('available_for_work', true);
      
      if (error) {
        console.log('Error fetching freelancers:', error.message);
        // If there's an error, use sample data
        setFreelancers(sampleFreelancers);
      } else if (data && data.length > 0) {
        setFreelancers(data);
      } else {
        // Fallback to sample data if no freelancers in database
        setFreelancers(sampleFreelancers);
      }
    } catch (error) {
      console.log('Error in fetchFreelancers:', error.message);
      setFreelancers(sampleFreelancers);
    } finally {
      setIsLoading(false);
    }
  };

  // Sample data as fallback
  const sampleFreelancers = [
    { 
      id: 1, 
      name: 'John Doe', 
      rating: 4.5, 
      hourly_rate: 50, 
      years_experience: 5, 
      image_url: 'https://randomuser.me/api/portraits/men/32.jpg', 
      total_reviews: 20, 
      availability: { hours_per_week: 40, timezone: 'GMT', preferred_hours: '9 AM - 5 PM' }, 
      skills: [{ id: '1-1', name: 'JavaScript', years: 3, level: 'Expert' }, { id: '1-2', name: 'React', years: 2, level: 'Intermediate' }], 
      certificates: [{ id: '1-1', name: 'React Certification', year: 2020, issuer: 'Coursera' }] 
    },
    { 
      id: 2, 
      name: 'Jane Smith', 
      rating: 4.8, 
      hourly_rate: 65, 
      years_experience: 7, 
      image_url: 'https://randomuser.me/api/portraits/women/44.jpg', 
      total_reviews: 32, 
      availability: { hours_per_week: 30, timezone: 'EST', preferred_hours: '10 AM - 6 PM' }, 
      skills: [{ id: '2-1', name: 'UI/UX Design', years: 5, level: 'Expert' }, { id: '2-2', name: 'Figma', years: 4, level: 'Expert' }], 
      certificates: [{ id: '2-1', name: 'UI/UX Professional', year: 2019, issuer: 'Udemy' }] 
    },
    { 
      id: 3, 
      name: 'Alex Johnson', 
      rating: 4.2, 
      hourly_rate: 45, 
      years_experience: 3, 
      image_url: 'https://randomuser.me/api/portraits/men/67.jpg', 
      total_reviews: 15, 
      availability: { hours_per_week: 20, timezone: 'PST', preferred_hours: '1 PM - 9 PM' }, 
      skills: [{ id: '3-1', name: 'Python', years: 3, level: 'Intermediate' }, { id: '3-2', name: 'Data Analysis', years: 2, level: 'Intermediate' }], 
      certificates: [{ id: '3-1', name: 'Python Developer', year: 2021, issuer: 'DataCamp' }] 
    }
  ];

  const handleSwipe = (swipeDirection) => {
    setDirection(swipeDirection);
    
    // Animate card off screen
    const moveX = swipeDirection === 'right' ? SCREEN_WIDTH + 100 : -SCREEN_WIDTH - 100;
    x.value = withTiming(moveX, { duration: 300 }, () => {
      cardOpacity.value = withTiming(0, { duration: 200 }, () => {
        runOnJS(finishSwipe)(swipeDirection);
      });
    });
  };

  const finishSwipe = (swipeDirection) => {
    const currentFreelancer = freelancers[currentIndex];
  
    if (swipeDirection === 'right') {
      const alreadyMatched = matches.some(f => f.id === currentFreelancer.id);
      
      if (!alreadyMatched) {
        // Use the context function to add a match
        addMatch(currentFreelancer);
        
        setSelectedFreelancer(currentFreelancer);
        setShowModal(true);
  
        // Update parent if needed
        if (onMatchCreated && typeof onMatchCreated === 'function') {
          onMatchCreated(currentFreelancer);
        }
      }
    }
  
    // Move to the next profile
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      x.value = 0;
      y.value = 0;
      rotate.value = 0;
      cardOpacity.value = 1;
      scale.value = 1;
    }, swipeDirection === 'right' ? 100 : 0);
  };
  
  const handleCloseModal = () => {
    setShowModal(false);
  };

  const navigateToChat = () => {
    // Close the modal first
    setShowModal(false);
    
    // Navigate to chat screen with the selected freelancer
    navigation.navigate('Chat', { 
      freelancer: selectedFreelancer 
    });
  };

  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      x.value = event.translationX;
      y.value = event.translationY;
      rotate.value = event.translationX / 15;
      
      // Update direction based on swipe
      if (event.translationX > 50) {
        runOnJS(setDirection)('right');
      } else if (event.translationX < -50) {
        runOnJS(setDirection)('left');
      } else {
        runOnJS(setDirection)(null);
      }
    })
    .onEnd((event) => {
      if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
        const swipeDirection = event.translationX > 0 ? 'right' : 'left';
        runOnJS(handleSwipe)(swipeDirection);
      } else {
        x.value = withSpring(0);
        y.value = withSpring(0);
        rotate.value = withSpring(0);
        runOnJS(setDirection)(null);
      }
    });

  const cardStyle = useAnimatedStyle(() => {
    const rotateValue = `${rotate.value}deg`;
    
    return {
      transform: [
        { translateX: x.value },
        { translateY: y.value },
        { rotate: rotateValue },
        { scale: scale.value }
      ],
      opacity: cardOpacity.value,
    };
  });

  // Render appropriate content based on loading state and available freelancers
  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading freelancers...</Text>
        </View>
      );
    }
    
    if (freelancers.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No freelancers available at the moment</Text>
        </View>
      );
    }
    
    if (currentIndex >= freelancers.length) {
      return (
        <View style={styles.endContainer}>
          <Text style={styles.endText}>You've viewed all available profiles</Text>
          <TouchableOpacity 
            style={styles.resetButton} 
            onPress={() => setCurrentIndex(0)}
          >
            <Text style={styles.resetButtonText}>Start Over</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const currentFreelancer = freelancers[currentIndex];
    
    return (
      <GestureHandlerRootView style={styles.gestureContainer}>
        <GestureDetector gesture={gesture}>
          <Animated.View style={[styles.card, cardStyle]}>
            {/* Main Card Content */}
            <View style={styles.imageContainer}>
              {imageError ? (
                <View style={styles.fallbackImageContainer}>
                  <FontAwesome name="user-circle" size={100} color="#CCCCCC" />
                </View>
              ) : (
                <Image
                  source={{ uri: currentFreelancer.image_url }}
                  style={styles.profileImage}
                  onError={() => setImageError(true)}
                />
              )}
              
              <View style={styles.imageDarkOverlay}>
                <View style={styles.imageBottomInfo}>
                  <Text style={styles.nameOnImage}>{currentFreelancer.name}</Text>
                  <View style={styles.ratingOnImage}>
                    <Star rating={currentFreelancer.rating} />
                    <Text style={styles.ratingTextOnImage}>
                      {currentFreelancer.rating.toFixed(1)} ({currentFreelancer.total_reviews || 0})
                    </Text>
                  </View>
                </View>
              </View>
            </View>
            
            <View style={styles.infoContainer}>
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>${currentFreelancer.hourly_rate}/hr</Text>
                  <Text style={styles.statLabel}>Rate</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{currentFreelancer.years_experience} yrs</Text>
                  <Text style={styles.statLabel}>Experience</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{currentFreelancer.availability?.hours_per_week || 'N/A'}</Text>
                  <Text style={styles.statLabel}>Hrs/week</Text>
                </View>
              </View>
              
              <View style={styles.divider} />
              
              <ScrollView style={styles.detailsScroll} showsVerticalScrollIndicator={false}>
                {currentFreelancer.skills && currentFreelancer.skills.length > 0 && (
                  <View style={styles.detailSection}>
                    <Text style={styles.sectionTitle}>Skills</Text>
                    <View style={styles.skillsContainer}>
                      {currentFreelancer.skills.map((skill) => (
                        <View key={`skill-${currentFreelancer.id}-${skill.name}`} style={styles.skillChip}>
                          <Text style={styles.skillText}>{skill.name} - {skill.level}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
                
                {currentFreelancer.availability && (
                  <View style={styles.detailSection}>
                    <Text style={styles.sectionTitle}>Availability</Text>
                    <Text style={styles.detailText}>
                      {currentFreelancer.availability.preferred_hours} ({currentFreelancer.availability.timezone})
                    </Text>
                  </View>
                )}
                
                {currentFreelancer.certificates && currentFreelancer.certificates.length > 0 && (
                  <View style={styles.detailSection}>
                    <Text style={styles.sectionTitle}>Certificates</Text>
                    {currentFreelancer.certificates.map((cert) => (
                      <Text key={`cert-${currentFreelancer.id}-${cert.name}`} style={styles.detailText}>
                        {cert.name} ({cert.year}) - {cert.issuer}
                      </Text>
                    ))}
                  </View>
                )}
              </ScrollView>
            </View>
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>
    );
  };
  
  // Action buttons outside the swipeable card
  const renderActionButtons = () => {
    if (isLoading || freelancers.length === 0 || currentIndex >= freelancers.length) {
      return null;
    }
    
    return (
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.nopeButton]}
          onPress={() => handleSwipe('left')}
        >
          <FontAwesome name="times" size={30} color="#FF6B6B" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.likeButton]}
          onPress={() => handleSwipe('right')}
        >
          <FontAwesome name="check" size={30} color="#4CD964" />
        </TouchableOpacity>
      </View>
    );
  };
  
  // Modal to show when a match is made
  const renderMatchModal = () => {
    if (!selectedFreelancer) return null;
    
    return (
      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>It's a Match!</Text>
              <TouchableOpacity style={styles.closeButton} onPress={handleCloseModal}>
                <FontAwesome name="times" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.matchImageContainer}>
              {selectedFreelancer.image_url ? (
                <Image
                  source={{ uri: selectedFreelancer.image_url }}
                  style={styles.matchImage}
                />
              ) : (
                <View style={styles.fallbackMatchImage}>
                  <FontAwesome name="user-circle" size={80} color="#CCCCCC" />
                </View>
              )}
            </View>
            
            <Text style={styles.matchName}>{selectedFreelancer.name}</Text>
            <Text style={styles.matchMessage}>
              You've matched with {selectedFreelancer.name}! 
              Start a conversation now to discuss your project needs.
            </Text>
            
            <TouchableOpacity style={styles.chatButton} onPress={navigateToChat}>
              <Text style={styles.chatButtonText}>Start Chatting</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.continueButton} onPress={handleCloseModal}>
              <Text style={styles.continueButtonText}>Continue Browsing</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#F5F7FA" barStyle="dark-content" />
      <View style={styles.container}>
        <Text style={styles.headerTitle}>Find Freelancers</Text>
        {renderContent()}
        {renderActionButtons()}
        {renderMatchModal()}
      </View>
    </SafeAreaView>
  );
};

// Enhanced styles for better UI
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    padding: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginVertical: 15,
    color: '#333',
    letterSpacing: 0.5,
  },
  gestureContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: SCREEN_WIDTH * 0.95,
    height: SCREEN_HEIGHT * 0.65, // Reduced card height from 0.7 to 0.65
    backgroundColor: 'white',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  imageContainer: {
    height: '40%', // Reduced image height from 45% to 40%
    width: '100%',
    backgroundColor: '#f0f0f0',
    position: 'relative',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageDarkOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'flex-end', // Changed from space-between to flex-end to push content to bottom
  },
  imageBottomInfo: {
    padding: 20,
  },
  nameOnImage: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  ratingOnImage: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  ratingTextOnImage: {
    marginLeft: 5,
    fontSize: 16,
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  fallbackImageContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  infoContainer: {
    flex: 1,
    padding: 15, // Reduced padding from 20 to 15
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  ratingText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#666',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10, // Reduced from 15 to 10
    paddingVertical: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
    marginTop: 3,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 10, // Reduced from 15 to 10
  },
  detailsScroll: {
    flex: 1,
  },
  detailSection: {
    marginBottom: 15, // Reduced from 20 to 15
  },
  sectionTitle: {
    fontSize: 16, // Reduced from 18 to 16
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6, // Reduced from 8 to 6
  },
  detailText: {
    fontSize: 14, // Reduced from 15 to 14
    color: '#555',
    lineHeight: 20, // Reduced from 22 to 20
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  skillChip: {
    backgroundColor: '#E0E7FF',
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 7,
    margin: 3,
    shadowColor: '#4C63B6',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  skillText: {
    fontSize: 13,
    color: '#4C63B6',
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
  },
  actionButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  likeButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#4CD964',
  },
  nopeButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#FF6B6B',
    
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
  endContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  endText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 25,
  },
  resetButton: {
    backgroundColor: '#4C63B6',
    paddingHorizontal: 25,
    paddingVertical: 14,
    borderRadius: 10,
    shadowColor: '#4C63B6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  resetButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 17,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 15,
  },
  modalHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  matchImageContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    overflow: 'hidden',
    marginVertical: 20,
    borderWidth: 3,
    borderColor: '#4CD964',
    shadowColor: '#4CD964',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  matchImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  fallbackMatchImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  matchName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 10,
  },
  matchMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  chatButton: {
    backgroundColor: '#4CD964',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#4CD964',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
    marginBottom: 15,
  },
  chatButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 17,
  },
  continueButton: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#CCC',
  },
  continueButtonText: {
    color: '#666',
    fontWeight: '500',
    fontSize: 16,
  },
});

export default Match;