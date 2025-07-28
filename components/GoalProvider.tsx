import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// Types
interface GoalContextType {
  goal: any;
  setGoal: React.Dispatch<React.SetStateAction<any>>;
  allLevels: any[];
  setAllLevels: React.Dispatch<React.SetStateAction<any[]>>;
  loading: boolean;
  refreshGoal: () => Promise<void>;
}

const GoalContext = createContext<GoalContextType | null>(null);

export function GoalProvider({ children }: { children: ReactNode }) {
  const [goal, setGoal] = useState<any>(null);
  const [allLevels, setAllLevels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch goal and levels from Supabase ONCE at startup
  const fetchGoalAndLevels = useCallback(async () => {
    setLoading(true);
    try {
      console.log('[GoalProvider] Fetching goal and levels from Supabase...');
      const fetchedGoal = await fetchLatestGoalForUser();
      setGoal(fetchedGoal);
      let processedLevels: any[] = [];
      if (fetchedGoal && fetchedGoal.levels) {
        if (Array.isArray(fetchedGoal.levels)) {
          if (fetchedGoal.levels[0] && fetchedGoal.levels[0].levels) {
            processedLevels = fetchedGoal.levels.flatMap((section: any) =>
              (section.levels || []).map((lvl: any) => ({
                ...lvl,
                sectionTitle: section.title,
                sectionSummary: section.summary,
              }))
            );
          } else {
            processedLevels = fetchedGoal.levels;
          }
        } else if (typeof fetchedGoal.levels === 'object') {
          if (fetchedGoal.levels.levels) {
            processedLevels = fetchedGoal.levels.levels;
          } else {
            processedLevels = Object.values(fetchedGoal.levels);
          }
        }
      }
      setAllLevels(processedLevels || []);
      console.log('[GoalProvider] Levels loaded from Supabase:', processedLevels.length);
    } catch (e) {
      setGoal(null);
      setAllLevels([]);
      console.log('[GoalProvider] Error loading levels from Supabase:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoalAndLevels();
  }, [fetchGoalAndLevels]);

  // Expose a refresh function for manual refreshes
  const refreshGoal = fetchGoalAndLevels;

  return (
    <GoalContext.Provider value={{ goal, setGoal, allLevels, setAllLevels, loading, refreshGoal }}>
      {children}
    </GoalContext.Provider>
  );
}

export function useGoal() {
  console.log('[GoalProvider] useGoal called: returning context values from memory');
  const ctx = useContext(GoalContext);
  if (!ctx) throw new Error('useGoal must be used within a GoalProvider');
  return ctx;
}

// Copy of fetchLatestGoalForUser from HomeScreen
async function fetchLatestGoalForUser() {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      console.log('User not found or error:', userError);
      return null;
    }
    const userId = userData.user.id;
    console.log('Fetching goals for user:', userId);

    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.log('Supabase fetch error:', error);
      return null;
    }
    
    console.log('Raw Supabase data:', data);
    
    if (data && data.length > 0) {
      const goal = data[0];
      console.log('Found goal:', goal);
      
      if (!goal.current_level) {
        console.log('No current_level found, setting default to 1_1');
        const { error: updateError } = await supabase
          .from('goals')
          .update({ current_level: '1_1' })
          .eq('id', goal.id);
        
        if (!updateError) {
          goal.current_level = '1_1';
        }
      }
      
      return goal;
    }
    
    console.log('No goals found for user');
    return null;
  } catch (error) {
    console.error('Error in fetchLatestGoalForUser:', error);
    return null;
  }
} 