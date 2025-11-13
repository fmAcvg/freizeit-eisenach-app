import React from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { View, Text, ActivityIndicator, DevSettings } from 'react-native';
import { useFonts } from 'expo-font';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useTranslations } from '@/hooks/use-translations';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
// screenshot-funktion rausgenommen, provider dazu auch entfernt

// expo router konfig für die haupt-navi
// klein gehalten, damit kein extra "(tabs)" screen auftaucht

// navi layout für eingeloggte nutzer
function RootLayoutNav() {
  const { isLoading, isAuthenticated } = useAuth();
  const theme = useAppTheme();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background.primary }}>
        <ActivityIndicator size="large" color={theme.primary.main} />
        <Text style={{ marginTop: 16, fontSize: 16, color: theme.text.primary }}>Lade...</Text>
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        title: '',
        headerTitle: '',
        headerBackTitle: '',
        headerBackTitleVisible: false,
        headerTransparent: true,
        headerBlurEffect: 'none',
        animation: 'none',
      }}
    >
      {/* tabs sind immer da, der profile tab zeigt login falls nötig */}
      <Stack.Screen 
        name="(tabs)" 
        options={{ 
          headerShown: false,
          title: '',
          headerTitle: '',
          headerBackTitle: '',
          headerBackTitleVisible: false,
          headerTransparent: true,
          animation: 'none',
        }} 
      />
      {/* auth stack für login/registrierung */}
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />

      {/* weitere screens */}
      <Stack.Screen 
        name="event/[id]" 
        options={{ 
          title: 'Event Details', 
          headerShown: true,
          headerTitle: 'Event Details',
          headerStyle: { backgroundColor: theme.background.primary },
          headerTintColor: theme.text.primary,
          headerTitleStyle: { color: theme.text.primary }
        }} 
      />
      <Stack.Screen 
        name="events/manage" 
        options={{ 
          title: 'Event Verwaltung', 
          headerTitle: 'Event Verwaltung',
          headerShown: true,
          headerBackTitle: 'Zurück',
          headerStyle: { backgroundColor: theme.background.primary },
          headerTintColor: theme.text.primary,
          headerTitleStyle: { color: theme.text.primary }
        }} 
      />
      <Stack.Screen 
        name="events/dashboard/[id]" 
        options={{ 
          title: 'Event Dashboard',
          headerTitle: 'Event Dashboard',
          headerShown: true,
          headerBackTitle: 'Zurück',
          headerStyle: { backgroundColor: theme.background.primary },
          headerTintColor: theme.text.primary,
          headerTitleStyle: { color: theme.text.primary }
        }} 
      />
      <Stack.Screen 
        name="events/edit/[id]" 
        options={{ 
          title: 'Event bearbeiten',
          headerTitle: 'Event bearbeiten',
          headerShown: true,
          headerBackTitle: 'Zurück',
          headerStyle: { backgroundColor: theme.background.primary },
          headerTintColor: theme.text.primary,
          headerTitleStyle: { color: theme.text.primary }
        }} 
      />
      <Stack.Screen 
        name="friend/[id]" 
        options={{ 
          title: 'Freund Profil', 
          headerTitle: 'Freund Profil',
          headerShown: true,
          headerBackTitle: 'Zurück',
          headerStyle: { backgroundColor: theme.background.primary },
          headerTintColor: theme.text.primary,
          headerTitleStyle: { color: theme.text.primary }
        }} 
      />
      <Stack.Screen 
        name="profile/edit" 
        options={{ 
          title: 'Profil bearbeiten',
          headerTitle: 'Profil bearbeiten',
          headerShown: true,
          headerBackTitle: 'Zurück',
          headerStyle: { backgroundColor: theme.background.primary },
          headerTintColor: theme.text.primary,
          headerTitleStyle: { color: theme.text.primary }
        }} 
      />
      <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
    </Stack>
  );
}

// hauptlayout der app: hier kommen theme und navi zusammen
export default function RootLayout() {
  // theme hook für farben und darstellung (hell/dunkel)
  const colorScheme = useColorScheme();
  const theme = useAppTheme();
  const translations = useTranslations();

  // screenshot-tour entfernt (hat nur abgelenkt)

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <RootLayoutNav />
        <StatusBar style="auto" translucent={false} />
      </AuthProvider>
    </ThemeProvider>
  );
}
