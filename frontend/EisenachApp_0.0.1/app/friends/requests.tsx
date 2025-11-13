import React from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, Alert, RefreshControl, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { useAppTheme } from '@/hooks/use-app-theme';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { getFriendshipRequests, respondToFriendshipRequest, cancelFriendshipRequest, type FriendshipRequest } from '@/services/api';

// Typdefinitionen werden aus api.ts importiert

// Freundschafts-Anfragen Seite
export default function FriendRequestsScreen() {
  const [requests, setRequests] = React.useState<FriendshipRequest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [processing, setProcessing] = React.useState<number | null>(null);

  const { user } = useAuth();
  const theme = useAppTheme();
  const backgroundColor = theme.background.primary;
  const surfaceColor = theme.background.surface;
  const textColor = theme.text.primary;
  const mutedColor = theme.text.muted;

  // Freundschafts-Anfragen laden
  const loadRequests = async () => {
    try {
      const data = await getFriendshipRequests();
      // Sicherstellen, dass data ein Array ist
      setRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Fehler beim Laden der Freundschafts-Anfragen:', error);
      Alert.alert('Fehler', 'Freundschafts-Anfragen konnten nicht geladen werden');
      setRequests([]); // Fallback zu leerem Array
    }
  };

  // Pull-to-Refresh
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await loadRequests();
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Initiales Laden
  React.useEffect(() => {
    loadRequests().finally(() => setLoading(false));
  }, []);

  // Auf Freundschafts-Anfrage antworten
  const respondToRequest = async (requestId: number, action: 'accept' | 'decline') => {
    setProcessing(requestId);
    
    try {
      await respondToFriendshipRequest(requestId, action);
      Alert.alert(
        'Erfolg',
        action === 'accept' 
          ? 'Freundschafts-Anfrage angenommen!' 
          : 'Freundschafts-Anfrage abgelehnt!'
      );
      // Liste aktualisieren
      await loadRequests();
    } catch (error) {
      console.error('Fehler beim Antworten auf Anfrage:', error);
      Alert.alert('Fehler', 'Ein Fehler ist aufgetreten');
    } finally {
      setProcessing(null);
    }
  };

  // Freundschafts-Anfrage stornieren
  const cancelRequest = async (requestId: number) => {
    setProcessing(requestId);
    
    try {
      await cancelFriendshipRequest(requestId);
      Alert.alert('Erfolg', 'Freundschafts-Anfrage storniert!');
      await loadRequests();
    } catch (error) {
      console.error('Fehler beim Stornieren der Anfrage:', error);
      Alert.alert('Fehler', 'Ein Fehler ist aufgetreten');
    } finally {
      setProcessing(null);
    }
  };

  // Anfragen nach Status filtern
  const pendingRequests = requests.filter(req => req.status === 'pending');
  const receivedRequests = pendingRequests.filter(req => req.to_user.id === user?.id);
  const sentRequests = pendingRequests.filter(req => req.from_user.id === user?.id);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary.main} />
          <Text style={[styles.loadingText, { color: textColor }]}>Lade Freundschafts-Anfragen...</Text>
        </View>
      </View>
    );
  }

  return (
    <ProtectedRoute 
      fallbackMessage="Melde dich an, um Freundschafts-Anfragen zu verwalten"
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
            progressBackgroundColor={surfaceColor}
            title={refreshing ? "Lädt..." : "Zum Aktualisieren nach unten ziehen"}
            titleColor={textColor}
            progressViewOffset={40}
          />
        }
      >
        {/* Header */}
        <View style={styles.headerArea}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={24} color={textColor} />
          </TouchableOpacity>
          <ThemedText type="title" style={[styles.headerTitle, { color: textColor }]}>
            Freundschafts-Anfragen
          </ThemedText>
        </View>

        {/* Eingegangene Anfragen */}
        {receivedRequests.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              Eingegangene Anfragen ({receivedRequests.length})
            </Text>
            
            {receivedRequests.map((request) => (
              <View key={request.id} style={[styles.requestCard, { backgroundColor: surfaceColor }]}>
                <View style={styles.requestHeader}>
                  <View style={styles.userInfo}>
                    {request.from_user.profile_image ? (
                      <View style={styles.avatarContainer}>
                        <Text style={[styles.avatarText, { color: '#ffffff' }]}>
                          {request.from_user.first_name.charAt(0)}{request.from_user.last_name.charAt(0)}
                        </Text>
                      </View>
                    ) : (
                      <View style={[styles.avatarContainer, { backgroundColor: theme.primary.main }]}>
                        <MaterialIcons name="person" size={20} color="#ffffff" />
                      </View>
                    )}
                    <View style={styles.userDetails}>
                      <Text style={[styles.userName, { color: textColor }]}>
                        {request.from_user.first_name} {request.from_user.last_name}
                      </Text>
                      <Text style={[styles.userUsername, { color: mutedColor }]}>
                        @{request.from_user.username}
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={[styles.requestDate, { color: mutedColor }]}>
                    {new Date(request.created_at).toLocaleDateString('de-DE')}
                  </Text>
                </View>

                {request.message && (
                  <Text style={[styles.requestMessage, { color: textColor }]}>
                    "{request.message}"
                  </Text>
                )}

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.acceptButton, { backgroundColor: theme.primary.main }]}
                    onPress={() => respondToRequest(request.id, 'accept')}
                    disabled={processing === request.id}
                  >
                    {processing === request.id ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <MaterialIcons name="check" size={20} color="#ffffff" />
                        <Text style={styles.buttonText}>Annehmen</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.declineButton, { backgroundColor: theme.status.error }]}
                    onPress={() => respondToRequest(request.id, 'decline')}
                    disabled={processing === request.id}
                  >
                    <MaterialIcons name="close" size={20} color="#ffffff" />
                    <Text style={styles.buttonText}>Ablehnen</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Gesendete Anfragen */}
        {sentRequests.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              Gesendete Anfragen ({sentRequests.length})
            </Text>
            
            {sentRequests.map((request) => (
              <View key={request.id} style={[styles.requestCard, { backgroundColor: surfaceColor }]}>
                <View style={styles.requestHeader}>
                  <View style={styles.userInfo}>
                    {request.to_user.profile_image ? (
                      <View style={styles.avatarContainer}>
                        <Text style={[styles.avatarText, { color: '#ffffff' }]}>
                          {request.to_user.first_name.charAt(0)}{request.to_user.last_name.charAt(0)}
                        </Text>
                      </View>
                    ) : (
                      <View style={[styles.avatarContainer, { backgroundColor: theme.primary.main }]}>
                        <MaterialIcons name="person" size={20} color="#ffffff" />
                      </View>
                    )}
                    <View style={styles.userDetails}>
                      <Text style={[styles.userName, { color: textColor }]}>
                        {request.to_user.first_name} {request.to_user.last_name}
                      </Text>
                      <Text style={[styles.userUsername, { color: mutedColor }]}>
                        @{request.to_user.username}
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={[styles.requestDate, { color: mutedColor }]}>
                    {new Date(request.created_at).toLocaleDateString('de-DE')}
                  </Text>
                </View>

                {request.message && (
                  <Text style={[styles.requestMessage, { color: textColor }]}>
                    "{request.message}"
                  </Text>
                )}

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.cancelButton, { backgroundColor: mutedColor }]}
                    onPress={() => cancelRequest(request.id)}
                    disabled={processing === request.id}
                  >
                    {processing === request.id ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <MaterialIcons name="cancel" size={20} color="#ffffff" />
                        <Text style={styles.buttonText}>Stornieren</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Keine Anfragen */}
        {pendingRequests.length === 0 && (
          <View style={[styles.emptyState, { backgroundColor: surfaceColor }]}>
            <MaterialIcons name="person-add" size={48} color={mutedColor} />
            <Text style={[styles.emptyTitle, { color: textColor }]}>
              Keine Freundschafts-Anfragen
            </Text>
            <Text style={[styles.emptyDescription, { color: mutedColor }]}>
              Du hast momentan keine ausstehenden Freundschafts-Anfragen.
            </Text>
            <TouchableOpacity
              style={[styles.findFriendsButton, { backgroundColor: theme.primary.main }]}
              onPress={() => router.push('/friends')}
            >
              <MaterialIcons name="search" size={20} color="#ffffff" />
              <Text style={styles.buttonText}>Freunde finden</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  containerContent: {
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  headerArea: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    gap: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    flex: 1,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  requestCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0A84FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  userUsername: {
    fontSize: 14,
  },
  requestDate: {
    fontSize: 12,
  },
  requestMessage: {
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(10, 132, 255, 0.1)',
    borderRadius: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    flex: 1,
    justifyContent: 'center',
  },
  declineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    flex: 1,
    justifyContent: 'center',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
    marginHorizontal: 24,
    borderRadius: 16,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  findFriendsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
});
