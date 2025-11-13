import React from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, Alert, RefreshControl, Share } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { useAppTheme } from '@/hooks/use-app-theme';
import { fetchEventById, fetchMyCreatedEvents, deleteEvent, fetchEventAgeAnalytics, fetchEventParticipants, type EventItem, type AgeAnalytics, type ParticipantDetail } from '@/services/api';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

// Event-Dashboard für Event-Ersteller
export default function EventDashboardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  
  const theme = useAppTheme();
  const backgroundColor = theme.background.primary;
  const surfaceColor = theme.background.surface;
  const textColor = theme.text.primary;
  const mutedColor = theme.text.muted;

  // State für Event-Daten
  const [event, setEvent] = React.useState<EventItem | null>(null);
  const [ageAnalytics, setAgeAnalytics] = React.useState<AgeAnalytics | null>(null);
  const [participants, setParticipants] = React.useState<ParticipantDetail[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [participantsPage, setParticipantsPage] = React.useState(1);
  const [loadingMoreParticipants, setLoadingMoreParticipants] = React.useState(false);

  // Event-Daten laden
  React.useEffect(() => {
    if (id && user) {
      loadEventData();
    }
  }, [id, user]);

  const loadEventData = async () => {
    try {
      setLoading(true);
      const eventData = await fetchEventById(parseInt(id!));
      
      // Sicherheitscheck: Nur Event-Ersteller kann Dashboard sehen
      if (eventData && eventData.created_by.id === user?.id) {
        setEvent(eventData);
        
        // Alters-Analytics laden
        try {
          const analytics = await fetchEventAgeAnalytics(parseInt(id!));
          setAgeAnalytics(analytics);
        } catch (error) {
          console.error('Fehler beim Laden der Alters-Analytics:', error);
          // Analytics sind optional, Event kann trotzdem angezeigt werden
        }
        
        // Teilnehmerliste laden
        try {
          const participantsList = await fetchEventParticipants(parseInt(id!));
          setParticipants(participantsList);
        } catch (error) {
          console.error('Fehler beim Laden der Teilnehmer:', error);
          // Teilnehmerliste ist optional
        }
      } else {
        Alert.alert('Zugriff verweigert', 'Du kannst nur deine eigenen Events verwalten.');
        router.back();
      }
    } catch (error) {
      console.error('Fehler beim Laden des Event-Dashboards:', error);
      Alert.alert('Fehler', 'Event konnte nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  };

  // sichere hilfsfunktionen für namensanzeige und initialen
  const getParticipantName = (p: ParticipantDetail) => {
    const first = (p.first_name || '').trim();
    const last = (p.last_name || '').trim();
    const combined = `${first} ${last}`.trim();
    return combined.length > 0 ? combined : (p.username || 'Unbekannt');
  };

  const getParticipantInitials = (p: ParticipantDetail) => {
    const first = (p.first_name || '').trim();
    const last = (p.last_name || '').trim();
    const username = (p.username || '').trim();
    const i1 = first ? first.charAt(0) : (username ? username.charAt(0) : '?');
    const i2 = last ? last.charAt(0) : '';
    return `${i1}${i2}`.toUpperCase();
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadEventData();
    setRefreshing(false);
  }, []);

  // Event löschen
  const handleDeleteEvent = () => {
    if (!event) return;
    
    Alert.alert(
      'Event löschen',
      `"${event.title}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        { 
          text: 'Löschen', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEvent(event.id);
              Alert.alert('Event gelöscht', 'Das Event wurde erfolgreich gelöscht.');
              router.back();
            } catch (error) {
              Alert.alert('Fehler', 'Event konnte nicht gelöscht werden.');
            }
          }
        }
      ]
    );
  };

  // Event bearbeiten
  const handleEditEvent = () => {
    if (!event) return;
    
    if (event.status === 'published') {
      router.push(`/events/edit/${event.id}`);
    } else {
      Alert.alert('Info', 'Nur veröffentlichte Events können bearbeitet werden.');
    }
  };

  // Status-Farbe bestimmen
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return theme.status.success;
      case 'pending': return theme.status.warning;
      case 'draft': return theme.status.error;
      default: return mutedColor;
    }
  };

  // Status-Text bestimmen
  const getStatusText = (status: string) => {
    switch (status) {
      case 'published': return 'Veröffentlicht';
      case 'pending': return 'Wartend auf Freigabe';
      case 'draft': return 'Entwurf';
      default: return 'Unbekannt';
    }
  };

  // CSV-Export für Teilnehmerliste
  const exportParticipantsToCSV = async () => {
    if (!event || participants.length === 0) {
      Alert.alert('Keine Daten', 'Es sind keine Teilnehmer vorhanden.');
      return;
    }

    try {
      // CSV-Header
      const csvHeader = 'Name,Benutzername,Beigetreten am\n';
      
      // CSV-Daten
      const csvData = participants.map(participant => {
        const name = `${participant.first_name} ${participant.last_name}`.trim();
        const username = participant.username;
        const joinedDate = new Date(participant.joined_at).toLocaleDateString('de-DE');
        return `"${name}","${username}","${joinedDate}"`;
      }).join('\n');
      
      const csvContent = csvHeader + csvData;
      const fileName = `teilnehmer_${event.title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
      
      // Datei teilen
      await Share.share({
        message: csvContent,
        title: `Teilnehmerliste - ${event.title}`,
        url: `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`,
      });
      
      Alert.alert('Export erfolgreich', 'Die Teilnehmerliste wurde als CSV exportiert.');
    } catch (error) {
      console.error('Fehler beim CSV-Export:', error);
      Alert.alert('Export-Fehler', 'Die Teilnehmerliste konnte nicht exportiert werden.');
    }
  };

  // Teilnehmer in 5er-Schritten anzeigen
  const getDisplayedParticipants = () => {
    const startIndex = (participantsPage - 1) * 5;
    return participants.slice(startIndex, startIndex + 5);
  };

  const hasMoreParticipants = () => {
    return participantsPage * 5 < participants.length;
  };

  const loadMoreParticipants = () => {
    if (hasMoreParticipants()) {
      setLoadingMoreParticipants(true);
      setTimeout(() => {
        setParticipantsPage(prev => prev + 1);
        setLoadingMoreParticipants(false);
      }, 500);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <View style={styles.loadingContainer}>
          <MaterialIcons name="refresh" size={48} color={theme.primary.main} />
          <Text style={[styles.loadingText, { color: textColor }]}>Dashboard wird geladen...</Text>
        </View>
      </View>
    );
  }

  if (!event) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error" size={48} color={theme.status.error} />
          <Text style={[styles.errorText, { color: textColor }]}>Event nicht gefunden</Text>
        </View>
      </View>
    );
  }

  return (
    <ProtectedRoute 
      fallbackMessage="Melde dich an, um das Event-Dashboard zu sehen"
      fallbackButtonText="Anmelden"
    >
    <ScrollView 
      style={[styles.container, { backgroundColor }]} 
      contentContainerStyle={[styles.containerContent, { paddingBottom: 120 }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.primary.main}
          colors={[theme.primary.main]}
        />
      }>
      
      {/* Header */}
      <View style={styles.headerArea}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <ThemedText type="title" style={[styles.headerTitle, { color: textColor }]}>
          Event-Dashboard
        </ThemedText>
        <Text style={[styles.mutedText, { color: mutedColor }]}>
          Verwaltung für: {event.title}
        </Text>
      </View>

      {/* Event-Status */}
      <View style={[styles.statusCard, { backgroundColor: surfaceColor }]}>
        <View style={styles.statusHeader}>
          <MaterialIcons name="info" size={24} color={getStatusColor(event.status)} />
          <Text style={[styles.statusTitle, { color: textColor }]}>Event-Status</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(event.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(event.status) }]}>
            {getStatusText(event.status)}
          </Text>
        </View>
        <Text style={[styles.statusDescription, { color: mutedColor }]}>
          {event.status === 'published' && 'Dein Event ist öffentlich sichtbar und Teilnehmer können sich anmelden.'}
          {event.status === 'pending' && 'Dein Event wartet auf eine Überprüfung und Freigabe durch die Moderatoren.'}
          {event.status === 'draft' && 'Dein Event ist noch ein Entwurf und nicht öffentlich sichtbar.'}
        </Text>
      </View>

      {/* Event-Statistiken */}
      <View style={[styles.statsCard, { backgroundColor: surfaceColor }]}>
        <View style={styles.statsHeader}>
          <MaterialIcons name="analytics" size={24} color={theme.primary.main} />
          <Text style={[styles.statsTitle, { color: textColor }]}>Statistiken</Text>
        </View>
        
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <MaterialIcons name="group" size={20} color={theme.status.success} />
            <Text style={[styles.statNumber, { color: theme.status.success }]}>
              {event.participant_count}
            </Text>
            <Text style={[styles.statLabel, { color: mutedColor }]}>Teilnehmer</Text>
          </View>
          
          <View style={styles.statItem}>
            <MaterialIcons name="favorite" size={20} color={theme.status.error} />
            <Text style={[styles.statNumber, { color: theme.status.error }]}>
              {event.likes_count}
            </Text>
            <Text style={[styles.statLabel, { color: mutedColor }]}>Likes</Text>
          </View>
          
          <View style={styles.statItem}>
            <MaterialIcons name="chat" size={20} color={theme.status.warning} />
            <Text style={[styles.statNumber, { color: theme.status.warning }]}>
              {event.comments_count || 0}
            </Text>
            <Text style={[styles.statLabel, { color: mutedColor }]}>Kommentare</Text>
          </View>
          
          <View style={styles.statItem}>
            <MaterialIcons name="visibility" size={20} color={theme.primary.main} />
            <Text style={[styles.statNumber, { color: theme.primary.main }]}>
              {event.participant_count || 0}
            </Text>
            <Text style={[styles.statLabel, { color: mutedColor }]}>Aufrufe</Text>
          </View>
        </View>
      </View>

      {/* Alters-Analytics */}
      {ageAnalytics && (
        <View style={[styles.statsCard, { backgroundColor: surfaceColor }]}>
          <View style={styles.statsHeader}>
            <MaterialIcons name="cake" size={24} color={theme.primary.main} />
            <Text style={[styles.statsTitle, { color: textColor }]}>Altersverteilung</Text>
          </View>
          
          <View style={styles.ageChart}>
            {Object.entries(ageAnalytics.age_distribution).map(([ageGroup, count]) => (
              <View key={ageGroup} style={styles.ageBar}>
                <View style={styles.ageBarContainer}>
                  <View 
                    style={[
                      styles.ageBarFill, 
                      { 
                        backgroundColor: theme.primary.main,
                        height: ageAnalytics.total_participants > 0 
                          ? `${(count / ageAnalytics.total_participants) * 100}%`
                          : '0%'
                      }
                    ]} 
                  />
                </View>
                <Text style={[styles.ageLabel, { color: mutedColor }]}>{ageGroup}</Text>
                <Text style={[styles.ageCount, { color: textColor }]}>{count}</Text>
              </View>
            ))}
          </View>
          
          <Text style={[styles.ageSummary, { color: mutedColor }]}>
            Gesamt: {ageAnalytics.total_participants} Teilnehmer
          </Text>
        </View>
      )}

      {/* Event-Details */}
      <View style={[styles.detailsCard, { backgroundColor: surfaceColor }]}>
        <View style={styles.detailsHeader}>
          <MaterialIcons name="event" size={24} color={theme.primary.main} />
          <Text style={[styles.detailsTitle, { color: textColor }]}>Event-Details</Text>
        </View>
        
        <View style={styles.detailRow}>
          <MaterialIcons name="schedule" size={16} color={mutedColor} />
          <Text style={[styles.detailText, { color: textColor }]}>
            {new Date(event.date).toLocaleDateString('de-DE', {
              weekday: 'long',
              day: '2-digit',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <MaterialIcons name="location-on" size={16} color={mutedColor} />
          <Text style={[styles.detailText, { color: textColor }]}>
            {event.location}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <MaterialIcons name="description" size={16} color={mutedColor} />
          <Text style={[styles.detailText, { color: textColor }]}>
            {event.description}
          </Text>
        </View>
      </View>

      {/* Teilnehmerliste */}
      <View style={[styles.participantsCard, { backgroundColor: surfaceColor }]}>
        <View style={styles.participantsHeader}>
          <MaterialIcons name="group" size={24} color={theme.primary.main} />
          <Text style={[styles.participantsTitle, { color: textColor }]}>
            Teilnehmer ({participants.length})
          </Text>
          {participants.length > 0 && (
            <TouchableOpacity 
              style={[styles.exportButton, { backgroundColor: theme.primary.main }]}
              onPress={exportParticipantsToCSV}
            >
              <MaterialIcons name="file-download" size={16} color="#ffffff" />
              <Text style={styles.exportButtonText}>CSV</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {participants.length === 0 ? (
          <View style={styles.emptyParticipants}>
            <MaterialIcons name="group-add" size={48} color={mutedColor} />
            <Text style={[styles.emptyParticipantsText, { color: mutedColor }]}>
              Noch keine Teilnehmer
            </Text>
          </View>
        ) : (
          <View style={styles.participantsList}>
            {getDisplayedParticipants().map((participant, index) => (
              <View key={participant.id} style={[styles.participantItem, { backgroundColor: backgroundColor }]}>
                <View style={styles.participantInfo}>
                  <View style={[styles.participantAvatar, { backgroundColor: theme.primary.main }]}>
                    <Text style={styles.participantAvatarText}>{getParticipantInitials(participant)}</Text>
                  </View>
                  <View style={styles.participantDetails}>
                    <Text style={[styles.participantName, { color: textColor }]}>{getParticipantName(participant)}</Text>
                    <Text style={[styles.participantUsername, { color: mutedColor }]}>
                      @{participant.username || 'unbekannt'}
                    </Text>
                    <Text style={[styles.participantJoined, { color: mutedColor }]}>
                      Beigetreten: {new Date(participant.joined_at).toLocaleDateString('de-DE', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
            
            {/* Mehr laden Button */}
            {hasMoreParticipants() && (
              <TouchableOpacity 
                style={[styles.loadMoreButton, { backgroundColor: theme.primary.main }]}
                onPress={loadMoreParticipants}
                disabled={loadingMoreParticipants}
              >
                <MaterialIcons 
                  name={loadingMoreParticipants ? "hourglass-empty" : "expand-more"} 
                  size={20} 
                  color="#ffffff" 
                />
                <Text style={styles.loadMoreButtonText}>
                  {loadingMoreParticipants ? 'Lädt...' : 'Mehr anzeigen'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Aktionen */}
      <View style={[styles.actionsCard, { backgroundColor: surfaceColor }]}>
        <View style={styles.actionsHeader}>
          <MaterialIcons name="settings" size={24} color={theme.primary.main} />
          <Text style={[styles.actionsTitle, { color: textColor }]}>Aktionen</Text>
        </View>
        
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: theme.primary.main }]}
          onPress={() => router.push(`/event/${event.id}`)}>
          <MaterialIcons name="visibility" size={20} color="#ffffff" />
          <Text style={styles.actionButtonText}>Event ansehen</Text>
        </TouchableOpacity>
        
        {event.status === 'published' && (
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.status.warning }]}
            onPress={handleEditEvent}>
            <MaterialIcons name="edit" size={20} color="#ffffff" />
            <Text style={styles.actionButtonText}>Event bearbeiten</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: theme.status.error }]}
          onPress={handleDeleteEvent}>
          <MaterialIcons name="delete" size={20} color="#ffffff" />
          <Text style={styles.actionButtonText}>Event löschen</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  containerContent: {
    paddingTop: 40, // zusätzlicher abstand nach oben
    paddingBottom: 32,
  },
  headerArea: {
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 16,
    gap: 8,
  },
  backButton: {
    position: 'absolute',
    top: 80,
    left: 24,
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
  },
  mutedText: {
    fontSize: 14,
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '500',
  },
  statusCard: {
    marginHorizontal: 24,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  statsCard: {
    marginHorizontal: 24,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    gap: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  detailsCard: {
    marginHorizontal: 24,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  detailText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  
  // Alters-Analytics Styles
  ageChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    marginVertical: 16,
    paddingHorizontal: 8,
  },
  ageBar: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  ageBarContainer: {
    width: 24,
    height: 80,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  ageBarFill: {
    width: '100%',
    borderRadius: 12,
    minHeight: 2,
  },
  ageLabel: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  ageCount: {
    fontSize: 14,
    fontWeight: '600',
  },
  ageSummary: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
  actionsCard: {
    marginHorizontal: 24,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  actionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionsTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Teilnehmerliste Styles
  participantsCard: {
    marginHorizontal: 24,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  participantsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  participantsTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  exportButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyParticipants: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  emptyParticipantsText: {
    fontSize: 16,
    textAlign: 'center',
  },
  participantsList: {
    gap: 12,
  },
  participantItem: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  participantAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  participantAvatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  participantDetails: {
    flex: 1,
    gap: 4,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
  },
  participantUsername: {
    fontSize: 14,
    fontWeight: '500',
  },
  participantJoined: {
    fontSize: 12,
  },
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
    marginTop: 8,
  },
  loadMoreButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});