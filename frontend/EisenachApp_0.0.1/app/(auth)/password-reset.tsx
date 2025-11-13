import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAppTheme } from '@/hooks/use-app-theme';
import { requestPasswordReset } from '@/services/api';
import { useRouter } from 'expo-router';

export default function PasswordResetRequestScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [debugCode, setDebugCode] = React.useState<string | null>(null);

  const handleSubmit = async () => {
    if (!email.trim()) {
      Alert.alert('Fehler', 'Bitte E-Mail eingeben');
      return;
    }
    setLoading(true);
    try {
      const res = await requestPasswordReset(email.trim());
      Alert.alert('Hinweis', res.message);
      if (res.debug_code) {
        setDebugCode(String(res.debug_code));
        console.log('Passwort-Reset DEV-Code:', res.debug_code);
        // Direkt zur Code-Eingabe navigieren und Felder vorausfüllen
        const query = `/(auth)/password-reset-confirm?code=${encodeURIComponent(String(res.debug_code))}&email=${encodeURIComponent(email.trim())}${res.debug_username ? `&username=${encodeURIComponent(res.debug_username)}` : ''}`;
        router.push(query as any);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unbekannter Fehler';
      Alert.alert('Fehler', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background.primary }]}>
      <Text style={[styles.title, { color: theme.text.primary }]}>Passwort zurücksetzen</Text>
      <Text style={[styles.subtitle, { color: theme.text.muted }]}>Prototyp: Funktioniert nur im Debug-Modus. Gib deine E-Mail ein – wenn ein Konto existiert, bekommst du einen 6-stelligen Code.</Text>
      <View style={[styles.input, { backgroundColor: theme.background.surface, borderColor: theme.text.muted + '30' }]}>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="E-Mail"
          placeholderTextColor={theme.text.muted}
          autoCapitalize="none"
          keyboardType="email-address"
          style={{ color: theme.text.primary, flex: 1 }}
        />
      </View>
      <TouchableOpacity
        onPress={handleSubmit}
        disabled={loading}
        style={[styles.button, { backgroundColor: loading ? theme.text.muted + '50' : theme.primary.main }]}
      >
        <Text style={styles.buttonText}>{loading ? 'Sende...' : 'Link/Code anfordern'}</Text>
      </TouchableOpacity>

      {debugCode && (
        <View style={[styles.debugBox, { borderColor: theme.primary.main + '40', backgroundColor: theme.primary.main + '10' }]}>
          <Text style={{ color: theme.text.primary }}>DEV-Code (10 Min gültig): <Text style={{ fontWeight: '700' }}>{debugCode}</Text></Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 14, marginBottom: 16 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, minHeight: 50, justifyContent: 'center' },
  button: { marginTop: 16, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
  debugBox: { marginTop: 16, padding: 12, borderRadius: 10, borderWidth: 1 },
});
