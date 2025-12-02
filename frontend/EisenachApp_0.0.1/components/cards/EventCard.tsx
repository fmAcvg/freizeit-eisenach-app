// Import der notwendigen React Native und Expo Komponenten
import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';

// Import der eigenen Typen und Hooks
import type { EventItem } from '@/services/api';
import { useAppTheme } from '@/hooks/use-app-theme';
import { usePrivacySettings } from '@/hooks/use-privacy-settings';
import { useAuth } from '@/contexts/AuthContext';

// Kein Fallback-Bild mehr - Events ohne Bild zeigen kein Bild an

// Typdefinition für die Props der EventCard-Komponente
type Props = {
  event: EventItem; // Event-Daten, die angezeigt werden sollen
  accent?: string; // Akzentfarbe für Buttons und Badges (optional)
  onPress?: (event: EventItem) => void; // Klick-Handler für die gesamte Karte (optional)
  onLikePress?: (event: EventItem) => void; // Like-Button-Handler (optional)
  showLikeButton?: boolean; // Ob Like-Button angezeigt werden soll (optional, Standard: true)
  showJoinedBadge?: boolean; // Ob "Angemeldet"-Badge angezeigt werden soll (optional, Standard: true)
};

// EventCard-Komponente für die Anzeige von Events im Feed
export function EventCard({
  event,
  accent = '#0A84FF',
  onPress,
  onLikePress,
  showLikeButton = true,
  showJoinedBadge = true,
}: Props) {
  const theme = useAppTheme();
  const privacy = usePrivacySettings();
  const { isAuthenticated } = useAuth();
  const backgroundColor = theme.background.surface;
  const textColor = theme.text.primary;
  const mutedColor = theme.text.muted;

  // Datum und Uhrzeit formatieren
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60));
      
      if (diffInHours < 0) {
        return 'Vergangen';
      } else if (diffInHours < 24) {
        return `In ${diffInHours}h`;
      } else {
        const diffInDays = Math.floor(diffInHours / 24);
        return `In ${diffInDays} Tagen`;
      }
    } catch {
      return 'Datum unbekannt';
    }
  };

  const whenLabel: string = event.date ? formatDate(event.date) : 'Datum unbekannt';
  const timeLabel: string = event.date ? new Date(event.date).toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  }) : 'Zeit unbekannt';

  // Teilnehmer ermitteln, die angezeigt werden sollen
  // Für Gäste keine Teilnehmer anzeigen
  const participatingFriends = isAuthenticated ? (event.participants?.slice(0, 3) || []) : [];
  const showFriendsSection = isAuthenticated && privacy.canShowParticipants() && participatingFriends.length > 0;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => onPress?.(event)}
      accessibilityRole="button"
      accessibilityLabel={`Event ${event.title}`}
      style={[styles.card, { backgroundColor }]}
    >
      {/* Bild nur anzeigen wenn vorhanden */}
      {event.image_url && (
        <View style={styles.imageWrap}>
          <Image 
            source={{ 
              uri: event.image_url 
            }} 
            style={styles.image} 
          />
        </View>
      )}

      <View style={[styles.body, !event.image_url && styles.bodyWithoutImage]}>
        <View style={styles.badgeRow}>
          <View style={[styles.pill, { backgroundColor: withAlpha(accent, 0.1) }]}>
            <MaterialIcons name="schedule" size={16} color={accent} />
            <Text style={[styles.pillText, { color: accent }]}>{whenLabel}</Text>
          </View>
          {showJoinedBadge && (event.joined || event.is_participant) ? (
            <View style={[styles.pill, styles.joinedPill]}>
              <MaterialIcons name="check" size={16} color={accent} />
              <Text style={[styles.joinedText, { color: accent }]}>Angemeldet</Text>
            </View>
          ) : null}
        </View>

        <Text style={[styles.title, { color: textColor }]}>{event.title || 'Titel unbekannt'}</Text>
        <Text style={[styles.description, { color: mutedColor }]} numberOfLines={3}>
          {event.description || 'Beschreibung nicht verfügbar'}
        </Text>
        
        {/* Ersteller anzeigen */}
        {event.created_by && (
          <View style={styles.creatorRow}>
            <MaterialIcons name="person" size={14} color={mutedColor} />
            <Text style={[styles.creatorText, { color: mutedColor }]}>
              {`Von ${event.created_by.first_name || 'Unbekannt'} ${event.created_by.last_name || 'Benutzer'}`}
            </Text>
          </View>
        )}

        {/* Adresse nur für Teilnehmer/Ersteller sichtbar: Im Feed grundsätzlich nicht anzeigen */}
        <View style={styles.metaRow}>
          <MaterialIcons name="schedule" size={18} color={mutedColor} />
          <Text style={[styles.metaText, { color: mutedColor }]}>{timeLabel}</Text>
        </View>

        {/* Kapazität anzeigen, wenn begrenzt */}
        {typeof event.max_guests === 'number' && (
          <View style={styles.metaRow}>
            <MaterialIcons name="event-seat" size={18} color={mutedColor} />
            <Text style={[styles.metaText, { color: mutedColor }]}>
              {event.participant_count || 0} / {event.max_guests} Plätze
            </Text>
          </View>
        )}

        {/* Friends participating section */}
        {showFriendsSection && (
          <View style={styles.friendsSection}>
            <View style={styles.friendsHeader}>
              <MaterialIcons name="group" size={14} color={theme.friends.online} />
              <Text style={[styles.friendsLabel, { color: mutedColor }]}>
                Teilnehmer:
              </Text>
            </View>
            <View style={styles.friendsList}>
              {participatingFriends.slice(0, 3).map((participant, index) => (
                <TouchableOpacity 
                  key={participant.id} 
                  style={styles.participantItem}
                  onPress={() => router.push(`/profile/${participant.user.id}`)}>
                  <View style={styles.participantInfo}>
                    {participant.user.profile_image ? (
                      <Image 
                        source={{ uri: participant.user.profile_image }} 
                        style={styles.participantAvatar}
                      />
                    ) : (
                      <View style={[styles.avatarContainer, { backgroundColor: theme.primary.main + '20' }]}>
                        <MaterialIcons name="person" size={16} color={theme.primary.main} />
                      </View>
                    )}
                    <Text style={[styles.participantName, { color: textColor }]} numberOfLines={1}>
                      {participant.user.first_name || participant.user.username}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
              {participatingFriends.length > 3 && (
                <View style={styles.participantItem}>
                  <View style={[styles.avatarContainer, { backgroundColor: mutedColor + '20' }]}>
                    <Text style={[styles.moreText, { color: mutedColor }]}>
                      {`+${participatingFriends.length - 3}`}
                    </Text>
                  </View>
                  <Text style={[styles.participantName, { color: mutedColor }]} numberOfLines={1}>
                    weitere
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Like Button */}
        {showLikeButton ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Event gefällt mir"
            onPress={() => onLikePress?.(event)}
            style={[styles.likeButton, { backgroundColor: withAlpha(accent, 0.12) }]}
            activeOpacity={0.8}>
            <View style={styles.likeContent}>
              <MaterialIcons name="favorite" size={18} color={accent} />
              <Text style={[styles.likeText, { color: accent }]}>
                {`${event.likes_count || 0} Gefällt${event.likes_count === 1 ? '' : ''}`}
              </Text>
            </View>
          </TouchableOpacity>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

// Relative Datumsanzeige (Heute, Morgen, etc.)
function getRelativeLabel(dateISO: string) {
  const date = new Date(dateISO);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDay = new Date(date);
  eventDay.setHours(0, 0, 0, 0);
  const diff = Math.round((eventDay.getTime() - today.getTime()) / 86_400_000);
  if (diff === 0) return 'Heute';
  if (diff === 1) return 'Morgen';
  if (diff === -1) return 'Gestern';
  return date.toLocaleDateString('de-DE', {
    day: 'numeric',
    month: 'short',
  });
}

// Farbe mit Transparenz erstellen
function withAlpha(color: string, alpha: number) {
  const a = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0');
  return `${color}${a}`;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
  imageWrap: {
    overflow: 'hidden',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  image: {
    width: '100%',
    height: 210,
  },
  body: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    gap: 12,
  },
  bodyWithoutImage: {
    paddingTop: 24, // Mehr Padding oben wenn kein Bild vorhanden
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  joinedPill: {
    backgroundColor: 'rgba(10, 132, 255, 0.1)',
  },
  joinedText: {
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
  },
  // Ersteller-Informationen
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  creatorText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 14,
  },
  likeButton: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  likeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  likeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  friendsSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  friendsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  friendsLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  friendsList: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    flexWrap: 'wrap',
  },
  participantItem: {
    alignItems: 'center',
    gap: 6,
    maxWidth: 80,
  },
  participantInfo: {
    alignItems: 'center',
    gap: 6,
  },
  participantAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  participantName: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  friendAvatar: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    zIndex: 1,
    elevation: 2,
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreText: {
    fontSize: 10,
    fontWeight: '600',
  },
});


