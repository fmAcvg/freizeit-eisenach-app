import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Modal, 
  Platform,
  ScrollView,
  Dimensions 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppTheme } from '@/hooks/use-app-theme';
import { default as NativeDateTimePicker } from '@react-native-community/datetimepicker';

interface DateTimePickerProps {
  date: Date | null;
  time: string;
  onDateChange: (date: Date | null) => void;
  onTimeChange: (time: string) => void;
  label: string;
  placeholder?: string;
}

const { width: screenWidth } = Dimensions.get('window');

export function DateTimePickerNew({ 
  date, 
  time, 
  onDateChange, 
  onTimeChange, 
  label, 
  placeholder = "Datum wählen" 
}: DateTimePickerProps) {
  const theme = useAppTheme();
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date | null>(null);
  const [tempTime, setTempTime] = useState<Date>(new Date());

  const backgroundColor = theme.background.secondary;
  const surfaceColor = theme.background.surface;
  const textColor = theme.text.primary;
  const mutedColor = theme.text.muted;
  const primaryColor = theme.primary.main;

  // Datum im deutschen Format formatieren
  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('de-DE', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Zeit formatieren
  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    try {
      const [hours, minutes] = timeString.split(':');
      return `${hours}:${minutes} Uhr`;
    } catch {
      return timeString;
    }
  };

  // Zeitstring in Date umwandeln
  const parseTimeToDate = (timeString: string): Date => {
    try {
      const [hours, minutes] = timeString.split(':').map(Number);
      const date = new Date();
      date.setHours(hours || 0, minutes || 0, 0, 0);
      return date;
    } catch (error) {
      return new Date();
    }
  };

  // Date picker öffnen
  const openDatePicker = () => {
    setTempDate(date || new Date());
    setShowDatePicker(true);
  };

  // Time picker öffnen
  const openTimePicker = () => {
    setTempTime(time ? parseTimeToDate(time) : new Date());
    setShowTimePicker(true);
  };

  // Datum bestätigen
  const confirmDate = () => {
    if (tempDate) {
      onDateChange(tempDate);
    }
    setShowDatePicker(false);
  };

  // Zeit bestätigen
  const confirmTime = () => {
    const hours = tempTime.getHours().toString().padStart(2, '0');
    const minutes = tempTime.getMinutes().toString().padStart(2, '0');
    const timeString = `${hours}:${minutes}`;
    onTimeChange(timeString);
    setShowTimePicker(false);
  };

  // Datum abbrechen
  const cancelDate = () => {
    setTempDate(null);
    setShowDatePicker(false);
  };

  // Zeit abbrechen
  const cancelTime = () => {
    setTempTime(new Date());
    setShowTimePicker(false);
  };

  // Datum löschen
  const clearDate = () => {
    onDateChange(null);
  };

  // Zeit löschen
  const clearTime = () => {
    onTimeChange('');
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      
      <View style={styles.inputRow}>
        {/* Datum Picker */}
        <TouchableOpacity
          style={[styles.inputButton, { backgroundColor: surfaceColor }]}
          onPress={openDatePicker}
          activeOpacity={0.7}
        >
          <View style={styles.buttonContent}>
            <MaterialIcons name="calendar-today" size={20} color={primaryColor} />
            <Text style={[styles.inputText, { color: date ? textColor : mutedColor }]} numberOfLines={1}>
              {date ? formatDate(date) : placeholder}
            </Text>
            {date && (
              <TouchableOpacity 
                onPress={(e) => {
                  e.stopPropagation();
                  clearDate();
                }} 
                style={styles.clearButton}
                activeOpacity={0.7}
              >
                <MaterialIcons name="close" size={18} color={mutedColor} />
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>

        {/* Zeit Picker */}
        <TouchableOpacity
          style={[styles.inputButton, { backgroundColor: surfaceColor }]}
          onPress={openTimePicker}
          activeOpacity={0.7}
        >
          <View style={styles.buttonContent}>
            <MaterialIcons name="access-time" size={20} color={primaryColor} />
            <Text style={[styles.inputText, { color: time ? textColor : mutedColor }]} numberOfLines={1}>
              {time ? formatTime(time) : "Uhrzeit wählen"}
            </Text>
            {time && (
              <TouchableOpacity 
                onPress={(e) => {
                  e.stopPropagation();
                  clearTime();
                }} 
                style={styles.clearButton}
                activeOpacity={0.7}
              >
                <MaterialIcons name="close" size={18} color={mutedColor} />
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={cancelDate}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: surfaceColor }]}>
            <Text style={[styles.modalTitle, { color: textColor }]}>Datum wählen</Text>
            
            <View style={styles.pickerContainer}>
              <NativeDateTimePicker
                value={tempDate || new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
                onChange={(event, selectedDate) => {
                  if (selectedDate) {
                    setTempDate(selectedDate);
                  }
                }}
                maximumDate={new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000)} // 2 Jahre in die Zukunft
                minimumDate={new Date()}
                textColor={textColor}
                style={styles.picker}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton, { borderColor: mutedColor }]}
                onPress={cancelDate}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalButtonText, { color: mutedColor }]}>Abbrechen</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton, { backgroundColor: primaryColor }]}
                onPress={confirmDate}
                activeOpacity={0.7}
              >
                <Text style={styles.modalButtonText}>Bestätigen</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Time Picker Modal */}
      <Modal
        visible={showTimePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={cancelTime}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: surfaceColor }]}>
            <Text style={[styles.modalTitle, { color: textColor }]}>Uhrzeit wählen</Text>
            
            <View style={styles.pickerContainer}>
              <NativeDateTimePicker
                value={tempTime}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'clock'}
                onChange={(event, selectedTime) => {
                  if (selectedTime) {
                    setTempTime(selectedTime);
                  }
                }}
                textColor={textColor}
                is24Hour={true}
                minuteInterval={5} // 5-Minuten-Intervalle für bessere UX
                style={styles.picker}
              />
            </View>

            {/* Schnellauswahl für häufige Zeiten */}
            <View style={styles.quickTimeContainer}>
              <Text style={[styles.quickTimeTitle, { color: mutedColor }]}>Schnellauswahl:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickTimeScroll}>
                {[
                  '09:00', '10:00', '11:00', '12:00', 
                  '13:00', '14:00', '15:00', '16:00', 
                  '17:00', '18:00', '19:00', '20:00'
                ].map((quickTime) => {
                  const [hours, minutes] = quickTime.split(':');
                  const quickDate = new Date();
                  quickDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                  
                  return (
                    <TouchableOpacity
                      key={quickTime}
                      style={[styles.quickTimeButton, { backgroundColor: backgroundColor }]}
                      onPress={() => setTempTime(quickDate)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.quickTimeText, { color: textColor }]}>
                        {quickTime}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton, { borderColor: mutedColor }]}
                onPress={cancelTime}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalButtonText, { color: mutedColor }]}>Abbrechen</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton, { backgroundColor: primaryColor }]}
                onPress={confirmTime}
                activeOpacity={0.7}
              >
                <Text style={styles.modalButtonText}>Bestätigen</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    minHeight: 48,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    flex: 1,
  },
  inputText: {
    fontSize: 16,
    flex: 1,
  },
  clearButton: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: screenWidth * 0.9,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  pickerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  picker: {
    width: '100%',
    height: 200,
  },
  quickTimeContainer: {
    marginBottom: 20,
  },
  quickTimeTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  quickTimeScroll: {
    flexDirection: 'row',
  },
  quickTimeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  quickTimeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  confirmButton: {
    // backgroundColor wird dynamisch gesetzt
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

