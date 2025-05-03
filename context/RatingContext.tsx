import React, { createContext, useContext, useState } from 'react';
import { supabase } from '../lib/supabase';

interface RatingContextType {
  ratings: Record<string, number>;
  setRatings: (ratings: Record<string, number>) => void;
  rateFreelancer: (freelancerId: string, ratingValue: number) => Promise<void>;
}

const RatingContext = createContext<RatingContextType | undefined>(undefined);

export function RatingProvider({ children }: { children: React.ReactNode }) {
  const [ratings, setRatings] = useState<Record<string, number>>({});

  const rateFreelancer = async (freelancerId: string, ratingValue: number) => {
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
      console.error('Rating error:', error);
    }
  };

  return (
    <RatingContext.Provider value={{ ratings, setRatings, rateFreelancer }}>
      {children}
    </RatingContext.Provider>
  );
}

export function useRating() {
  const context = useContext(RatingContext);
  if (context === undefined) {
    throw new Error('useRating must be used within a RatingProvider');
  }
  return context;
} 