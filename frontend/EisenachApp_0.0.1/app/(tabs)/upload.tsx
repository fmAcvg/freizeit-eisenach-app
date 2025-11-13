import React from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, TextInput, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { useAppTheme } from '@/hooks/use-app-theme';
import { DateTimePicker } from '@/components/inputs/DateTimePicker';
import LocationPicker from '@/components/inputs/LocationPicker';
import ImagePicker from '@/components/inputs/ImagePicker';
import { submitEventDraft } from '@/services/api';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
// Screenshot-Registrierung entfernt

const PRIMARY = '#0A84FF';

// EventDraft Type für Event-Einreichung
interface EventDraft {
  title: string;
  description: string;
  date: string;
  location: string;
  contact_info: string;
  cost?: string;
  min_age?: number;
  image?: string; // Lokaler Bild-URI für Upload
  max_guests?: number; // Leer = unbegrenzt
}

// event einreichungsbildschirm hier können nutzer neue events vorschlagen
// Lokaler Ref-Typ kompatibel zum ScreenshotContext (ScrollView mit optionalem setNativeProps)
type ScrollViewLike = ScrollView & { setNativeProps?: (props: any) => void };

export default function UploadScreen() {
  // Screenshot-Registrierung entfernt
  const scrollRef = React.useRef<ScrollViewLike>(null as any);
  // state für alle formularfelder
  const [eventTitle, setEventTitle] = React.useState('');
  const [eventDescription, setEventDescription] = React.useState('');
  const [eventDate, setEventDate] = React.useState<Date | null>(null);
  const [eventTime, setEventTime] = React.useState('');
  const [eventLocation, setEventLocation] = React.useState('');
  const [contactInfo, setContactInfo] = React.useState('');
  const [minAge, setMinAge] = React.useState<number | undefined>(undefined);
  const [eventImage, setEventImage] = React.useState<string | null>(null);
  const [maxGuests, setMaxGuests] = React.useState<string>('');
  const [submitting, setSubmitting] = React.useState(false);

  const theme = useAppTheme();
  const backgroundColor = theme.background.primary;
  const surfaceColor = theme.background.surface;

  // pull-to-refresh funktion für upload
  // Reset-Funktion für das Formular (ohne RefreshControl)
  const resetForm = React.useCallback(() => {
    setEventTitle('');
    setEventDescription('');
    setEventDate(null);
    setEventTime('');
    setEventLocation('');
    setContactInfo('');
    setEventImage(null);
  }, []);
  const textColor = theme.text.primary;
  const mutedColor = theme.text.muted;

  // event einreichung mit validierung und backend integration
  const handleSubmit = async () => {
    // pflichtfelder prüfen
    if (!eventTitle.trim() || !eventDescription.trim() || !eventDate || !eventLocation.trim()) {
      Alert.alert('Fehler', 'Bitte fülle alle Pflichtfelder aus.');
      return;
    }

    setSubmitting(true);
    
    try {
      // Event-Daten für Backend vorbereiten
      const eventData: EventDraft = {
        title: eventTitle.trim(),
        description: eventDescription.trim(),
        date: eventDate.toISOString(),
        location: eventLocation.trim(),
        contact_info: contactInfo.trim(),
        cost: 'Kostenlos', // Standard-Wert für Event-Einreichungen
        min_age: minAge, // Altersbeschränkung (optional)
        image: eventImage || undefined, // Bild hinzufügen falls vorhanden
        max_guests: maxGuests.trim() === '' ? undefined : Number(maxGuests),
      };

      // Event an Backend senden
      const result = await submitEventDraft(eventData);
      
      if (result.status === 'created') {
        Alert.alert(
          'Event erstellt!',
          'Dein Event wurde erfolgreich erstellt und ist jetzt sichtbar.',
          [
            {
              text: 'OK',
              onPress: () => {
                // formular zurücksetzen nach erfolgreicher einreichung
                setEventTitle('');
                setEventDescription('');
                setEventDate(null);
                setEventTime('');
                setEventLocation('');
                setContactInfo('');
                setEventImage(null);
                setMaxGuests('');
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error submitting event:', error);
      Alert.alert(
        'Fehler',
        'Das Event konnte nicht erstellt werden. Bitte versuche es später erneut.',
        [{ text: 'OK' }]
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedRoute 
      fallbackMessage="Melde dich an, um Events einzureichen"
      fallbackButtonText="Anmelden"
    >
    <ScrollView 
      ref={scrollRef}
      style={[styles.container, { backgroundColor }]} 
      contentContainerStyle={[styles.containerContent, { paddingBottom: 120 }]}
      >
      <View style={styles.headerArea}>
        <View style={styles.headerTop}>
          <ThemedText type="title" style={[styles.headerTitle, { color: textColor }]}>
            Event einreichen
          </ThemedText>
          <TouchableOpacity 
            style={[styles.resetButton, { backgroundColor: surfaceColor }]}
            onPress={resetForm}
            disabled={submitting}
          >
            <MaterialIcons name="refresh" size={20} color={theme.primary.main} />
            <Text style={[styles.resetButtonText, { color: theme.primary.main }]}>Reset</Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.mutedText, { color: mutedColor }]}>
          reiche dein event zur prüfung ein wir schauen es uns an und geben dir bescheid
        </Text>
      </View>

      <View style={styles.formArea}>
        <View style={[styles.card, { backgroundColor: surfaceColor }]}>
              <View style={styles.cardHeader}>
                <MaterialIcons name="event" size={24} color={theme.primary.main} />
                <ThemedText style={[styles.cardTitle, { color: textColor }]}>Event Details</ThemedText>
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

          <ImagePicker
            value={eventImage}
            onImageChange={setEventImage}
            label="Event-Bild (optional)"
            placeholder="Bild für dein Event auswählen"
          />

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
            <Text style={[styles.label, { color: textColor }]}>Maximale Teilnehmer (leer = unbegrenzt)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: backgroundColor, color: textColor, borderColor: 'rgba(255,255,255,0.2)' }]}
              value={maxGuests}
              onChangeText={setMaxGuests}
              placeholder="z.B. 20"
              placeholderTextColor={mutedColor}
              keyboardType="number-pad"
            />
          </View>

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

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: textColor }]}>Mindestalter (optional)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: backgroundColor, color: textColor, borderColor: 'rgba(255,255,255,0.2)' }]}
              value={minAge ? minAge.toString() : ''}
              onChangeText={(text) => {
                const age = parseInt(text);
                setMinAge(isNaN(age) ? undefined : age);
              }}
              placeholder="z.B. 16 (für Events ab 16 Jahren)"
              placeholderTextColor={mutedColor}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: surfaceColor }]}>
              <View style={styles.cardHeader}>
                <MaterialIcons name="info" size={24} color={theme.primary.main} />
                <ThemedText style={[styles.cardTitle, { color: textColor }]}>Wichtige Hinweise</ThemedText>
              </View>
          
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <MaterialIcons name="schedule" size={16} color={mutedColor} />
              <Text style={[styles.infoText, { color: mutedColor }]}>
                Hinweis: Du trägst die Verantwortung für die Inhalte deiner Event-Einreichung
              </Text>
            </View>
            <View style={styles.infoItem}>
              <MaterialIcons name="verified" size={16} color={mutedColor} />
              <Text style={[styles.infoText, { color: mutedColor }]}>
                Alle Events werden vor Veröffentlichung geprüft
              </Text>
            </View>
            <View style={styles.infoItem}>
              <MaterialIcons name="email" size={16} color={mutedColor} />
              <Text style={[styles.infoText, { color: mutedColor }]}>
                Du erhältst eine Benachrichtigung über die Freigabe
              </Text>
            </View>
          </View>
        </View>

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: theme.primary.main }]}
              onPress={handleSubmit}
              disabled={submitting}>
          <MaterialIcons 
            name={submitting ? "hourglass-empty" : "upload"} 
            size={20} 
            color="#ffffff" 
          />
          <Text style={styles.submitButtonText}>
            {submitting ? 'Wird gesendet...' : 'Event Anfrage senden'}
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
    paddingBottom: 32,
  },
  headerArea: {
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 24,
    gap: 12,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    flex: 1,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(10, 132, 255, 0.2)',
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  mutedText: {
    fontSize: 14,
    lineHeight: 20,
  },
  formArea: {
    paddingHorizontal: 24,
    gap: 20,
  },
  card: {
    borderRadius: 28,
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
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    fontSize: 16,
  },
  textArea: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  infoList: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    paddingVertical: 16,
    gap: 8,
    marginTop: 8,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
