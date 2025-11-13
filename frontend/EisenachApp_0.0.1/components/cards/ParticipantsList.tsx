import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import type { EventParticipant } from '@/services/api';
import { useAppTheme } from '@/hooks/use-app-theme';

// Props für die Teilnehmerliste
type Props = {
  participants: EventParticipant[];
  maxParticipants?: number;
  totalCount?: number; // gesamtanzahl aus dem backend (genauer als gefilterte liste)
  friendIds?: number[]; // ids der eigenen freunde um sie oben zu sortieren
  selfUserId?: number; // eigener nutzer zum hervorheben
};

// Komponente zur Anzeige der Event-Teilnehmer
export function ParticipantsList({ participants, maxParticipants, totalCount, friendIds = [], selfUserId }: Props) {
  const theme = useAppTheme();
  const backgroundColor = theme.background.surface;
  const textColor = theme.text.primary;
  const mutedColor = theme.text.muted;

  // lokaler state für "alle anzeigen"
  const [expanded, setExpanded] = React.useState(false);

  // hilfsfunktion: ist teilnehmer ein freund?
  const isFriend = (p: EventParticipant) => friendIds.includes(p.user.id);
  const isSelf = (p: EventParticipant) => (selfUserId ? p.user.id === selfUserId : false);

  // namen korrekt darstellen (vorname nachname oder fallback username)
  const formatName = (p: EventParticipant) => {
    const first = p.user.first_name?.trim() || '';
    const last = p.user.last_name?.trim() || '';
    const combined = `${first} ${last}`.trim();
    return combined.length > 0 ? combined : p.user.username;
  };

  // teilnehmer sortieren: freunde zuerst, dann nach beitrittszeit
  const sorted = [...participants].sort((a, b) => {
    const aFriend = isFriend(a) ? 1 : 0;
    const bFriend = isFriend(b) ? 1 : 0;
    if (aFriend !== bFriend) return bFriend - aFriend; // freunde oben
    // neuere teilnahmen zuerst
    return new Date(b.joined_at).getTime() - new Date(a.joined_at).getTime();
  });

  // begrenzte anzeige (erst 5, dann alle)
  const displayParticipants = expanded ? sorted : sorted.slice(0, 5);
  const remainingCount = sorted.length - displayParticipants.length;

  // Relative Zeit seit Beitritt berechnen
  const getTimeAgo = (joinedAt: string) => {
    const now = new Date();
    const joined = new Date(joinedAt);
    const diffMs = now.getTime() - joined.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `vor ${diffDays} Tag${diffDays === 1 ? '' : 'en'}`;
    } else if (diffHours > 0) {
      return `vor ${diffHours} Stunde${diffHours === 1 ? '' : 'n'}`;
    } else {
      return 'gerade eben';
    }
  };

  if (participants.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={styles.header}>
        <MaterialIcons name="group" size={20} color={theme.primary.main} />
        <Text style={[styles.title, { color: textColor }]}>
          Teilnehmer ({(totalCount ?? participants.length)}{maxParticipants ? ` / ${maxParticipants}` : ''})
        </Text>
      </View>

      <View style={styles.participantsList}>
        {displayParticipants.map((participant) => (
          <View key={participant.id} style={styles.participantRow}>
            <View style={styles.participantInfo}>
              <View style={[styles.avatar, { backgroundColor: isSelf(participant) ? (theme.primary.main + '40') : (theme.primary.main + '20') }]}>
                <MaterialIcons 
                  name="person" 
                  size={16} 
                  color={isSelf(participant) ? '#ffffff' : (isFriend(participant) ? theme.primary.main : mutedColor)} 
                />
              </View>
              <View style={styles.participantDetails}>
                <View style={styles.nameRow}>
                  <Text style={[styles.name, { color: textColor }]}>
                    {formatName(participant)}{isSelf(participant) ? ' (Du)' : ''}
                  </Text>
                  {isFriend(participant) && (
                    <MaterialIcons name="group" size={14} color={theme.friends.online} />
                  )}
                </View>
                <Text style={[styles.joinTime, { color: mutedColor }]}>
                  {getTimeAgo(participant.joined_at)}
                </Text>
              </View>
            </View>
          </View>
        ))}

        {!expanded && remainingCount > 0 && (
          <TouchableOpacity style={styles.showMoreButton} onPress={() => setExpanded(true)}>
            <Text style={[styles.showMoreText, { color: theme.primary.main }]}>
              +{remainingCount} weitere anzeigen
            </Text>
            <MaterialIcons name="expand-more" size={16} color={theme.primary.main} />
          </TouchableOpacity>
        )}
      </View>

      {sorted.some(isFriend) && (
        <View style={styles.friendsSummary}>
          <MaterialIcons name="favorite" size={14} color={theme.friends.online} />
          <Text style={[styles.friendsText, { color: mutedColor }]}>
            {sorted.filter(isFriend).length} deiner Freunde sind dabei
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  participantsList: {
    gap: 8,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  participantDetails: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontSize: 14,
    fontWeight: '500',
  },
  joinTime: {
    fontSize: 12,
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    marginTop: 4,
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: '500',
  },
  friendsSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  friendsText: {
    fontSize: 13,
  },
});


