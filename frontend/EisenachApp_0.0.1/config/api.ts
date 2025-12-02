// API-Konfiguration für verschiedene Umgebungen

// Für die Entwicklung: Ändere diese URL zu deiner lokalen IP-Adresse
// Du findest deine IP mit: ipconfig (Windows) oder ifconfig (Mac/Linux)
// Beispiel: http://192.168.1.100:8000/api

import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const API_CONFIG = {
  // Fallback: Wenn keine IP erkannt wird, nutze diese 192er Basis
  BASE_URL: 'http://192.168.2.120:8000/api',
};

// Optionaler Override per Umgebungsvariable (z. B. Docker/CI)
// EXPO_PUBLIC_API_URL=/api oder http://backend:8000/api
const ENV_API_URL: string | null =
  typeof process !== 'undefined' && (process as any)?.env?.EXPO_PUBLIC_API_URL
    ? String((process as any).env.EXPO_PUBLIC_API_URL)
    : null;

// Versuche aus Expo/Metro-Umgebung die Host-IP herauszulesen
function detectHostFromExpo(): string | null {
  // In Entwicklung liefert expoConfig.hostUri i. d. R. "192.168.x.y:8081"
  const hostUri = (Constants as any)?.expoConfig?.hostUri || (Constants as any)?.manifest?.debuggerHost;
  if (typeof hostUri === 'string') {
    const host = hostUri.split(':')[0];
    return host;
  }
  return null;
}

// Ermittelt die beste Host-IP für das Backend im lokalen Netzwerk
function isIPv4(host: string): boolean {
  return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host);
}

function resolveLocalApiBase(): string {
  // 1) Expo Host-IP (bevorzugt, wenn 192er IP)
  const expoHost = detectHostFromExpo();
  if (expoHost && isIPv4(expoHost)) {
    return `http://${expoHost}:8000/api`;
  }

  // 2) Browser-Hostname (falls Web)
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname) {
    const h = window.location.hostname;
    if (isIPv4(h)) return `http://${h}:8000/api`;
  }

  // 3) Fallback auf feste 192er Basis (Projektvorgabe)
  return API_CONFIG.BASE_URL;
}

// Automatische Erkennung der Basis-URL für API-Requests
export const getApiUrl = () => {
  // 0) ENV hat Vorrang (z. B. im Docker-Web-Build)
  if (ENV_API_URL) return ENV_API_URL;
  const url = resolveLocalApiBase();
  return url;
};
