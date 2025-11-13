import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { uploadProfileImage, deleteProfileImage, getProfileImageUrl } from '@/services/imageUpload';
import { useAppTheme } from '@/hooks/use-app-theme';

interface ProfileImageUploadProps {
  currentAvatar?: string;
  onImageUpdate: (newAvatarUrl: string | null) => void;
  size?: number;
  showUploadButton?: boolean;
}

export default function ProfileImageUpload({
  currentAvatar,
  onImageUpdate,
  size = 100,
  showUploadButton = true,
}: ProfileImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const theme = useAppTheme();

  const styles = StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    imageContainer: {
      position: 'relative',
      borderRadius: size / 2,
      overflow: 'hidden',
      backgroundColor: theme.background.surface,
      borderWidth: 2,
      borderColor: theme.primary.main + '30',
    },
    avatar: {
      width: size,
      height: size,
      borderRadius: size / 2,
    },
    placeholderContainer: {
      width: size,
      height: size,
      backgroundColor: theme.primary.main + '20',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: size / 2,
    },
    placeholderIcon: {
      color: theme.primary.main,
    },
    cameraIcon: {
      position: 'absolute',
      bottom: 6,
      right: 6,
      backgroundColor: theme.primary.main,
      borderRadius: 10,
      width: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: theme.background.primary,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3,
      elevation: 5,
    },
    uploadButton: {
      marginTop: 10,
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: theme.primary.main,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    uploadButtonText: {
      color: theme.background.primary,
      fontWeight: '600',
    },
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: size / 2,
    },
  });

  const handleImagePicker = () => {
    Alert.alert(
      'Profilbild ändern',
      'Wähle eine Option aus',
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Kamera', onPress: openCamera },
        { text: 'Galerie', onPress: openGallery },
        ...(currentAvatar ? [{ text: 'Löschen', onPress: handleDeleteImage, style: 'destructive' as const }] : []),
      ]
    );
  };

  const openCamera = async () => {
    try {
      // Prüfe Kamera-Berechtigung
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      
      if (cameraPermission.granted === false) {
        Alert.alert(
          'Kamera-Berechtigung erforderlich',
          'Die App benötigt Zugriff auf deine Kamera, um Profilbilder aufzunehmen.',
          [
            { text: 'Abbrechen', style: 'cancel' },
            { text: 'Einstellungen', onPress: () => {
              // Hier könnte man zu den App-Einstellungen weiterleiten
              console.log('Zu App-Einstellungen weiterleiten');
            }}
          ]
        );
        return;
      }

      console.log('📸 Öffne Kamera...');
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        exif: false, // Keine EXIF-Daten für bessere Performance
      });

      console.log('📸 Kamera-Resultat:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        console.log('📸 Gewähltes Bild:', asset.uri);
        await handleImageUpload(asset.uri);
      } else {
        console.log('📸 Kamera-Aufnahme abgebrochen');
      }
    } catch (error) {
      console.error('❌ Fehler beim Öffnen der Kamera:', error);
      Alert.alert('Fehler', 'Kamera konnte nicht geöffnet werden. Bitte versuche es erneut.');
    }
  };

  const openGallery = async () => {
    try {
      // Prüfe Galerie-Berechtigung
      const galleryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (galleryPermission.granted === false) {
        Alert.alert(
          'Galerie-Berechtigung erforderlich',
          'Die App benötigt Zugriff auf deine Fotos, um Profilbilder auszuwählen.',
          [
            { text: 'Abbrechen', style: 'cancel' },
            { text: 'Einstellungen', onPress: () => {
              // Hier könnte man zu den App-Einstellungen weiterleiten
              console.log('Zu App-Einstellungen weiterleiten');
            }}
          ]
        );
        return;
      }

      console.log('📷 Öffne Galerie...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        exif: false, // Keine EXIF-Daten für bessere Performance
      });

      console.log('📷 Galerie-Resultat:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        console.log('📷 Gewähltes Bild:', asset.uri);
        await handleImageUpload(asset.uri);
      } else {
        console.log('📷 Bildauswahl abgebrochen');
      }
    } catch (error) {
      console.error('❌ Fehler beim Öffnen der Galerie:', error);
      Alert.alert('Fehler', 'Galerie konnte nicht geöffnet werden. Bitte versuche es erneut.');
    }
  };

  const handleImageUpload = async (imageUri: string) => {
    try {
      setUploading(true);
      console.log('📤 Starte Upload für Bild:', imageUri);
      
      const response = await uploadProfileImage(imageUri);
      console.log('✅ Upload-Response:', response);
      
      if (response.profile?.avatar) {
        const imageUrl = getProfileImageUrl(response.profile.avatar);
        console.log('🖼️ Neue Profilbild-URL:', imageUrl);
        onImageUpdate(imageUrl);
        Alert.alert('Erfolg', 'Profilbild wurde erfolgreich hochgeladen');
      } else {
        console.warn('⚠️ Keine Avatar-URL in der Response');
        Alert.alert('Fehler', 'Profilbild wurde hochgeladen, aber die URL konnte nicht abgerufen werden');
      }
    } catch (error) {
      console.error('❌ Fehler beim Hochladen:', error);
      Alert.alert(
        'Upload-Fehler',
        error instanceof Error ? error.message : 'Profilbild konnte nicht hochgeladen werden'
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async () => {
    Alert.alert(
      'Profilbild löschen',
      'Möchtest du dein Profilbild wirklich löschen?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: async () => {
            try {
              setUploading(true);
              console.log('🗑️ Starte Löschung des Profilbilds...');
              
              const response = await deleteProfileImage();
              console.log('✅ Löschung-Response:', response);
              
              onImageUpdate(null);
              Alert.alert('Erfolg', 'Profilbild wurde gelöscht');
            } catch (error) {
              console.error('❌ Fehler beim Löschen:', error);
              Alert.alert(
                'Lösch-Fehler',
                error instanceof Error ? error.message : 'Profilbild konnte nicht gelöscht werden'
              );
            } finally {
              setUploading(false);
            }
          },
        },
      ]
    );
  };

  const imageUrl = getProfileImageUrl(currentAvatar);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.imageContainer}
        onPress={handleImagePicker}
        disabled={uploading}
      >
        {imageUrl ? (
          <Image 
            source={{ uri: imageUrl }} 
            style={styles.avatar}
            onLoad={() => console.log('🖼️ Bild erfolgreich geladen:', imageUrl)}
            onError={(error) => console.error('🖼️ Bild-Ladefehler:', error, 'URL:', imageUrl)}
          />
        ) : (
          <View style={styles.placeholderContainer}>
            <MaterialIcons name="person" size={size * 0.6} style={styles.placeholderIcon} />
          </View>
        )}
        
        {showUploadButton && (
          <View style={styles.cameraIcon}>
            <MaterialIcons name="camera-alt" size={16} color={theme.background.primary} />
          </View>
        )}
        
        {uploading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={theme.primary.main} />
          </View>
        )}
      </TouchableOpacity>
      
      {showUploadButton && (
        <TouchableOpacity style={styles.uploadButton} onPress={handleImagePicker} disabled={uploading}>
          <MaterialIcons name="add-a-photo" size={16} color={theme.background.primary} />
          <Text style={styles.uploadButtonText}>
            {uploading ? 'Wird hochgeladen...' : 'Profilbild ändern'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
