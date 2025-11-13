import React from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { useAppTheme } from '@/hooks/use-app-theme';
import { fetchMyCreatedEvents, fetchMyParticipatedEvents, deleteEvent, type EventItem } from '@/services/api';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
// Screenshot-Registrierung entfernt

export default function EventManagementScreen() {
  // Screenshot-Registrierung entfernt
  const scrollRef = React.useRef<import('react-native').ScrollView>(null);
  const theme = useAppTheme();
  const router = useRouter();
  const backgroundColor = theme.background.primary;
  const surfaceColor = theme.background.surface;
  const textColor = theme.text.primary;
  const mutedColor = theme.text.muted;

  const [createdEvents, setCreatedEvents] = React.useState<EventItem[]>([]);
  const [participatedEvents, setParticipatedEvents] = React.useState<EventItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  React.useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const created = await fetchMyCreatedEvents();
      const participated = await fetchMyParticipatedEvents();
      
      const safeCreated = Array.isArray(created) ? created : [];
      const safeParticipated = Array.isArray(participated) ? participated : [];
      
      // Events nach Datum sortieren - das nächste Event zuerst (aufsteigend)
      const sortedCreated = safeCreated.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateA - dateB; // Aufsteigend - frühere Events zuerst
      });
      
      const sortedParticipated = safeParticipated.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateA - dateB; // Aufsteigend - frühere Events zuerst
      });
      
      setCreatedEvents(sortedCreated);
      setParticipatedEvents(sortedParticipated);
    } catch (error) {
      console.error('❌ Fehler beim Laden der Events:', error);
      Alert.alert('Fehler', 'Events konnten nicht geladen werden. Bitte versuche es erneut.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await loadEvents();
    } finally {
      setRefreshing(false);
    }
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return theme.status.warning;
      case 'published': return theme.status.success;
      case 'cancelled': return theme.status.error;
      default: return mutedColor;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return 'Entwurf';
      case 'published': return 'Veröffentlicht';
      case 'cancelled': return 'Abgebrochen';
      default: return status;
    }
  };

  const handleDeleteEvent = async (eventId: string, eventTitle: string) => {
    Alert.alert(
      'Event löschen',
      `"${eventTitle}" wirklich löschen?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        { 
          text: 'Löschen', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEvent(parseInt(eventId));
              await loadEvents();
              Alert.alert('Event gelöscht', `"${eventTitle}" wurde erfolgreich gelöscht.`);
            } catch (error) {
              console.error('Error deleting event:', error);
              Alert.alert('Fehler', 'Event konnte nicht gelöscht werden.');
            }
          }
        }
      ]
    );
  };

  const handleOpenEvent = (eventId: number) => {
    router.push(`/event/${eventId}`);
  };

  const handleEditEvent = (eventId: string) => {
    router.push(`/events/edit/${eventId}`);
  };

  const handleEventDashboard = (eventId: string) => {
    router.push(`/events/dashboard/${eventId}`);
  };

  return (
    <ProtectedRoute 
      fallbackMessage="Melde dich an, um Events zu erstellen und zu verwalten"
      fallbackButtonText="Anmelden"
    >
      <View style={[styles.container, { backgroundColor }]}>
        {/* Header - Konsistente Struktur */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={24} color={textColor} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={[styles.title, { color: textColor }]}>Events verwalten</Text>
          </View>
        </View>

        <ScrollView 
          ref={scrollRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.primary.main}
              colors={[theme.primary.main]}
            />
          }
        >
          {/* Stats Card - Einheitliches Design */}
          <View style={[styles.card, { backgroundColor: surfaceColor }]}>
            <Text style={[styles.cardTitle, { color: textColor }]}>Übersicht</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statBox}>
                <Text style={[styles.statNumber, { color: theme.primary.main }]}>{createdEvents.length}</Text>
                <Text style={[styles.statLabel, { color: mutedColor }]}>Erstellt</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statNumber, { color: theme.status.success }]}>{participatedEvents.length}</Text>
                <Text style={[styles.statLabel, { color: mutedColor }]}>Teilgenommen</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statNumber, { color: theme.status.warning }]}>
                  {createdEvents.filter(e => e.status === 'published').length}
                </Text>
                <Text style={[styles.statLabel, { color: mutedColor }]}>Veröffentlicht</Text>
              </View>
            </View>
          </View>

          {/* Erstellte Events - Konsistente Sektion */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="create" size={20} color={theme.primary.main} />
              <Text style={[styles.sectionTitle, { color: textColor }]}>Meine Events</Text>
            </View>
            
            {loading ? (
              <View style={styles.centerContent}>
                <MaterialIcons name="refresh" size={32} color={mutedColor} />
                <Text style={[styles.centerText, { color: mutedColor }]}>Events werden geladen...</Text>
              </View>
            ) : createdEvents.length === 0 ? (
              <View style={[styles.card, { backgroundColor: surfaceColor }]}>
                <View style={styles.centerContent}>
                  <MaterialIcons name="event-note" size={48} color={mutedColor} />
                  <Text style={[styles.emptyTitle, { color: textColor }]}>Noch keine Events erstellt</Text>
                  <Text style={[styles.emptyText, { color: mutedColor }]}>
                    Erstelle dein erstes Event und teile es mit der Community!
                  </Text>
                  <TouchableOpacity 
                    style={[styles.primaryButton, { backgroundColor: theme.primary.main }]}
                    onPress={() => router.push('/(tabs)/upload')}
                  >
                    <MaterialIcons name="add" size={20} color="#FFFFFF" />
                    <Text style={styles.primaryButtonText}>Event erstellen</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.eventsList}>
                {createdEvents.map((event) => (
                  <View key={event.id} style={[styles.card, { backgroundColor: surfaceColor }]}>
                    {/* Event Header */}
                    <View style={styles.eventHeader}>
                      <Text style={[styles.eventTitle, { color: textColor }]} numberOfLines={2}>
                        {event.title}
                      </Text>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(event.status) + '15' }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(event.status) }]}>
                          {getStatusText(event.status)}
                        </Text>
                      </View>
                    </View>

                    {/* Event Details */}
                    <View style={styles.eventDetails}>
                      <View style={styles.detailRow}>
                        <MaterialIcons name="schedule" size={16} color={mutedColor} />
                        <Text style={[styles.detailText, { color: mutedColor }]}>
                          {new Date(event.date).toLocaleDateString('de-DE', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <MaterialIcons name="location-on" size={16} color={mutedColor} />
                        <Text style={[styles.detailText, { color: mutedColor }]} numberOfLines={1}>
                          {event.location || 'Kein Ort angegeben'}
                        </Text>
                      </View>
                    </View>

                    {/* Event Stats */}
                    <View style={styles.eventStats}>
                      <View style={styles.stat}>
                        <MaterialIcons name="group" size={16} color={mutedColor} />
                        <Text style={[styles.statText, { color: mutedColor }]}>{event.participant_count}</Text>
                      </View>
                      <View style={styles.stat}>
                        <MaterialIcons name="favorite" size={16} color={mutedColor} />
                        <Text style={[styles.statText, { color: mutedColor }]}>{event.likes_count}</Text>
                      </View>
                      <View style={styles.stat}>
                        <MaterialIcons name="comment" size={16} color={mutedColor} />
                        <Text style={[styles.statText, { color: mutedColor }]}>{event.comments_count || 0}</Text>
                      </View>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionRow}>
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.primaryAction]}
                        onPress={() => handleOpenEvent(event.id)}
                      >
                        <MaterialIcons name="visibility" size={16} color={theme.primary.main} />
                        <Text style={[styles.actionText, { color: theme.primary.main }]}>Anzeigen</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.secondaryAction]}
                        onPress={() => handleEditEvent(event.id)}
                      >
                        <MaterialIcons name="edit" size={16} color={theme.status.warning} />
                        <Text style={[styles.actionText, { color: theme.status.warning }]}>Bearbeiten</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.secondaryAction]}
                        onPress={() => handleEventDashboard(event.id)}
                      >
                        <MaterialIcons name="analytics" size={16} color={theme.status.success} />
                        <Text style={[styles.actionText, { color: theme.status.success }]}>Dashboard</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.dangerAction]}
                        onPress={() => handleDeleteEvent(event.id, event.title)}
                      >
                        <MaterialIcons name="delete" size={16} color={theme.status.error} />
                        <Text style={[styles.actionText, { color: theme.status.error }]}>Löschen</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Teilnahme Events - Konsistente Sektion */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="group" size={20} color={theme.status.success} />
              <Text style={[styles.sectionTitle, { color: textColor }]}>Events an denen ich teilnehme</Text>
            </View>
            
            {loading ? (
              <View style={styles.centerContent}>
                <MaterialIcons name="refresh" size={32} color={mutedColor} />
                <Text style={[styles.centerText, { color: mutedColor }]}>Events werden geladen...</Text>
              </View>
            ) : participatedEvents.length === 0 ? (
              <View style={[styles.card, { backgroundColor: surfaceColor }]}>
                <View style={styles.centerContent}>
                  <MaterialIcons name="group-add" size={48} color={mutedColor} />
                  <Text style={[styles.emptyTitle, { color: textColor }]}>Noch keine Teilnahmen</Text>
                  <Text style={[styles.emptyText, { color: mutedColor }]}>
                    Entdecke Events in der Community und nimm an interessanten Veranstaltungen teil!
                  </Text>
                  <TouchableOpacity 
                    style={[styles.primaryButton, { backgroundColor: theme.status.success }]}
                    onPress={() => router.push('/(tabs)/')}
                  >
                    <MaterialIcons name="explore" size={20} color="#FFFFFF" />
                    <Text style={styles.primaryButtonText}>Events entdecken</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.eventsList}>
                {participatedEvents.map((event) => (
                  <View key={event.id} style={[styles.card, { backgroundColor: surfaceColor }]}>
                    {/* Event Header */}
                    <View style={styles.eventHeader}>
                      <Text style={[styles.eventTitle, { color: textColor }]} numberOfLines={2}>
                        {event.title}
                      </Text>
                      <View style={[styles.participantBadge, { backgroundColor: theme.status.success + '15' }]}>
                        <MaterialIcons name="group" size={12} color={theme.status.success} />
                        <Text style={[styles.participantText, { color: theme.status.success }]}>Teilnehmer</Text>
                      </View>
                    </View>

                    {/* Event Details */}
                    <View style={styles.eventDetails}>
                      <View style={styles.detailRow}>
                        <MaterialIcons name="schedule" size={16} color={mutedColor} />
                        <Text style={[styles.detailText, { color: mutedColor }]}>
                          {new Date(event.date).toLocaleDateString('de-DE', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <MaterialIcons name="location-on" size={16} color={mutedColor} />
                        <Text style={[styles.detailText, { color: mutedColor }]} numberOfLines={1}>
                          {event.location || 'Kein Ort angegeben'}
                        </Text>
                      </View>
                    </View>

                    {/* Event Stats */}
                    <View style={styles.eventStats}>
                      <View style={styles.stat}>
                        <MaterialIcons name="group" size={16} color={mutedColor} />
                        <Text style={[styles.statText, { color: mutedColor }]}>{event.participant_count}</Text>
                      </View>
                      <View style={styles.stat}>
                        <MaterialIcons name="favorite" size={16} color={mutedColor} />
                        <Text style={[styles.statText, { color: mutedColor }]}>{event.likes_count}</Text>
                      </View>
                      <View style={styles.stat}>
                        <MaterialIcons name="comment" size={16} color={mutedColor} />
                        <Text style={[styles.statText, { color: mutedColor }]}>{event.comments_count || 0}</Text>
                      </View>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionRow}>
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.primaryAction]}
                        onPress={() => handleOpenEvent(event.id)}
                      >
                        <MaterialIcons name="visibility" size={16} color={theme.primary.main} />
                        <Text style={[styles.actionText, { color: theme.primary.main }]}>Anzeigen</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  // Header - Konsistente Struktur
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 24,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },

  // Scroll View
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 40, // zusätzlicher abstand nach oben
    paddingBottom: 100,
  },

  // Cards - Einheitliches Design
  card: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },

  // Stats - Konsistente Grid
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    textAlign: 'center',
  },

  // Sections - Einheitliche Struktur
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
  },

  // Center Content - Konsistente Mitteilung
  centerContent: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  centerText: {
    fontSize: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },

  // Buttons - Einheitliche Styles
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Events List
  eventsList: {
    gap: 16,
  },

  // Event Cards - Konsistente Struktur
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    lineHeight: 24,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  participantBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  participantText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Event Details - Konsistente Struktur
  eventDetails: {
    marginBottom: 16,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    flex: 1,
  },

  // Event Stats - Konsistente Struktur
  eventStats: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
    fontWeight: '500',
  },

  // Action Buttons - Einheitliches Design
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
    flex: 1,
    minWidth: 80,
    justifyContent: 'center',
  },
  primaryAction: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#0A84FF',
  },
  secondaryAction: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FF9500',
  },
  dangerAction: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
  },
});