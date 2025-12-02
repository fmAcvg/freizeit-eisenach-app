// import der expo router komponenten für navigation
import { Link, Stack, useLocalSearchParams, useFocusEffect } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Linking,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

// import der eigenen komponenten und services
import { ThemedText } from '@/components/themed-text';
import { fetchEventById, type EventItem, fetchEventComments, addEventComment, deleteEventComment, reportComment, type EventComment, fetchFriends, joinEvent, leaveEvent, fetchEventParticipants } from '@/services/api';
import { router } from 'expo-router';
import { useAppTheme } from '@/hooks/use-app-theme';
import { ParticipantsList } from '@/components/cards/ParticipantsList';
import { usePrivacySettings } from '@/hooks/use-privacy-settings';
import CommentSection from '@/components/comments/CommentSection';
import { useAuth } from '@/contexts/AuthContext';

const PRIMARY = '#0A84FF';

// event detail bildschirm mit vollständigen informationen und interaktionsmöglichkeiten
// hier sieht man alle details zu einem event und kann sich anmelden oder kommentieren
export default function EventDetailScreen() {
  // Screenshot-Registrierung entfernt
  const scrollRef = React.useRef<import('react-native').ScrollView>(null);
  const { id } = useLocalSearchParams<{ id: string }>();
  
  // state für event daten kommentare und ladezustand
  const [event, setEvent] = React.useState<EventItem | null>(null);
  const [comments, setComments] = React.useState<EventComment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [friendIds, setFriendIds] = React.useState<number[]>([]);
  // Ref um zu verhindern dass useFocusEffect die Daten überschreibt während An-/Abmeldung
  const isUpdatingRef = React.useRef(false);

  const theme = useAppTheme();
  const privacy = usePrivacySettings();
  const { user } = useAuth();
  const backgroundColor = theme.background.primary;
  const surfaceColor = theme.background.surface;
  const textColor = theme.text.primary;
  const mutedColor = theme.text.muted;

  // Funktion zum Laden der Event-Daten (wiederverwendbar)
  const loadEventData = React.useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      // event und kommentare parallel laden für bessere performance
      const eventId = parseInt(id);
      // zusätzlich die freunde laden um sie in der teilnehmerliste zu markieren
      // Ohne Auth: keine Requests die Auth brauchen
      const [eventData, commentsData] = await Promise.all([
        fetchEventById(eventId),
        fetchEventComments(eventId),
      ]);
      
      // joined-status aus backend-flag is_participant ODER teilnehmerliste ableiten
      // erklärung: Backend liefert jetzt is_participant, das ist die zuverlässigste Quelle
      const isJoined = !!(eventData?.is_participant ?? eventData?.joined ?? eventData?.participants?.some(p => p.user.id === user?.id));
      setEvent(eventData ? { ...eventData, joined: isJoined, is_participant: eventData.is_participant ?? isJoined } : null);
      setComments(commentsData ?? []);
      // friendIds nur laden, wenn eingeloggt
      if (user) {
        try {
          const fl = await fetchFriends();
          setFriendIds(Array.isArray(fl) ? fl.map(f => f.id) : []);
        } catch {
          setFriendIds([]);
        }
      } else {
        setFriendIds([]);
      }
    } catch (error) {
      console.error('❌ Error loading event data:', error);
      setEvent(null);
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [id, user?.id]);

  // event daten und kommentare beim ersten laden abrufen
  React.useEffect(() => {
    loadEventData();
  }, [id]);

  // Event-Daten neu laden wenn Screen fokussiert wird (z.B. nach Navigation zurück)
  useFocusEffect(
    React.useCallback(() => {
      // Nicht neu laden wenn gerade eine An-/Abmeldung stattfindet
      if (isUpdatingRef.current) {
        return;
      }
      // Nur neu laden wenn bereits ein Event geladen wurde (nicht beim ersten Mal)
      if (event) {
        // Kurze Verzögerung um sicherzustellen dass An-/Abmeldung abgeschlossen ist
        const timeoutId = setTimeout(() => {
          if (!isUpdatingRef.current) {
            loadEventData();
          }
        }, 500);
        return () => clearTimeout(timeoutId);
      }
    }, [id, loadEventData, event])
  );

  // joined-Status nachträglich setzen, sobald der Nutzer im Kontext da ist
  // Hintergrund: Wenn die App frisch geöffnet wird, sind Event-Teilnehmer schon vom Backend geladen,
  // aber der Nutzer (useAuth) kommt evtl. ein paar Millisekunden später. Dann setzen wir hier korrekt "joined".
  React.useEffect(() => {
    if (!user || !event) return;
    // joined aus Backend-Feld is_participant ODER teilnehmerliste ableiten (robust gegen später ladende daten)
    const joinedNow = !!(event.is_participant ?? event.joined ?? event.participants?.some(p => p.user.id === user.id));
    if (event.joined !== joinedNow) {
      setEvent(prev => (prev ? { ...prev, joined: joinedNow, is_participant: prev.is_participant ?? joinedNow } as any : prev));
    }
  }, [user?.id, event?.participants, event?.is_participant]);

  // Fallback: Teilnehmerliste vom Backend nachladen sobald User verfügbar ist,
  // falls wir noch keine Teilnehmerdaten haben. So ist "joined" wirklich zuverlässig,
  // auch wenn das Event bereits voll ist (Abmelde-Button hat Priorität).
  React.useEffect(() => {
    const ensureParticipantsLoaded = async () => {
      if (!id || !user || !event) return;
      const eventId = parseInt(id);
      // Nur nachladen, wenn entweder keine Teilnehmer vorhanden sind oder joined unklar ist
      const missingParticipants = !event.participants || event.participants.length === 0;
      if (!missingParticipants) return;
      try {
        const refreshed = await fetchEventParticipants(eventId);
        setEvent(prev => prev ? {
          ...prev,
          participants: refreshed.map(p => ({
            id: p.id,
            joined_at: p.joined_at,
            user: {
              id: p.user_id,
              username: p.username,
              first_name: p.first_name,
              last_name: p.last_name,
              profile_image: p.profile_image,
            }
          })),
          participant_count: refreshed.length,
          // joined aus Backend-Feld is_participant ODER Teilnehmerliste ableiten
          joined: prev?.is_participant ?? refreshed.some(p => p.user_id === user.id),
          is_participant: prev?.is_participant ?? refreshed.some(p => p.user_id === user.id),
        } : prev);
      } catch (e) {
        // still schweigend ignorieren – UI bleibt nutzbar, joined wird später ggf. gesetzt
      }
    };
    ensureParticipantsLoaded();
  }, [id, user?.id, event?.id, event?.participants?.length]);

  // event anmeldung/abmeldung
  const handleUnregister = async () => {
    if (!id) return;
    isUpdatingRef.current = true;
    try {
      await leaveEvent(parseInt(id));
      // lokal sofort aktualisieren
      setEvent(prev => {
        if (!prev) return prev;
        const filtered = (prev.participants || []).filter(p => p.user.id !== user?.id);
        return { ...prev, joined: false, is_participant: false, participants: filtered, participant_count: Math.max(0, (prev.participant_count || 0) - 1) } as any;
      });
      // Event-Daten vollständig neu laden um sicherzustellen dass is_participant korrekt ist
      try {
        const refreshedEvent = await fetchEventById(parseInt(id));
        if (refreshedEvent) {
          const isJoined = !!(refreshedEvent.is_participant ?? refreshedEvent.participants?.some(p => p.user.id === user?.id));
          setEvent({ ...refreshedEvent, joined: isJoined, is_participant: refreshedEvent.is_participant ?? isJoined });
        }
      } catch {}
      Alert.alert('Abgemeldet', 'Du hast deine Teilnahme erfolgreich beendet.');
    } catch (e) {
      Alert.alert('Fehler', 'Abmelden fehlgeschlagen.');
    } finally {
      // Flag nach kurzer Verzögerung zurücksetzen
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 1000);
    }
  };

  const handleJoin = async () => {
    if (!id) return;
    if (!user) {
      Alert.alert('Anmeldung erforderlich', 'Bitte melde dich an, um teilzunehmen.', [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Anmelden', onPress: () => router.replace('/(tabs)/profile') },
      ]);
      return;
    }
    // Wenn bereits angemeldet, nichts tun
    if (event?.joined || event?.is_participant) {
      return;
    }
    // Wenn Event voll ist, gar nicht erst ans Backend senden
    const isFull = typeof event?.max_guests === 'number' && (event?.participant_count || 0) >= (event?.max_guests || 0);
    if (isFull) {
      Alert.alert('Event ausgebucht', 'Dieses Event ist bereits voll. Es sind keine Plätze mehr frei.');
      return;
    }
    
    isUpdatingRef.current = true;
    try {
      await joinEvent(parseInt(id));
      // Event-Daten vollständig neu laden um sicherzustellen dass is_participant korrekt ist
      const refreshedEvent = await fetchEventById(parseInt(id));
      if (refreshedEvent) {
        const isJoined = !!(refreshedEvent.is_participant ?? refreshedEvent.participants?.some(p => p.user.id === user?.id));
        setEvent({ ...refreshedEvent, joined: isJoined, is_participant: refreshedEvent.is_participant ?? isJoined });
      }
      Alert.alert('Angemeldet', 'Du nimmst jetzt am Event teil.');
    } catch (e) {
      // Bei Fehler: Event-Daten neu laden um korrekten Status zu bekommen
      try {
        const refreshedEvent = await fetchEventById(parseInt(id));
        if (refreshedEvent) {
          const isJoined = !!(refreshedEvent.is_participant ?? refreshedEvent.participants?.some(p => p.user.id === user?.id));
          setEvent({ ...refreshedEvent, joined: isJoined, is_participant: refreshedEvent.is_participant ?? isJoined });
        }
      } catch {}
      // Bessere Fehlerbehandlung: Zeige die genaue Fehlermeldung vom Backend
      let errorMessage = 'Teilnahme nicht möglich.';
      if (e instanceof Error) {
        errorMessage = e.message;
        // Wenn die Fehlermeldung zu generisch ist, versuche mehr Details zu extrahieren
        if (errorMessage.includes('400') || errorMessage.includes('API Error')) {
          errorMessage = 'Teilnahme nicht möglich. Das Event könnte voll sein oder du erfüllst die Altersanforderungen nicht.';
        }
      }
      Alert.alert('Fehler', errorMessage);
    } finally {
      // Flag nach kurzer Verzögerung zurücksetzen
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 1000);
    }
  };

  // neuen kommentar hinzufügen
  const handleAddComment = async (text: string) => {
    if (!id) return;
    try {
      const newComment = await addEventComment(parseInt(id), text);
      setComments(prev => {
        // Stelle sicher, dass prev immer ein Array ist
        const currentComments = Array.isArray(prev) ? prev : [];
        return [...currentComments, newComment];
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  };

  // kommentar löschen
  const handleDeleteComment = async (commentId: number) => {
    try {
      await deleteEventComment(commentId);
      setComments(prev => {
        // Stelle sicher, dass prev immer ein Array ist
        const currentComments = Array.isArray(prev) ? prev : [];
        return currentComments.filter(c => c.id !== commentId);
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  };

  // kommentar melden
  const handleReportComment = async (commentId: number) => {
    // Zeige Dialog zur Auswahl des Meldegrund
    Alert.alert(
      'Kommentar melden',
      'Warum möchtest du diesen Kommentar melden?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Unangemessener Inhalt',
          onPress: () => submitReport(commentId, 'inappropriate_content'),
        },
        {
          text: 'Belästigung',
          onPress: () => submitReport(commentId, 'harassment'),
        },
        {
          text: 'Spam',
          onPress: () => submitReport(commentId, 'spam'),
        },
        {
          text: 'Gewalt',
          onPress: () => submitReport(commentId, 'violence'),
        },
        {
          text: 'Sonstiges',
          onPress: () => submitReport(commentId, 'other'),
        },
      ]
    );
  };

  // Meldung absenden
  const submitReport = async (commentId: number, reason: string) => {
    try {
      await reportComment(commentId, reason);
      Alert.alert(
        'Gemeldet',
        'Der Kommentar wurde gemeldet und wird überprüft. Vielen Dank für deine Mithilfe!',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error reporting comment:', error);
      Alert.alert(
        'Fehler',
        'Der Kommentar konnte nicht gemeldet werden. Bitte versuche es später erneut.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: event?.title ?? 'Event',
          headerBackTitle: 'Zurück',
        }}
      />
      {loading ? (
        // ladezustand zeigt spinner während event daten geladen werden
        <View style={[styles.loader, { backgroundColor }]}>
          <ActivityIndicator />
        </View>
      ) : event ? (
        // hauptinhalt wenn event erfolgreich geladen wurde
        <ScrollView ref={scrollRef} style={[styles.container, { backgroundColor }]} contentContainerStyle={{ paddingTop: 104, paddingBottom: 48 }}>
          {/* event hero bild - nur anzeigen wenn vorhanden */}
          {event.image_url && (
            <Image
              source={{
                uri: event.image_url,
              }}
              style={styles.hero}
            />
          )}
          <View style={[styles.body, !event.image_url && styles.bodyWithoutImage]}>
            {/* Hinweis für Gäste: Anmeldung für mehr Informationen */}
            {!user && (
              <View style={{
                padding: 16,
                borderRadius: 12,
                backgroundColor: surfaceColor,
                marginBottom: 8,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.12)'
              }}>
                <Text style={{ color: mutedColor, marginBottom: 12 }}>
                  Du bist nicht angemeldet. Melde dich an, um alle Informationen (Teilnahme, Kommentare, Teilnehmerliste) zu sehen.
                </Text>
                <TouchableOpacity
                  onPress={() => router.push('/(tabs)/profile')}
                  style={{
                    backgroundColor: theme.primary.main,
                    paddingVertical: 12,
                    borderRadius: 10,
                    alignItems: 'center'
                  }}
                >
                  <Text style={{ color: '#ffffff', fontWeight: '700' }}>Zur Anmeldung</Text>
                </TouchableOpacity>
              </View>
            )}
            {/* datum und uhrzeit pill */}
            <View style={styles.pillRow}>
              <View style={[styles.pill, { backgroundColor: surfaceColor }]}>
                <MaterialIcons name="schedule" size={18} color={theme.primary.main} />
                <Text style={[styles.pillText, { color: textColor }]}>
                  {new Date(event.date).toLocaleString('de-DE', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            </View>
            {/* event titel */}
            <ThemedText type="title" style={[styles.title, { color: textColor }]}>
              {event.title}
            </ThemedText>
            {/* event beschreibung falls vorhanden */}
            {event.description ? (
              <Text style={[styles.description, { color: mutedColor }]}>{event.description}</Text>
            ) : null}

            {/* meta informationen (Ort) nur für teilnehmer/ersteller sichtbar */}
            {(event?.can_view_location || event.joined || event.created_by?.id === user?.id) && (
              <View style={styles.metaList}>
                <MetaRow 
                  icon="place" 
                  label={event.location} 
                  textColor={textColor} 
                  surfaceColor={surfaceColor} 
                  theme={theme}
                  showMapsButton={true}
                  location={event.location}
                />
              </View>
            )}

            {/* teilnehmerliste nur anzeigen wenn angemeldet und datenschutz es erlaubt */}
            {user && privacy.canShowParticipants() && event.participants && event.participants.length > 0 && (
              <ParticipantsList 
                participants={event.participants} 
                maxParticipants={event.max_guests}
                totalCount={event.participant_count}
                friendIds={friendIds}
                selfUserId={user?.id}
              />
            )}

            {/* kommentare bereich: nur anzeigen wenn angemeldet, sonst Hinweis */}
            {user && id ? (
              <CommentSection
                eventId={parseInt(id)}
                comments={comments}
                onAddComment={handleAddComment}
                onDeleteComment={handleDeleteComment}
                onReportComment={handleReportComment}
                loading={loading}
              />
            ) : (
              <View style={{
                marginTop: 8,
                padding: 16,
                borderRadius: 12,
                backgroundColor: surfaceColor
              }}>
                <Text style={{ color: mutedColor }}>Melde dich an, um Kommentare zu sehen und zu schreiben.</Text>
              </View>
            )}

            {/* hauptbutton für teilnahme oder abmeldung - nicht anzeigen für den Ersteller */}
            {event.created_by?.id !== user?.id && (() => {
              const isParticipant = !!(event.joined || event.is_participant);
              return (
                <TouchableOpacity 
                  style={[
                    styles.primaryButton, 
                    { 
                      backgroundColor: !user
                        ? theme.text.muted
                        : isParticipant
                          ? theme.status.error
                          : (typeof event.max_guests === 'number' && (event.participant_count || 0) >= (event.max_guests || 0))
                            ? theme.text.muted
                            : theme.primary.main,
                      opacity: !user ? 0.6 : 1,
                    }
                  ]}
                  onPress={() => {
                    // Wenn nicht angemeldet: zur Anmeldung leiten
                    if (!user) {
                      Alert.alert('Anmeldung erforderlich', 'Bitte melde dich an, um an Events teilzunehmen.', [
                        { text: 'Abbrechen', style: 'cancel' },
                        { text: 'Anmelden', onPress: () => router.replace('/(tabs)/profile') },
                      ]);
                      return;
                    }
                    
                    if (isParticipant) {
                      return handleUnregister();
                    }
                    
                    const isFull = typeof event.max_guests === 'number' && (event.participant_count || 0) >= (event.max_guests || 0);
                    if (isFull) {
                      Alert.alert('Event ausgebucht', 'Dieses Event ist bereits voll. Es sind keine Plätze mehr frei.');
                      return;
                    }
                    
                    handleJoin();
                  }}
                  disabled={!user || (!isParticipant && typeof event.max_guests === 'number' && (event.participant_count || 0) >= (event.max_guests || 0))}
                >
                  <MaterialIcons 
                    name={!user ? "lock" : isParticipant ? "exit-to-app" : (typeof event.max_guests === 'number' && (event.participant_count || 0) >= (event.max_guests || 0)) ? 'block' : 'person-add'} 
                    size={20} 
                    color="#ffffff" 
                  />
                  <Text style={styles.primaryButtonText}>
                    {!user ? 'Anmeldung erforderlich' : isParticipant ? 'Abmelden' : (typeof event.max_guests === 'number' && (event.participant_count || 0) >= (event.max_guests || 0)) ? 'Ausgebucht' : 'Teilnehmen'}
                  </Text>
                </TouchableOpacity>
              );
            })()}

            {/* weiterleitung zu weiteren events */}
            <Link href="/(tabs)" asChild>
              <TouchableOpacity style={[styles.secondaryButton, { borderColor: 'rgba(255,255,255,0.2)' }]}>
                <Text style={[styles.secondaryButtonText, { color: textColor }]}>Weitere Events</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      ) : (
        // fehlerzustand wenn kein event gefunden wurde
        <View style={[styles.loader, { backgroundColor }]}>
          <Text style={{ color: textColor }}>Keine Eventdaten gefunden.</Text>
        </View>
      )}
    </>
  );
}

// meta row komponente für ortsinformationen mit optionalem maps button
function MetaRow({
  icon,
  label,
  textColor,
  surfaceColor,
  theme,
  showMapsButton = false,
  location = '',
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  textColor: string;
  surfaceColor: string;
  theme: any;
  showMapsButton?: boolean;
  location?: string;
}) {
  // maps app öffnen mit fallback für verschiedene systeme
  const handleOpenMaps = async () => {
    try {
      // ort für url kodieren
      const encodedLocation = encodeURIComponent(location);
      
      // zuerst apple maps versuchen (ios)
      const appleMapsUrl = `http://maps.apple.com/?q=${encodedLocation}`;
      
      // fallback zu google maps
      const googleMapsUrl = `https://maps.google.com/?q=${encodedLocation}`;
      
      // versuche zuerst apple maps zu öffnen
      const canOpenApple = await Linking.canOpenURL(appleMapsUrl);
      
      if (canOpenApple) {
        await Linking.openURL(appleMapsUrl);
      } else {
        // fallback zu google maps
        await Linking.openURL(googleMapsUrl);
      }
    } catch (error) {
      Alert.alert(
        'Fehler',
        'Maps konnte nicht geöffnet werden. Bitte installiere eine Maps-App oder versuche es später erneut.'
      );
    }
  };

  return (
    <View style={styles.metaRow}>
      <View style={[styles.metaIcon, { backgroundColor: surfaceColor }]}>
        <MaterialIcons name={icon} size={20} color={theme.primary.main} />
      </View>
      <Text style={[styles.metaLabel, { color: textColor }]}>{label}</Text>
      
      {/* maps button nur anzeigen wenn gewünscht */}
      {showMapsButton && (
        <TouchableOpacity 
          style={[styles.mapsButton, { backgroundColor: theme.primary.main }]}
          onPress={handleOpenMaps}>
          <MaterialIcons name="map" size={16} color="#ffffff" />
          <Text style={styles.mapsButtonText}>Maps</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// stylesheet für den event detail bildschirm
const styles = StyleSheet.create({
  // haupt container nimmt gesamten verfügbaren platz ein
  container: {
    flex: 1,
  },
  // ladecontainer für spinner zentriert
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // hero bild des events oben im bildschirm
  hero: {
    width: '100%',
    height: 240,
  },
  // hauptinhalt container mit padding
  body: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 18,
  },
  bodyWithoutImage: {
    paddingTop: 32, // Mehr Padding oben wenn kein Bild vorhanden
  },
  // reihe für datum pill
  pillRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  // datum pill mit icon und text
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  // text in der datum pill
  pillText: {
    fontWeight: '600',
  },
  // haupttitel des events
  title: {
    fontSize: 28,
  },
  // beschreibungstext des events
  description: {
    fontSize: 16,
    lineHeight: 22,
  },
  // liste der meta informationen
  metaList: {
    gap: 12,
  },
  // einzelne meta zeile mit icon text und optionalem button
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  // icon container für meta informationen
  metaIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // label text für meta informationen
  metaLabel: {
    flex: 1,
    fontSize: 16,
  },
  // hauptbutton für teilnahme oder abmeldung
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    paddingVertical: 16,
    marginTop: 10,
    gap: 8,
  },
  // text für hauptbutton
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
  // sekundärer button für weitere events
  secondaryButton: {
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  // text für sekundärbutton
  secondaryButtonText: {
    fontWeight: '600',
    fontSize: 16,
  },
  // maps button für ortsöffnung
  mapsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  // text für maps button
  mapsButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
});


