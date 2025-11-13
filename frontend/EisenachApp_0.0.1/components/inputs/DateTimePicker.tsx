import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Modal, 
  Platform,
  Dimensions,
  ScrollView
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

export function DateTimePicker({ 
  date, 
  time, 
  onDateChange, 
  onTimeChange, 
  label, 
  placeholder = "Datum wählen" 
}: DateTimePickerProps) {
  const theme = useAppTheme();
  
  // Zeitstring in Date-Objekt umwandeln - MUSS vor useState definiert werden
  const parseTimeToDate = (timeString: string): Date => {
    try {
      const [hours, minutes] = timeString.split(':').map(Number);
      const date = new Date();
      date.setHours(hours || 0, minutes || 0, 0, 0);
      return date;
    } catch (error) {
      console.error('Error parsing time:', error);
      const now = new Date();
      now.setSeconds(0, 0);
      return now;
    }
  };
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date | null>(null);
  const [tempTime, setTempTime] = useState<Date>(() => {
    // Initialisierung nur einmal beim Mount
    const initialTime = time ? parseTimeToDate(time) : new Date();
    initialTime.setSeconds(0, 0);
    return initialTime;
  });

  const backgroundColor = theme.background.secondary;
  const surfaceColor = theme.background.surface;
  const textColor = theme.text.primary;
  const mutedColor = theme.text.muted;
  const primaryColor = theme.primary.main;

  // Synchronisiere tempTime mit time prop
  useEffect(() => {
    if (time) {
      const newTime = parseTimeToDate(time);
      newTime.setSeconds(0, 0);
      setTempTime(newTime);
    }
  }, [time]);

  // Datum im deutschen Format formatieren
  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('de-DE', {
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



  // Date picker öffnen
  const openDatePicker = () => {
    setTempDate(date || new Date());
    setShowDatePicker(true);
  };

  // Time picker öffnen
  const openTimePicker = () => {
    // Nur öffnen, tempTime nicht ändern - es behält seinen Wert
    setShowTimePicker(true);
  };

  // Android Date Picker Handler - wird direkt ohne Modal aufgerufen
  const handleAndroidDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (event.type === 'set' && selectedDate) {
      onDateChange(selectedDate);
    }
  };

  // Android Time Picker Handler - wird direkt ohne Modal aufgerufen
  const handleAndroidTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (event.type === 'set' && selectedTime) {
      const hours = selectedTime.getHours().toString().padStart(2, '0');
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}`;
      onTimeChange(timeString);
    }
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
    // Zurück zur ursprünglichen Zeit
    const originalTime = time ? parseTimeToDate(time) : new Date();
    originalTime.setSeconds(0, 0);
    setTempTime(originalTime);
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
      
      <View style={styles.inputColumn}>
        {/* Datum Picker - Volle Breite */}
        <TouchableOpacity
          style={[styles.fullWidthButton, { backgroundColor: surfaceColor }]}
          onPress={openDatePicker}
          activeOpacity={0.7}
        >
          <View style={styles.buttonContent}>
            <MaterialIcons name="calendar-today" size={20} color={primaryColor} />
            <Text style={[styles.fullWidthText, { color: date ? textColor : mutedColor }]} numberOfLines={1}>
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

        {/* Zeit Picker - Volle Breite */}
        <TouchableOpacity
          style={[styles.fullWidthButton, { backgroundColor: surfaceColor }]}
          onPress={openTimePicker}
          activeOpacity={0.7}
        >
          <View style={styles.buttonContent}>
            <MaterialIcons name="access-time" size={20} color={primaryColor} />
            <Text style={[styles.fullWidthText, { color: time ? textColor : mutedColor }]} numberOfLines={1}>
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

      {/* Date Picker - Android: Nativer Picker, iOS: Custom Modal */}
      {Platform.OS === 'android' ? (
        // Android: Nativer Date Picker (öffnet sich automatisch als Modal)
        showDatePicker && (
          <NativeDateTimePicker
            value={tempDate || new Date()}
            mode="date"
            display="default"
            onChange={handleAndroidDateChange}
            maximumDate={new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000)}
            minimumDate={new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)}
          />
        )
      ) : (
        // iOS: Custom Modal mit Spinner
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
                  display="spinner"
                  onChange={(event, selectedDate) => {
                    if (selectedDate) {
                      setTempDate(selectedDate);
                    }
                  }}
                  maximumDate={new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000)}
                  minimumDate={new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)}
                  textColor={textColor}
                  style={styles.picker}
                  locale="de_DE"
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
      )}

      {/* Time Picker - Android: Nativer Picker, iOS: Custom Modal */}
      {Platform.OS === 'android' ? (
        // Android: Nativer Time Picker (öffnet sich automatisch als Modal)
        showTimePicker && (
          <NativeDateTimePicker
            value={tempTime}
            mode="time"
            display="default"
            onChange={handleAndroidTimeChange}
            is24Hour={true}
            minuteInterval={1}
          />
        )
      ) : (
        // iOS: Custom Modal mit Scroll-Picker
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
                {/* Custom iOS Time-Picker mit ScrollViews */}
                <View style={styles.customTimePicker}>
                  <View style={styles.timePickerRow}>
                    {/* Stunden Picker */}
                    <ScrollView 
                      style={styles.hourScrollView}
                      showsVerticalScrollIndicator={false}
                      snapToInterval={40}
                      decelerationRate="fast"
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <TouchableOpacity
                          key={i}
                          style={[
                            styles.timeOption,
                            { backgroundColor: backgroundColor },
                            tempTime.getHours() === i && { backgroundColor: primaryColor }
                          ]}
                          onPress={() => {
                            const newTime = new Date(tempTime);
                            newTime.setHours(i);
                            setTempTime(newTime);
                          }}
                        >
                          <Text style={[
                            styles.timeOptionText,
                            { color: tempTime.getHours() === i ? '#ffffff' : textColor }
                          ]}>
                            {i.toString().padStart(2, '0')}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                    
                    <Text style={[styles.timeSeparator, { color: textColor }]}>:</Text>
                    
                    {/* Minuten Picker */}
                    <ScrollView 
                      style={styles.minuteScrollView}
                      showsVerticalScrollIndicator={false}
                      snapToInterval={40}
                      decelerationRate="fast"
                    >
                      {Array.from({ length: 60 }, (_, i) => (
                        <TouchableOpacity
                          key={i}
                          style={[
                            styles.timeOption,
                            { backgroundColor: backgroundColor },
                            tempTime.getMinutes() === i && { backgroundColor: primaryColor }
                          ]}
                          onPress={() => {
                            const newTime = new Date(tempTime);
                            newTime.setMinutes(i);
                            setTempTime(newTime);
                          }}
                        >
                          <Text style={[
                            styles.timeOptionText,
                            { color: tempTime.getMinutes() === i ? '#ffffff' : textColor }
                          ]}>
                            {i.toString().padStart(2, '0')}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>
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
      )}
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
  inputColumn: {
    flexDirection: 'column',
    gap: 12,
  },
  fullWidthButton: {
    width: '100%',
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
  fullWidthText: {
    fontSize: 16,
    flex: 1,
    minWidth: 0, // Wichtig für Text-Truncation
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
  // Custom iOS Time Picker Styles
  customTimePicker: {
    width: '100%',
    height: 200,
  },
  timePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: 20,
  },
  hourScrollView: {
    flex: 1,
    height: 200,
    maxHeight: 200,
  },
  minuteScrollView: {
    flex: 1,
    height: 200,
    maxHeight: 200,
  },
  timeOption: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginVertical: 2,
    marginHorizontal: 8,
  },
  timeOptionText: {
    fontSize: 18,
    fontWeight: '600',
  },
  timeSeparator: {
    fontSize: 24,
    fontWeight: 'bold',
    marginHorizontal: 10,
  },
});