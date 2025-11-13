import React from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, TextInput, Alert, RefreshControl } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { useAppTheme } from '@/hooks/use-app-theme';
import { DateTimePicker } from '@/components/inputs/DateTimePicker';
import LocationPicker from '@/components/inputs/LocationPicker';
import { fetchEventById, updateEvent, type EventItem } from '@/services/api';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

// Event-Bearbeiten-Seite für akzeptierte Events
export default function EventEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  
  const theme = useAppTheme();
  const backgroundColor = theme.background.primary;
  const surfaceColor = theme.background.surface;
  const textColor = theme.text.primary;
  const mutedColor = theme.text.muted;

  // State für Event-Daten und Formular
  const [event, setEvent] = React.useState<EventItem | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);

  // Formular-State
  const [eventTitle, setEventTitle] = React.useState('');
  const [eventDescription, setEventDescription] = React.useState('');
  const [eventDate, setEventDate] = React.useState<Date | null>(null);
  const [eventTime, setEventTime] = React.useState('');
  const [eventLocation, setEventLocation] = React.useState('');
  const [contactInfo, setContactInfo] = React.useState('');

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
      
      // Sicherheitscheck: Nur Event-Ersteller kann bearbeiten
      if (eventData && eventData.created_by.id === user?.id && eventData.status === 'published') {
        setEvent(eventData);
        
        // Formular mit Event-Daten füllen
        setEventTitle(eventData.title);
        setEventDescription(eventData.description);
        const eventDateObj = new Date(eventData.date);
        setEventDate(eventDateObj);
        // Zeit aus dem Datum extrahieren
        const timeString = eventDateObj.toTimeString().slice(0, 5); // HH:MM Format
        setEventTime(timeString);
        setEventLocation(eventData.location);
        setContactInfo(eventData.contact_info || '');
      } else {
        Alert.alert('Zugriff verweigert', 'Du kannst nur deine eigenen veröffentlichten Events bearbeiten.');
        router.back();
      }
    } catch (error) {
      console.error('Fehler beim Laden des Events:', error);
      Alert.alert('Fehler', 'Event konnte nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadEventData();
    setRefreshing(false);
  }, []);

  // Event speichern
  const handleSaveEvent = async () => {
    if (!event) return;

    // Validierung
    if (!eventTitle.trim() || !eventDescription.trim() || !eventDate || !eventLocation.trim()) {
      Alert.alert('Fehler', 'Bitte fülle alle Pflichtfelder aus.');
      return;
    }

    setSaving(true);
    
    try {
      // Datum und Zeit kombinieren
      let combinedDateTime = eventDate;
      if (eventTime) {
        const [hours, minutes] = eventTime.split(':').map(Number);
        combinedDateTime = new Date(eventDate);
        combinedDateTime.setHours(hours, minutes, 0, 0);
      }

      const updateData = {
        title: eventTitle.trim(),
        description: eventDescription.trim(),
        date: combinedDateTime.toISOString(),
        location: eventLocation.trim(),
        contact_info: contactInfo.trim(),
      };

      const updatedEvent = await updateEvent(event.id, updateData);
      
      if (updatedEvent) {
        Alert.alert(
          'Event aktualisiert',
          'Dein Event wurde erfolgreich bearbeitet.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    } catch (error) {
      console.error('Fehler beim Speichern des Events:', error);
      Alert.alert('Fehler', 'Event konnte nicht gespeichert werden.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <View style={styles.loadingContainer}>
          <MaterialIcons name="refresh" size={48} color={theme.primary.main} />
          <Text style={[styles.loadingText, { color: textColor }]}>Event wird geladen...</Text>
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
      fallbackMessage="Melde dich an, um Events zu bearbeiten"
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
          Event bearbeiten
        </ThemedText>
        <Text style={[styles.mutedText, { color: mutedColor }]}>
          Bearbeite dein veröffentlichtes Event
        </Text>
      </View>

      {/* Formular */}
      <View style={styles.formArea}>
        <View style={[styles.card, { backgroundColor: surfaceColor }]}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="edit" size={24} color={theme.primary.main} />
            <ThemedText style={[styles.cardTitle, { color: textColor }]}>Event-Details</ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: textColor }]}>Event Titel *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: backgroundColor, color: textColor, borderColor: 'rgba(255,255,255,0.2)' }]}
              value={eventTitle}
              onChangeText={setEventTitle}
              placeholder="z.B. Konzert im Park"
              placeholderTextColor={mutedColor}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: textColor }]}>Beschreibung *</Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: backgroundColor, color: textColor, borderColor: 'rgba(255,255,255,0.2)' }]}
              value={eventDescription}
              onChangeText={setEventDescription}
              placeholder="Beschreibe dein Event..."
              placeholderTextColor={mutedColor}
              multiline
              numberOfLines={4}
            />
          </View>

          <DateTimePicker
            date={eventDate}
            time={eventTime}
            onDateChange={setEventDate}
            onTimeChange={setEventTime}
            label="Datum & Uhrzeit *"
            placeholder="Datum wählen"
          />

          <LocationPicker
            value={eventLocation}
            onLocationChange={setEventLocation}
            label="Ort *"
            placeholder="Ort eingeben oder wählen"
          />

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: textColor }]}>Kontakt (optional)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: backgroundColor, color: textColor, borderColor: 'rgba(255,255,255,0.2)' }]}
              value={contactInfo}
              onChangeText={setContactInfo}
              placeholder="Email oder Telefon"
              placeholderTextColor={mutedColor}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: theme.primary.main }, saving && styles.saveButtonDisabled]}
          onPress={handleSaveEvent}
          disabled={saving}>
          <MaterialIcons 
            name={saving ? "hourglass-empty" : "save"} 
            size={20} 
            color="#ffffff" 
          />
          <Text style={styles.saveButtonText}>
            {saving ? 'Wird gespeichert...' : 'Änderungen speichern'}
          </Text>
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
  formArea: {
    paddingHorizontal: 24,
    gap: 20,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
    gap: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    fontSize: 16,
  },
  textArea: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 16,
    gap: 8,
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});