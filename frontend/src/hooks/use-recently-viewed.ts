import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { API_CONFIG } from '@/lib/api-config';

export interface RecentlyViewedPG {
  id: string;
  name: string;
  city: string;
  rent: number;
  image?: string;
  viewedAt: number;
}

const MAX_RECENT_ITEMS = 10;
const STORAGE_KEY = 'smartstay_recently_viewed';

export const useRecentlyViewed = () => {
  const addToRecentlyViewed = async (pg: Omit<RecentlyViewedPG, 'viewedAt'>) => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // If logged in, save to backend (Supabase) - but don't block on errors
        fetch(`${API_CONFIG.BACKEND_URL}/api/recently-viewed`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            pg_id: pg.id
          })
        }).catch(err => {
          // Silently fail - localStorage will still work
          console.debug('Backend recently viewed save failed:', err);
        });
      }
      
      // Always save to localStorage as fallback/cache
      const existing = getRecentlyViewed();
      
      // Remove if already exists
      const filtered = existing.filter(item => item.id !== pg.id);
      
      // Add to beginning with timestamp
      const updated: RecentlyViewedPG[] = [
        { ...pg, viewedAt: Date.now() },
        ...filtered
      ].slice(0, MAX_RECENT_ITEMS);
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving to recently viewed:', error);
    }
  };

  const getRecentlyViewed = (): RecentlyViewedPG[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      
      const items: RecentlyViewedPG[] = JSON.parse(stored);
      
      // Filter out items older than 30 days
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      return items.filter(item => item.viewedAt > thirtyDaysAgo);
    } catch (error) {
      console.error('Error reading recently viewed:', error);
      return [];
    }
  };

  const clearRecentlyViewed = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing recently viewed:', error);
    }
  };

  return {
    addToRecentlyViewed,
    getRecentlyViewed,
    clearRecentlyViewed
  };
};
