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

const RatingScreen = () => {
    const { matches } = useMatch();
    const { ratings, rateFreelancer } = useRating();
  const [expandedProfileId, setExpandedProfileId] = useState(null);

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
          >
            <Ionicons
              name={star <= currentRating ? 'star' : 'star-outline'}
              size={28}
              color={star <= currentRating ? '#FFD700' : '#BBBBBB'}
              style={styles.star}
            />
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Ratings</Text>
      </View>
      
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
  header: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333333',
  },
  listContainer: {
    padding: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  profileHeader: {
    flexDirection: 'row',
    padding: 15,
    alignItems: 'center',
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  profileTitle: {
    fontSize: 14,
    color: '#666666',
    marginTop: 3,
  },
  profileRating: {
    fontSize: 14,
    color: '#2196F3',
    marginTop: 3,
  },
  expandedContent: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginTop: 10,
    marginBottom: 5,
  },
  profileBio: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  skillBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  skillText: {
    color: '#2196F3',
    fontSize: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 10,
  },
  star: {
    marginHorizontal: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666666',
    marginTop: 20,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    marginTop: 10,
  },
});

export default RatingScreen;