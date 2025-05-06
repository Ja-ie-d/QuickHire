import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ChatInput = ({ message = '', setMessage = () => {}, onSend = () => {}, isSending = false }) => {
  const [inputHeight, setInputHeight] = useState(36);
  const inputRef = useRef(null);
  
  const handleSend = () => {
    if (!isSending && message.trim()) {
      onSend();
      // Reset input height after sending
      setInputHeight(36);
      // Keep focus on input after sending
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  // Handle input content size changes
  const handleContentSizeChange = (event) => {
    const { height } = event.nativeEvent.contentSize;
    
    // Apply constraints to input height
    const minHeight = 36;
    const maxHeight = 100;
    const newHeight = Math.min(Math.max(minHeight, height), maxHeight);
    
    if (newHeight !== inputHeight) {
      setInputHeight(newHeight);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            { height: inputHeight }
          ]}
          value={message}
          onChangeText={setMessage}
          placeholder="Type a message..."
          placeholderTextColor="#999"
          multiline
          onContentSizeChange={handleContentSizeChange}
          blurOnSubmit={false}
          selectionColor="#007AFF"
        />
        
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!message.trim() || isSending) && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!message.trim() || isSending}
          activeOpacity={0.7}
        >
          <Ionicons 
            name="send" 
            size={20} 
            color="#fff" 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: 8,
    backgroundColor: '#f8f8f8',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 22,
    paddingHorizontal: 12,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  input: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    color: '#333',
    fontSize: 16,
    minHeight: 36,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  sendButtonDisabled: {
    backgroundColor: '#b0c4de',
  },
});

export default ChatInput;