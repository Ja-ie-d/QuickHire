// App.js with Supabase authentication and Context API integration
import React, { useState, useEffect } from 'react';
import { StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { supabase } from './lib/supabase'; // Import the supabase client

// Import Context Providers
import { MatchProvider } from './context/MatchContext';
import { createContext, useContext } from 'react';

// Create other context objects for global state management
const ChatContext = createContext();
const RatingContext = createContext();
const ProfileContext = createContext();
const AuthContext = createContext();

// Screens
import LoginScreen from './Screens/LoginScreen';
import SwipeScreen from './Screens/SwipeScreen';
import ChatScreen from './Screens/ChatScreen';
import ProfileScreen from './Screens/ProfileScreen';
import SignUpScreen from './Screens/SignUpScreen';
import RatingScreen from './Screens/RatingScreen';

// Data
import { freelancers } from './data/freelancers';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Export Chat Provider
export const ChatProvider = ({ children }) => {
  const [chats, setChats] = useState({});

  const addMessage = (freelancerId, message, isUser = true) => {
    setChats(prevChats => ({
      ...prevChats,
      [freelancerId]: [
        ...prevChats[freelancerId] || [],
        {
          id: Date.now().toString(),
          text: message,
          isUser,
          timestamp: new Date()
        }
      ]
    }));

    // Save message to database
    saveMessageToDatabase(freelancerId, message, isUser);
  };

  // Save message to database
  const saveMessageToDatabase = async (freelancerId, message, isUser) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { error } = await supabase
          .from('messages')
          .insert({
            user_id: user.id,
            freelancer_id: freelancerId,
            message,
            is_from_user: isUser,
            created_at: new Date()
          });
          
        if (error) {
          console.error('Error saving message:', error);
        }
      }
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  return (
    <ChatContext.Provider value={{ chats, setChats, addMessage }}>
      {children}
    </ChatContext.Provider>
  );
};

// Export Rating Provider
export const RatingProvider = ({ children }) => {
  const [ratings, setRatings] = useState({});

  const rateFreelancer = async (freelancerId, ratingValue) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
  
      // Update state locally first
      setRatings(prev => ({
        ...prev,
        [freelancerId]: ratingValue
      }));
  
      // Check if rating already exists
      const { data: existing, error: fetchError } = await supabase
        .from('ratings')
        .select('id')
        .eq('user_id', user.id)
        .eq('freelancer_id', freelancerId)
        .single();
  
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Rating fetch error:', fetchError);
        return;
      }
  
      if (existing) {
        // Update existing rating
        const { error } = await supabase
          .from('ratings')
          .update({
            rating: ratingValue,
            updated_at: new Date()
          })
          .eq('id', existing.id);
  
        if (error) {
          console.error('Update rating error:', error);
        }
      } else {
        // Insert new rating
        const { error } = await supabase
          .from('ratings')
          .insert({
            user_id: user.id,
            freelancer_id: freelancerId,
            rating: ratingValue,
            created_at: new Date()
          });
  
        if (error) {
          console.error('Insert rating error:', error);
        }
      }
  
    } catch (error) {
      console.error('Rating error:', error.message);
    }
  };
  
  
  // Save rating to database
  const saveRatingToDatabase = async (freelancerId, rating) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Check if rating already exists
        const { data, error: fetchError } = await supabase
          .from('ratings')
          .select('*')
          .eq('user_id', user.id)
          .eq('freelancer_id', freelancerId)
          .single();
          
        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is the error code for no rows found
          console.error('Error checking existing rating:', fetchError);
          return;
        }
        
        let saveError;
        
        if (data) {
          // Update existing rating
          const { error } = await supabase
            .from('ratings')
            .update({ 
              rating,
              updated_at: new Date()
            })
            .eq('id', data.id);
            
          saveError = error;
        } else {
          // Insert new rating
          const { error } = await supabase
            .from('ratings')
            .insert({
              user_id: user.id,
              freelancer_id: freelancerId,
              rating,
              created_at: new Date()
            });
            
          saveError = error;
        }
        
        if (saveError) {
          console.error('Error saving rating:', saveError);
        }
      }
    } catch (error) {
      console.error('Error saving rating:', error);
    }
  };

  return (
    <RatingContext.Provider value={{ ratings, setRatings, rateFreelancer }}>
      {children}
    </RatingContext.Provider>
  );
};

// Export Profile Provider
export const ProfileProvider = ({ children }) => {
  const [userProfile, setUserProfile] = useState({
    name: 'Client',
    bio: 'Looking for skilled freelancers',
    email: '1234@gmail.com',
    projectNeeds: 'Web Development, Mobile Apps, Design'
  });

  const updateUserProfile = async (newProfile) => {
    setUserProfile(newProfile);
    
    // Update profile in database
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { error } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            name: newProfile.name,
            bio: newProfile.bio,
            email: newProfile.email,
            project_needs: newProfile.projectNeeds,
            updated_at: new Date()
          });
          
        if (error) {
          console.error('Error updating profile:', error);
        }
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  return (
    <ProfileContext.Provider value={{ userProfile, setUserProfile, updateUserProfile }}>
      {children}
    </ProfileContext.Provider>
  );
};

// Export Auth Provider
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const handleLogin = async (email, password) => {
    try {
      // This is called from LoginScreen after Supabase auth
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login handler error:', error);
      return false;
    }
  };
  
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Signout error:', error);
    }
  };

  // Hooks for other providers to use
  const useChat = () => useContext(ChatContext);
  const useRating = () => useContext(RatingContext);
  const useProfile = () => useContext(ProfileContext);
  const useMatch = () => useContext(MatchContext);

  return (
    <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated, loading, setLoading, handleLogin, handleSignOut }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook for accessing auth context
export const useAuth = () => useContext(AuthContext);
export const useChat = () => useContext(ChatContext);
export const useRating = () => useContext(RatingContext);
export const useProfile = () => useContext(ProfileContext);

// Main Tab Navigator
function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
        
          if (route.name === 'Swipe') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'Chat') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Ratings') {
            iconName = focused ? 'star' : 'star-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'settings' : 'settings-outline';
          }
        
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: 'gray',
        tabBarHideOnKeyboard: true
      })}
    >
      <Tab.Screen name="Swipe" component={SwipeScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Chat" component={ChatScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Ratings" component={RatingScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Check for existing session on app load
  useEffect(() => {
    checkUserSession();
    
    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          setIsAuthenticated(true);
          fetchUserData(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setIsAuthenticated(false);
        }
      }
    );
    
    // Cleanup function
    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  // Function to check if user is already logged in
  const checkUserSession = async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.log('Session error:', error);
        setIsAuthenticated(false);
      } else if (data?.session) {
        // User is logged in
        setIsAuthenticated(true);
        
        // Fetch user data
        fetchUserData(data.session.user.id);
      }
    } catch (error) {
      console.error('Session check error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all user data (profile, matches, chats, ratings)
  const fetchUserData = async (userId) => {
    try {
      // This function will be called when needed
      // Each context provider will handle their own data fetching
      // We'll just log that we're fetching data here
      console.log('Fetching user data for:', userId);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  // Login validation with Supabase
  const handleLogin = async (email, password) => {
    try {
      // This is called from LoginScreen after Supabase auth
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setIsAuthenticated(true);
        fetchUserData(user.id);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login handler error:', error);
      return false;
    }
  };
  
  // Sign out function
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Signout error:', error);
    }
  };

  if (loading) {
    // You can return a loading component here
    return null;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ProfileProvider>
          <MatchProvider>
            <ChatProvider>
              <RatingProvider>
                <NavigationContainer>
                  <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 25}
                  >
                    <Stack.Navigator>
                      {!isAuthenticated ? (
                        <>
                          <Stack.Screen 
                            name="Login" 
                            options={{ headerShown: false }}
                          >
                            {props => <LoginScreen {...props} onLogin={handleLogin} />}
                          </Stack.Screen>

                          <Stack.Screen 
                            name="SignUp" 
                            component={SignUpScreen}
                            options={{ headerShown: false }}
                          />
                        </>
                      ) : (
                        <Stack.Screen 
                          name="Main" 
                          component={MainTabNavigator}
                          options={{ headerShown: false }}
                        />
                      )}
                    </Stack.Navigator>
                  </KeyboardAvoidingView>
                </NavigationContainer>
              </RatingProvider>
            </ChatProvider>
          </MatchProvider>
        </ProfileProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}