import { api } from './api';
import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';

// This service bridges authentication between Supabase and the legacy API
export const authBridge = {
  // Authenticate with the legacy API using credentials
  async authenticateLegacy(email: string, password: string): Promise<{ token: string; user: any } | null> {
    try {
      const response = await api.post('login', { email, password });
      
      if (response.token) {
        localStorage.setItem('token', response.token);
        return response;
      }
      return null;
    } catch (error) {
      console.error('Legacy API authentication failed:', error);
      return null;
    }
  },
  
  // Get an authentication token for the legacy API using Supabase user info
  async getLegacyTokenFromSupabase(supabaseUser: User): Promise<string | null> {
    // In a real implementation, you would have an API endpoint that validates
    // the Supabase JWT and returns a token for your legacy API.
    // This is just a placeholder.
    try {
      const supabaseToken = await supabaseUser.getIdToken();
      
      // Call an API endpoint that validates the Supabase token and returns a legacy token
      const response = await api.post('auth/validate-supabase-token', { 
        supabaseToken,
        user: {
          email: supabaseUser.email,
          name: supabaseUser.user_metadata.name
        }
      });
      
      if (response.token) {
        localStorage.setItem('token', response.token);
        return response.token;
      }
      return null;
    } catch (error) {
      console.error('Failed to get legacy token:', error);
      return null;
    }
  },
  
  // Check if we have valid authentication for both systems
  async checkAuth(): Promise<{ supabase: boolean; legacy: boolean }> {
    const supabaseSession = await supabase.auth.getSession();
    const legacyToken = localStorage.getItem('token');
    
    let legacyValid = false;
    if (legacyToken) {
      try {
        // Verify legacy token is valid by making an API call
        await api.get('me');
        legacyValid = true;
      } catch {
        legacyValid = false;
      }
    }
    
    return {
      supabase: !!supabaseSession.data.session,
      legacy: legacyValid
    };
  }
};