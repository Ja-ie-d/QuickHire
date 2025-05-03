import React, { createContext, useContext, useState } from 'react';
import { supabase } from '../lib/supabase';

interface UserProfile {
  name: string;
  bio: string;
  email: string;
  projectNeeds: string;
}

interface ProfileContextType {
  userProfile: UserProfile;
  setUserProfile: (profile: UserProfile) => void;
  updateUserProfile: (newProfile: UserProfile) => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'Client',
    bio: 'Looking for skilled freelancers',
    email: '',
    projectNeeds: 'Web Development, Mobile Apps, Design'
  });

  const updateUserProfile = async (newProfile: UserProfile) => {
    setUserProfile(newProfile);
    
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
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
} 