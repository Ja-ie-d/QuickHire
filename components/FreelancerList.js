import React from 'react';
import { ScrollView, View, Text, Image, StyleSheet } from 'react-native';
import FreelancerCard from './FreelancerCard'; // Assuming FreelancerCard is a separate component

const FreelancerList = () => {
  const sampleFreelancers = [
    { id: 1, name: 'John Doe', rating: 4.5, image: 'https://placeimg.com/100/100/people' },
    { id: 2, name: 'Jane Smith', rating: 4.2, image: 'https://placeimg.com/100/100/people' },
    { id: 3, name: 'Alice Brown', rating: 5, image: 'https://placeimg.com/100/100/people' },
    { id: 4, name: 'Robert White', rating: 3.8, image: 'https://placeimg.com/100/100/people' },
  ];

  return (
    <ScrollView style={styles.container}>
      {sampleFreelancers.map((freelancer) => (
        <FreelancerCard
          key={freelancer.id}
          freelancerName={freelancer.name}
          rating={freelancer.rating}
          image={freelancer.image}
        />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
});

export default FreelancerList;
