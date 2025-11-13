import React from 'react';
import { Image, StyleSheet, ViewStyle, ImageStyle } from 'react-native';

interface AppLogoProps {
  size?: number;
  style?: ViewStyle | ImageStyle;
  showText?: boolean;
}

export function AppLogo({ size = 40, style, showText = false }: AppLogoProps) {
  return (
    <Image
      source={require('@/assets/images/eisenach-logo.png')}
      style={[
        styles.logo,
        { width: size, height: size },
        style,
      ]}
      resizeMode="contain"
    />
  );
}

const styles = StyleSheet.create({
  logo: {
    borderRadius: 8,
  },
});

export default AppLogo;
