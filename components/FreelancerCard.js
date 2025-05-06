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
  SafeAreaView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { GestureHandlerRootView, GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
  withTiming, 
  runOnJS,
  interpolate,
  Extrapolation,
  Easing
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
  const [isReloading, setIsReloading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const rotate = useSharedValue(0);
  const cardOpacity = useSharedValue(1);
  const scale = useSharedValue(1);
  const entranceOpacity = useSharedValue(0);
  const entranceTranslateY = useSharedValue(40);

  // Animate card entrance
  useEffect(() => {
    entranceOpacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.exp) });
    entranceTranslateY.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.exp) });
  }, [currentIndex]);

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
        // Randomly shuffle the data to provide a fresh experience on reload
        const shuffledData = [...data].sort(() => Math.random() - 0.5);
        setFreelancers(shuffledData);
      } else {
        // Fallback to sample data if no freelancers in database
        setFreelancers(sampleFreelancers);
      }
    } catch (error) {
      console.log('Error in fetchFreelancers:', error.message);
      setFreelancers(sampleFreelancers);
    } finally {
      setIsLoading(false);
      setIsReloading(false);
    }
  };

  const handleReloadFreelancers = () => {
    setIsReloading(true);
    setCurrentIndex(0);
    // Small delay to allow for animation
    setTimeout(() => {
      fetchFreelancers();
    }, 300);
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
    // Animate scale and shadow as card is dragged
    const dragDistance = Math.abs(x.value);
    const scaleValue = interpolate(dragDistance, [0, SWIPE_THRESHOLD], [1, 0.96], Extrapolation.CLAMP);
    const shadowOpacity = interpolate(dragDistance, [0, SWIPE_THRESHOLD], [0.12, 0.25], Extrapolation.CLAMP);
    // Animate colored shadow/glow based on swipe direction
    let shadowColor = '#4C63B6';
    if (x.value > 0) shadowColor = '#4CD964'; // right swipe = green glow
    if (x.value < 0) shadowColor = '#FF6B6B'; // left swipe = red glow
    return {
      transform: [
        { translateX: x.value },
        { translateY: y.value + entranceTranslateY.value },
        { rotate: rotateValue },
        { scale: scale.value * scaleValue },
      ],
      opacity: cardOpacity.value * entranceOpacity.value,
      shadowColor,
      shadowOpacity,
    };
  });

  // Animated swipe instruction
  const instructionOpacity = useSharedValue(0);
  useEffect(() => {
    instructionOpacity.value = withTiming(1, { duration: 600 });
    return () => { instructionOpacity.value = 0; };
  }, [currentIndex]);
  const instructionStyle = useAnimatedStyle(() => ({
    opacity: instructionOpacity.value,
    transform: [{ translateY: interpolate(instructionOpacity.value, [0, 1], [20, 0]) }],
  }));

  const uploadImage = async (uri) => {
    setUploading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) return;

      // Fetch the file as a blob and set the type explicitly
      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: 'image/jpeg' }); // or 'image/png' if PNG

      const filePath = `${user.id}/profile.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, blob, {
          cacheControl: '3600',
          upsert: true,
          contentType: 'image/jpeg', // Make sure this matches the Blob type
        });

      if (uploadError) {
        console.log('Upload error:', uploadError.message);
        Alert.alert('Upload Failed', uploadError.message);
        return;
      }

      const { data: publicUrlData, error: publicUrlError } = await supabase
        .storage
        .from('profiles')
        .getPublicUrl(filePath);

      if (publicUrlError) {
        console.log('Error getting public URL:', publicUrlError.message);
        return;
      }

      if (publicUrlData?.publicUrl) {
        const imageUrl = publicUrlData.publicUrl;
        setProfile(prev => ({ ...prev, image_url: imageUrl + '?cache=' + Date.now() }));
        await supabase
          .from('profiles')
          .update({ image_url: imageUrl })
          .eq('id', user.id);
      }
    } catch (error) {
      console.log('Upload image error:', error.message);
      Alert.alert('Error', 'Failed to upload the image.');
    } finally {
      setUploading(false);
    }
  };

  // Render appropriate content based on loading state and available freelancers
  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4C63B6" />
          <Text style={styles.loadingText}>Loading freelancers...</Text>
        </View>
      );
    }
    
    if (freelancers.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No freelancers available at the moment</Text>
          <TouchableOpacity 
            style={styles.reloadButton} 
            onPress={handleReloadFreelancers}
          >
            <Text style={styles.reloadButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    if (currentIndex >= freelancers.length) {
      return (
        <View style={styles.endContainer}>
          <Text style={styles.endText}>You've viewed all available profiles</Text>
          
          <TouchableOpacity 
            style={styles.reloadButton} 
            onPress={handleReloadFreelancers}
            disabled={isReloading}
          >
            {isReloading ? (
              <View style={styles.reloadButtonContent}>
                <ActivityIndicator size="small" color="white" />
                <Text style={[styles.reloadButtonText, {marginLeft: 10}]}>Reloading...</Text>
              </View>
            ) : (
              <View style={styles.reloadButtonContent}>
                <FontAwesome name="refresh" size={20} color="white" style={{marginRight: 10}} />
                <Text style={styles.reloadButtonText}>Reload Freelancers</Text>
              </View>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.resetButton} 
            onPress={() => setCurrentIndex(0)}
          >
            <Text style={styles.resetButtonText}>Start Over (Same Profiles)</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const currentFreelancer = freelancers[currentIndex];
    
    return (
      <GestureHandlerRootView style={styles.gestureContainer}>
        <Animated.View style={[styles.swipeInstructionContainer, instructionStyle]}>
          <Text style={styles.swipeInstructionText}>Swipe left to pass, right to match</Text>
        </Animated.View>
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
                  key={currentFreelancer.image_url}
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
  
  // Action buttons are now commented out / removed
  // The renderActionButtons function is kept but not used
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
                  key={selectedFreelancer.image_url}
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
        <Text style={styles.headerTitle}></Text>
        {renderContent()}
        {/* Action buttons removed from here */}
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
    height: SCREEN_HEIGHT * 0.75,
    backgroundColor: 'white',
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#4C63B6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F1F6',
  },
  imageContainer: {
    height: '40%',
    width: '100%',
    backgroundColor: '#f0f0f0',
    position: 'relative',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    borderWidth: 2,
    borderColor: '#E0E7FF',
  },
  imageDarkOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.18)',
    justifyContent: 'flex-end',
  },
  imageBottomInfo: {
    padding: 20,
  },
  nameOnImage: {
    fontSize: 30,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 6,
    marginBottom: 2,
  },
  ratingOnImage: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 7,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  ratingTextOnImage: {
    marginLeft: 6,
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
    marginBottom: 14,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    shadowColor: '#4C63B6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    paddingHorizontal: 8,
  },
  stat: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'column',
    gap: 2,
  },
  statValue: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#2D3A4B',
  },
  statLabel: {
    fontSize: 13,
    color: '#7B8794',
    marginTop: 2,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 10, // Reduced from 15 to 10
  },
  detailsScroll: {
    flex: 1,
    paddingHorizontal: 2,
    paddingBottom: 10,
  },
  detailSection: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#4C63B6',
    marginBottom: 7,
    letterSpacing: 0.2,
  },
  detailText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 21,
    marginBottom: 2,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 7,
    gap: 2,
  },
  skillChip: {
    backgroundColor: '#E0E7FF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    margin: 3,
    shadowColor: '#4C63B6',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 1,
  },
  skillText: {
    fontSize: 13,
    color: '#4C63B6',
    fontWeight: '600',
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
    marginTop: 15,
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
    marginBottom: 20,
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
  reloadButton: {
    backgroundColor: 'linear-gradient(90deg, #4C63B6 0%, #6B8DD6 100%)',
    paddingHorizontal: 25,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#4C63B6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 7,
    elevation: 3,
    marginBottom: 15,
    minWidth: 200,
    alignItems: 'center',
  },
  reloadButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reloadButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 17,
    letterSpacing: 0.2,
  },
  resetButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 25,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#cccccc',
    minWidth: 200,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#666',
    fontWeight: '500',
    fontSize: 15,
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
    lineHeight: 22,
    marginBottom: 25,
  },
  chatButton: {
    backgroundColor: '#4CD964',
    paddingHorizontal: 25,
    paddingVertical: 14,
    borderRadius: 10,
    width: '100%',
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
    backgroundColor: 'transparent',
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#666',
    fontWeight: '500',
    fontSize: 16,
  },
  swipeInstructionContainer: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  swipeInstructionText: {
    color: '#888',
    fontSize: 14,
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  }
});

export default Match;