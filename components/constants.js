import React from 'react';
import { View, Text, GestureHandlerRootView } from 'react-native';
import { GestureHandler, GestureDetector, Gesture } from 'react-native-gesture-handler';

const SWIPE_THRESHOLD = 100; // Define it here for this component

const MyComponent = () => {
  const gestureHandler = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationX > SWIPE_THRESHOLD) {
        console.log('Swiped enough to trigger action');
      }
    });

  return (
    <GestureHandlerRootView>
      <GestureDetector gesture={gestureHandler}>
        <View>
          <Text>Swipe me!</Text>
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};

export default MyComponent;
