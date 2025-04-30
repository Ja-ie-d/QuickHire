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
      const { data, error } = await supabase
        .from('freelancers')
        .select('*')
        .eq('available_for_work', true);

      if (error) {
        console.error('Error fetching available freelancers:', error.message);
      } else {
        setAvailableFreelancers(data);
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
        const formattedMatches = data.map(match => match.freelancer);
        setMatches(formattedMatches);
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

    setMatches(prevMatches => [...prevMatches, freelancer]);

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
          
        });

      if (error) {
        console.error('Error saving match:', error);
        setMatches(prevMatches => prevMatches.filter(m => m.id !== freelancer.id));
      }
    } catch (error) {
      console.error('Error in addMatch:', error);
      setMatches(prevMatches => prevMatches.filter(m => m.id !== freelancer.id));
    }
  };

  // Remove a match
  const removeMatch = async (freelancerId) => {
    setMatches(prev => prev.filter(m => m.id !== freelancerId));

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
