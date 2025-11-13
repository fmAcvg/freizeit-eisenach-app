import React from 'react';
import { View, Image, StyleSheet, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppTheme } from '@/hooks/use-app-theme';

interface AvatarProps {
  imageUrl?: string | null;
  size?: number;
  style?: ViewStyle;
  showBorder?: boolean;
}

// Avatar-Komponente für einheitliche Profilbild-Darstellung
export default function Avatar({ 
  imageUrl, 
  size = 40, 
  style, 
  showBorder = false 
}: AvatarProps) {
  const theme = useAppTheme();

  const styles = StyleSheet.create({
    container: {
      width: size,
      height: size,
      borderRadius: size / 2,
      overflow: 'hidden',
      backgroundColor: theme.ui.border,
      alignItems: 'center',
      justifyContent: 'center',
      ...(showBorder && {
        borderWidth: 2,
        borderColor: theme.primary.main + '30',
      }),
      ...style,
    },
    image: {
      width: size,
      height: size,
      borderRadius: size / 2,
    },
    placeholder: {
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
  });

  // Standard-Profilbild falls kein Avatar vorhanden
  const defaultAvatarSource = {
    uri: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNCRUJEREIiLz4KPGNpcmNsZSBjeD0iMjAiIGN5PSIxNiIgcj0iNiIgZmlsbD0iIzlFOUU5RSIvPgo8cGF0aCBkPSJNMzIgMzJDMzIgMjcuNTgxNyAyOC40MTgzIDI0IDI0IDI0QzE5LjU4MTcgMjQgMTYgMjcuNTgxNyAxNiAzMloiIGZpbGw9IiM5RTlFOUUiLz4KPC9zdmc+Cg=='
  };

  return (
    <View style={styles.container}>
      {imageUrl ? (
        <Image 
          source={{ uri: imageUrl }} 
          style={styles.image}
          onError={() => {
            // Bei Fehler auf Standard-Avatar zurückfallen
            console.log('Avatar-Ladefehler, verwende Standard-Avatar');
          }}
        />
      ) : (
        <Image 
          source={defaultAvatarSource} 
          style={styles.image}
          onError={() => {
            // Falls auch das Standard-Bild nicht lädt, Icon verwenden
            console.log('Standard-Avatar-Ladefehler, verwende Icon');
          }}
        />
      )}
    </View>
  );
}


