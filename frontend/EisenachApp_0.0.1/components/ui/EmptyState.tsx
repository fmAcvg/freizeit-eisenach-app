import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppTheme } from '@/hooks/use-app-theme';

// Komponente für leere Zustände (keine Daten, Fehler, etc.)
// Zeigt ein Icon, eine Nachricht und optional einen Untertitel an
interface EmptyStateProps {
  icon?: React.ComponentProps<typeof MaterialIcons>['name'];
  title: string;
  subtitle?: string;
  iconColor?: string;
}

export default function EmptyState({ 
  icon = 'inbox', 
  title, 
  subtitle,
  iconColor 
}: EmptyStateProps) {
  const theme = useAppTheme();
  const displayIconColor = iconColor || theme.text.muted;

  return (
    <View style={styles.container}>
      <MaterialIcons 
        name={icon} 
        size={64} 
        color={displayIconColor}
        style={styles.icon}
      />
      <Text style={[styles.title, { color: theme.text.primary }]}>
        {title}
      </Text>
      {subtitle && (
        <Text style={[styles.subtitle, { color: theme.text.muted }]}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 300,
  },
  icon: {
    marginBottom: 16,
    opacity: 0.6,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});










