import React from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { useAppTheme } from '@/hooks/use-app-theme';

interface ImagePickerProps {
  value?: string | null;
  onImageChange: (imageUri: string | null) => void;
  label?: string;
  placeholder?: string;
}

export default function ImagePickerComponent({
  value,
  onImageChange,
  label = 'Bild',
  placeholder = 'Bild auswählen'
}: ImagePickerProps) {
  const theme = useAppTheme();
  const textColor = theme.text.primary;
  const mutedColor = theme.text.muted;
  const surfaceColor = theme.background.surface;

  // Berechtigung für Kamera/Galerie anfragen
  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Berechtigung erforderlich',
        'Wir benötigen Zugriff auf deine Galerie, um Bilder auswählen zu können.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  // Bild aus Galerie auswählen
  const pickImageFromGallery = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9], // 16:9 Verhältnis für Events
        quality: 0.8, // Kompression für bessere Performance
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        onImageChange(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Fehler', 'Das Bild konnte nicht ausgewählt werden.');
    }
  };

  // Bild mit Kamera aufnehmen
  const takePhotoWithCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Berechtigung erforderlich',
        'Wir benötigen Zugriff auf deine Kamera, um Fotos aufnehmen zu können.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        onImageChange(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Fehler', 'Das Foto konnte nicht aufgenommen werden.');
    }
  };

  // Optionen für Bildauswahl anzeigen
  const showImageOptions = () => {
    Alert.alert(
      'Bild auswählen',
      'Wo möchtest du das Bild herholen?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Galerie', onPress: pickImageFromGallery },
        { text: 'Kamera', onPress: takePhotoWithCamera },
      ]
    );
  };

  // Bild entfernen
  const removeImage = () => {
    Alert.alert(
      'Bild entfernen',
      'Möchtest du das ausgewählte Bild entfernen?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Entfernen', style: 'destructive', onPress: () => onImageChange(null) },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      )}
      
      {value ? (
        // Bild ist ausgewählt - Vorschau anzeigen
        <View style={[styles.imageContainer, { backgroundColor: surfaceColor }]}>
          <Image source={{ uri: value }} style={styles.previewImage} />
          <TouchableOpacity
            style={[styles.removeButton, { backgroundColor: theme.status.error }]}
            onPress={removeImage}
            accessibilityLabel="Bild entfernen">
            <MaterialIcons name="close" size={16} color="#ffffff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.changeButton, { backgroundColor: theme.primary.main }]}
            onPress={showImageOptions}
            accessibilityLabel="Bild ändern">
            <MaterialIcons name="edit" size={16} color="#ffffff" />
          </TouchableOpacity>
        </View>
      ) : (
        // Kein Bild ausgewählt - Auswahl-Button anzeigen
        <TouchableOpacity
          style={[styles.selectButton, { backgroundColor: surfaceColor, borderColor: 'rgba(255,255,255,0.2)' }]}
          onPress={showImageOptions}
          accessibilityLabel={placeholder}>
          <MaterialIcons name="add-a-photo" size={32} color={mutedColor} />
          <Text style={[styles.selectButtonText, { color: mutedColor }]}>
            {placeholder}
          </Text>
          <Text style={[styles.selectButtonSubtext, { color: mutedColor }]}>
            Galerie oder Kamera
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    height: 200,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  changeButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  selectButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  selectButtonSubtext: {
    fontSize: 12,
  },
});

