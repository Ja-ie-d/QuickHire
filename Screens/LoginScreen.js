// screens/LoginScreen.jstest
import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ScrollView,
  SafeAreaView,
  Keyboard,
  TouchableWithoutFeedback
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

export default function LoginScreen({ navigation }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const passwordInputRef = useRef(null);

  // Handle screen dimension changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });
    
    return () => subscription?.remove();
  }, []);

  // Keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const isLandscape = dimensions.width > dimensions.height;

  const handleLoginPress = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setIsLoading(true);
    
    try {
      await signIn(email, password);
      navigation.navigate('Main');
    } catch (error) {
      console.error('Unexpected error during login:', error);
      Alert.alert('Error', 'Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#e0e7ff", "#f5f5f5"]} style={styles.gradientBg}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 20}
          enabled
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView 
              contentContainerStyle={[
                styles.scrollContainer,
                isLandscape && styles.landscapeContainer,
                keyboardVisible && styles.keyboardVisibleContainer
              ]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={[
                styles.logoContainer,
                isLandscape && styles.landscapeLogoContainer
              ]}>
                <View style={styles.logoShadow}>
                  <Image 
                    source={{ uri: 'https://via.placeholder.com/150' }} 
                    style={[
                      styles.logo,
                      isLandscape && styles.landscapeLogo
                    ]}
                  />
                </View>
                <Text style={styles.appName}>QuickHire</Text>
                <Text style={styles.tagline}>Find the perfect freelancer for your projects</Text>
              </View>
              <View style={[
                styles.formCard,
                isLandscape && styles.landscapeFormContainer
              ]}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="next"
                  autoComplete="email"
                  onSubmitEditing={() => passwordInputRef.current?.focus()}
                  blurOnSubmit={false}
                  placeholderTextColor="#b0b0b0"
                />
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  returnKeyType="done"
                  autoComplete="password"
                  ref={passwordInputRef}
                  onSubmitEditing={handleLoginPress}
                  placeholderTextColor="#b0b0b0"
                />
                <TouchableOpacity 
                  style={[styles.loginButton, isLoading && styles.disabledButton]}
                  onPress={handleLoginPress}
                  disabled={isLoading}
                  activeOpacity={0.85}
                >
                  <LinearGradient colors={["#2196F3", "#6B8DD6"]} style={styles.loginButtonGradient}>
                    <Text style={styles.loginButtonText}>
                      {isLoading ? 'Logging in...' : 'Login'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.signupButton}
                  onPress={() => navigation.navigate('SignUp')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.signupButtonText}>
                    Create New Account
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.forgotPasswordButton}
                  onPress={() => navigation.navigate('ForgotPassword')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.forgotPasswordText}>
                    
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 20, // Add padding at the bottom
  },
  keyboardVisibleContainer: {
    paddingBottom: Platform.OS === 'ios' ? 120 : 80, // Extra padding when keyboard is visible
  },
  landscapeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: Dimensions.get('window').height * 0.08, // Responsive margin
    marginBottom: Dimensions.get('window').height * 0.04,
  },
  landscapeLogoContainer: {
    flex: 1,
    justifyContent: 'center',
    marginTop: 0,
    paddingHorizontal: 20,
  },
  logo: {
    width: Math.min(100, Dimensions.get('window').width * 0.2),
    height: Math.min(100, Dimensions.get('window').width * 0.2),
    resizeMode: 'contain',
    marginBottom: 20,
  },
  landscapeLogo: {
    width: 80,
    height: 80,
  },
  appName: {
    fontSize: Math.min(32, Dimensions.get('window').width * 0.08),
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2196F3',
  },
  tagline: {
    fontSize: Math.min(16, Dimensions.get('window').width * 0.04),
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: 18,
    padding: 24,
    marginHorizontal: 10,
    shadowColor: '#4C63B6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 6,
    marginTop: 10,
    marginBottom: 20,
  },
  label: {
    fontSize: Math.min(16, Dimensions.get('window').width * 0.04),
    marginBottom: 5,
    color: '#333',
  },
  input: {
    backgroundColor: '#f7faff',
    borderWidth: 1.5,
    borderColor: '#d0d7e2',
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 22,
    marginBottom: 18,
    fontSize: Math.min(16, Dimensions.get('window').width * 0.04),
    color: '#222',
    shadowColor: '#4C63B6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  loginButton: {
    borderRadius: 30,
    marginTop: 10,
    overflow: 'hidden',
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
  loginButtonGradient: {
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#90CAF9',
  },
  loginButtonText: {
    color: 'white',
    fontSize: Math.min(18, Dimensions.get('window').width * 0.045),
    fontWeight: 'bold',
    letterSpacing: 0.2,
  },
  signupButton: {
    marginTop: 15,
    alignItems: 'center',
  },
  signupButtonText: {
    color: '#2196F3',
    fontSize: Math.min(16, Dimensions.get('window').width * 0.04),
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  forgotPasswordButton: {
    marginTop: 15,
    alignItems: 'center',
  },
  forgotPasswordText: {
    color: '#2196F3',
    fontSize: Math.min(14, Dimensions.get('window').width * 0.035),
    textDecorationLine: 'underline',
  },
  logoShadow: {
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
    borderRadius: 60,
    marginBottom: 10,
  },
  gradientBg: {
    flex: 1,
  },
});