import React from 'react';
import { updatePrivacySettings, getUserProfile, type Profile } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

// Datenschutz-Einstellungen mit Backend-Integration
export function usePrivacySettings() {
  const { user } = useAuth();
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [loading, setLoading] = React.useState(false);

  // Lade Profil-Daten beim ersten Aufruf
  React.useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const profileData = await getUserProfile();
      setProfile(profileData);
    } catch (error) {
      console.error('Fehler beim Laden des Profils:', error);
    } finally {
      setLoading(false);
    }
  };

  const setEventsPublic = async (value: boolean) => {
    if (!user) return;
    
    try {
      setLoading(true);
      const updatedProfile = await updatePrivacySettings({ events_public: value });
      setProfile(updatedProfile);
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Event-Sichtbarkeit:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const setProfilePublic = async (value: boolean) => {
    if (!user) return;
    
    try {
      setLoading(true);
      const updatedProfile = await updatePrivacySettings({ profile_public: value });
      setProfile(updatedProfile);
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Profil-Sichtbarkeit:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    // teilnahme an events öffentlich sichtbar
    eventsPublic: profile?.events_public ?? true,
    setEventsPublic,
    
    // profil öffentlich
    profilePublic: profile?.profile_public ?? true,
    setProfilePublic,
    
    // helper funktionen
    canShowParticipants: () => profile?.events_public ?? true, // nur zeigen wenn teilnahme öffentlich ist
    canShowProfile: () => profile?.profile_public ?? true,     // nur zeigen wenn profil öffentlich ist
    
    // zusätzliche properties
    loading,
    profile,
    refreshProfile: loadProfile,
  };
}
