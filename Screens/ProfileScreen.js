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
import { Buffer } from 'buffer';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';


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
        mediaTypes: 'images',
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
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.log('User error while uploading:', userError?.message);
        return;
      }
  
      console.log('Uploading to profiles bucket...');
  
      // Read the file
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
  
      const binary = Buffer.from(base64, 'base64');
  
      // Here define the correct filePath
      const filePath = `${user.id}/profile.jpg`;
  
      // Step 1: Upload the image
      const { data, error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, binary, {
          cacheControl: '3600',
          upsert: true,
          contentType: 'image/jpeg',
        });
  
      if (uploadError) {
        console.log('Upload error:', uploadError.message);
        Alert.alert('Upload Failed', uploadError.message);
        return;
      }
  
      // Step 2: Get the public URL
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
        console.log('Image URL set to:', imageUrl);
  
        // Update profile state locally
        setProfile(prev => ({ ...prev, image_url: imageUrl }));
  
        // Also update database
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ image_url: imageUrl })
          .eq('id', user.id);
  
        if (updateError) {
          console.log('Error updating profile with image URL:', updateError.message);
        } else {
          console.log('Profile updated with new image URL');
          await fetchProfile();
        }
      } else {
        console.log('No public URL returned');
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

      const profileData = {
        id: user.id,
        name: profile.name,
        bio: profile.bio,
        skills: profile.skills,
        hourly_rate: profile.hourly_rate ? parseFloat(profile.hourly_rate) : null,
        is_freelancer: profile.is_freelancer,
        image_url: profile.image_url,
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
          image_url: profile.image_url,
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
          <View style={[
            styles.header, 
            isLandscape && styles.landscapeHeader
          ]}>
            <TouchableOpacity 
              onPress={handleImagePick}
              disabled={uploading}
              style={styles.imageContainer}
            >
              {uploading && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator size="small" color="#fff" />
                </View>
              )}
              {profile.image_url && profile.image_url.startsWith('http') ? (
                <Image
                  source={{ uri: profile.image_url }}
                  style={[
                    styles.profileImage, 
                    { width: imageSize, height: imageSize, borderRadius: imageSize/2 }
                  ]}
                  resizeMode="cover"
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
              <Text style={styles.sectionTitle}>Freelancer Settings</Text>
              
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
                  I want to work as a freelancer
                </Text>
              </TouchableOpacity>

              {profile.is_freelancer && (
                <View style={styles.infoBox}>
                  <Text style={[styles.infoText, isSmallDevice && styles.smallText]}>
                    By activating freelancer mode, your profile will be visible to potential clients on the swipe page.
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={loading}
              >
                {loading ? (
                  <View style={styles.loadingButton}>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={[styles.saveButtonText, isSmallDevice && styles.smallSaveText, {marginLeft: 10}]}>
                      Saving...
                    </Text>
                  </View>
                ) : (
                  <Text style={[styles.saveButtonText, isSmallDevice && styles.smallSaveText]}>
                    Save Profile
                  </Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.signOutButton}
                onPress={handleSignOut}
              >
                <Text style={[styles.signOutButtonText, isSmallDevice && styles.smallText]}>Sign Out</Text>
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
    backgroundColor: '#f8f9fa',
  },
  container: { 
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  lloadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#555',
  },
  portraitContent: {
    paddingBottom: 40,
  },
  landscapeContent: {
    flexDirection: 'row',
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e4e8',
  },
  landscapeHeader: {
    flex: 0.3,
    borderBottomWidth: 0,
    borderRightWidth: 1,
    borderRightColor: '#e1e4e8',
    justifyContent: 'flex-start',
    paddingTop: 40,
    height: '100%',
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  profileImage: {
    borderWidth: 3,
    borderColor: '#007AFF',
  },
  profileImagePlaceholder: {
    backgroundColor: '#e1e4e8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#b0b0b0',
    borderStyle: 'dashed',
  },
  addPhotoText: {
    color: '#777',
    fontSize: 16,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 5,
  },
  profileNamePlaceholder: {
    fontSize: 22,
    fontWeight: '500',
    color: '#999',
    marginBottom: 5,
  },
  freelancerBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 5,
  },
  freelancerBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  form: {
    flex: 1,
    padding: 20,
  },
  landscapeForm: {
    flex: 0.7,
    paddingTop: 40,
  },
  formSection: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  smallSectionTitle: {
    fontSize: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    color: '#555',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  smallInput: {
    fontSize: 14,
    padding: 10,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    minHeight: 30,
  },
  skill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e1f5fe',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  smallSkill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  skillText: {
    color: '#0277bd',
    fontSize: 14,
    fontWeight: '500',
  },
  removeSkillIcon: {
    marginLeft: 6,
    fontSize: 18,
    color: '#0277bd',
    fontWeight: 'bold',
  },
  addSkill: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    marginLeft: 10,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  noItemsText: {
    color: '#999',
    fontStyle: 'italic',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  editButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  editButtonText: {
    color: '#555',
    fontSize: 14,
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  infoLabel: {
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    color: '#333',
  },
  certificateCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  certificateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center', 
    marginBottom: 4,
  },
  certificateName: {
    fontWeight: '600',
    fontSize: 15,
    color: '#333',
  },
  certificateDetails: {
    color: '#666',
    fontSize: 14,
  },
  removeText: {
    color: '#ff3b30',
    fontSize: 14,
  },
  freelancerToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  freelancerToggleActive: {
    backgroundColor: '#e3f2fd',
  },
  freelancerToggleText: {
    fontWeight: '600',
    color: '#777',
  },
  freelancerToggleTextActive: {
    color: '#007AFF',
  },
  infoBox: {
    backgroundColor: '#fff9c4',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ffd54f',
  },
  infoText: {
    color: '#8a6d3b',
  },
  buttonContainer: {
    marginTop: 10,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  loadingButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#b0c4de',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  smallSaveText: {
    fontSize: 14,
  },
  signOutButton: {
    borderWidth: 1,
    borderColor: '#dc3545',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  signOutButtonText: {
    color: '#dc3545',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalContentSmall: {
    padding: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  smallText: {
    fontSize: 12,
  },
});