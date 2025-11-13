import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAppTheme } from '@/hooks/use-app-theme';
import { confirmPasswordResetByCode } from '@/services/api';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function PasswordResetConfirmScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ uid?: string; token?: string; email?: string; code?: string; username?: string }>();

  // Code Modus
  const [email, setEmail] = React.useState((params.email as string) || '');
  const [username, setUsername] = React.useState((params.username as string) || '');
  const [code, setCode] = React.useState((params.code as string) || '');

  const [password, setPassword] = React.useState('');
  const [password2, setPassword2] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async () => {
    if (password !== password2) {
      Alert.alert('Fehler', 'Passwörter stimmen nicht überein');
      return;
    }
    setLoading(true);
    try {
      if ((!email.trim() && !username.trim()) || !code.trim() || !password.trim()) {
        Alert.alert('Fehler', 'Bitte E-Mail oder Benutzername, Code und neues Passwort eingeben');
        setLoading(false);
        return;
      }
      const identifier = email.trim() ? { email: email.trim() } : { username: username.trim() };
      const res = await confirmPasswordResetByCode(identifier, code.trim(), password);
      Alert.alert('Erfolg', res.message, [{ text: 'OK', onPress: () => router.replace('/(tabs)/profile') }]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unbekannter Fehler';
      Alert.alert('Fehler', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background.primary }]}>
      <Text style={[styles.title, { color: theme.text.primary }]}>Neues Passwort setzen</Text>
      <Text style={[styles.subtitle, { color: theme.text.muted }]}>Benutzername/E-Mail sind vorausgefüllt. Gib den 6-stelligen Code und dein neues Passwort ein.</Text>

      <View style={[styles.input, { backgroundColor: theme.background.surface, borderColor: theme.text.muted + '30' }]}>
        <TextInput
          value={username || email}
          editable={false}
          placeholder="Benutzername/E-Mail"
          placeholderTextColor={theme.text.muted}
          autoCapitalize="none"
          style={{ color: theme.text.primary, flex: 1, opacity: 0.8 }}
        />
      </View>

      <View style={[styles.input, { backgroundColor: theme.background.surface, borderColor: theme.text.muted + '30' }]}>
        <TextInput
          value={code}
          onChangeText={setCode}
          placeholder="6-stelliger Code"
          placeholderTextColor={theme.text.muted}
          autoCapitalize="none"
          keyboardType="number-pad"
          style={{ color: theme.text.primary, flex: 1 }}
        />
      </View>
      

      {/* Nur Code-Eingabe */}

      <View style={[styles.input, { backgroundColor: theme.background.surface, borderColor: theme.text.muted + '30' }]}>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Neues Passwort"
          placeholderTextColor={theme.text.muted}
          secureTextEntry
          autoCapitalize="none"
          style={{ color: theme.text.primary, flex: 1 }}
        />
      </View>

      <View style={[styles.input, { backgroundColor: theme.background.surface, borderColor: theme.text.muted + '30' }]}>
        <TextInput
          value={password2}
          onChangeText={setPassword2}
          placeholder="Passwort wiederholen"
          placeholderTextColor={theme.text.muted}
          secureTextEntry
          autoCapitalize="none"
          style={{ color: theme.text.primary, flex: 1 }}
        />
      </View>

      <TouchableOpacity
        onPress={handleSubmit}
        disabled={loading}
        style={[styles.button, { backgroundColor: loading ? theme.text.muted + '50' : theme.primary.main }]}
      >
        <Text style={styles.buttonText}>{loading ? 'Speichere...' : 'Passwort ändern'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 14, marginBottom: 16 },
  tabsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  tabBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, minHeight: 50, justifyContent: 'center', marginTop: 12 },
  button: { marginTop: 16, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
});
