import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest, createUserReport, type CreateUserReportRequest } from '@/services/api';

interface Profile {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  bio?: string;
  avatar?: string;
  birth_date?: string;
  age_visible: boolean;
  created_events: number;
  published_events: Event[];
  is_friend: boolean;
  friendship_status: 'none' | 'pending' | 'accepted';
}

interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  date: string;
  status: string;
  created_at: string;
}

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const theme = useAppTheme();
  const colorScheme = useColorScheme();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const backgroundColor = theme.background.primary;
  const surfaceColor = theme.background.surface;
  const mutedColor = theme.text.muted;
  const textColor = theme.text.primary;

  const isOwnProfile = currentUser?.id?.toString() === id;

  useEffect(() => {
    if (id) {
      loadProfile();
    }
  }, [id]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<Profile>(`/profile/${id}/`, {}, true);
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Fehler', 'Profil konnte nicht geladen werden');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  };

  const handleFriendAction = async (action: 'add' | 'remove') => {
    if (!profile) return;

    try {
      setActionLoading(true);
      
      if (action === 'add') {
        await apiRequest('/friends/add/', {
          method: 'POST',
          body: JSON.stringify({ user_id: profile.id }),
        }, true);
        Alert.alert('Erfolg', 'Freundschaftsanfrage gesendet');
      } else {
        await apiRequest('/friends/remove/', {
          method: 'POST',
          body: JSON.stringify({ user_id: profile.id }),
        }, true);
        Alert.alert('Erfolg', 'Freundschaft entfernt');
      }
      
      await loadProfile(); // Reload profile to update friendship status
    } catch (error) {
      console.error('Error handling friend action:', error);
      Alert.alert('Fehler', 'Aktion konnte nicht ausgeführt werden');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReport = () => {
    Alert.alert(
      'Nutzer melden',
      'Warum möchtest du diesen Nutzer melden?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Unangemessener Inhalt',
          onPress: () => submitReport('inappropriate_content'),
        },
        {
          text: 'Belästigung',
          onPress: () => submitReport('harassment'),
        },
        {
          text: 'Spam',
          onPress: () => submitReport('spam'),
        },
        {
          text: 'Falsches Profil',
          onPress: () => submitReport('fake_profile'),
        },
        {
          text: 'Sonstiges',
          onPress: () => submitReport('other'),
        },
      ]
    );
  };

  const submitReport = async (reason: 'inappropriate_content' | 'harassment' | 'spam' | 'fake_profile' | 'violence' | 'other') => {
    try {
      const reportData: CreateUserReportRequest = {
        reported_user_id: parseInt(id || '0'),
        reason: reason,
        description: `Nutzer ${profile?.first_name} ${profile?.last_name} wurde gemeldet.`,
      };

      await createUserReport(reportData);
      Alert.alert('Erfolg', 'Der Nutzer wurde erfolgreich gemeldet. Vielen Dank für deinen Hinweis.');
    } catch (error) {
      console.error('Fehler beim Melden des Nutzers:', error);
      
      // Prüfe ob es ein Duplikat-Fehler ist
      if (error instanceof Error && error.message.includes('bereits gemeldet')) {
        Alert.alert('Bereits gemeldet', 'Du hast diesen Nutzer bereits gemeldet.');
      } else if (error instanceof Error && error.message.includes('nicht selbst melden')) {
        Alert.alert('Fehler', 'Du kannst dich nicht selbst melden.');
      } else {
        Alert.alert('Fehler', 'Der Nutzer konnte nicht gemeldet werden. Bitte versuche es erneut.');
      }
    }
  };

  const getAge = () => {
    if (!profile?.birth_date || !profile?.age_visible) return null;
    const birthDate = new Date(profile.birth_date);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    return age;
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color={textColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: textColor }]}>Profil</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary.main} />
        </View>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color={textColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: textColor }]}>Profil</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: mutedColor }]}>
            Profil nicht gefunden
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: textColor }]}>
            {isOwnProfile ? 'Mein Profil' : 'Profil'}
          </Text>
        </View>
        <View style={styles.headerRight}>
          {!isOwnProfile && (
            <TouchableOpacity style={styles.reportButton} onPress={handleReport}>
              <MaterialIcons name="report" size={24} color={theme.status.error || '#FF3B30'} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        
        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: surfaceColor }]}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              {profile.avatar ? (
                <Image source={{ uri: profile.avatar }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: theme.primary.main }]}>
                  <MaterialIcons name="person" size={40} color="white" />
                </View>
              )}
            </View>
            
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: textColor }]}>
                {profile.first_name} {profile.last_name}
              </Text>
              <Text style={[styles.profileUsername, { color: mutedColor }]}>
                @{profile.username}
              </Text>
              {getAge() && (
                <Text style={[styles.profileAge, { color: mutedColor }]}>
                  {getAge()} Jahre alt
                </Text>
              )}
            </View>
          </View>

          {profile.bio && (
            <View style={styles.bioSection}>
              <Text style={[styles.bioText, { color: textColor }]}>{profile.bio}</Text>
            </View>
          )}

          {/* Action Buttons */}
          {!isOwnProfile && (
            <View style={styles.actionButtons}>
              {profile.is_friend ? (
                <TouchableOpacity
                  style={[styles.actionButton, styles.removeButton]}
                  onPress={() => handleFriendAction('remove')}
                  disabled={actionLoading}>
                  <MaterialIcons name="person-remove" size={20} color="white" />
                  <Text style={styles.actionButtonText}>Freund entfernen</Text>
                </TouchableOpacity>
              ) : profile.friendship_status === 'pending' ? (
                <TouchableOpacity
                  style={[styles.actionButton, styles.pendingButton]}
                  disabled={true}>
                  <MaterialIcons name="hourglass-empty" size={20} color="white" />
                  <Text style={styles.actionButtonText}>Anfrage gesendet</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.actionButton, styles.addButton]}
                  onPress={() => handleFriendAction('add')}
                  disabled={actionLoading}>
                  <MaterialIcons name="person-add" size={20} color="white" />
                  <Text style={styles.actionButtonText}>Freund hinzufügen</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={[styles.statsCard, { backgroundColor: surfaceColor }]}>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.primary.main }]}>
                {profile.created_events}
              </Text>
              <Text style={[styles.statLabel, { color: mutedColor }]}>Erstellte Events</Text>
            </View>
          </View>
        </View>

        {/* Published Events */}
        <View style={[styles.eventsCard, { backgroundColor: surfaceColor }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Veröffentlichte Events</Text>
          
          {profile.published_events.length > 0 ? (
            <View style={styles.eventsList}>
              {profile.published_events.map((event) => (
                <TouchableOpacity
                  key={event.id}
                  style={[styles.eventItem, { borderColor: '#E5E5EA' }]}
                  onPress={() => router.push(`/event/${event.id}`)}>
                  <View style={styles.eventContent}>
                    <Text style={[styles.eventTitle, { color: textColor }]} numberOfLines={2}>
                      {event.title}
                    </Text>
                    <Text style={[styles.eventLocation, { color: mutedColor }]} numberOfLines={1}>
                      📍 {event.location}
                    </Text>
                    <Text style={[styles.eventDate, { color: mutedColor }]} numberOfLines={1}>
                      📅 {new Date(event.date).toLocaleDateString('de-DE')}
                    </Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={24} color={mutedColor} />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyEvents}>
              <MaterialIcons name="event-busy" size={48} color={mutedColor} />
              <Text style={[styles.emptyEventsText, { color: mutedColor }]}>
                {isOwnProfile ? 'Du hast noch keine Events veröffentlicht' : 'Dieser Nutzer hat noch keine Events veröffentlicht'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'left',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reportButton: {
    padding: 8,
    marginRight: -8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  profileCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
    alignItems: 'flex-start',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'left',
  },
  profileUsername: {
    fontSize: 16,
    marginBottom: 4,
    textAlign: 'left',
  },
  profileAge: {
    fontSize: 14,
    textAlign: 'left',
  },
  bioSection: {
    marginBottom: 16,
  },
  bioText: {
    fontSize: 16,
    lineHeight: 24,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
    gap: 8,
  },
  addButton: {
    backgroundColor: '#34C759',
  },
  removeButton: {
    backgroundColor: '#FF3B30',
  },
  pendingButton: {
    backgroundColor: '#FF9500',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  statsCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  eventsCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  eventsList: {
    gap: 12,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  eventLocation: {
    fontSize: 14,
    marginBottom: 2,
  },
  eventDate: {
    fontSize: 14,
  },
  emptyEvents: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyEventsText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
  },
});
