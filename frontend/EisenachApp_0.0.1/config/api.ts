// API-Konfiguration für verschiedene Umgebungen

// Render Backend URL (fest für diesen Branch)
export const API_CONFIG = {
  BASE_URL: 'https://freizeit-eisenach-app-1.onrender.com/api',
};

// Automatische Erkennung der Basis-URL für API-Requests
export const getApiUrl = () => {
  // Wir nutzen jetzt immer das Render-Backend
  return API_CONFIG.BASE_URL;
};

/* Alte Logik (auskommentiert für Render-Branch):
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const ENV_API_URL: string | null =
  typeof process !== 'undefined' && (process as any)?.env?.EXPO_PUBLIC_API_URL
    ? String((process as any).env.EXPO_PUBLIC_API_URL)
    : null;

function detectHostFromExpo(): string | null {
  const hostUri = (Constants as any)?.expoConfig?.hostUri || (Constants as any)?.manifest?.debuggerHost;
  if (typeof hostUri === 'string') {
    const host = hostUri.split(':')[0];
    return host;
  }
  return null;
}

function isIPv4(host: string): boolean {
  return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host);
}

function resolveLocalApiBase(): string {
  const expoHost = detectHostFromExpo();
  if (expoHost && isIPv4(expoHost)) {
    return `http://${expoHost}:8000/api`;
  }
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname) {
    const h = window.location.hostname;
    if (isIPv4(h)) return `http://${h}:8000/api`;
  }
  return 'http://192.168.2.120:8000/api';
}
*/
