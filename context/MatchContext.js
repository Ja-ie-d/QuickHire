import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Create the context
const MatchContext = createContext();

// Provider component
export const MatchProvider = ({ children }) => {
  const [matches, setMatches] = useState([]);
  const [availableFreelancers, setAvailableFreelancers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMatches();
    fetchAvailableFreelancers();
  }, []);

  // Fetch all available freelancers for swiping
  const fetchAvailableFreelancers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user found');
        return;
      }

      // Get existing matches to exclude them from available freelancers
      const { data: matchData } = await supabase
        .from('matches')
        .select('freelancer_id')
        .eq('user_id', user.id);

      const matchedIds = matchData ? matchData.map(m => m.freelancer_id) : [];

      const { data, error } = await supabase
        .from('freelancers')
        .select('*')
        .eq('available_for_work', true)
        .not('id', 'in', `(${matchedIds.join(',')})`);

      if (error) {
        console.error('Error fetching available freelancers:', error.message);
      } else {
        setAvailableFreelancers(data || []);
      }
    } catch (err) {
      console.error('Unexpected error fetching freelancers:', err.message);
    }
  };

  // Fetch matches from Supabase
  const fetchMatches = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No authenticated user found');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('matches')
        .select('*, freelancer:freelancer_id(*)')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching matches:', error);
      } else if (data) {
        // Ensure unique matches by freelancer ID
        const uniqueMatches = data.reduce((acc, match) => {
          if (!acc.some(m => m.id === match.freelancer.id)) {
            acc.push(match.freelancer);
          }
          return acc;
        }, []);
        setMatches(uniqueMatches);
      }
    } catch (error) {
      console.error('Error in fetchMatches:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add a new match
  const addMatch = async (freelancer) => {
    const alreadyMatched = matches.some(m => m.id === freelancer.id);
    if (alreadyMatched) {
      console.log('Already matched with this freelancer');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user found');
        return;
      }

      const { error } = await supabase
        .from('matches')
        .insert({
          user_id: user.id,
          freelancer_id: freelancer.id,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error saving match:', error);
        return;
      }

      // Add to local state only after successful database insert
      setMatches(prevMatches => {
        if (prevMatches.some(m => m.id === freelancer.id)) {
          return prevMatches;
        }
        return [...prevMatches, freelancer];
      });

      // Remove from available freelancers
      setAvailableFreelancers(prev => 
        prev.filter(f => f.id !== freelancer.id)
      );

    } catch (error) {
      console.error('Error in addMatch:', error);
    }
  };

  // Remove a match
  const removeMatch = async (freelancerId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('matches')
        .delete()
        .eq('user_id', user.id)
        .eq('freelancer_id', freelancerId);

      if (error) {
        console.error('Error removing match:', error);
        return;
      }

      // Update local state only after successful database delete
      setMatches(prev => prev.filter(m => m.id !== freelancerId));
      
      // Fetch the freelancer details to add back to available freelancers
      const { data: freelancer } = await supabase
        .from('freelancers')
        .select('*')
        .eq('id', freelancerId)
        .single();

      if (freelancer) {
        setAvailableFreelancers(prev => [...prev, freelancer]);
      }
    } catch (error) {
      console.error('Error in removeMatch:', error);
    }
  };

  const isMatched = (freelancerId) => matches.some(m => m.id === freelancerId);

  const value = {
    matches,
    availableFreelancers,
    loading,
    addMatch,
    removeMatch,
    isMatched,
    refreshMatches: fetchMatches,
    refreshAvailableFreelancers: fetchAvailableFreelancers
  };

  return (
    <MatchContext.Provider value={value}>
      {children}
    </MatchContext.Provider>
  );
};

// Custom hook
export const useMatch = () => {
  const context = useContext(MatchContext);
  if (!context) throw new Error('useMatch must be used within a MatchProvider');
  return context;
};

export default MatchContext;
