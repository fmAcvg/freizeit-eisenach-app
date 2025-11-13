import React from 'react';
import { ScrollView, StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, RefreshControl, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
// Screenshot-Registrierung entfernt
import { fetchFriends, searchUsers, sendFriendRequest, removeFriendship, type Friend, type SearchUser } from '@/services/api';
import Avatar from '@/components/ui/Avatar';

const PRIMARY = '#0A84FF';

// freunde bildschirm mit suche und verwaltung
export default function FriendsScreen() {
  const { user } = useAuth();
  const theme = useAppTheme();
  const backgroundColor = theme.background.primary;

  // Unangemeldet: sofort nur den ProtectedRoute-Hinweis rendern, ohne API-Logik zu mounten
  if (!user) {
    return (
      <ProtectedRoute fallbackMessage="Melde dich an, um deine Freunde zu sehen" fallbackButtonText="Anmelden">
        <View style={{ flex: 1, backgroundColor }} />
      </ProtectedRoute>
    );
  }

  return <FriendsInner />;
}

function FriendsInner() {
  // Screenshot-Registrierung entfernt
  const scrollRef = React.useRef<import('react-native').ScrollView>(null);
  const { user } = useAuth();
  // state für freunde und suche
  const [friends, setFriends] = React.useState<Friend[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  const theme = useAppTheme();
  const backgroundColor = theme.background.primary;
  const surfaceColor = theme.background.surface;
  const textColor = theme.text.primary;
  const mutedColor = theme.text.muted;

  // Freunde beim ersten Laden abrufen
  React.useEffect(() => {
    if (user) {
      loadFriends();
    }
  }, [user]);

  // Freunde aus dem Backend laden
  const loadFriends = async () => {
    try {
      setLoading(true);
      const friendsData = await fetchFriends();
      setFriends(friendsData);
    } catch (error) {
      console.error('Fehler beim Laden der Freunde:', error);
      Alert.alert('Fehler', 'Freunde konnten nicht geladen werden');
    } finally {
      setLoading(false);
    }
  };

  // pull-to-refresh funktion für freunde
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await loadFriends();
    } finally {
      setRefreshing(false);
    }
  }, []);

  // suche nach neuen freunden
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (query.trim().length > 2) {
      setIsSearching(true);
      try {
        const results = await searchUsers(query);
        setSearchResults(results);
      } catch (error) {
        console.error('Fehler bei der Suche:', error);
        Alert.alert('Fehler', 'Suche konnte nicht durchgeführt werden');
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  };

  // freund hinzufügen
  const handleAddFriend = async (userId: string, userName: string) => {
    Alert.alert(
      'Freund hinzufügen',
      `Möchtest du ${userName} als Freund hinzufügen?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        { 
          text: 'Hinzufügen', 
          onPress: async () => {
            try {
              await sendFriendRequest(userId);
              Alert.alert('Erfolg', `${userName} wurde als Freund hinzugefügt!`);
              // Suche aktualisieren
              if (searchQuery.length > 2) {
                handleSearch(searchQuery);
              }
            } catch (error) {
              console.error('Fehler beim Hinzufügen des Freundes:', error);
              Alert.alert('Fehler', 'Freund konnte nicht hinzugefügt werden');
            }
          }
        }
      ]
    );
  };

  // freund entfernen
  const handleRemoveFriend = (userId: string, userName: string) => {
    Alert.alert(
      'Freund entfernen',
      `Möchtest du ${userName} wirklich aus deiner Freundesliste entfernen?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        { 
          text: 'Entfernen', 
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFriendship(userId);
              setFriends(friends.filter(friend => friend.id.toString() !== userId));
              Alert.alert('Erfolg', `${userName} wurde aus deiner Freundesliste entfernt.`);
            } catch (error) {
              console.error('Fehler beim Entfernen des Freundes:', error);
              Alert.alert('Fehler', 'Freund konnte nicht entfernt werden');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary.main} />
          <Text style={[styles.loadingText, { color: mutedColor }]}>Lade Freunde...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView 
      ref={scrollRef}
      style={[styles.container, { backgroundColor }]}
      contentContainerStyle={{ paddingTop: 40, paddingBottom: 120 }}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh}
          tintColor={theme.primary.main}
          colors={[theme.primary.main]}
        />
      }>
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <ThemedText type="title" style={[styles.headerTitle, { color: textColor }]}>
            Freunde
          </ThemedText>
          <TouchableOpacity 
            style={[styles.requestsButton, { backgroundColor: surfaceColor }]}
            onPress={() => router.push('/friends/requests')}
          >
            <MaterialIcons name="person-add" size={20} color={theme.primary.main} />
            <Text style={[styles.requestsButtonText, { color: theme.primary.main }]}>Anfragen</Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.headerSubtitle, { color: mutedColor }]}>
          {friends.length} Freunde
        </Text>
      </View>

      {/* Suchfeld */}
      <View style={[styles.searchContainer, { backgroundColor: surfaceColor }]}>
        <MaterialIcons name="search" size={24} color={mutedColor} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: textColor }]}
          placeholder="Freunde suchen..."
          placeholderTextColor={mutedColor}
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')} style={styles.clearButton}>
            <MaterialIcons name="clear" size={20} color={mutedColor} />
          </TouchableOpacity>
        )}
      </View>

      {/* Suchergebnisse */}
      {searchQuery.length > 0 && (
        <View style={[styles.searchResultsContainer, { backgroundColor: surfaceColor }]}>
          <Text style={[styles.searchResultsTitle, { color: textColor }]}>
            Suchergebnisse für "{searchQuery}"
          </Text>
          
          {isSearching ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.primary.main} />
              <Text style={[styles.loadingText, { color: mutedColor }]}>Suche...</Text>
            </View>
          ) : searchResults.length > 0 ? (
            <View style={styles.searchResultsList}>
              {searchResults.map((user) => (
                <TouchableOpacity 
                  key={user.id} 
                  style={[styles.searchResultCard, { backgroundColor: surfaceColor }]}
                  onPress={() => router.push(`/profile/${user.id}`)}>
                  <Avatar 
                    imageUrl={user.avatar} 
                    size={50} 
                    style={styles.searchResultAvatar}
                    showBorder={true}
                  />
                  <View style={styles.searchResultInfo}>
                    <Text style={[styles.searchResultName, { color: textColor }]}>{user.first_name} {user.last_name}</Text>
                    <Text style={[styles.searchResultUsername, { color: mutedColor }]}>@{user.username}</Text>
                    {user.bio && (
                      <Text style={[styles.searchResultBio, { color: mutedColor }]} numberOfLines={2}>{user.bio}</Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={[styles.addFriendButton, { backgroundColor: theme.primary.main }]}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleAddFriend(user.id.toString(), `${user.first_name} ${user.last_name}`);
                    }}>
                    {user.is_friend ? (
                      <MaterialIcons name="check" size={20} color="white" />
                    ) : (
                      <MaterialIcons name="person-add" size={20} color="white" />
                    )}
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.noResultsContainer}>
              <MaterialIcons name="person-search" size={24} color={mutedColor} />
              <Text style={[styles.noResultsText, { color: mutedColor }]}>Keine Ergebnisse gefunden</Text>
            </View>
          )}
        </View>
      )}

      {/* Freunde-Liste */}
      {searchQuery.length === 0 && (
        <View style={[styles.friendsContainer, { backgroundColor: surfaceColor }]}>
          {friends.length > 0 ? (
            <View style={styles.friendsList}>
              {friends.map((friend) => (
                <TouchableOpacity 
                  key={friend.id} 
                  style={[styles.friendCard, { backgroundColor: surfaceColor }]}
                  onPress={() => router.push(`/profile/${friend.id}`)}>
                  
                  {/* Avatar zentriert oben */}
                  <Avatar 
                    imageUrl={friend.avatar} 
                    size={70} 
                    style={styles.friendAvatar}
                    showBorder={true}
                  />
                  
                  {/* Freund-Informationen zentriert */}
                  <View style={styles.friendInfo}>
                    <Text style={[styles.friendName, { color: textColor }]}>
                      {friend.first_name} {friend.last_name}
                    </Text>
                    <Text style={[styles.friendUsername, { color: mutedColor }]}>
                      @{friend.username}
                    </Text>
                    {friend.bio && (
                      <Text style={[styles.friendBio, { color: mutedColor }]} numberOfLines={3}>
                        {friend.bio}
                      </Text>
                    )}
                  </View>
                  
                  {/* Statistiken zentriert */}
                  <View style={styles.friendStats}>
                    <Text style={[styles.friendStat, { color: mutedColor }]}>
                      {friend.created_events} Events erstellt
                    </Text>
                  </View>
                  
                  {/* Entfernen-Button */}
                  <View style={styles.friendActions}>
                    <TouchableOpacity
                      style={[styles.friendActionButton, { backgroundColor: theme.status.error + '15', borderColor: theme.status.error + '25' }]}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleRemoveFriend(friend.id.toString(), `${friend.first_name} ${friend.last_name}`);
                      }}>
                      <MaterialIcons name="person-remove" size={24} color={theme.status.error} />
                      <Text style={[styles.removeButtonText, { color: theme.status.error }]}>Entfernen</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyFriendsContainer}>
              <MaterialIcons name="group-add" size={48} color={mutedColor} />
              <Text style={[styles.emptyFriendsTitle, { color: textColor }]}>Noch keine Freunde</Text>
              <Text style={[styles.emptyFriendsText, { color: mutedColor }]}>
                Suche nach Benutzern und füge sie als Freunde hinzu!
              </Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    flex: 1,
  },
  requestsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(10, 132, 255, 0.2)',
  },
  requestsButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
  clearButton: {
    padding: 4,
  },
  searchResultsContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  searchResultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  searchResultsList: {
    gap: 12,
  },
  searchResultCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchResultAvatar: {
    marginRight: 16,
    marginTop: 4,
  },
  searchResultInfo: {
    flex: 1,
    gap: 4,
  },
  searchResultName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  searchResultUsername: {
    fontSize: 15,
    marginBottom: 6,
  },
  searchResultBio: {
    fontSize: 15,
    lineHeight: 20,
  },
  addFriendButton: {
    padding: 12,
    borderRadius: 12,
    marginLeft: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noResultsText: {
    fontSize: 16,
    marginTop: 12,
  },
  friendsContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  friendsList: {
    gap: 16,
  },
  friendCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  friendAvatar: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  friendInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  friendName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  friendUsername: {
    fontSize: 15,
    marginBottom: 12,
    textAlign: 'center',
  },
  friendBio: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  friendStats: {
    alignItems: 'center',
    marginBottom: 16,
  },
  friendStat: {
    fontSize: 14,
    textAlign: 'center',
  },
  friendActions: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  friendActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  removeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyFriendsContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyFriendsTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyFriendsText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
});