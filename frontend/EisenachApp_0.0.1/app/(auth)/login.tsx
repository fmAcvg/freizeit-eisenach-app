import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Link, router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useAppTheme } from '@/hooks/use-app-theme';
import AppLogo from '@/components/ui/AppLogo';

export default function LoginScreen() {
  // Test-Anmeldedaten automatisch vorausfüllen für Development
  const [username, setUsername] = useState('lars');
  const [password, setPassword] = useState('test123');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  
  // Registrierungs-Felder
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');

  const { login, register, logout, isAuthenticated } = useAuth();
  const theme = useAppTheme();

  // Wenn bereits angemeldet, zur Hauptseite weiterleiten
  React.useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated]);

  // Auto-Login deaktiviert für manuelles Testen der Anmeldung
  // React.useEffect(() => {
  //   // Automatischer Login-Versuch nach 1 Sekunde (nur für Development)
  //   const autoLoginTimer = setTimeout(async () => {
  //     if (!isAuthenticated && !isLoading) {
  //       console.log('🔄 Development: Auto-Login wird versucht...');
  //       const success = await login(username, password);
  //       if (success) {
  //         console.log('✅ Development: Auto-Login erfolgreich!');
  //       } else {
  //         console.log('❌ Development: Auto-Login fehlgeschlagen - Backend nicht erreichbar');
  //       }
  //     }
  //   }, 1000);

  //   return () => clearTimeout(autoLoginTimer);
  // }, [isAuthenticated, isLoading, username, password, login]);

  // Development: Logout beim App-Start für Testen der Anmeldung
  React.useEffect(() => {
    const resetAuthForTesting = async () => {
      console.log('🧪 Development: Authentifizierung wird zurückgesetzt für Tests...');
      // Hier könnten wir logout() aufrufen, aber das würde einen Loop verursachen
      // Stattdessen zeigen wir nur die Login-Seite
    };
    
    resetAuthForTesting();
  }, []);

  const handleSubmit = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Fehler', 'Bitte fülle alle Felder aus');
      return;
    }

    if (!isLoginMode && (!email.trim() || !firstName.trim() || !lastName.trim())) {
      Alert.alert('Fehler', 'Bitte fülle alle Registrierungsfelder aus');
      return;
    }

    setIsLoading(true);

    try {
      let success = false;
      
      if (isLoginMode) {
        success = await login(username, password);
      } else {
        success = await register(username, email, password, firstName, lastName, birthDate);
      }

      if (success) {
        Alert.alert(
          'Erfolgreich',
          isLoginMode ? 'Willkommen zurück!' : 'Registrierung erfolgreich!',
          [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
        );
      } else {
        Alert.alert(
          'Fehler',
          isLoginMode 
            ? 'Ungültige Anmeldedaten. Bitte überprüfe Benutzername und Passwort.'
            : 'Registrierung fehlgeschlagen. Benutzername oder E-Mail bereits vergeben.'
        );
      }
    } catch (error) {
      Alert.alert('Fehler', 'Ein unerwarteter Fehler ist aufgetreten');
    } finally {
      setIsLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background.primary,
    },
    scrollContainer: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: 20,
      paddingTop: 80,
      paddingBottom: 20,
    },
    header: {
      alignItems: 'center',
      marginBottom: 40,
    },
    logoContainer: {
      alignItems: 'center',
      marginBottom: 20,
    },
    logoImage: {
      marginBottom: 15,
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    logoTextContainer: {
      alignItems: 'center',
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.text.primary,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: theme.text.muted,
      textAlign: 'center',
    },
    form: {
      gap: 20,
    },
    inputContainer: {
      gap: 8,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text.primary,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.background.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.text.muted + '30',
      paddingHorizontal: 16,
      minHeight: 50,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: theme.text.primary,
      paddingVertical: 12,
    },
    passwordToggle: {
      padding: 8,
    },
    submitButton: {
      backgroundColor: theme.primary.main,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 10,
    },
    submitButtonDisabled: {
      backgroundColor: theme.text.muted + '50',
    },
    submitButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
    quickLoginButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      paddingVertical: 12,
      marginTop: 8,
      gap: 8,
    },
    quickLoginButtonText: {
      fontSize: 14,
      fontWeight: '600',
    },
    logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      paddingVertical: 12,
      marginTop: 8,
      gap: 8,
    },
    logoutButtonText: {
      fontSize: 14,
      fontWeight: '600',
    },
    toggleMode: {
      alignItems: 'center',
      marginTop: 20,
      padding: 16,
    },
    toggleText: {
      fontSize: 16,
      color: theme.text.muted,
    },
    toggleLink: {
      color: theme.primary.main,
      fontWeight: '600',
    },
    testCredentials: {
      marginTop: 30,
      padding: 16,
      backgroundColor: theme.background.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.primary.main + '30',
    },
    testTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.primary.main,
      marginBottom: 8,
    },
    testText: {
      fontSize: 12,
      color: theme.text.muted,
      lineHeight: 16,
    },
    testUserButtons: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 8,
    },
    testUserButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.primary.main + '30',
    },
    testUserButtonText: {
      fontSize: 12,
      fontWeight: '600',
    },
  });

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <AppLogo size={120} style={styles.logoImage} />
            <View style={styles.logoTextContainer}>
              <Text style={styles.title}>Eisenach App</Text>
              <Text style={styles.subtitle}>
                {isLoginMode 
                  ? 'Melde dich an, um Veranstaltungen zu entdecken'
                  : 'Erstelle ein Konto, um teilzunehmen'
                }
              </Text>
            </View>
          </View>
        </View>

        {/* Formular */}
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Benutzername</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons name="person" size={20} color={theme.text.muted} />
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Benutzername eingeben"
                placeholderTextColor={theme.text.muted}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {!isLoginMode && (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>E-Mail</Text>
                <View style={styles.inputWrapper}>
                  <MaterialIcons name="email" size={20} color={theme.text.muted} />
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="E-Mail eingeben"
                    placeholderTextColor={theme.text.muted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Vorname</Text>
                <View style={styles.inputWrapper}>
                  <MaterialIcons name="badge" size={20} color={theme.text.muted} />
                  <TextInput
                    style={styles.input}
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="Vorname eingeben"
                    placeholderTextColor={theme.text.muted}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Nachname</Text>
                <View style={styles.inputWrapper}>
                  <MaterialIcons name="badge" size={20} color={theme.text.muted} />
                  <TextInput
                    style={styles.input}
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Nachname eingeben"
                    placeholderTextColor={theme.text.muted}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Geburtsdatum</Text>
                <View style={styles.inputWrapper}>
                  <MaterialIcons name="cake" size={20} color={theme.text.muted} />
                  <TextInput
                    style={styles.input}
                    value={birthDate}
                    onChangeText={setBirthDate}
                    placeholder="YYYY-MM-DD (z.B. 1990-05-15)"
                    placeholderTextColor={theme.text.muted}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </>
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Passwort</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons name="lock" size={20} color={theme.text.muted} />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Passwort eingeben"
                placeholderTextColor={theme.text.muted}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowPassword(!showPassword)}
              >
                <MaterialIcons 
                  name={showPassword ? "visibility-off" : "visibility"} 
                  size={20} 
                  color={theme.text.muted} 
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              isLoading && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <Text style={styles.submitButtonText}>
              {isLoading 
                ? 'Wird verarbeitet...' 
                : (isLoginMode ? 'Anmelden' : 'Registrieren')
              }
            </Text>
          </TouchableOpacity>

          {/* Quick-Login Button für Development */}
          {isLoginMode && (
            <TouchableOpacity
              style={[styles.quickLoginButton, { backgroundColor: theme.primary.main + '20' }]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              <MaterialIcons name="flash-on" size={16} color={theme.primary.main} />
              <Text style={[styles.quickLoginButtonText, { color: theme.primary.main }]}>
                Quick Login ({username})
              </Text>
            </TouchableOpacity>
          )}

          {/* Development: Logout Button zum Testen der Anmeldung */}
          {isAuthenticated && (
            <TouchableOpacity
              style={[styles.logoutButton, { backgroundColor: theme.status.error + '20' }]}
              onPress={logout}
            >
              <MaterialIcons name="logout" size={16} color={theme.status.error} />
              <Text style={[styles.logoutButtonText, { color: theme.status.error }]}>
                Logout für Tests
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Modus wechseln */}
        <View style={styles.toggleMode}>
          <Text style={styles.toggleText}>
            {isLoginMode ? 'Noch kein Konto?' : 'Bereits registriert?'}{' '}
            <Text 
              style={styles.toggleLink}
              onPress={() => {
                setIsLoginMode(!isLoginMode);
                setEmail('');
                setFirstName('');
                setLastName('');
              }}
            >
              {isLoginMode ? 'Registrieren' : 'Anmelden'}
            </Text>
          </Text>
        </View>

        {/* Test-Zugangsdaten */}
        <View style={styles.testCredentials}>
          <Text style={styles.testTitle}>Test-Zugangsdaten (bereits vorausgefüllt):</Text>
          <Text style={styles.testText}>
            Aktuell: {username} / {password}{'\n'}
            🧪 Development: Auth wird beim Neuladen zurückgesetzt{'\n\n'}
            Weitere Test-Benutzer:{'\n'}
          </Text>
          
          {/* Quick-Switch Buttons für Test-Benutzer */}
          <View style={styles.testUserButtons}>
            {[
              { username: 'lars', name: 'Lars' },
              { username: 'lenny', name: 'Lenny' },
              { username: 'valentin', name: 'Valentin' },
              { username: 'enzo', name: 'Enzo' },
              { username: 'marie', name: 'Marie' },
              { username: 'jonas', name: 'Jonas' }
            ].map((user) => (
              <TouchableOpacity
                key={user.username}
                style={[
                  styles.testUserButton,
                  { backgroundColor: username === user.username ? theme.primary.main : theme.background.secondary }
                ]}
                onPress={() => {
                  setUsername(user.username);
                  setPassword('test123');
                }}
              >
                <Text style={[
                  styles.testUserButtonText,
                  { color: username === user.username ? '#ffffff' : theme.text.primary }
                ]}>
                  {user.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}