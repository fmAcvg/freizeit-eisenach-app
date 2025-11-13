import React from 'react';
import { 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  TextInput, 
  Alert, 
  ScrollView, 
  KeyboardAvoidingView,
  Platform 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useAppTheme } from '@/hooks/use-app-theme';
import AppLogo from '@/components/ui/AppLogo';
import { Link } from 'expo-router';

interface LoginFormProps {
  onLoginSuccess?: () => void;
}

export function LoginForm({ onLoginSuccess }: LoginFormProps) {
  // Test-Anmeldedaten automatisch vorausfüllen für Development
  const [username, setUsername] = React.useState('lars');
  const [password, setPassword] = React.useState('test123');
  const [isLoading, setIsLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoginMode, setIsLoginMode] = React.useState(true);
  
  // Registrierungs-Felder
  const [email, setEmail] = React.useState('');
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [birthDate, setBirthDate] = React.useState('');

  const { login, register, logout, isAuthenticated } = useAuth();
  const theme = useAppTheme();

  const handleSubmit = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Fehler', 'Bitte fülle alle Felder aus');
      return;
    }

    if (!isLoginMode && (!email.trim() || !firstName.trim() || !lastName.trim() || !birthDate.trim())) {
      Alert.alert('Fehler', 'Bitte fülle alle Felder für die Registrierung aus (inkl. Geburtsdatum)');
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
          isLoginMode ? 'Erfolgreich angemeldet!' : 'Registrierung erfolgreich!',
          [{ text: 'OK', onPress: onLoginSuccess }]
        );
      } else {
        Alert.alert(
          'Fehler',
          isLoginMode ? 'Anmeldung fehlgeschlagen. Überprüfe deine Daten.' : 'Registrierung fehlgeschlagen.'
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ein unerwarteter Fehler ist aufgetreten';
      Alert.alert('Fehler', message);
    } finally {
      setIsLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background.primary,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: 24,
      paddingTop: 80,
      paddingBottom: 40,
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
      gap: 16,
    },
    inputContainer: {
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
    icon: {
      marginRight: 12,
    },
    passwordToggle: {
      padding: 4,
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
      fontSize: 14,
      color: theme.text.muted,
    },
    toggleLink: {
      color: theme.primary.main,
      fontWeight: '600',
    },
    forgotRow: {
      alignItems: 'flex-end',
    },
    forgotLink: {
      color: theme.primary.main,
      fontWeight: '600',
      marginTop: 8,
    },
    testCredentials: {
      backgroundColor: theme.background.surface,
      borderRadius: 12,
      padding: 16,
      marginTop: 20,
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
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <AppLogo size={100} style={styles.logoImage} />
            <View style={styles.logoTextContainer}>
              <Text style={styles.title}>
                {isLoginMode ? 'Willkommen zurück' : 'Registrieren'}
              </Text>
              <Text style={styles.subtitle}>
                {isLoginMode 
                  ? 'Melde dich an, um Events zu entdecken' 
                  : 'Erstelle dein Konto für die Eisenach App'
                }
              </Text>
            </View>
          </View>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Benutzername oder E-Mail */}
          <View style={styles.inputContainer}>
            <MaterialIcons 
              name="person" 
              size={20} 
              color={theme.text.muted} 
              style={styles.icon}
            />
            <TextInput
              style={styles.input}
              placeholder="Benutzername oder E-Mail"
              placeholderTextColor={theme.text.muted}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Passwort */}
          <View style={styles.inputContainer}>
            <MaterialIcons 
              name="lock" 
              size={20} 
              color={theme.text.muted} 
              style={styles.icon}
            />
            <TextInput
              style={styles.input}
              placeholder="Passwort"
              placeholderTextColor={theme.text.muted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.passwordToggle}
              onPress={() => setShowPassword(!showPassword)}
            >
              <MaterialIcons
                name={showPassword ? 'visibility-off' : 'visibility'}
                size={20}
                color={theme.text.muted}
              />
            </TouchableOpacity>
          </View>

          {/* Passwort vergessen Link */}
          {isLoginMode && (
            <View style={styles.forgotRow}>
              <Link href="/(auth)/password-reset" style={styles.forgotLink}>Passwort vergessen?</Link>
            </View>
          )}

          {/* Registrierungs-Felder */}
          {!isLoginMode && (
            <>
              <View style={styles.inputContainer}>
                <MaterialIcons 
                  name="email" 
                  size={20} 
                  color={theme.text.muted} 
                  style={styles.icon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="E-Mail"
                  placeholderTextColor={theme.text.muted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputContainer}>
                <MaterialIcons 
                  name="person-outline" 
                  size={20} 
                  color={theme.text.muted} 
                  style={styles.icon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Vorname"
                  placeholderTextColor={theme.text.muted}
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputContainer}>
                <MaterialIcons 
                  name="person-outline" 
                  size={20} 
                  color={theme.text.muted} 
                  style={styles.icon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Nachname"
                  placeholderTextColor={theme.text.muted}
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputContainer}>
                <MaterialIcons 
                  name="calendar-today" 
                  size={20} 
                  color={theme.text.muted} 
                  style={styles.icon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Geburtsdatum (TT.MM.JJJJ)"
                  placeholderTextColor={theme.text.muted}
                  value={birthDate}
                  onChangeText={setBirthDate}
                  autoCapitalize="none"
                />
              </View>
            </>
          )}

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
            {isLoginMode ? 'Noch kein Konto?' : 'Bereits registriert?'}
            <Text
              style={styles.toggleLink}
              onPress={() => setIsLoginMode(!isLoginMode)}
            >
              {' '}
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
