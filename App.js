// App.js with Supabase authentication and Context API integration
import React from 'react';
import { StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Import Context Providers
import { MatchProvider } from './context/MatchContext';
import { AuthProvider } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import { RatingProvider } from './context/RatingContext';
import { ProfileProvider } from './context/ProfileContext';

// Screens
import LoginScreen from './Screens/LoginScreen';
import SwipeScreen from './Screens/SwipeScreen';
import ChatScreen from './Screens/ChatScreen';
import ChatListScreen from './Screens/ChatListScreen';
import ProfileScreen from './Screens/ProfileScreen';
import SignUpScreen from './Screens/SignUpScreen';
import RatingScreen from './Screens/RatingScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function ChatStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ChatList"
        component={ChatListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{ headerShown: true }}
      />
    </Stack.Navigator>
  );
}

function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Swipe') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Chats') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'Ratings') {
            iconName = focused ? 'star' : 'star-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Swipe" component={SwipeScreen} />
      <Tab.Screen name="Chats" component={ChatStack} />
      <Tab.Screen name="Ratings" component={RatingScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <MatchProvider>
          <ChatProvider>
            <RatingProvider>
              <ProfileProvider>
                <NavigationContainer>
                  <Stack.Navigator>
                    <Stack.Screen
                      name="Login"
                      component={LoginScreen}
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="SignUp"
                      component={SignUpScreen}
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="Main"
                      component={MainTabNavigator}
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="Rating"
                      component={RatingScreen}
                      options={{ headerShown: false }}
                    />
                  </Stack.Navigator>
                </NavigationContainer>
              </ProfileProvider>
            </RatingProvider>
          </ChatProvider>
        </MatchProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}