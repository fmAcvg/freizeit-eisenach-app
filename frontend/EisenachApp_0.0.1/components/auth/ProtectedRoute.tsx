import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useAppTheme } from '@/hooks/use-app-theme';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallbackMessage?: string;
  fallbackButtonText?: string;
}

export function ProtectedRoute({ 
  children, 
  fallbackMessage = "Melde dich an, um diese Funktion zu nutzen",
  fallbackButtonText = "Anmelden"
}: ProtectedRouteProps) {
  const { user } = useAuth();
  const theme = useAppTheme();

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background.primary }]}>
        <View style={styles.loginModal}>
          <View style={[styles.modalCard, { backgroundColor: theme.background.surface }]}>
            <View style={styles.modalIconContainer}>
              <MaterialIcons name="lock" size={48} color={theme.primary.main} />
            </View>
            
            <Text style={[styles.modalTitle, { color: theme.text.primary }]}>
              Anmeldung erforderlich
            </Text>
            
            <Text style={[styles.modalMessage, { color: theme.text.muted }]}>
              {fallbackMessage}
            </Text>
            
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: theme.primary.main }]}
              onPress={() => router.push('/(tabs)/profile')}>
              <MaterialIcons name="login" size={20} color="#ffffff" />
              <Text style={styles.modalButtonText}>{fallbackButtonText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loginModal: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 120,
    paddingBottom: 60,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
    gap: 20,
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(10, 132, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    gap: 8,
    width: '100%',
    marginTop: 8,
  },
  modalButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
