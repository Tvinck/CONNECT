import { supabase } from './supabase';

export const trackEvent = async (eventName: 'views' | 'unique_visitors' | 'registrations' | 'add_to_cart' | 'orders') => {
  try {
    // Вызываем RPC-функцию, которую создали в Supabase
    await supabase.rpc('increment_bazzar_analytics', { col_name: eventName });
  } catch (error) {
    console.error('Failed to track event:', eventName, error);
  }
};

export const initAnalytics = () => {
  // Track unique visitors (once per day)
  const today = new Date().toISOString().split('T')[0];
  const lastVisit = localStorage.getItem('last_visit_date');
  
  if (lastVisit !== today) {
    trackEvent('unique_visitors');
    localStorage.setItem('last_visit_date', today);
  }
};
