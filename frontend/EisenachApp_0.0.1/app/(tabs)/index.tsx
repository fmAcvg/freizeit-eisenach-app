// import der notwendigen react native und expo router komponenten
import { Link } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View, RefreshControl } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

// import der eigenen komponenten und services (alles was wir brauchen)
import { EventCard } from '@/components/cards/EventCard';
import { ThemedText } from '@/components/themed-text';
import { fetchEventsFiltered, toggleLike, type EventItem, testBackendConnection } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useTranslations } from '@/hooks/use-translations';
import AppLogo from '@/components/ui/AppLogo';

// filter konfig für die event übersicht
const getFilters = (translations: any): Array<{ key: FilterKey; label: string; icon: string }> => [
  { key: 'friends', label: translations.feed.filters.friends, icon: 'group' },
  { key: 'upcoming', label: translations.feed.filters.upcoming, icon: 'schedule' },
  { key: 'trending', label: translations.feed.filters.trending, icon: 'trending-up' },
];

// typdefinition für die verfügbaren filter optionen
type FilterKey = 'friends' | 'upcoming' | 'trending';

// hauptbildschirm mit event feed und filtern
// screenshot registrierung entfernt, brauchen wir grad nicht

export default function FeedScreen() {
  // state verwaltung für den feed
  const [events, setEvents] = React.useState<EventItem[]>([]); // alle geladenen events
  const [loading, setLoading] = React.useState(true); // zeigt ob gerade geladen wird
  const [refreshing, setRefreshing] = React.useState(false); // zeigt ob pull-to-refresh läuft
  const { isAuthenticated } = useAuth();
  // Wenn nicht angemeldet: Standard-Filter 'upcoming', sonst 'friends'
  const [activeFilter, setActiveFilter] = React.useState<FilterKey>(isAuthenticated ? 'friends' : 'upcoming');
  
  // theme hook für farben (hell/dunkel modus)
  const theme = useAppTheme();
  const translations = useTranslations();
  
  // farb variablen für bessere lesebarkeit im code (kleine abkürzungen)
  const backgroundColor = theme.background.primary; // haupt hintergrund farbe
  const surfaceColor = theme.background.surface; // farbe für karten und oberflächen
  const textColor = theme.text.primary; // haupt textfarbe
  const mutedColor = theme.text.muted; // gedämpfte textfarbe für untertitel

  // beim ersten render die events laden (und wenn sich auth ändert)
  React.useEffect(() => {
    // wenn sich auth ändert, passenden filter setzen
    const initial = isAuthenticated ? 'friends' : 'upcoming';
    setActiveFilter(initial);
    loadEvents(initial);
  }, [isAuthenticated]);

  // pull-to-refresh funktion (zum aktualisieren runterziehen)
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await loadEvents(activeFilter);
    } finally {
      setRefreshing(false);
    }
  }, [activeFilter]);

  // events laden (je nach filter), asynchron damit ui nicht blockiert
  const loadEvents = async (filter: FilterKey) => {
    setLoading(true); // lade indikator an
    
    // backend verbindung testen (kleiner check)
    console.log('🔍 Testing backend connection...');
    const backendAvailable = await testBackendConnection();
    console.log('🔍 Backend available:', backendAvailable);
    
    if (!backendAvailable) {
      console.error('❌ Backend ist nicht erreichbar!');
      Alert.alert(
        'Backend nicht erreichbar',
        'Das Backend ist derzeit nicht verfügbar. Bitte stelle sicher, dass das Backend läuft und erreichbar ist.',
        [{ text: 'OK' }]
      );
      setEvents([]);
      setLoading(false);
      return;
    }
    
    try {
      const res = await fetchEventsFiltered(filter); // api aufruf mit dem filter
      setEvents(res); // events in den state packen
    } catch (error) {
      console.error('❌ Fehler beim Laden der Events:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      
      // nur fehler anzeigen wenn es kein auth fehler ist (die fangen wir anders)
      if (!errorMessage.includes('autorisiert') && !errorMessage.includes('verweigert')) {
        Alert.alert(
          'Fehler beim Laden',
          'Events konnten nicht geladen werden: ' + errorMessage,
          [{ text: 'OK' }]
        );
      }
      
      setEvents([]); // bei fehler leere liste
    } finally {
      setLoading(false); // lade indikator aus
    }
  };

  // filter wechseln (nur wenn nötig)
  const onFilterPress = async (filter: FilterKey) => {
    // unnötige api aufrufe vermeiden
    if (filter === activeFilter) return;
    // freunde filter nur wenn eingeloggt
    if (!isAuthenticated && filter === 'friends') {
      Alert.alert('Anmeldung erforderlich', 'Melde dich an, um Events deiner Freunde zu sehen.', [
        { text: 'OK' }
      ]);
      return;
    }
    
    setActiveFilter(filter); // neuen filter speichern
    await loadEvents(filter); // events neu laden
  };

  // kleine hilfsfunktion: statistik für den aktuellen filter
  const getFilterStats = (filter: FilterKey) => {
    // einfache zahlen aus den events holen
    const totalEvents = events.length; // anzahl events
    const totalParticipants = events.reduce((sum, event) => sum + (event.participants?.length || event.participant_count || 0), 0); // gesamt teilnehmer
    const friendsCount = events.reduce((sum, event) => {
      // serverseitiger count falls vorhanden, sonst 0
      const serverCount = typeof event.friend_participants_count === 'number' ? event.friend_participants_count : 0;
      return sum + serverCount;
    }, 0);

    // je nach filter andere texte
    switch (filter) {
      case 'friends': 
        return {
          title: `${totalEvents} ${translations.feed.stats.eventsWithFriends}`,
          subtitle: `${friendsCount} ${translations.feed.stats.friendsParticipating}`,
          icon: 'group'
        };
      case 'upcoming': 
        return {
          title: `${totalEvents} ${translations.feed.stats.upcomingEvents}`,
          subtitle: `${totalParticipants} ${translations.feed.stats.totalParticipants}`,
          icon: 'schedule'
        };
      case 'trending': 
        return {
          title: `${totalEvents} ${translations.feed.stats.trendingEvents}`,
          subtitle: `${totalParticipants} ${translations.feed.stats.totalParticipants}`,
          icon: 'trending-up'
        };
      default: 
        return {
          title: `${totalEvents} ${translations.feed.stats.events}`,
          subtitle: `${totalParticipants} ${translations.feed.stats.participants}`,
          icon: 'event'
        };
    }
  };

  // verfügbare filter für gäste: ohne "friends"
  const availableFilters = getFilters(translations).filter(f => isAuthenticated || f.key !== 'friends');

  // like funktionalität mit backend integration
  const handleLike = async (eventId: number) => {
    if (!isAuthenticated) {
      Alert.alert('Anmeldung erforderlich', 'Bitte melde dich an, um Events zu liken.', [{ text: 'OK' }]);
      return;
    }
    try {
      const updatedEvent = await toggleLike(eventId);
      if (updatedEvent) {
        // aktualisiere das event in der liste mit den neuen daten
        setEvents(prev => prev.map(e => e.id === eventId ? updatedEvent : e));
      }
    } catch (error) {
      console.error('Fehler beim Liken des Events:', error);
    }
  };


  // Screenshot-Registrierung entfernt
  const scrollRef = React.useRef<import('react-native').ScrollView>(null);

  // jsx render der feed komponente
  return (
    <ScrollView
      ref={scrollRef}
      style={[styles.container, { backgroundColor }]} // haupt container mit dynamischer hintergrundfarbe
      contentContainerStyle={[styles.containerContent, { paddingBottom: 120 }]} // zusätzlicher abstand für tab bar
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
      
      {/* header bereich mit titel und statistiken */}
      <View style={styles.headerArea}>
        {/* haupt header mit titel und untertitel */}
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <AppLogo size={96} style={styles.headerLogo} />
            <View style={styles.headerTextContainer}>
              <ThemedText type="title" style={[styles.headerTitle, { color: textColor }]}>
                {translations.feed.title} {/* dynamischer titel aus übersetzungen */}
              </ThemedText>
              <Text style={[styles.headerSubtitle, { color: mutedColor }]}>
                {translations.feed.subtitle} {/* dynamischer untertitel */}
              </Text>
            </View>
          </View>
        </View>

        {/* statistiken karte zeigt nur an wenn events geladen wurden */}
        {!loading && events.length > 0 && (
          <View style={[styles.statsCard, { backgroundColor: surfaceColor }]}>
            <View style={styles.statsHeader}>
              <MaterialIcons 
                name={getFilterStats(activeFilter).icon as any} 
                size={20} 
                color={theme.primary.main} 
              />
              <Text style={[styles.statsTitle, { color: textColor }]}>
                {getFilterStats(activeFilter).title} {/* dynamischer titel basierend auf filter */}
              </Text>
            </View>
            <Text style={[styles.statsSubtitle, { color: mutedColor }]}>
              {getFilterStats(activeFilter).subtitle} {/* dynamischer untertitel */}
            </Text>
          </View>
        )}

        {/* filter buttons horizontale liste der verfügbaren kategorien */}
        <View style={styles.filterSection}>
          <Text style={[styles.filterSectionTitle, { color: textColor, backgroundColor: 'transparent' }]}>Kategorien</Text>
          {/* horizontal scroll damit alle kategorien erreichbar sind */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {/* dynamisches rendering aller verfügbaren filter */}
            {availableFilters.map((filter) => {
              const isActive = filter.key === activeFilter; // prüft ob dieser filter aktiv ist
              return (
                <TouchableOpacity
                  key={filter.key} // eindeutiger schlüssel für react
                  onPress={() => onFilterPress(filter.key)} // event handler für filter wechsel
                  style={[
                    styles.filterChip,
                    { backgroundColor: surfaceColor }, // standard hintergrundfarbe
                    isActive && { backgroundColor: theme.primary.main } // aktive farbe wenn ausgewählt
                  ]}>
                  <MaterialIcons 
                    name={filter.icon as any} 
                    size={16} 
                    color={isActive ? '#ffffff' : theme.primary.main} // weiß für aktiv primärfarbe für inaktiv
                  />
                  <Text style={[
                    styles.filterText, 
                    { color: isActive ? '#ffffff' : textColor } // textfarbe entsprechend dem status
                  ]}>
                    {filter.label} {/* dynamischer text aus übersetzungen */}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>

      {/* events liste hauptinhalt der feed seite */}
      <View style={styles.listArea}>
        {/* bedingtes rendering basierend auf ladezustand und event anzahl */}
        {loading ? (
          // ladezustand zeigt ladeindikator während daten abgerufen werden
          <View style={[styles.loadingCard, { backgroundColor: surfaceColor }]}>
            <View style={styles.loadingContent}>
              <MaterialIcons name="hourglass-empty" size={24} color={theme.primary.main} />
              <Text style={[styles.loadingText, { color: textColor }]}>Events werden geladen…</Text>
            </View>
          </View>
        ) : events.length === 0 ? (
          // leerzustand zeigt meldung wenn keine events gefunden wurden
          <View style={[styles.emptyCard, { backgroundColor: surfaceColor }]}>
            <View style={styles.emptyContent}>
              <MaterialIcons name="event-busy" size={48} color={mutedColor} />
              <Text style={[styles.emptyTitle, { color: textColor }]}>Keine Events gefunden</Text>
              <Text style={[styles.emptyDescription, { color: mutedColor }]}>
                {/* dynamische meldung basierend auf aktivem filter */}
                {activeFilter === 'friends' 
                  ? 'Deine Freunde nehmen noch an keinen Events teil'
                  : 'Momentan sind keine Events verfügbar'
                }
              </Text>
              <Text style={[styles.emptyDescription, { color: theme.status.error, marginTop: 8, textAlign: 'center' }]}>
                Backend-Verbindung testen...{'\n'}
                Öffne die Konsole für Details
              </Text>
            </View>
          </View>
        ) : (
          // erfolgszustand rendert alle events als klickbare karten
          <>
            {events.map((event) => (
              <Link
                key={event.id} // eindeutiger schlüssel für react
                href={{ pathname: '/event/[id]', params: { id: event.id } }} // navigation zur event detailseite
                asChild>
                <EventCard 
                  event={event} // event daten an komponente weitergeben
                  accent={theme.primary.main} // primärfarbe für akzente
                  onLikePress={() => handleLike(event.id)} // like handler
                  showLikeButton={isAuthenticated}
                />
              </Link>
            ))}
          </>
        )}
      </View>
    </ScrollView>
  );
}

// stylesheet mit allen visuellen stilen für die feed komponente
const styles = StyleSheet.create({
  // haupt container nimmt gesamten verfügbaren platz ein
  container: {
    flex: 1, // flexbox nimmt gesamte verfügbare höhe ein
  },
  
  // inhalt container zusätzlicher abstand am unteren rand für tab bar
  containerContent: {
    paddingBottom: 32, // abstand vom unteren bildschirmrand
  },
  
  // header bereich obere sektion mit titel statistiken und filtern
  headerArea: {
    paddingHorizontal: 24, // seitlicher abstand
    paddingTop: 56, // top abstand für status bar
    paddingBottom: 20, // abstand zum hauptinhalt
    gap: 16, // vertikaler abstand zwischen elementen
  },
  
  // header top flexbox layout für titel bereich
  headerTop: {
    flexDirection: 'row', // horizontale anordnung
    alignItems: 'flex-start', // oben ausrichten
    justifyContent: 'space-between', // platz zwischen elementen verteilen
  },
  
  // header left linker bereich für titel und untertitel
  headerLeft: {
    flex: 1, // nimmt verfügbaren platz ein
    alignItems: 'flex-start', // links ausgerichtet
  },
  
  // header text container für titel und untertitel
  headerTextContainer: {
    marginTop: 0,
    alignItems: 'flex-start',
  },
  
  // header logo styling - jetzt größer und links ausgerichtet
  headerLogo: {
    opacity: 0.9,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  
  // header icon kreisrunder icon container aktuell nicht verwendet
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24, // macht es kreisförmig
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
  },
  
  // haupttitel große fette schrift
  headerTitle: {
    fontSize: 28,
    fontWeight: '700', // extra fett
  },
  
  // untertitel kleinere normale schrift
  headerSubtitle: {
    fontSize: 14,
    lineHeight: 20, // zeilenhöhe für bessere lesbarkeit
    marginTop: 4,
  },
  
  // statistiken karte container für event statistiken
  statsCard: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8, // abstand zwischen icon und text
    // schatten für ios
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    // schatten für android
    elevation: 2,
  },
  
  // statistiken header icon und titel in einer zeile
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  
  // statistiken titel haupttext der statistiken
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1, // nimmt verfügbaren platz ein
  },
  
  // statistiken untertitel zusätzliche informationen
  statsSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 28, // ausrichtung mit titel icon breite plus abstand
  },
  
  // filter sektion container für alle filter buttons
  filterSection: {
    gap: 12, // abstand zwischen titel und buttons
  },
  
  // filter sektions titel überschrift für filter bereich
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  
  // filter reihe horizontale anordnung aller filter buttons
  filterRow: {
    flexDirection: 'row',
    gap: 12, // abstand zwischen einzelnen buttons
  },
  
  // filter chip einzelner filter button
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24, // abgerundete ecken für pill form
    gap: 8, // abstand zwischen icon und text
    // schatten für visuelle tiefe
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  
  // filter text text in filter buttons
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  
  // liste bereich container für events liste
  listArea: {
    paddingHorizontal: 24, // seitlicher abstand
    gap: 16, // abstand zwischen event karten
  },
  
  // lade karte container für ladezustand
  loadingCard: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center', // zentrierte ausrichtung
    // schatten
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  
  // lade inhalt icon und text für ladezustand
  loadingContent: {
    alignItems: 'center',
    gap: 12,
  },
  
  // lade text text während des ladens
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  
  // leer karte container für leerzustand
  emptyCard: {
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    // schatten
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  
  // leer inhalt icon und text für leerzustand
  emptyContent: {
    alignItems: 'center',
    gap: 16,
  },
  
  // leer titel haupttext für leerzustand
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  
  // leer beschreibung erklärungstext für leerzustand
  emptyDescription: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
