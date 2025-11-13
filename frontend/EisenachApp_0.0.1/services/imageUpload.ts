import { getApiUrl } from '../config/api';

// Hilfsfunktion für API-Aufrufe mit Datei-Upload
async function uploadRequest<T>(endpoint: string, formData: FormData, requireAuth: boolean = true): Promise<T> {
  const url = `${getApiUrl()}${endpoint}`;
  console.log(`🌐 uploadRequest: POST ${url}`);
  
  let token = null;
  if (requireAuth) {
    try {
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      token = await AsyncStorage.default.getItem('auth_token');
      console.log(`🔑 uploadRequest: Token geladen: ${token ? 'Ja' : 'Nein'}`);
    } catch (error) {
      console.error('❌ uploadRequest: Fehler beim Laden des Tokens:', error);
    }
  }
  
  try {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Token ${token}`;
    }
    // Content-Type wird automatisch für FormData gesetzt
    
    console.log(`📤 uploadRequest: Sende Request mit Headers:`, headers);
    const response = await fetch(url, { 
      method: 'POST',
      headers,
      body: formData
    });
    
    console.log(`📥 uploadRequest: Response Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Nicht autorisiert. Bitte melde dich erneut an.');
      }
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log(`✅ uploadRequest: JSON-Daten erhalten:`, data);
    return data;
  } catch (error) {
    console.error('❌ uploadRequest: Request Error:', error);
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(`Netzwerk-Fehler: Backend nicht erreichbar unter ${url}. Stelle sicher, dass das Backend läuft.`);
    }
    throw error;
  }
}

// Hilfsfunktion für DELETE-Requests
async function deleteRequest<T>(endpoint: string, requireAuth: boolean = true): Promise<T> {
  const url = `${getApiUrl()}${endpoint}`;
  console.log(`🌐 deleteRequest: DELETE ${url}`);
  
  let token = null;
  if (requireAuth) {
    try {
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      token = await AsyncStorage.default.getItem('auth_token');
      console.log(`🔑 deleteRequest: Token geladen: ${token ? 'Ja' : 'Nein'}`);
    } catch (error) {
      console.error('❌ deleteRequest: Fehler beim Laden des Tokens:', error);
    }
  }
  
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Token ${token}`;
    }
    
    console.log(`📤 deleteRequest: Sende Request mit Headers:`, headers);
    const response = await fetch(url, { 
      method: 'DELETE',
      headers
    });
    
    console.log(`📥 deleteRequest: Response Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Nicht autorisiert. Bitte melde dich erneut an.');
      }
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log(`✅ deleteRequest: JSON-Daten erhalten:`, data);
    return data;
  } catch (error) {
    console.error('❌ deleteRequest: Request Error:', error);
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(`Netzwerk-Fehler: Backend nicht erreichbar unter ${url}. Stelle sicher, dass das Backend läuft.`);
    }
    throw error;
  }
}

// Profilbild hochladen
export async function uploadProfileImage(imageUri: string): Promise<{ message: string; profile: any }> {
  try {
    console.log('🔍 uploadProfileImage: Starte Bild-Upload für:', imageUri);
    
    // Validiere Bild-URI
    if (!imageUri || !imageUri.startsWith('file://') && !imageUri.startsWith('content://')) {
      throw new Error('Ungültige Bild-URI');
    }
    
    // Erstelle FormData
    const formData = new FormData();
    
    // Extrahiere Dateiname aus URI
    const fileName = imageUri.split('/').pop() || 'profile_image.jpg';
    const fileExtension = fileName.split('.').pop()?.toLowerCase();
    const mimeType = fileExtension === 'png' ? 'image/png' : 'image/jpeg';
    
    console.log('📁 Datei-Details:', { fileName, fileExtension, mimeType });
    
    // Füge die Bilddatei hinzu
    formData.append('image', {
      uri: imageUri,
      type: mimeType,
      name: fileName,
    } as any);
    
    console.log('📤 Sende FormData an Backend...');
    const response = await uploadRequest<{ message: string; profile: any }>('/auth/profile/image/', formData, true);
    console.log('✅ uploadProfileImage: Upload erfolgreich:', response);
    
    return response;
  } catch (error) {
    console.error('❌ uploadProfileImage: Fehler beim Hochladen des Profilbilds:', error);
    throw error;
  }
}

// Profilbild löschen
export async function deleteProfileImage(): Promise<{ message: string; profile: any }> {
  try {
    console.log('🔍 deleteProfileImage: Starte Bild-Löschung...');
    
    const response = await deleteRequest<{ message: string; profile: any }>('/auth/profile/image/delete/', true);
    console.log('✅ deleteProfileImage: Löschung erfolgreich:', response);
    
    return response;
  } catch (error) {
    console.error('❌ deleteProfileImage: Fehler beim Löschen des Profilbilds:', error);
    throw error;
  }
}

// Hilfsfunktion um Bild-URL zu erstellen
export function getProfileImageUrl(avatarPath?: string): string | null {
  if (!avatarPath) return null;
  
  // Wenn es bereits eine vollständige URL ist
  if (avatarPath.startsWith('http')) {
    return avatarPath;
  }
  
  // Erstelle URL für Backend-Bild
  // getApiUrl() gibt z.B. "http://192.168.2.120:8000/api" zurück
  // Wir brauchen "http://192.168.2.120:8000" + "/media/avatars/..."
  const baseUrl = getApiUrl().replace('/api', '');
  return `${baseUrl}${avatarPath}`;
}
