import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  login as apiLogin, 
  register as apiRegister, 
  logout as apiLogout, 
  getCurrentUser, 
  isAuthenticated as checkIsAuthenticated,
  type User,
  type LoginRequest,
  type RegisterRequest
} from '@/services/api';

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string, firstName: string, lastName: string, birthDate?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

// Auth-Context erstellen
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth-Provider Komponente
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Berechnet ob der Benutzer authentifiziert ist
  const isAuthenticated = !!user && !!token;

  // Token und Benutzerdaten beim App-Start laden
  useEffect(() => {
    loadStoredAuth();
  }, []);

  // Gespeicherte Auth-Daten laden und Session validieren (nur einloggen, wenn gültig)
  const loadStoredAuth = async () => {
    try {
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      const storedToken = await AsyncStorage.default.getItem('auth_token');
      const storedUser = await AsyncStorage.default.getItem('user_data');

      if (!storedToken || !storedUser) {
        console.log('🔓 Keine gespeicherten Anmeldedaten gefunden');
        setToken(null);
        setUser(null);
        return;
      }

      try {
        console.log('🔐 Validiere gespeichertes Token...');
        const current = await getCurrentUser();
        if (current) {
          console.log('✅ Token gültig, Benutzer angemeldet:', current.username);
          setToken(storedToken);
          setUser(current);
        } else {
          console.log('❌ Token ungültig, Anmeldedaten werden gelöscht');
          await AsyncStorage.default.removeItem('auth_token');
          await AsyncStorage.default.removeItem('user_data');
          setToken(null);
          setUser(null);
        }
      } catch (e) {
        console.error('❌ Fehler bei Token-Validierung:', e);
        await AsyncStorage.default.removeItem('auth_token');
        await AsyncStorage.default.removeItem('user_data');
        setToken(null);
        setUser(null);
      }
    } catch (error) {
      console.error('❌ Fehler beim Laden der Auth-Daten:', error);
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Benutzer anmelden
  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const credentials: LoginRequest = { username, password };
      const response = await apiLogin(credentials);
      
      setUser(response.user);
      setToken(response.token);
      
      return true;
    } catch (error) {
      console.error('Login-Fehler:', error);
      throw error; // Fehler weitergeben, damit die UI die genaue Meldung anzeigen kann
    }
  };

  // Benutzer registrieren
  const register = async (
    username: string, 
    email: string, 
    password: string, 
    firstName: string, 
    lastName: string,
    birthDate?: string
  ): Promise<boolean> => {
    try {
      const userData: RegisterRequest = {
        username,
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        birth_date: birthDate,
      };
      
      const response = await apiRegister(userData);
      
      setUser(response.user);
      setToken(response.token);
      
      return true;
    } catch (error) {
      console.error('Registrierungs-Fehler:', error);
      throw error; // Fehler weitergeben, damit die UI die genaue Meldung anzeigen kann
    }
  };

  // Benutzer abmelden
  const logout = async (): Promise<void> => {
    try {
      await apiLogout();
    } catch (error) {
      console.error('Fehler beim Logout:', error);
    } finally {
      setToken(null);
      setUser(null);
    }
  };

  // Benutzerdaten aktualisieren
  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook zum Verwenden des Auth-Contexts
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth muss innerhalb eines AuthProvider verwendet werden');
  }
  return context;
}
