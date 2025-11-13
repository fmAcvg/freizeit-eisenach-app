import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppTheme } from '@/hooks/use-app-theme';
import { getProfileImageUrl } from '@/services/imageUpload';

interface AvatarProps {
  avatarUrl?: string;
  size?: number;
  showBorder?: boolean;
}

export default function Avatar({ 
  avatarUrl, 
  size = 40, 
  showBorder = false 
}: AvatarProps) {
  const theme = useAppTheme();
  
  const styles = StyleSheet.create({
    container: {
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: theme.primary.main + '20',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: showBorder ? 2 : 0,
      borderColor: showBorder ? theme.primary.main : 'transparent',
    },
    image: {
      width: size,
      height: size,
      borderRadius: size / 2,
    },
    placeholderIcon: {
      color: theme.primary.main,
    },
  });

  const imageUrl = getProfileImageUrl(avatarUrl);

  return (
    <View style={styles.container}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.image} />
      ) : (
        <MaterialIcons 
          name="person" 
          size={size * 0.6} 
          style={styles.placeholderIcon} 
        />
      )}
    </View>
  );
}
