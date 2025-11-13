import React from 'react';
import { getUserProfile, type Profile } from '@/services/api';
import { getProfileImageUrl } from '@/services/imageUpload';
import { useAuth } from '@/contexts/AuthContext';

// Hook für Profilbild-Management
export function useProfileImage() {
  const { user } = useAuth();
  const [profileImageUrl, setProfileImageUrl] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  // Lade Profilbild beim ersten Aufruf
  React.useEffect(() => {
    if (user) {
      loadProfileImage();
    }
  }, [user]);

  const loadProfileImage = async () => {
    try {
      setLoading(true);
      const profileData = await getUserProfile();
      
      if (profileData?.avatar) {
        const imageUrl = getProfileImageUrl(profileData.avatar);
        setProfileImageUrl(imageUrl);
      } else {
        setProfileImageUrl(null);
      }
    } catch (error) {
      console.error('Fehler beim Laden des Profilbilds:', error);
      setProfileImageUrl(null);
    } finally {
      setLoading(false);
    }
  };

  const updateProfileImage = (newImageUrl: string | null) => {
    setProfileImageUrl(newImageUrl);
  };

  return {
    profileImageUrl,
    loading,
    loadProfileImage,
    updateProfileImage,
  };
}
