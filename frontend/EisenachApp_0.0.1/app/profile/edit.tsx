import React from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, TextInput, Alert, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAppTheme } from '@/hooks/use-app-theme';
import { getUserProfile, updateUserProfile, type Profile } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { getProfileImageUrl } from '@/services/imageUpload';
import ProfileImageUpload from '@/components/profile/ProfileImageUpload';

// Profil-Datentypen für die Bearbeitung
interface ProfileData {
  id: string;
  name: string;
  username: string;
  bio: string;
  profileImage: string | null;
  email: string;
  phone: string;
  location: string;
}

// Profil-Bearbeitungsbildschirm für Benutzer
export default function ProfileEditScreen() {
  const theme = useAppTheme();
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [profileImageUrl, setProfileImageUrl] = React.useState<string | null>(null);

  // State für Profil-Daten und Formular-Status
  const [profileData, setProfileData] = React.useState<ProfileData>({
    id: '1',
    name: '',
    username: '',
    bio: '',
    profileImage: null,
    email: '',
    phone: '',
    location: '',
  });

  const backgroundColor = theme.background.primary;
  const surfaceColor = theme.background.surface;
  const textColor = theme.text.primary;
  const mutedColor = theme.text.muted;

  // Profil-Daten beim ersten Laden abrufen
  React.useEffect(() => {
    loadProfileData();
  }, []);

  // Profil-Daten aus dem Backend laden
  const loadProfileData = async () => {
    setLoading(true);
    
    try {
      // Versuche Profil vom Backend zu laden
      const profile = await getUserProfile();
      
      if (profile) {
        setProfileData({
          id: profile.id.toString(),
          name: `${profile.user.first_name} ${profile.user.last_name}`,
          username: profile.user.username,
          bio: profile.bio || '',
          profileImage: profile.avatar || null,
          email: profile.user.email,
          phone: '', // Phone nicht im Backend verfügbar
          location: profile.location || '',
        });
        
        // Setze Profilbild-URL
        if (profile.avatar) {
          const imageUrl = getProfileImageUrl(profile.avatar);
          setProfileImageUrl(imageUrl);
        } else {
          setProfileImageUrl(null);
        }
      } else if (user) {
        // Fallback auf Auth-Daten
        setProfileData({
          id: user.id.toString(),
          name: `${user.first_name} ${user.last_name}`,
          username: user.username,
          bio: 'Event-Enthusiast aus Eisenach',
          profileImage: null,
          email: user.email,
          phone: '',
          location: 'Eisenach, Deutschland',
        });
        
        // Setze Profilbild-URL auf null für Fallback
        setProfileImageUrl(null);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      // Fallback auf Standard-Daten
      if (user) {
        setProfileData({
          id: user.id.toString(),
          name: `${user.first_name} ${user.last_name}`,
          username: user.username,
          bio: 'Event-Enthusiast aus Eisenach',
          profileImage: null,
          email: user.email,
          phone: '',
          location: 'Eisenach, Deutschland',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Profil-Änderungen speichern mit Validierung
  const handleSave = async () => {
    if (!profileData.name.trim() || !profileData.username.trim()) {
      Alert.alert('Fehler', 'Name und Benutzername sind Pflichtfelder.');
      return;
    }

    setSaving(true);
    
    try {
      // Namen in Vor- und Nachname aufteilen
      const nameParts = profileData.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Profil-Daten für Backend vorbereiten
      const updateData = {
        bio: profileData.bio.trim(),
        location: profileData.location.trim(),
        // Weitere Felder könnten hier hinzugefügt werden
      };

      // Profil im Backend aktualisieren
      const updatedProfile = await updateUserProfile(updateData);
      
      if (updatedProfile) {
        Alert.alert(
          'Profil gespeichert!', 
          'Deine Änderungen wurden erfolgreich gespeichert.',
          [
            {
              text: 'OK',
              onPress: () => router.back()
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert(
        'Fehler',
        'Das Profil konnte nicht gespeichert werden. Bitte versuche es später erneut.',
        [{ text: 'OK' }]
      );
    } finally {
      setSaving(false);
    }
  };


  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <View style={styles.loadingContainer}>
          <MaterialIcons name="hourglass-empty" size={48} color={theme.primary.main} />
          <Text style={[styles.loadingText, { color: textColor }]}>Profil wird geladen...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}>
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>Profil bearbeiten</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Profile Picture Section */}
      <View style={[styles.section, { backgroundColor: surfaceColor }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>Profilbild</Text>
        
        <View style={styles.profileImageContainer}>
          <ProfileImageUpload
            currentAvatar={profileImageUrl || undefined}
            onImageUpdate={(newImageUrl) => {
              setProfileImageUrl(newImageUrl);
              // Aktualisiere auch profileData
              setProfileData({
                ...profileData,
                profileImage: newImageUrl
              });
            }}
            size={120}
            showUploadButton={true}
          />
        </View>

        <Text style={[styles.profileImageHint, { color: mutedColor }]}>
          Tippe auf das Profilbild, um es zu ändern
        </Text>
      </View>

      {/* Basic Information */}
      <View style={[styles.section, { backgroundColor: surfaceColor }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>Grundinformationen</Text>
        
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: textColor }]}>Name *</Text>
          <TextInput
            style={[styles.input, { backgroundColor, color: textColor, borderColor: theme.primary.main + '30' }]}
            value={profileData.name}
            onChangeText={(text) => setProfileData({ ...profileData, name: text })}
            placeholder="Dein vollständiger Name"
            placeholderTextColor={mutedColor}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: textColor }]}>Benutzername *</Text>
          <TextInput
            style={[styles.input, { backgroundColor, color: textColor, borderColor: theme.primary.main + '30' }]}
            value={profileData.username}
            onChangeText={(text) => setProfileData({ ...profileData, username: text })}
            placeholder="@benutzername"
            placeholderTextColor={mutedColor}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: textColor }]}>Über mich</Text>
          <TextInput
            style={[styles.textArea, { backgroundColor, color: textColor, borderColor: theme.primary.main + '30' }]}
            value={profileData.bio}
            onChangeText={(text) => setProfileData({ ...profileData, bio: text })}
            placeholder="Erzähle etwas über dich..."
            placeholderTextColor={mutedColor}
            multiline
            numberOfLines={4}
          />
        </View>
      </View>

      {/* Contact Information */}
      <View style={[styles.section, { backgroundColor: surfaceColor }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>Kontaktinformationen</Text>
        
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: textColor }]}>E-Mail</Text>
          <TextInput
            style={[styles.input, { backgroundColor, color: textColor, borderColor: theme.primary.main + '30' }]}
            value={profileData.email}
            onChangeText={(text) => setProfileData({ ...profileData, email: text })}
            placeholder="deine@email.de"
            placeholderTextColor={mutedColor}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: textColor }]}>Telefon</Text>
          <TextInput
            style={[styles.input, { backgroundColor, color: textColor, borderColor: theme.primary.main + '30' }]}
            value={profileData.phone}
            onChangeText={(text) => setProfileData({ ...profileData, phone: text })}
            placeholder="+49 123 456789"
            placeholderTextColor={mutedColor}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: textColor }]}>Standort</Text>
          <TextInput
            style={[styles.input, { backgroundColor, color: textColor, borderColor: theme.primary.main + '30' }]}
            value={profileData.location}
            onChangeText={(text) => setProfileData({ ...profileData, location: text })}
            placeholder="Stadt, Land"
            placeholderTextColor={mutedColor}
          />
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: theme.primary.main }]}
          onPress={handleSave}
          disabled={saving}>
          <MaterialIcons name="save" size={20} color="#ffffff" />
          <Text style={styles.saveButtonText}>
            {saving ? 'Speichern...' : 'Änderungen speichern'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.cancelButton, { backgroundColor: theme.background.secondary }]}
          onPress={() => router.back()}>
          <MaterialIcons name="close" size={20} color={textColor} />
          <Text style={[styles.cancelButtonText, { color: textColor }]}>
            Abbrechen
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 50,
    paddingBottom: 120,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginTop: 10,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerSpacer: {
    width: 40,
  },
  section: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  profileImageWrapper: {
    position: 'relative',
    borderWidth: 2,
    borderRadius: 80,
    padding: 4,
  },
  profileImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  profileImagePlaceholder: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editImageButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  profileImageHint: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
  },
  textArea: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  actionButtons: {
    padding: 20,
    gap: 12,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});


