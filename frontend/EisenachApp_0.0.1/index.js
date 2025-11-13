// Custom entry point to resolve expo-router/entry module resolution issues
import 'expo-router/entry';
import { API_CONFIG, getApiUrl } from './config/api';

// Hinweis beim App-Start: wohin die API-Requests gehen
// Erklärung: hilft beim lokalen Testen in verschiedenen WLANs
console.log(`Backend API Base URL: ${getApiUrl()} (Basis-Konfig: ${API_CONFIG.BASE_URL})`);

