import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

// Props für eine Detail-Liste mit Icon, Label und Beschreibung
type Props = {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  description: string;
};

// Komponente für Event-Details mit Icon und Text
export function DetailListItem({ icon, label, description }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.iconWrap}>
        <MaterialIcons name={icon} size={22} color="#0A84FF" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#eef3ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontWeight: '600',
    fontSize: 16,
    color: '#1c1f25',
    marginBottom: 4,
  },
  description: {
    color: '#5b6573',
    fontSize: 15,
    lineHeight: 20,
  },
});


