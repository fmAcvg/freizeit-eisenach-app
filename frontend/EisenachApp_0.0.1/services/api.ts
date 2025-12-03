// API-Service für die Verbindung mit dem Django Backend
// Alle Funktionen führen echte API-Aufrufe an das Backend durch

import { getApiUrl } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Hinweis: Einfaches Health-Check Caching, um unnötige Requests zu vermeiden
let lastHealthCheckAt = 0;
let lastHealthCheckOk = false;

// Test-Funktion um zu prüfen ob das Backend erreichbar ist
export async function testBackendConnection(): Promise<boolean> {
  const url = `${getApiUrl()}/health/`;
  const now = Date.now();
  // Innerhalb von 30s Ergebnis cachen (verhindert Abbrüche bei schnellem Navigieren)
  if (now - lastHealthCheckAt < 30_000) {
    console.log('Skip health check (cached):', lastHealthCheckOk);
    return lastHealthCheckOk;
  }

  // Debug-Ausgabe für Ziel-URL des Health-Checks (hilft beim WLAN-Wechsel)
  console.log('Health-Check URL:', url);
  try {
    const response = await fetch(url, { method: 'GET' });
    console.log('Health-Check Status:', response.status, response.statusText);
    lastHealthCheckAt = now;
    lastHealthCheckOk = response.ok;
    if (!response.ok) return false;
    return true;
  } catch (error) {
    console.error('Health-Check fehlgeschlagen:', error);
    lastHealthCheckAt = now;
    lastHealthCheckOk = false;
    return false;
  }
}

// Basis-URL für das Backend - flexibel für verschiedene Umgebungen
const API_BASE_URL = getApiUrl();

// Hilfsfunktion um relative Bild-URLs in absolute URLs umzuwandeln
// Dies ist notwendig, damit Bilder auch funktionieren, wenn die App über einen Render-Link geöffnet wird
export function getAbsoluteImageUrl(imageUrl?: string): string | undefined {
  if (!imageUrl) return undefined;
  
  // Wenn die URL bereits absolut ist (beginnt mit http:// oder https://), direkt zurückgeben
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // Backend-Base-URL ohne /api für Media-Dateien
  // Die API-URL ist z.B. "https://freizeit-eisenach-app-1.onrender.com/api"
  // Die Media-URL sollte sein: "https://freizeit-eisenach-app-1.onrender.com"
  const baseUrl = API_BASE_URL.replace('/api', '');
  
  // Relative URL normalisieren (entferne führenden Slash wenn vorhanden, füge einen hinzu wenn nicht)
  const normalizedPath = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  
  return `${baseUrl}${normalizedPath}`;
}

// Typdefinitionen für Events und verwandte Daten (angepasst an Django-Backend)
export type EventItem = {
  id: number;
  title: string;
  description: string;
  date: string;
  location: string;
  can_view_location?: boolean;
  image?: string; // Hochgeladenes Bild (lokale URI für Upload)
  image_url?: string; // Bild-URL (berechnet vom Backend - verwende diese für Anzeige)
  likes_count: number;
  comments_count: number;
  participant_count: number;
  friend_participants_count?: number;
  is_participant?: boolean; // Backend-Feld: Ist der aktuelle Nutzer Teilnehmer?
  joined?: boolean; // Client-seitiges Hilfsfeld für UI-Zustand (wird aus is_participant abgeleitet)
  created_by: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
  cost?: string;
  contact_info?: string;
  max_guests?: number;
  min_age?: number;
  status: string;
  participants?: EventParticipant[];
  created_at: string;
  updated_at: string;
  published_at?: string;
};

export type EventParticipant = {
  id: number;
  user: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    profile_image?: string;
  };
  joined_at: string;
};

// Erweiterte Teilnehmer-Info für Dashboard
export type ParticipantDetail = {
  id: number; // Teilnehmer-Objekt ID (nicht User-ID)
  user_id: number; // echte User-ID
  username: string;
  first_name: string;
  last_name: string;
  joined_at: string;
  profile_image?: string;
};

// Freundschafts-Anfragen Typen
export type FriendshipRequest = {
  id: number;
  from_user: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    profile_image?: string;
  };
  to_user: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  message?: string;
  created_at: string;
  updated_at: string;
};

export type EventComment = {
  id: number;
  event: number;
  author: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
  author_avatar?: string;
  text: string;
  created_at: string;
  is_author: boolean;
  can_delete: boolean;
};

export type Friend = {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  bio: string;
  avatar?: string;
  created_events: number;
  friendship_date: string;
};

export type SearchUser = {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  bio: string;
  avatar?: string;
  created_events: number;
  is_friend: boolean;
};

export type User = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  date_joined: string;
};

type EventDraft = {
  title: string;
  description: string;
  date: string;
  location: string;
  image_url?: string;
  image?: string; // Lokaler Bild-URI für Upload
  contact_info?: string; // Kontaktinformationen
  cost?: string;
  max_guests?: number;
  min_age?: number;
};

export type ManagerApplication = {
  motivation: string;
  experience: string;
};

// Benachrichtigungs-Typ
// Benachrichtigungen entfernt (Backend-Feature deaktiviert)

// Profil-Typ
export type Profile = {
  id: number;
  user: User;
  bio?: string;
  location?: string;
  avatar?: string;
  status: string;
  birth_date?: string;  // Geburtsdatum für Altersberechnung
  age_visible: boolean; // Alter öffentlich sichtbar
  age?: number;         // Berechnetes Alter (read-only)
  profile_public: boolean;
  events_public: boolean;
  created_at: string;
  updated_at: string;
};

// Typdefinitionen für Authentifizierung
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  birth_date?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}


// Hilfsfunktion für API-Aufrufe mit Authentifizierung
export async function apiRequest<T>(endpoint: string, options: RequestInit = {}, requireAuth: boolean = false): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`apiRequest: ${options.method || 'GET'} ${url}`);
  
  // Token aus AsyncStorage laden falls Authentifizierung erforderlich
  let token = null;
  if (requireAuth) {
    try {
      token = await AsyncStorage.getItem('auth_token');
      console.log(`apiRequest: Token geladen: ${token ? 'Ja' : 'Nein'}`);
    } catch (error) {
      console.error('apiRequest: Fehler beim Laden des Tokens:', error);
    }
  }
  
  try {
    const headers: Record<string, string> = {};
    
    // Content-Type nur setzen wenn es nicht FormData ist
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    
    // Zusätzliche Headers hinzufügen
    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    // Token hinzufügen falls vorhanden
    if (token) {
      headers['Authorization'] = `Token ${token}`;
    }

    console.log(`apiRequest: Sende Request mit Headers:`, headers);

    const response = await fetch(url, {
      headers,
      ...options,
    });

    console.log(`apiRequest: Response Status: ${response.status} ${response.statusText}`);

    // Response-Body einmal klonen für mögliche Fehlerbehandlung
    const responseClone = response.clone();
    
    if (!response.ok) {
      // Bei 401/403: Automatisch ausloggen, da Token ungültig oder abgelaufen ist
      if (response.status === 401 || response.status === 403) {
        console.log('Token ungültig oder abgelaufen - Benutzer wird ausgeloggt');
        
        // AsyncStorage leeren
        try {
          await AsyncStorage.removeItem('auth_token');
          await AsyncStorage.removeItem('user_data');
        } catch (storageError) {
          console.error('Fehler beim Löschen der Anmeldedaten:', storageError);
        }
        
        const errorMessage = response.status === 401 
          ? 'Nicht autorisiert. Bitte melde dich erneut an.'
          : 'Zugriff verweigert. Bitte melde dich erneut an.';
        throw new Error(errorMessage);
      }
      
      // Versuche die Backend-Fehlermeldung zu extrahieren (robust gegen Arrays/Objekte)
      try {
        const errorData = await responseClone.json();

        const extractMessage = (data: any): string | undefined => {
          if (!data) return undefined;
          if (typeof data === 'string') return data;
          if (Array.isArray(data)) return data.map(v => (typeof v === 'string' ? v : JSON.stringify(v))).join(' ');
          if (typeof data === 'object') {
            const preferredKeys = ['error', 'detail', 'message', 'non_field_errors'];
            for (const key of preferredKeys) {
              if (key in data) {
                const msg = extractMessage((data as any)[key]);
                if (msg) return msg;
              }
            }
            for (const value of Object.values(data)) {
              const msg = extractMessage(value);
              if (msg) return msg;
            }
          }
          return undefined;
        };

        const message = extractMessage(errorData);
        if (message) throw new Error(message);

        // Falls keine klare Message gefunden wurde, vollständige Antwort loggen
        console.error('apiRequest: Backend Error Response:', errorData);
      } catch (jsonError) {
        // Wenn JSON-Parsing fehlschlägt, verwende Status-Text
      }
      
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    // Prüfe ob Response leer ist (z.B. bei DELETE mit 204 No Content)
    const contentType = response.headers.get('content-type');
    const contentLength = response.headers.get('content-length');
    
    if (response.status === 204 || contentLength === '0' || !contentType?.includes('application/json')) {
      console.log(`apiRequest: Leere Antwort erhalten (Status: ${response.status})`);
      return {} as T; // Für DELETE-Requests ohne Antwort - leeres Objekt zurückgeben
    }
    
    const data = await response.json();
    console.log(`apiRequest: JSON-Daten erhalten:`, data);
    return data;
  } catch (error) {
    console.error('apiRequest: Request Error:', error);
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(`Netzwerk-Fehler: Backend nicht erreichbar unter ${url}. Stelle sicher, dass das Backend läuft.`);
    }
    throw error;
  }
}

// Alle Events abrufen
export async function fetchEvents(): Promise<EventItem[]> {
  try {
    const response = await apiRequest<any>('/events/');
    
    // API gibt paginierte Daten zurück: {count, next, previous, results: [...]}
    let events: EventItem[] = [];
    if (response && response.results) {
      events = response.results;
    } else if (Array.isArray(response)) {
      events = response;
    }

    // Events validieren und sicherstellen, dass alle erforderlichen Felder vorhanden sind
    const validEvents = events.map(event => ({
      ...event,
      title: event.title || 'Titel unbekannt',
      description: event.description || 'Beschreibung nicht verfügbar',
      location: event.location || 'Ort unbekannt',
      date: event.date || new Date().toISOString(),
      created_by: event.created_by || { id: 0, username: 'unbekannt', first_name: 'Unbekannt', last_name: 'Benutzer' },
      likes_count: event.likes_count || 0,
      participant_count: event.participant_count || 0,
      comments_count: event.comments_count || 0,
      participants: event.participants || [], // Teilnehmerdaten hinzufügen falls vorhanden
      is_participant: event.is_participant ?? false, // Backend-Feld für Teilnahme-Status
      joined: event.is_participant ?? event.joined ?? false, // joined aus is_participant ableiten falls vorhanden
    }));
    
    return validEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error('Fehler beim Laden der Events:', error);
    // Bei Fehler leere Liste zurückgeben
    return [];
  }
}

// Events nach Filter abrufen
export async function fetchEventsFiltered(filter: 'friends' | 'upcoming' | 'trending'): Promise<EventItem[]> {
  try {
    if (filter === 'friends') {
      // Serverseitig gefilterte Events, an denen Freunde teilnehmen
      const response = await apiRequest<any>('/events/friends/', { method: 'GET' }, true);
      const events: EventItem[] = (response?.results || response || []).map((event: any) => ({
        ...event,
        is_participant: event.is_participant ?? false,
        joined: event.is_participant ?? event.joined ?? false,
      }));
      return (Array.isArray(events) ? events : []).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    const all = await fetchEvents();
    
    // Alle Events nach Datum sortieren (zukünftige Events zuerst)
    const upcomingEvents = all
      .filter(event => new Date(event.date) > new Date())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    switch (filter as 'friends' | 'upcoming' | 'trending') {
      case 'trending':
        // Events nach Likes sortieren (trending)
        return all.sort((a, b) => b.likes_count - a.likes_count);
        
      case 'upcoming':
        // Nur zukünftige Events, chronologisch sortiert
        return upcomingEvents;
        
      case 'friends':
        return all; // Fallback (sollte nicht erreicht werden)
          
      default:
        return all;
    }
  } catch (error) {
    console.error('Fehler beim Filtern der Events:', error);
    return [];
  }
}

// Event Like hinzufügen
export async function toggleLike(eventId: number): Promise<EventItem | undefined> {
  try {
    await apiRequest(`/events/${eventId}/likes/`, {
      method: 'POST',
    }, true); // Authentifizierung erforderlich
    
    // Event erneut abrufen um aktualisierte Like-Anzahl zu bekommen
    return await fetchEventById(eventId);
  } catch (error) {
    console.error('Fehler beim Liken des Events:', error);
    return undefined;
  }
}

// Events abrufen die der Benutzer erstellt hat
export async function fetchMyCreatedEvents(): Promise<EventItem[]> {
  try {
    console.log('fetchMyCreatedEvents: Starte API-Aufruf...');
    const response = await apiRequest<any>('/events/my-created/', {
      method: 'GET',
    }, true);
    console.log('fetchMyCreatedEvents: API-Antwort erhalten:', response);
    
    // Handle paginated response
    const events = (response?.results || response || []).map((event: any) => ({
      ...event,
      is_participant: event.is_participant ?? false,
      joined: event.is_participant ?? event.joined ?? false,
    }));
    console.log('fetchMyCreatedEvents: Events aus Pagination:', events);
    console.log('fetchMyCreatedEvents: Anzahl Events:', events?.length || 0);
    
    return events;
  } catch (error) {
    console.error('fetchMyCreatedEvents: Fehler beim Laden der erstellten Events:', error);
    if (error instanceof Error && error.message.includes('404')) {
      throw new Error('API-Endpunkt für erstellte Events nicht gefunden. Bitte starte das Backend neu.');
    }
    throw error;
  }
}

// Events abrufen an denen der Benutzer teilnimmt
export async function fetchMyParticipatedEvents(): Promise<EventItem[]> {
  try {
    console.log('fetchMyParticipatedEvents: Starte API-Aufruf...');
    const response = await apiRequest<any>('/events/my-participated/', {
      method: 'GET',
    }, true);
    console.log('fetchMyParticipatedEvents: API-Antwort erhalten:', response);
    
    // Handle paginated response
    const events = (response?.results || response || []).map((event: any) => ({
      ...event,
      is_participant: event.is_participant ?? true, // Bei my-participated sind alle Events, an denen der Nutzer teilnimmt
      joined: event.is_participant ?? event.joined ?? true,
    }));
    console.log('fetchMyParticipatedEvents: Events aus Pagination:', events);
    console.log('fetchMyParticipatedEvents: Anzahl Events:', events?.length || 0);
    
    return events;
  } catch (error) {
    console.error('fetchMyParticipatedEvents: Fehler beim Laden der teilgenommenen Events:', error);
    if (error instanceof Error && error.message.includes('404')) {
      throw new Error('API-Endpunkt für Teilnahme-Events nicht gefunden. Bitte starte das Backend neu.');
    }
    throw error;
  }
}

// Legacy-Funktionen für Rückwärtskompatibilität
export async function fetchUserEvents(userId?: number): Promise<EventItem[]> {
  return fetchMyParticipatedEvents();
}

export async function fetchCreatorEvents(userId?: number): Promise<EventItem[]> {
  return fetchMyCreatedEvents();
}

// Einzelnes Event nach ID abrufen
export async function fetchEventById(id: number): Promise<EventItem | undefined> {
  try {
    console.log('fetchEventById: Lade Event', id);
    // Prüfe ob Benutzer angemeldet ist - wenn ja, mit Auth laden damit is_participant korrekt ist
    const authed = await isAuthenticated();
    const event = await apiRequest<EventItem>(`/events/${id}/`, {}, authed);
    console.log('fetchEventById: Event geladen:', event?.title || event?.id, 'is_participant:', event?.is_participant);
    
    // Teilnehmerdaten separat laden falls Event vorhanden ist
    if (event) {
      // joined-Status aus Backend-Feld is_participant ableiten
      event.joined = event.is_participant ?? event.joined ?? false;
      
      try {
        // Nur für angemeldete Nutzer Teilnehmerdaten laden (Endpoint erfordert Auth)
        const authed = await isAuthenticated();
        if (authed) {
          const participants = await fetchEventParticipants(id);
          // Robust mappen: API liefert aktuell { id, joined_at, user: { id, username, first_name, last_name, profile_image } }
          event.participants = participants.map((p: any) => {
            const hasNestedUser = p && p.user;
            const user = hasNestedUser
              ? {
                  id: p.user.id,
                  username: p.user.username,
                  first_name: p.user.first_name,
                  last_name: p.user.last_name,
                  profile_image: p.user.profile_image,
                }
              : {
                  id: p.id,
                  username: p.username,
                  first_name: p.first_name,
                  last_name: p.last_name,
                  profile_image: p.profile_image,
                };
            return {
              id: p.id,
              joined_at: p.joined_at,
              user,
            };
          });
          // joined-Status auch aus Teilnehmerliste ableiten (als Fallback)
          const userData = await getCurrentUser();
          if (userData) {
            const isInParticipants = participants.some((p: any) => p.user_id === userData.id);
            event.joined = event.joined || isInParticipants;
            // Wenn in Teilnehmerliste aber is_participant false, manuell setzen
            if (isInParticipants && !event.is_participant) {
              event.is_participant = true;
            }
          }
        }
      } catch (error) {
        console.log('Teilnehmerdaten konnten nicht geladen werden (Gast oder Fehler):', error);
        // Event trotzdem zurückgeben, auch ohne Teilnehmerdaten
      }
    }
    
    return event;
  } catch (error) {
    console.error('Fehler beim Laden des Events:', error);
    return undefined;
  }
}

// Event erstellen
export async function submitEventDraft(draft: EventDraft): Promise<{ status: 'created'; id: number }> {
  try {
    console.log('submitEventDraft: Starte Event-Erstellung...');
    
    // Wenn ein Bild vorhanden ist, FormData verwenden
    if (draft.image) {
      console.log('submitEventDraft: Event mit Bild wird erstellt...');
      
      const formData = new FormData();
      formData.append('title', draft.title);
      formData.append('description', draft.description);
      formData.append('date', draft.date);
      formData.append('location', draft.location);
      formData.append('contact_info', draft.contact_info || '');
      formData.append('cost', draft.cost || 'Kostenlos');
      if (draft.min_age) {
        formData.append('min_age', draft.min_age.toString());
      }
      if (typeof draft.max_guests === 'number') {
        formData.append('max_guests', String(draft.max_guests));
      }
      
      // Bild als Datei anhängen
      const imageUri = draft.image;
      const imageName = imageUri.split('/').pop() || 'event_image.jpg';
      
      // Für React Native FormData
      formData.append('image', {
        uri: imageUri,
        name: imageName,
        type: 'image/jpeg',
      } as any);
      
      const response = await apiRequest<EventItem>('/events/', {
        method: 'POST',
        body: formData,
        // Content-Type wird automatisch von FormData gesetzt - nicht explizit setzen!
      }, true); // Authentifizierung erforderlich!
      
      console.log('submitEventDraft: Event mit Bild erfolgreich erstellt:', response);
      return { status: 'created', id: response.id };
    } else {
      // Ohne Bild - normales JSON
      console.log('submitEventDraft: Event ohne Bild wird erstellt...');
      const response = await apiRequest<EventItem>('/events/', {
        method: 'POST',
        body: JSON.stringify(draft),
      }, true); // Authentifizierung erforderlich!
      
      console.log('submitEventDraft: Event erfolgreich erstellt:', response);
      return { status: 'created', id: response.id };
    }
  } catch (error) {
    console.error('submitEventDraft: Fehler beim Erstellen des Events:', error);
    throw error;
  }
}

// Event aktualisieren
export async function updateEvent(eventId: number, updateData: Partial<EventItem>): Promise<EventItem | undefined> {
  try {
    const response = await apiRequest<EventItem>(`/events/${eventId}/`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    }, true);
    return response;
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Events:', error);
    throw error;
  }
}

// Datenschutz-Einstellungen aktualisieren
export async function updatePrivacySettings(privacyData: { profile_public?: boolean; events_public?: boolean; age_visible?: boolean }): Promise<Profile> {
  try {
    console.log('updatePrivacySettings: Starte API-Aufruf...');
    const response = await apiRequest<Profile>('/auth/profile/', {
      method: 'PATCH',
      body: JSON.stringify(privacyData),
    }, true);
    console.log('updatePrivacySettings: API-Antwort erhalten:', response);
    return response;
  } catch (error) {
    console.error('updatePrivacySettings: Fehler beim Aktualisieren der Datenschutz-Einstellungen:', error);
    throw error;
  }
}

// Manager-Bewerbung einreichen (vereinfacht)
export async function applyForManager(app: ManagerApplication): Promise<{ status: 'under-review' }> {
  // Diese Funktionalität ist im Backend noch nicht implementiert
  console.log('Manager-Bewerbung:', app);
  return { status: 'under-review' };
}


// Kommentare zu einem Event abrufen
export async function fetchEventComments(eventId: number): Promise<EventComment[]> {
  try {
    console.log(`fetchEventComments: Lade Kommentare für Event ${eventId}...`);
    const response = await apiRequest<any>(`/events/${eventId}/comments/`);
    // Paginierte oder direkte Antwort unterstützen
    const comments: EventComment[] = Array.isArray(response) ? response : (response?.results || []);
    console.log(`fetchEventComments: ${comments.length} Kommentare geladen`);
    return comments;
  } catch (error) {
    console.error('Fehler beim Laden der Kommentare:', error);
    return [];
  }
}

// Neuen Kommentar hinzufügen
export async function addEventComment(eventId: number, text: string): Promise<EventComment> {
  try {
    return await apiRequest<EventComment>(`/events/${eventId}/comments/`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    }, true); // Authentifizierung erforderlich
  } catch (error) {
    console.error('Fehler beim Hinzufügen des Kommentars:', error);
    throw error;
  }
}

// Kommentar löschen
export async function deleteEventComment(commentId: number): Promise<void> {
  try {
    await apiRequest(`/comments/${commentId}/`, {
      method: 'DELETE',
    }, true); // Auth erforderlich zum Löschen
  } catch (error) {
    console.error('Fehler beim Löschen des Kommentars:', error);
    throw error;
  }
}

// Benutzer anmelden
export async function login(credentials: LoginRequest): Promise<AuthResponse> {
  try {
    const response = await apiRequest<AuthResponse>('/auth/login/', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    // Token im AsyncStorage speichern
    if (response.token) {
      await AsyncStorage.setItem('auth_token', response.token);
      await AsyncStorage.setItem('user_data', JSON.stringify(response.user));
    }
    
    return response;
  } catch (error) {
    console.error('Fehler beim Anmelden:', error);
    throw error;
  }
}

// Benutzer registrieren
export async function register(userData: RegisterRequest): Promise<AuthResponse> {
  try {
    const response = await apiRequest<AuthResponse>('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    // Token im AsyncStorage speichern
    if (response.token) {
      await AsyncStorage.setItem('auth_token', response.token);
      await AsyncStorage.setItem('user_data', JSON.stringify(response.user));
    }
    
    return response;
  } catch (error) {
    console.error('Fehler bei der Registrierung:', error);
    throw error;
  }
}

// Passwort zurücksetzen anfordern
export async function requestPasswordReset(email: string): Promise<{ message: string; debug_code?: string; debug_username?: string }> {
  try {
    const response = await apiRequest<{ message: string; error?: string; debug_code?: string; debug_username?: string }>(
      '/auth/password-reset/',
      {
        method: 'POST',
        body: JSON.stringify({ email }),
      }
    );
    return { 
      message: response?.message || 'Wenn die E-Mail existiert, wurde eine Nachricht gesendet.',
      debug_code: response?.debug_code,
      debug_username: response?.debug_username,
    };
  } catch (error) {
    console.error('Fehler bei Passwort-Reset-Anforderung:', error);
    throw error;
  }
}

// Passwort mit UID/Token bestätigen
export async function confirmPasswordReset(uid: string, token: string, newPassword: string): Promise<{ message: string }> {
  try {
    const response = await apiRequest<{ message: string; error?: string }>(
      '/auth/password-reset/confirm/',
      {
        method: 'POST',
        body: JSON.stringify({ uid, token, new_password: newPassword }),
      }
    );
    return { message: response?.message || 'Passwort wurde erfolgreich geändert.' };
  } catch (error) {
    console.error('Fehler bei Passwort-Reset-Bestätigung:', error);
    throw error;
  }
}

// Passwort per 6-stelligem Code bestätigen
export async function confirmPasswordResetByCode(identifier: { email?: string; username?: string }, code: string, newPassword: string): Promise<{ message: string }> {
  try {
    const response = await apiRequest<{ message: string; error?: string }>(
      '/auth/password-reset/confirm-code/',
      {
        method: 'POST',
        body: JSON.stringify({ ...identifier, code, new_password: newPassword }),
      }
    );
    return { message: response?.message || 'Passwort wurde erfolgreich geändert.' };
  } catch (error) {
    console.error('Fehler bei Passwort-Reset (Code):', error);
    throw error;
  }
}

// Benutzer abmelden
export async function logout(): Promise<void> {
  try {
    await apiRequest('/auth/logout/', {
      method: 'POST',
    }, true);
    
    // Token und Benutzerdaten aus AsyncStorage entfernen
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('user_data');
  } catch (error) {
    console.error('Fehler beim Abmelden:', error);
    // Auch bei Fehler lokale Daten löschen
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('user_data');
    throw error;
  }
}

// Aktuellen Benutzer abrufen
export async function getCurrentUser(): Promise<User | null> {
  try {
    const userData = await AsyncStorage.getItem('user_data');
    
    if (userData) {
      return JSON.parse(userData);
    }
    
    // Fallback: Benutzer vom Server abrufen
    const response = await apiRequest<User>('/auth/profile/', {}, true);
    await AsyncStorage.setItem('user_data', JSON.stringify(response));
    return response;
  } catch (error) {
    console.error('Fehler beim Abrufen des Benutzers:', error);
    return null;
  }
}

// Benutzer-Profil abrufen
export async function getUserProfile(): Promise<Profile> {
  try {
    return await apiRequest<Profile>('/profiles/', {}, true);
  } catch (error) {
    console.error('Fehler beim Abrufen des Profils:', error);
    throw error;
  }
}

// Benutzer-Profil aktualisieren
export async function updateUserProfile(profileData: Partial<Profile>): Promise<Profile> {
  try {
    const response = await apiRequest<Profile>('/profiles/', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    }, true);
    
    // Aktualisierte Benutzerdaten im AsyncStorage speichern
    if (response.user) {
      await AsyncStorage.setItem('user_data', JSON.stringify(response.user));
    }
    
    return response;
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Profils:', error);
    throw error;
  }
}

// Prüfen ob Benutzer angemeldet ist
export async function isAuthenticated(): Promise<boolean> {
  try {
    const token = await AsyncStorage.getItem('auth_token');
    return !!token;
  } catch (error) {
    console.error('Fehler beim Prüfen der Authentifizierung:', error);
    return false;
  }
}

// Token abrufen
export async function getAuthToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem('auth_token');
  } catch (error) {
    console.error('Fehler beim Abrufen des Tokens:', error);
    return null;
  }
}

// Event-Teilnahme
export async function joinEvent(eventId: number): Promise<void> {
  try {
    await apiRequest(`/events/${eventId}/participants/`, {
      method: 'POST',
      body: JSON.stringify({}), // Leerer JSON Body für POST-Request
    }, true);
  } catch (error) {
    console.error('Fehler beim Beitreten zum Event:', error);
    throw error;
  }
}

// Event verlassen
export async function leaveEvent(eventId: number): Promise<void> {
  try {
    // Eigene Teilnahme anhand der Teilnehmerliste (mit verschachteltem user) finden und löschen
    const response = await apiRequest<any>(`/events/${eventId}/participants/`, { method: 'GET' }, true);
    const participants = response?.results || response || [];
    const meStr = await AsyncStorage.getItem('user_data');
    const me = meStr ? JSON.parse(meStr) : null;
    const mine = participants.find((p: any) => p?.user?.id === me?.id);
    if (!mine) {
      // Bereits nicht Teilnehmer → noop
      return;
    }
    await apiRequest(`/events/${eventId}/participants/${mine.id}/`, { method: 'DELETE' }, true);
  } catch (error) {
    console.error('Fehler beim Verlassen des Events:', error);
    throw error;
  }
}

// Event-Teilnehmerliste abrufen (für Dashboard)
export async function fetchEventParticipants(eventId: number): Promise<ParticipantDetail[]> {
  try {
    console.log('fetchEventParticipants: Lade Teilnehmer für Event', eventId);
    const response = await apiRequest<any>(`/events/${eventId}/participants/`, {
      method: 'GET',
    }, true);
    
    console.log('fetchEventParticipants: API-Antwort erhalten:', response);
    
    // Handle paginated response
    const raw = response?.results || response || [];
    console.log('fetchEventParticipants: Teilnehmer aus Pagination:', raw);

    // API liefert { id, user: {id, username, first_name, last_name, profile_image}, joined_at }
    const flattened: ParticipantDetail[] = raw.map((p: any) => ({
      id: p.id, // Teilnehmer-ID
      user_id: p?.user?.id ?? p?.id, // echte User-ID
      username: p?.user?.username ?? p?.username,
      first_name: p?.user?.first_name ?? p?.first_name,
      last_name: p?.user?.last_name ?? p?.last_name,
      profile_image: p?.user?.profile_image ?? p?.profile_image,
      joined_at: p.joined_at,
    }));

    // Teilnehmer nach joined_at sortieren (neueste zuerst)
    const sorted = flattened.sort((a, b) => new Date(b.joined_at).getTime() - new Date(a.joined_at).getTime());
    console.log('fetchEventParticipants: Sortierte Teilnehmer:', sorted.length);
    return sorted;
  } catch (error) {
    console.error('fetchEventParticipants: Fehler beim Laden der Teilnehmer:', error);
    if (error instanceof Error && error.message.includes('404')) {
      throw new Error('API-Endpunkt für Teilnehmer nicht gefunden. Bitte starte das Backend neu.');
    }
    throw error;
  }
}

// Benutzer abrufen
export async function fetchUser(userId: number): Promise<User | undefined> {
  try {
    return await apiRequest<User>(`/users/${userId}/`);
  } catch (error) {
    console.error('Fehler beim Laden des Benutzers:', error);
    return undefined;
  }
}

// Freunde abrufen
export async function fetchFriends(): Promise<Friend[]> {
  try {
    return await apiRequest<Friend[]>('/friends/list/', {}, true);
  } catch (error) {
    console.error('Fehler beim Laden der Freunde:', error);
    return [];
  }
}

// Benutzer suchen
export async function searchUsers(query: string): Promise<SearchUser[]> {
  try {
    return await apiRequest<SearchUser[]>(`/friends/search/?q=${encodeURIComponent(query)}`, {}, true);
  } catch (error) {
    console.error('Fehler bei der Benutzer-Suche:', error);
    return [];
  }
}

// Freundschaftsanfrage senden
export async function sendFriendRequest(userId: string): Promise<void> {
  try {
    await apiRequest('/friends/add/', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    }, true);
  } catch (error) {
    console.error('Fehler beim Senden der Freundschaftsanfrage:', error);
    throw error;
  }
}

// Freundschaft beenden
export async function removeFriendship(userId: string): Promise<void> {
  try {
    await apiRequest('/friends/remove/', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    }, true);
  } catch (error) {
    console.error('Fehler beim Entfernen der Freundschaft:', error);
    throw error;
  }
}



// Event löschen
export async function deleteEvent(eventId: number): Promise<void> {
  try {
    const result = await apiRequest(`/events/${eventId}/`, {
      method: 'DELETE',
    }, true); // Authentifizierung erforderlich
    
    // DELETE-Request war erfolgreich (Status 204 oder ähnlich)
    console.log('Event erfolgreich gelöscht');
  } catch (error) {
    console.error('Fehler beim Löschen des Events:', error);
    throw error;
  }
}

// Freundschaften (bereits in Zeile 675 definiert)


// Benachrichtigungen
// Benachrichtigungen entfernt (Backend-Feature deaktiviert)

// Alters-Analytics
export interface AgeAnalytics {
  event_id: number;
  event_title: string;
  total_participants: number;
  age_distribution: {
    '18-25': number;
    '26-35': number;
    '36-45': number;
    '46-55': number;
    '56-65': number;
    '65+': number;
    'unbekannt': number;
  };
}

export async function fetchEventAgeAnalytics(eventId: number): Promise<AgeAnalytics> {
  try {
    console.log(`fetchEventAgeAnalytics: Lade Alters-Analytics für Event ${eventId}...`);
    const response = await apiRequest<AgeAnalytics>(`/events/${eventId}/age-analytics/`, {}, true);
    console.log(`fetchEventAgeAnalytics: Analytics geladen:`, response);
    return response;
  } catch (error) {
    console.error('fetchEventAgeAnalytics: Fehler beim Laden der Alters-Analytics:', error);
    throw error;
  }
}

// User Report Interfaces
export interface UserReport {
  id: number;
  reporter: number;
  reported_user: number;
  reporter_username: string;
  reported_user_username: string;
  reason: 'inappropriate_content' | 'harassment' | 'spam' | 'fake_profile' | 'violence' | 'other';
  description: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  admin_notes: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

export interface CreateUserReportRequest {
  reported_user_id?: number;
  event_id?: number;
  comment_id?: number;
  reason: 'inappropriate_content' | 'harassment' | 'spam' | 'fake_profile' | 'violence' | 'other';
  description?: string;
}

// User Report Functions
export async function createUserReport(reportData: CreateUserReportRequest): Promise<UserReport> {
  try {
    console.log('createUserReport: Erstelle Meldung...', reportData);
    const response = await apiRequest<UserReport>('/reports/', {
      method: 'POST',
      body: JSON.stringify(reportData),
    }, true);
    console.log('createUserReport: Meldung erstellt:', response);
    return response;
  } catch (error) {
    console.error('createUserReport: Fehler beim Erstellen der Meldung:', error);
    throw error;
  }
}

// Kommentar melden
export async function reportComment(commentId: number, reason: string, description?: string): Promise<UserReport> {
  try {
    console.log('reportComment: Melde Kommentar...', { commentId, reason });
    // Nutze den dedizierten Kommentar-Report-Endpunkt
    const response = await apiRequest<UserReport>(`/comments/${commentId}/report/`, {
      method: 'POST',
      body: JSON.stringify({ reason, description }),
    }, true);
    console.log('reportComment: Kommentar gemeldet:', response);
    return response;
  } catch (error) {
    console.error('reportComment: Fehler beim Melden des Kommentars:', error);
    throw error;
  }
}

export async function getUserReports(): Promise<UserReport[]> {
  try {
    console.log('getUserReports: Lade alle Meldungen...');
    const response = await apiRequest<UserReport[]>('/reports/list/', {}, true);
    console.log('getUserReports: Meldungen geladen:', response);
    return response;
  } catch (error) {
    console.error('getUserReports: Fehler beim Laden der Meldungen:', error);
    throw error;
  }
}

// Freundschafts-Anfragen Funktionen
export async function getFriendshipRequests(): Promise<FriendshipRequest[]> {
  try {
    console.log('getFriendshipRequests: Lade Freundschafts-Anfragen...');
    const response = await apiRequest<any>('/friend-requests/', {}, true);
    console.log('getFriendshipRequests: Anfragen geladen:', response);
    
    // Handle paginated response
    if (response && response.results) {
      return response.results;
    } else if (Array.isArray(response)) {
      return response;
    } else {
      return [];
    }
  } catch (error) {
    console.error('getFriendshipRequests: Fehler beim Laden der Anfragen:', error);
    throw error;
  }
}

export async function sendFriendshipRequest(userId: number, message?: string): Promise<FriendshipRequest> {
  try {
    console.log('sendFriendshipRequest: Sende Freundschafts-Anfrage...', { userId, message });
    const response = await apiRequest<FriendshipRequest>(`/friend-requests/send/${userId}/`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }, true);
    console.log('sendFriendshipRequest: Anfrage gesendet:', response);
    return response;
  } catch (error) {
    console.error('sendFriendshipRequest: Fehler beim Senden der Anfrage:', error);
    throw error;
  }
}

export async function respondToFriendshipRequest(requestId: number, action: 'accept' | 'decline'): Promise<void> {
  try {
    console.log('respondToFriendshipRequest: Antworte auf Anfrage...', { requestId, action });
    await apiRequest(`/friend-requests/${requestId}/respond/`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    }, true);
    console.log('respondToFriendshipRequest: Antwort gesendet');
  } catch (error) {
    console.error('respondToFriendshipRequest: Fehler beim Antworten:', error);
    throw error;
  }
}

export async function cancelFriendshipRequest(requestId: number): Promise<void> {
  try {
    console.log('cancelFriendshipRequest: Storniere Anfrage...', requestId);
    await apiRequest(`/friend-requests/${requestId}/`, {
      method: 'DELETE',
    }, true);
    console.log('cancelFriendshipRequest: Anfrage storniert');
  } catch (error) {
    console.error('cancelFriendshipRequest: Fehler beim Stornieren:', error);
    throw error;
  }
}




