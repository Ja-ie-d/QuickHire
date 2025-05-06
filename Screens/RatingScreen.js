// RatingScreen.js
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  FlatList, 
  Image, 
  TouchableOpacity,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMatch } from '../context/MatchContext';
import { useRating } from '../context/RatingContext';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

const RatingScreen = () => {
    const { matches } = useMatch();
    const { ratings, rateFreelancer } = useRating();
  const [expandedProfileId, setExpandedProfileId] = useState(null);
  const scale = useSharedValue(1);
  const animatedStarStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // If no matches, show empty state
  if (!matches || matches.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Ratings</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="star-outline" size={80} color="#CCCCCC" />
          <Text style={styles.emptyText}>
            No freelancers to rate yet.
          </Text>
          <Text style={styles.emptySubText}>
            Swipe right on freelancers to match and rate them!
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Render rating stars for a specific freelancer
  const renderRatingStars = (freelancerId) => {
    const currentRating = ratings[freelancerId] || 0;
    
    return (
      <View style={styles.ratingContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => {
              rateFreelancer(freelancerId, star);
              Alert.alert('Rating Saved', `You rated this freelancer ${star} stars.`);
            }}
            onPressIn={() => { scale.value = withSpring(1.2); }}
            onPressOut={() => { scale.value = withSpring(1); }}
            activeOpacity={0.7}
          >
            <Animated.View style={animatedStarStyle}>
              <Ionicons
                name={star <= currentRating ? 'star' : 'star-outline'}
                size={34}
                color={star <= currentRating ? '#FFD700' : '#BBBBBB'}
                style={styles.star}
              />
            </Animated.View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Render individual freelancer item
  const renderItem = ({ item }) => {
    const isExpanded = expandedProfileId === item.id;
    
    return (
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.profileHeader}
          onPress={() => setExpandedProfileId(isExpanded ? null : item.id)}
        >
          <Image source={{ uri: item.image_url || item.photo || 'https://via.placeholder.com/100' }} style={styles.profileImage} />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{item.name}</Text>
            <Text style={styles.profileTitle}>{item.title}</Text>
            <Text style={styles.profileRating}>
              {ratings[item.id] ? `Current Rating: ${ratings[item.id]}/5` : 'Not Rated'}
            </Text>
          </View>
          <Ionicons 
            name={isExpanded ? 'chevron-up' : 'chevron-down'} 
            size={24} 
            color="#2196F3" 
          />
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.expandedContent}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.profileBio}>{item.bio}</Text>
            
            <Text style={styles.sectionTitle}>Skills</Text>
            <View style={styles.skillsContainer}>
            {item.skills.map((skill, index) => (
  <View key={index} style={styles.skillBadge}>
    <Text style={styles.skillText}>{skill.name} ({skill.level}, {skill.years} yrs)</Text>
  </View>
))}

            </View>
            
            <Text style={styles.sectionTitle}>Rate this Freelancer</Text>
            {renderRatingStars(item.id)}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#e0e7ff", "#f8fafc"]} style={styles.headerGradient}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Ratings</Text>
        </View>
      </LinearGradient>
      
      <FlatList
        data={matches}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
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
  listContainer: {
    padding: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginBottom: 18,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  profileHeader: {
    flexDirection: 'row',
    padding: 18,
    alignItems: 'center',
  },
  profileImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginRight: 18,
    borderWidth: 3,
    borderColor: '#2196F3',
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2196F3',
  },
  profileTitle: {
    fontSize: 15,
    color: '#666666',
    marginTop: 3,
  },
  profileRating: {
    fontSize: 15,
    color: '#2196F3',
    marginTop: 3,
    fontWeight: '600',
  },
  expandedContent: {
    padding: 18,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2196F3',
    marginTop: 10,
    marginBottom: 7,
    letterSpacing: 0.2,
  },
  profileBio: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 8,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  skillBadge: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    shadowColor: '#a5b4fc',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 2,
  },
  skillText: {
    color: '#2196F3',
    fontSize: 13,
    fontWeight: '500',
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 12,
  },
  star: {
    marginHorizontal: 7,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#888',
    marginTop: 22,
  },
  emptySubText: {
    fontSize: 15,
    color: '#999999',
    textAlign: 'center',
    marginTop: 12,
  },
});

export default RatingScreen;