import { StyleSheet, Text, TouchableOpacity, View, TextInput, Switch, Alert, ScrollView, RefreshControl } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import React from 'react';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { usePrivacySettings } from '@/hooks/use-privacy-settings';
import { useAuth } from '@/contexts/AuthContext';
import { getUserProfile, updateUserProfile, updatePrivacySettings, type Profile } from '@/services/api';
import { getProfileImageUrl } from '@/services/imageUpload';
import { LoginForm } from '@/components/auth/LoginForm';
// Screenshot-Registrierung entfernt
import ProfileImageUpload from '@/components/profile/ProfileImageUpload';

const PRIMARY = '#0A84FF';

// profilbildschirm mit einstellungen und event verwaltung
export default function ProfileScreen() {
  // Screenshot-Registrierung entfernt
  const scrollRef = React.useRef<import('react-native').ScrollView>(null);
  // profil und einstellungs state
  const [profileName, setProfileName] = React.useState('');
  const [profileBio, setProfileBio] = React.useState('');
  const [refreshing, setRefreshing] = React.useState(false);
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [profileImageUrl, setProfileImageUrl] = React.useState<string | null>(null);

  const theme = useAppTheme();
  const privacy = usePrivacySettings();
  const { user, logout } = useAuth();
  const backgroundColor = theme.background.primary;
  const surfaceColor = theme.background.surface;
  const mutedColor = theme.text.muted;
  const textColor = theme.text.primary;
  const colorScheme = useColorScheme();

  // Profil-Daten laden nur wenn authentifiziert
  React.useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  // Benutzerdaten aktualisieren wenn verfügbar
  React.useEffect(() => {
    if (user) {
      setProfileName(`${user.first_name} ${user.last_name}`);
    }
  }, [user]);

  // Profil-Daten vom Backend laden
  const loadProfile = async () => {
    // Abbrechen wenn kein User angemeldet ist
    if (!user) {
      console.log('Kein Benutzer angemeldet - Profil wird nicht geladen');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('Lade Profil-Daten für:', user.username);
      const profileData = await getUserProfile();
      
      if (profileData) {
        console.log('Profil-Daten erfolgreich geladen');
        setProfile(profileData);
        setProfileName(`${profileData.user.first_name} ${profileData.user.last_name}`);
        setProfileBio(profileData.bio || 'Event Enthusiast aus Eisenach');
        
        // Setze Profilbild-URL
        if (profileData.avatar) {
          const imageUrl = getProfileImageUrl(profileData.avatar);
          console.log('Profilbild-Debug:');
          console.log('  - Avatar-Pfad:', profileData.avatar);
          console.log('  - Konstruierte URL:', imageUrl);
          setProfileImageUrl(imageUrl);
        } else {
          console.log('Kein Avatar im Profil gefunden');
          setProfileImageUrl(null);
        }
      }
    } catch (error) {
      console.error('Fehler beim Laden des Profils:', error);
      
      // Zeige Fehlermeldung dem Benutzer
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      
      // Wenn es ein Auth-Fehler ist, navigiere zu Login
      if (errorMessage.includes('autorisiert') || errorMessage.includes('verweigert')) {
        Alert.alert(
          'Sitzung abgelaufen',
          'Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.',
          [{ text: 'OK', onPress: () => router.replace('/(tabs)/profile') }]
        );
        return;
      }
      
      // Für andere Fehler: Fallback auf lokale Daten aus AuthContext
      Alert.alert(
        'Profil konnte nicht geladen werden',
        errorMessage + '\n\nEs werden lokale Daten verwendet.',
        [{ text: 'OK' }]
      );
      
      if (user) {
        setProfileName(`${user.first_name} ${user.last_name}`);
        setProfileBio('Event Enthusiast aus Eisenach'); // Standard-Bio
        setProfileImageUrl(null);
      }
    } finally {
      setLoading(false);
    }
  };

  // pull-to-refresh funktion für profil
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await loadProfile();
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Wenn nicht authentifiziert, Login-Formular anzeigen
  if (!user) {
    return <LoginForm onLoginSuccess={() => loadProfile()} />;
  }

  // Loading state für bessere UX
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

  // navigation zur profilbearbeitung
  const handleEditProfile = () => {
    router.push('/profile/edit');
  };

  // logout funktion
  const handleLogout = () => {
    Alert.alert(
      'Abmelden',
      'Möchtest du dich wirklich abmelden?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        { 
          text: 'Abmelden', 
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(tabs)/profile');
          }
        }
      ]
    );
  };

  // datenschutz einstellungen verwalten
  const handlePrivacyChange = async (type: 'events' | 'profile', value: boolean) => {
    try {
      if (type === 'events') {
        await privacy.setEventsPublic(value);
        Alert.alert(
          'Datenschutz geändert',
          value
            ? 'Deine Teilnahme an Events ist jetzt öffentlich sichtbar. Freunde können sehen an welchen Events du teilnimmst.'
            : 'Deine Teilnahme an Events ist jetzt privat. Andere können nicht sehen an welchen Events du teilnimmst.'
        );
      } else {
        await privacy.setProfilePublic(value);
        Alert.alert(
          'Profil Sichtbarkeit geändert',
          value
            ? 'Dein Profil ist jetzt öffentlich'
            : 'Dein Profil ist jetzt privat'
        );
      }
    } catch (error) {
      console.error('Fehler beim Ändern der Datenschutz-Einstellungen:', error);
      Alert.alert(
        'Fehler',
        'Die Datenschutz-Einstellungen konnten nicht geändert werden. Bitte versuche es erneut.'
      );
    }
  };

  const handleThemeToggle = () => {
    Alert.alert(
      'Design wechseln',
      `Aktuell: ${colorScheme === 'dark' ? 'Dunkel' : 'Hell'} Modus`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Wechseln', onPress: () => {
          Alert.alert('Info', 'Design Wechsel erfolgt über die Systemeinstellungen deines Geräts');
        }}
      ]
    );
  };

  return (
    <ScrollView 
      ref={scrollRef}
      style={[styles.container, { backgroundColor }]} 
      contentContainerStyle={[styles.containerContent, { paddingBottom: 120 }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.primary.main}
          colors={[theme.primary.main]}
          progressBackgroundColor={surfaceColor}
          title={refreshing ? "Lädt..." : "Zum Aktualisieren nach unten ziehen"}
          titleColor={textColor}
          progressViewOffset={40}
        />
      }>
      {/* Profil-Header */}
      <View style={[styles.sectionCard, { backgroundColor: surfaceColor }]}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="person" size={24} color={theme.primary.main} />
          <ThemedText style={[styles.sectionTitle, { color: textColor }]}>Mein Profil</ThemedText>
        </View>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => router.push(`/profile/${user?.id}`)}
        > 
          <View style={styles.actionButtonLeft}>
            <View style={[styles.actionIcon, { backgroundColor: theme.primary.main + '20' }]}>
              <ProfileImageUpload
                currentAvatar={profileImageUrl || undefined}
                onImageUpdate={(newImageUrl) => {
                  setProfileImageUrl(newImageUrl);
                  // Lade das Profil nach dem Upload neu
                  if (newImageUrl) {
                    loadProfile();
                  }
                }}
                size={40}
                showUploadButton={false}
              />
            </View>
            <View style={styles.actionTextContainer}>
              <Text style={[styles.actionTitle, { color: textColor }]}>
                {profile?.user ? `${profile.user.first_name} ${profile.user.last_name}` : profileName}
              </Text>
              <Text style={[styles.actionDescription, { color: mutedColor }]}>
                {profile?.bio || profileBio || 'Profil anzeigen'}
              </Text>
            </View>
          </View>
          <MaterialIcons name="chevron-right" size={20} color={mutedColor} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleEditProfile}
        > 
          <View style={styles.actionButtonLeft}>
            <View style={[styles.actionIcon, { backgroundColor: theme.primary.main + '20' }]}>
              <MaterialIcons name="edit" size={20} color={theme.primary.main} />
            </View>
            <View style={styles.actionTextContainer}>
              <Text style={[styles.actionTitle, { color: textColor }]}>Profil bearbeiten</Text>
              <Text style={[styles.actionDescription, { color: mutedColor }]}>
                Name, Bio und Profilbild ändern
              </Text>
            </View>
          </View>
          <MaterialIcons name="chevron-right" size={20} color={mutedColor} />
        </TouchableOpacity>
      </View>

      {/* Meine Veranstaltungen verwalten */}
      <View style={[styles.sectionCard, { backgroundColor: surfaceColor }]}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="event" size={24} color={theme.primary.main} />
          <ThemedText style={[styles.sectionTitle, { color: textColor }]}>Meine Events</ThemedText>
        </View>

        <Link href="/events/manage" asChild>
          <TouchableOpacity style={styles.actionButton}>
            <View style={styles.actionButtonLeft}>
              <View style={[styles.actionIcon, { backgroundColor: theme.primary.main + '20' }]}>
                <MaterialIcons name="manage-accounts" size={20} color={theme.primary.main} />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={[styles.actionTitle, { color: textColor }]}>Events verwalten</Text>
                <Text style={[styles.actionDescription, { color: mutedColor }]}>
                  Verwalte deine hochgeladenen Events
                </Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={mutedColor} />
          </TouchableOpacity>
        </Link>
      </View>


      {/* Datenschutz-Einstellungen */}
      <View style={[styles.sectionCard, { backgroundColor: surfaceColor }]}> 
          <View style={styles.sectionHeader}>
            <MaterialIcons name="privacy-tip" size={24} color={theme.primary.main} />
            <ThemedText style={[styles.sectionTitle, { color: textColor }]}>Datenschutz-Einstellungen</ThemedText>
          </View>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: textColor }]}>Teilnahme öffentlich anzeigen</Text>
            <Text style={[styles.settingDescription, { color: mutedColor }]}>
              Andere können sehen, an welchen Events du teilnimmst
            </Text>
          </View>
              <Switch
                value={privacy.eventsPublic}
                onValueChange={(value) => handlePrivacyChange('events', value)}
                trackColor={{ false: 'rgba(255,255,255,0.2)', true: theme.primary.main + '50' }}
                thumbColor={privacy.eventsPublic ? theme.primary.main : 'rgba(255,255,255,0.6)'}
              />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: textColor }]}>Profil öffentlich</Text>
            <Text style={[styles.settingDescription, { color: mutedColor }]}>
              Dein Profil ist für andere Nutzer sichtbar
            </Text>
          </View>
              <Switch
                value={privacy.profilePublic}
                onValueChange={(value) => handlePrivacyChange('profile', value)}
                trackColor={{ false: 'rgba(255,255,255,0.2)', true: theme.primary.main + '50' }}
                thumbColor={privacy.profilePublic ? theme.primary.main : 'rgba(255,255,255,0.6)'}
              />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: textColor }]}>Alter anzeigen</Text>
            <Text style={[styles.settingDescription, { color: mutedColor }]}>
              {profile?.age ? `Dein Alter (${profile.age} Jahre) ist für andere sichtbar` : 'Alter wird berechnet, sobald Geburtsdatum eingegeben wurde'}
            </Text>
          </View>
              <Switch
                value={privacy.profile?.age_visible ?? true}
                onValueChange={async (value) => {
                  try {
                    await updatePrivacySettings({ age_visible: value });
                    await privacy.refreshProfile();
                    Alert.alert(
                      'Alter-Sichtbarkeit geändert',
                      value ? 'Dein Alter ist jetzt für andere sichtbar' : 'Dein Alter ist jetzt privat'
                    );
                  } catch (error) {
                    console.error('Fehler beim Ändern der Alter-Sichtbarkeit:', error);
                    Alert.alert('Fehler', 'Die Einstellung konnte nicht geändert werden.');
                  }
                }}
                trackColor={{ false: 'rgba(255,255,255,0.2)', true: theme.primary.main + '50' }}
                thumbColor={(privacy.profile?.age_visible ?? true) ? theme.primary.main : 'rgba(255,255,255,0.6)'}
                disabled={!profile?.age}
              />
        </View>

        {/* Benachrichtigungen entfernt */}
      </View>


      {/* App-Einstellungen */}
      <View style={[styles.sectionCard, { backgroundColor: surfaceColor }]}> 
          <View style={styles.sectionHeader}>
            <MaterialIcons name="settings" size={24} color={theme.primary.main} />
            <ThemedText style={[styles.sectionTitle, { color: textColor }]}>App-Einstellungen</ThemedText>
          </View>
        
        <TouchableOpacity style={styles.settingButton} onPress={handleThemeToggle}>
          <View style={styles.settingButtonLeft}>
            <MaterialIcons name={colorScheme === 'dark' ? 'dark-mode' : 'light-mode'} size={20} color={theme.primary.main} />
            <Text style={[styles.settingButtonText, { color: textColor }]}>Design-Modus</Text>
          </View>
          <View style={styles.settingButtonRight}>
            <Text style={[styles.settingButtonValue, { color: mutedColor }]}>
              {colorScheme === 'dark' ? 'Dunkel' : 'Hell'}
            </Text>
            <MaterialIcons name="chevron-right" size={20} color={mutedColor} />
          </View>
        </TouchableOpacity>


            <TouchableOpacity style={styles.settingButton} onPress={handleLogout}>
              <View style={styles.settingButtonLeft}>
                <MaterialIcons name="logout" size={20} color={theme.status.error} />
                <Text style={[styles.settingButtonText, { color: theme.status.error }]}>Abmelden</Text>
              </View>
            </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  containerContent: {
    paddingHorizontal: 24,
    paddingTop: 80, // zurück zum ursprünglichen Wert
    paddingBottom: 24,
    gap: 16,
  },
  sectionCard: {
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  settingInfo: {
    flex: 1,
    gap: 4,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  settingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  settingButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingButtonRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingButtonValue: {
    fontSize: 14,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  actionButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  actionTextContainer: {
    flex: 1,
    gap: 4,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  actionDescription: {
    fontSize: 13,
    lineHeight: 18,
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
});


