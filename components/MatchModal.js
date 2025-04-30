// components/MatchModal.js
import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function MatchModal({ visible, onClose, profile }) {
  if (!profile) return null;
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
    >
      <View style={styles.modalBackground}>
        <View style={styles.modalContainer}>
          <View style={[styles.colorBox, { backgroundColor: profile.color }]} />
          <Text style={styles.matchText}>It's a Match!</Text>
          <Text style={styles.profileName}>{profile.name}</Text>
          <Text style={styles.matchMessage}>You and {profile.name} have matched!</Text>
          
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Continue Swiping</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContainer: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center'
  },
  colorBox: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20
  },
  matchText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FF4081',
    marginBottom: 10
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5
  },
  matchMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666'
  },
  closeButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  }
});