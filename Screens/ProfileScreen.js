import { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  Alert, 
  Modal, 
  Switch,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  SafeAreaView,
  useWindowDimensions,
  ActivityIndicator
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';


export default function Profile() {
  const { signOut } = useAuth();
  const navigation = useNavigation();
  const { width, height } = useWindowDimensions(); // Dynamic dimensions that update on rotation
  const isSmallDevice = width < 375;
  const isLandscape = width > height;
  
  const [profile, setProfile] = useState({
    name: '',
    bio: '',
    skills: [],
    hourly_rate: '',
    is_freelancer: false,
    image_url: '',
    available_for_work: false,
    years_experience: 1,
    availability: {
      hours_per_week: 40,
      timezone: 'GMT',
      preferred_hours: '9 AM - 5 PM'
    },
    certificates: []
  });
  const [newSkill, setNewSkill] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Modal states
  const [availabilityModalVisible, setAvailabilityModalVisible] = useState(false);
  const [certificateModalVisible, setCertificateModalVisible] = useState(false);
  
  // Certificate form state
  const [newCertificate, setNewCertificate] = useState({
    name: '',
    year: new Date().getFullYear(),
    issuer: ''
  });

  // Profile image press animation
  const scale = useSharedValue(1);
  const animatedImageStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const handleImagePressIn = () => { scale.value = withSpring(1.08); };
  const handleImagePressOut = () => { scale.value = withSpring(1); };

  useEffect(() => {
    fetchProfile();
    requestPermission();
  }, []);

  const requestPermission = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'We need access to your media library.');
      }
    } catch (error) {
      console.log('Permission request error:', error.message);
    }
  };

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.log('User error:', userError.message);
        return;
      }
      if (!user) {
        console.log('No user found');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code === '42P01') {
        console.log('Profiles table not found - will create on save');
      } else if (error) {
        console.log('Error fetching profile:', error.message);
      } else if (data) {
        let parsedData = { ...data };

        const { data: ratingData, error: ratingError } = await supabase
          .from('ratings')
          .select('rating')
          .eq('freelancer_id', user.id)
          .maybeSingle();

        if (ratingError) {
          console.log('Error fetching rating:', ratingError.message);
        } else if (ratingData) {
          parsedData.rating = ratingData.rating; // Attach to profile
        }
        
        // Parse skills
        if (typeof parsedData.skills === 'string') {
          try {
            parsedData.skills = JSON.parse(parsedData.skills);
          } catch {
            parsedData.skills = [];
          }
        } else if (!Array.isArray(parsedData.skills)) {
          parsedData.skills = [];
        }
        
        // Parse availability
        if (typeof parsedData.availability === 'string') {
          try {
            parsedData.availability = JSON.parse(parsedData.availability);
          } catch {
            parsedData.availability = {
              hours_per_week: 40,
              timezone: 'GMT',
              preferred_hours: '9 AM - 5 PM'
            };
          }
        } else if (!parsedData.availability) {
          parsedData.availability = {
            hours_per_week: 40,
            timezone: 'GMT',
            preferred_hours: '9 AM - 5 PM'
          };
        }
        
        // Parse certificates
        if (typeof parsedData.certificates === 'string') {
          try {
            parsedData.certificates = JSON.parse(parsedData.certificates);
          } catch {
            parsedData.certificates = [];
          }
        } else if (!Array.isArray(parsedData.certificates)) {
          parsedData.certificates = [];
        }
        
        // Add cache busting parameter to image_url if it exists
        if (parsedData.image_url) {
          parsedData.image_url = `${parsedData.image_url}?cache=${new Date().getTime()}`;
        }
        
        setProfile(parsedData);
      }
    } catch (error) {
      console.log('Auth error:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImagePick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });
  
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImageUri = result.assets[0].uri;
        await uploadImage(selectedImageUri);
      }
    } catch (error) {
      console.log('Image picking error:', error.message);
      Alert.alert('Error', 'Failed to pick the image.');
    }
  };
  
  const uploadImage = async (uri) => {
    setUploading(true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.log('Session error:', sessionError?.message);
        return;
      }
      const user = session.user;
      const filePath = `${user.id}/profile.jpg`;
      // Supabase Storage REST endpoint
      const uploadUrl = `https://jbgroqozrlptdfkilpuk.supabase.co/storage/v1/object/profiles/${filePath}`;
      const response = await FileSystem.uploadAsync(uploadUrl, uri, {
        httpMethod: 'POST',
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        fieldName: 'file',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'x-upsert': 'true',
        },
      });
      if (response.status !== 200 && response.status !== 201) {
        console.log('Upload failed:', response.body);
        Alert.alert('Upload Failed', response.body);
        return;
      }
      // Get the public URL
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
        setProfile(prev => ({ ...prev, image_url: `${imageUrl}?t=${Date.now()}` }));
        // Update DB
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

  const handleAddSkill = () => {
    if (newSkill.trim() && !profile.skills.includes(newSkill.trim())) {
      setProfile(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()],
      }));
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skill) => {
    setProfile(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill),
    }));
  };

  const handleAddCertificate = () => {
    if (newCertificate.name.trim() && newCertificate.issuer.trim()) {
      setProfile(prev => ({
        ...prev,
        certificates: [...prev.certificates, {
          ...newCertificate,
          name: newCertificate.name.trim(),
          issuer: newCertificate.issuer.trim()
        }]
      }));
      setNewCertificate({
        name: '',
        year: new Date().getFullYear(),
        issuer: ''
      });
      setCertificateModalVisible(false);
    } else {
      Alert.alert('Incomplete Information', 'Please fill in the certificate name and issuer.');
    }
  };

  const handleRemoveCertificate = (index) => {
    setProfile(prev => ({
      ...prev,
      certificates: prev.certificates.filter((_, i) => i !== index)
    }));
  };

  const updateAvailability = () => {
    // Validation
    const hoursPerWeek = Number(profile.availability.hours_per_week);
    if (isNaN(hoursPerWeek) || hoursPerWeek <= 0 || hoursPerWeek > 168) {
      Alert.alert('Invalid Input', 'Please enter a valid number of hours per week (1-168).');
      return;
    }
    
    if (!profile.availability.timezone.trim()) {
      Alert.alert('Missing Information', 'Please enter your timezone.');
      return;
    }
    
    if (!profile.availability.preferred_hours.trim()) {
      Alert.alert('Missing Information', 'Please enter your preferred working hours.');
      return;
    }
    
    setAvailabilityModalVisible(false);
  };

  const toggleFreelancerStatus = () => {
    const newStatus = !profile.is_freelancer;

    setProfile(prev => ({
      ...prev,
      is_freelancer: newStatus,
      available_for_work: newStatus ? true : prev.available_for_work
    }));

    if (newStatus) {
      Alert.alert(
        "Freelancer Mode Activated",
        "Your profile will now be visible to potential clients on the swipe page.",
        [{ text: "OK" }]
      );
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.log('User error:', userError?.message);
        setLoading(false);
        return;
      }

      if (profile.is_freelancer && (!profile.name || !profile.bio || profile.skills.length === 0 || !profile.hourly_rate)) {
        Alert.alert(
          "Incomplete Profile",
          "Please complete your profile before activating freelancer mode. Make sure you have a name, bio, at least one skill, and an hourly rate.",
          [{ text: "OK" }]
        );
        setLoading(false);
        return;
      }

      // Remove cache parameter from image_url before saving to database
      let imageUrlForDB = profile.image_url;
      if (imageUrlForDB && imageUrlForDB.includes('?cache=')) {
        imageUrlForDB = imageUrlForDB.split('?cache=')[0];
      }

      const profileData = {
        id: user.id,
        name: profile.name,
        bio: profile.bio,
        skills: profile.skills,
        hourly_rate: profile.hourly_rate ? parseFloat(profile.hourly_rate) : null,
        is_freelancer: profile.is_freelancer,
        image_url: imageUrlForDB,
        available_for_work: profile.is_freelancer && profile.available_for_work,
        years_experience: profile.years_experience ? parseInt(profile.years_experience) : 1,
        availability: profile.availability,
        certificates: profile.certificates,
        updated_at: new Date().toISOString()
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(profileData);

      if (profileError) {
        console.log('Save error:', profileError.message);
        Alert.alert('Error', `Failed to update profile: ${profileError.message}`);
        setLoading(false);
        return;
      }

      if (profile.is_freelancer) {
        const freelancerData = {
          id: user.id,
          profile_id: user.id,
          name: profile.name,
          bio: profile.bio,
          hourly_rate: parseFloat(profile.hourly_rate) || 0,
          image_url: imageUrlForDB,
          available_for_work: true,
          rating: 4.5,
          years_experience: parseInt(profile.years_experience) || 1,
          total_reviews: 0,
          skills: profile.skills.map(skill => ({
            name: skill,
            years: 1,
            level: 'Intermediate'
          })),
          availability: profile.availability,
          certificates: profile.certificates,
          last_updated: new Date().toISOString()
        };

        const { error: freelancerError } = await supabase
          .from('freelancers')
          .upsert(freelancerData);

        if (freelancerError) {
          console.log('Freelancer update error:', freelancerError.message);
          Alert.alert('Warning', `Profile saved but freelancer status may not be updated properly: ${freelancerError.message}`);
        } else {
          Alert.alert('Success', 'Profile updated successfully! Your profile is now visible on the swipe page.');
        }
      } else {
        const { error: freelancerCheckError, data: existingFreelancer } = await supabase
          .from('freelancers')
          .select('id')
          .eq('id', user.id)
          .single();

        if (!freelancerCheckError && existingFreelancer) {
          const { error: updateError } = await supabase
            .from('freelancers')
            .update({ available_for_work: false })
            .eq('id', user.id);

          if (updateError) {
            console.log('Error updating freelancer availability:', updateError.message);
          }
        }

        Alert.alert('Success', 'Profile updated successfully!');
      }
    } catch (error) {
      console.log('Save profile error:', error.message);
      Alert.alert('Error', 'An unexpected error occurred while saving your profile.');
    }

    setLoading(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  // Availability Modal
  const renderAvailabilityModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={availabilityModalVisible}
      onRequestClose={() => setAvailabilityModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={[styles.modalContent, isSmallDevice && styles.modalContentSmall]}>
          <Text style={styles.modalTitle}>Set Your Availability</Text>
          
          <Text style={styles.label}>Hours per week</Text>
          <TextInput
            style={styles.input}
            value={String(profile.availability.hours_per_week)}
            onChangeText={(text) => setProfile(prev => ({
              ...prev,
              availability: { ...prev.availability, hours_per_week: text }
            }))}
            keyboardType="numeric"
            placeholder="40"
          />
          
          <Text style={styles.label}>Timezone</Text>
          <TextInput
            style={styles.input}
            value={profile.availability.timezone}
            onChangeText={(text) => setProfile(prev => ({
              ...prev,
              availability: { ...prev.availability, timezone: text }
            }))}
            placeholder="GMT, EST, PST, etc."
          />
          
          <Text style={styles.label}>Preferred Working Hours</Text>
          <TextInput
            style={styles.input}
            value={profile.availability.preferred_hours}
            onChangeText={(text) => setProfile(prev => ({
              ...prev,
              availability: { ...prev.availability, preferred_hours: text }
            }))}
            placeholder="e.g. 9 AM - 5 PM"
          />
          
          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]} 
              onPress={() => setAvailabilityModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modalButton, styles.saveButton]} 
              onPress={updateAvailability}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Certificate Modal
  const renderCertificateModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={certificateModalVisible}
      onRequestClose={() => setCertificateModalVisible(false)}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalContainer}
      >
        <View style={[styles.modalContent, isSmallDevice && styles.modalContentSmall]}>
          <Text style={styles.modalTitle}>Add Certificate</Text>
          
          <Text style={styles.label}>Certificate Name</Text>
          <TextInput
            style={styles.input}
            value={newCertificate.name}
            onChangeText={(text) => setNewCertificate(prev => ({ ...prev, name: text }))}
            placeholder="e.g. AWS Certified Developer"
          />
          
          <Text style={styles.label}>Year Obtained</Text>
          <TextInput
            style={styles.input}
            value={String(newCertificate.year)}
            onChangeText={(text) => setNewCertificate(prev => ({ ...prev, year: text }))}
            keyboardType="numeric"
            placeholder="2023"
          />
          
          <Text style={styles.label}>Issuing Organization</Text>
          <TextInput
            style={styles.input}
            value={newCertificate.issuer}
            onChangeText={(text) => setNewCertificate(prev => ({ ...prev, issuer: text }))}
            placeholder="e.g. Amazon Web Services"
          />
          
          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]} 
              onPress={() => setCertificateModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modalButton, styles.saveButton]} 
              onPress={handleAddCertificate}
            >
              <Text style={styles.saveButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  const getImageSize = () => {
    if (isSmallDevice) return 100;
    if (isLandscape) return 100;
    return 120;
  };

  const imageSize = getImageSize();

  // Debug log for image URL before rendering
  if (profile.image_url && profile.image_url.startsWith('http')) {
    console.log('Rendering profile image with URL:', profile.image_url);
  }

  if (loading && !profile.name) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView 
          style={styles.container}
          contentContainerStyle={isLandscape ? styles.landscapeContent : styles.portraitContent}
        >
          <LinearGradient colors={["#e0e7ff", "#f8fafc"]} style={styles.headerGradient}>
            <View style={[
              styles.header, 
              isLandscape && styles.landscapeHeader
            ]}>
              <TouchableOpacity 
                onPress={handleImagePick}
                disabled={uploading}
                style={styles.imageContainer}
                onPressIn={handleImagePressIn}
                onPressOut={handleImagePressOut}
                activeOpacity={0.8}
              >
                {uploading && (
                  <View style={styles.uploadingOverlay}>
                    <ActivityIndicator size="small" color="#fff" />
                  </View>
                )}
                {profile.image_url && profile.image_url.startsWith('http') ? (
                  <Animated.Image
                    source={{ 
                      uri: profile.image_url,
                      cache: 'reload',
                      headers: { Pragma: 'no-cache' }
                    }}
                    style={[
                      styles.profileImage, 
                      { width: imageSize, height: imageSize, borderRadius: imageSize/2 },
                      animatedImageStyle
                    ]}
                    resizeMode="cover"
                    onError={(error) => {
                      console.log('Image loading error:', error.nativeEvent);
                      setProfile(prev => ({ ...prev, image_url: '' }));
                    }}
                    key={profile.image_url}
                  />
                ) : (
                  <View style={[
                    styles.profileImagePlaceholder,
                    { width: imageSize, height: imageSize, borderRadius: imageSize/2 }
                  ]}>
                    <Text style={[styles.addPhotoText, isSmallDevice ? styles.smallText : null]}>Add Photo</Text>
                  </View>
                )}
              </TouchableOpacity>
              {profile.name ? (
                <Text style={styles.profileName}>{profile.name}</Text>
              ) : (
                <Text style={styles.profileNamePlaceholder}>Your Name</Text>
              )}
              {profile.is_freelancer && (
                <View style={styles.freelancerBadge}>
                  <Text style={styles.freelancerBadgeText}>Freelancer</Text>
                </View>
              )}
              {profile.rating && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5 }}>
                  <Ionicons name="star" size={18} color="#FFD700" />
                  <Text style={{ fontSize: 16, color: '#555', marginLeft: 4 }}>
                    {profile.rating.toFixed(1)} / 5
                  </Text>
                </View>
              )}
            </View>
          </LinearGradient>

          <View style={[
            styles.form,
            isLandscape && styles.landscapeForm
          ]}>
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Basic Information</Text>
              
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={[styles.input, isSmallDevice && styles.smallInput]}
                value={profile.name}
                onChangeText={name => setProfile(prev => ({ ...prev, name }))}
                placeholder="Your name"
              />

              <Text style={styles.label}>Bio</Text>
              <TextInput
                style={[styles.input, styles.textArea, isSmallDevice && styles.smallText]}
                value={profile.bio}
                onChangeText={bio => setProfile(prev => ({ ...prev, bio }))}
                placeholder="Tell us about yourself"
                multiline
                numberOfLines={4}
              />

              <Text style={styles.label}>Years of Experience</Text>
              <TextInput
                style={[styles.input, isSmallDevice && styles.smallInput]}
                value={String(profile.years_experience)}
                onChangeText={years => setProfile(prev => ({ ...prev, years_experience: years }))}
                placeholder="Years of professional experience"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Skills</Text>
              
              <View style={styles.skillsContainer}>
                {profile.skills.length === 0 ? (
                  <Text style={styles.noItemsText}>No skills added yet</Text>
                ) : (
                  profile.skills.map((skill, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[styles.skill, isSmallDevice && styles.smallSkill]}
                      onPress={() => handleRemoveSkill(skill)}
                    >
                      <Text style={[styles.skillText, isSmallDevice && styles.smallText]}>{skill}</Text>
                      <Text style={styles.removeSkillIcon}>×</Text>
                    </TouchableOpacity>
                  ))
                )}
              </View>

              <View style={styles.addSkill}>
                <TextInput
                  style={[styles.input, { flex: 1, marginBottom: 0 }, isSmallDevice && styles.smallInput]}
                  value={newSkill}
                  onChangeText={setNewSkill}
                  placeholder="Add a skill"
                />
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={handleAddSkill}
                >
                  <Text style={[styles.addButtonText, isSmallDevice && styles.smallText]}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Availability Section */}
            <View style={styles.formSection}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, isSmallDevice && styles.smallSectionTitle]}>Availability</Text>
                <TouchableOpacity 
                  style={styles.editButton}
                  onPress={() => setAvailabilityModalVisible(true)}
                >
                  <Text style={[styles.editButtonText, isSmallDevice && styles.smallText]}>Edit</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, isSmallDevice && styles.smallText]}>Hours per week:</Text>
                  <Text style={[styles.infoValue, isSmallDevice && styles.smallText]}>{profile.availability.hours_per_week}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, isSmallDevice && styles.smallText]}>Timezone:</Text>
                  <Text style={[styles.infoValue, isSmallDevice && styles.smallText]}>{profile.availability.timezone}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, isSmallDevice && styles.smallText]}>Preferred hours:</Text>
                  <Text style={[styles.infoValue, isSmallDevice && styles.smallText]}>{profile.availability.preferred_hours}</Text>
                </View>
              </View>
            </View>

            {/* Certificates Section */}
            <View style={styles.formSection}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, isSmallDevice && styles.smallSectionTitle]}>Certificates</Text>
                <TouchableOpacity 
                  style={styles.editButton}
                  onPress={() => setCertificateModalVisible(true)}
                >
                  <Text style={[styles.editButtonText, isSmallDevice && styles.smallText]}>Add New</Text>
                </TouchableOpacity>
              </View>

              {profile.certificates.length === 0 ? (
                <Text style={[styles.noItemsText, isSmallDevice && styles.smallText]}>No certificates added yet</Text>
              ) : (
                profile.certificates.map((cert, index) => (
                  <View key={index} style={styles.certificateCard}>
                    <View style={styles.certificateHeader}>
                      <Text style={[styles.certificateName, isSmallDevice && styles.smallText]}>{cert.name}</Text>
                      <TouchableOpacity onPress={() => handleRemoveCertificate(index)}>
                        <Text style={[styles.removeText, isSmallDevice && styles.smallText]}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={[styles.certificateDetails, isSmallDevice && styles.smallText]}>{cert.issuer} • {cert.year}</Text>
                  </View>
                ))
              )}
            </View>

            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Blue-Collar Settings</Text>
              
              <Text style={styles.label}>Hourly Rate ($)</Text>
              <TextInput
                style={[styles.input, isSmallDevice && styles.smallInput]}
                value={profile.hourly_rate?.toString() || ''}
                onChangeText={rate => setProfile(prev => ({ ...prev, hourly_rate: rate }))}
                placeholder="Your hourly rate"
                keyboardType="numeric"
              />

              <TouchableOpacity
                style={[
                  styles.freelancerToggle,
                  profile.is_freelancer && styles.freelancerToggleActive,
                ]}
                onPress={toggleFreelancerStatus}
              >
                <Text style={[
                  styles.freelancerToggleText,
                  profile.is_freelancer && styles.freelancerToggleTextActive,
                  isSmallDevice && styles.smallText
                ]}>
                 I want to be available for Blue-Collar work
                </Text>
                <View style={[
                  styles.toggleSwitch,
                  profile.is_freelancer && styles.toggleSwitchActive
                ]}>
                  <View style={[
                    styles.toggleBall,
                    profile.is_freelancer && styles.toggleBallActive
                  ]} />
                </View>
              </TouchableOpacity>

              {profile.is_freelancer && (
                <View style={styles.availabilityToggleContainer}>
                  <Text style={[styles.availabilityToggleLabel, isSmallDevice && styles.smallText]}>
                    Available for work now
                  </Text>
                  <Switch
                    value={profile.available_for_work}
                    onValueChange={(value) => setProfile(prev => ({ ...prev, available_for_work: value }))}
                    trackColor={{ false: '#d1d1d1', true: '#34C759' }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              )}
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.button, styles.saveButton]}
                onPress={handleSave}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Profile</Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.signOutButton]}
                onPress={handleSignOut}
              >
                <Text style={styles.signOutButtonText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      {renderAvailabilityModal()}
      {renderCertificateModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  portraitContent: {
    paddingBottom: 30,
  },
  landscapeContent: {
    paddingBottom: 30,
    flexDirection: 'row',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  headerGradient: {
    width: '100%',
    paddingBottom: 10,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  header: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  profileImage: {
    backgroundColor: '#E1E1E1',
    borderWidth: 3,
    borderColor: '#2196F3',
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  profileImagePlaceholder: {
    backgroundColor: '#E1E1E1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#c7d2fe',
    shadowColor: '#a5b4fc',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  addPhotoText: {
    color: '#555',
    fontSize: 14,
    fontWeight: '500',
  },
  profileName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2196F3',
    marginTop: 8,
    letterSpacing: 0.5,
  },
  profileNamePlaceholder: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#888',
  },
  freelancerBadge: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 18,
    marginTop: 12,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  freelancerBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  form: {
    padding: 20,
  },
  landscapeForm: {
    width: '70%',
  },
  formSection: {
    marginBottom: 28,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 18,
    letterSpacing: 0.5,
  },
  smallSectionTitle: {
    fontSize: 16,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#c7d2fe',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: '#F4F6FB',
    shadowColor: '#a5b4fc',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  inputFocused: {
    borderColor: '#2196F3',
    backgroundColor: '#fff',
  },
  smallInput: {
    fontSize: 14,
    paddingVertical: 8,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  smallText: {
    fontSize: 12,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  skill: {
    backgroundColor: '#e3f2fd',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 7,
    margin: 4,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#a5b4fc',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 2,
  },
  smallSkill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  skillText: {
    color: '#2196F3',
    fontWeight: '500',
  },
  removeSkillIcon: {
    color: '#0277BD',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 5,
  },
  addSkill: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginLeft: 10,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    padding: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    color: '#666',
    fontSize: 14,
  },
  infoValue: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  editButton: {
    backgroundColor: '#F0F0F0',
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  editButtonText: {
    color: '#555',
    fontSize: 14,
  },
  noItemsText: {
    color: '#888',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  certificateCard: {
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#a5b4fc',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 2,
  },
  certificateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  certificateName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  certificateDetails: {
    color: '#666',
    fontSize: 14,
  },
  removeText: {
    color: '#FF3B30',
    fontSize: 14,
  },
  freelancerToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0F0F0',
    borderRadius: 25,
    padding: 15,
    marginTop: 10,
    marginBottom: 15,
  },
  freelancerToggleActive: {
    backgroundColor: '#E1F5FE',
  },
  freelancerToggleText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  freelancerToggleTextActive: {
    color: '#0277BD',
  },
  toggleSwitch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#DDDDDD',
    padding: 2,
  },
  toggleSwitchActive: {
    backgroundColor: '#007AFF',
  },
  toggleBall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  toggleBallActive: {
    transform: [{ translateX: 22 }],
  },
  availabilityToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  availabilityToggleLabel: {
    fontSize: 16,
    color: '#333',
  },
  buttonContainer: {
    marginTop: 10,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  saveButton: {
    backgroundColor: '#2196F3',
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  signOutButton: {
    backgroundColor: '#F0F0F0',
  },
  signOutButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  modalContentSmall: {
    width: '90%',
    padding: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
  },
  cancelButtonText: {
    color: '#555',
    fontWeight: '500',
  },
});