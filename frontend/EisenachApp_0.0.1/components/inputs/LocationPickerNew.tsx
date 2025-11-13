import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useAppTheme } from '@/hooks/use-app-theme';

interface PlacePrediction {
  place_id: string;
  description: string;
  main_text: string;
  secondary_text: string;
}

interface LocationPickerProps {
  value: string;
  onLocationChange: (location: string) => void;
  label?: string;
  placeholder?: string;
  style?: any;
}

const HERE_API_KEY = 'OKfPuYaQGJSld_n06EDyjR5SPwqNqWaMFeOSiEe7Dn8';

export default function LocationPickerNew({
  value,
  onLocationChange, 
  label, 
  placeholder = 'Ort eingeben...',
  style,
}: LocationPickerProps) {
  const theme = useAppTheme();
  const textColor = theme.text.primary;
  const mutedColor = theme.text.muted;
  const surfaceColor = theme.background.surface;
  const backgroundColor = theme.background.primary;

  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Synchronisiere inputValue mit value prop
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Debounced search function
  const searchPlaces = async (query: string) => {
    if (!query || query.length < 3) {
      setPredictions([]);
      setShowPredictions(false);
      return;
    }

    setIsLoading(true);
    
    try {
      // HERE Geocoding and Search API
      const url = `https://discover.search.hereapi.com/v1/discover`;
      const params = new URLSearchParams({
        q: query,
        at: '50.9795,10.3151', // Eisenach coordinates as center
        in: 'countryCode:DEU',
        lang: 'de',
        limit: '8',
        apiKey: HERE_API_KEY
      });
      
      const fullUrl = `${url}?${params.toString()}`;
      console.log('🔍 HERE API Request:', fullUrl);
      
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      console.log('📥 HERE API Response Status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 HERE API Response Data:', data);
        
        if (data.items && data.items.length > 0) {
          const formattedPredictions = data.items.map((item: any, index: number) => {
            const address = item.address || {};
            const title = item.title || address.street || address.city || 'Unbekannter Ort';
            
            // Bessere Formatierung der Adresse
            const addressParts = [];
            if (address.street) addressParts.push(address.street);
            if (address.houseNumber) addressParts.push(address.houseNumber);
            if (address.postalCode) addressParts.push(address.postalCode);
            if (address.city) addressParts.push(address.city);
            if (address.state && address.state !== address.city) addressParts.push(address.state);
            
            const subtitle = addressParts.join(', ');
            const fullDescription = `${title}${subtitle ? ', ' + subtitle : ''}`;
            
            return {
              place_id: item.id || `here_${Date.now()}_${index}`,
              description: fullDescription,
              main_text: title,
              secondary_text: subtitle,
            };
          });
          
          console.log('✅ Formatted Predictions:', formattedPredictions);
          setPredictions(formattedPredictions);
          setShowPredictions(true);
        } else {
          console.log('ℹ️ No suggestions from HERE API');
          setPredictions([]);
          setShowPredictions(false);
        }
      } else {
        const errorData = await response.text().catch(() => 'Unknown error');
        console.error('❌ HERE API Error:', response.status, errorData);
        setPredictions([]);
        setShowPredictions(false);
      }
      
    } catch (error) {
      console.error('❌ Error fetching place predictions:', error);
      setPredictions([]);
      setShowPredictions(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input change with debouncing
  const handleInputChange = (text: string) => {
    setInputValue(text);
    onLocationChange(text);
    
    // Clear existing timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    // Set new timeout for search
    debounceRef.current = setTimeout(() => {
      searchPlaces(text);
    }, 400); // Längere Verzögerung für bessere Performance
  };

  // Handle prediction selection - KORRIGIERT
  const handlePredictionSelect = (prediction: PlacePrediction) => {
    console.log('🎯 Selected prediction:', prediction.description);
    setInputValue(prediction.description);
    onLocationChange(prediction.description);
    setShowPredictions(false);
    setPredictions([]);
  };

  // Get current location
  const getCurrentLocation = async () => {
    try {
      setIsGettingLocation(true);
      
      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Berechtigung erforderlich',
          'Um deinen aktuellen Standort zu verwenden, benötigen wir Zugriff auf deine Position.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Reverse geocoding to get address
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        const addressParts = [];
        if (address.street) addressParts.push(address.street);
        if (address.streetNumber) addressParts.push(address.streetNumber);
        if (address.postalCode) addressParts.push(address.postalCode);
        if (address.city) addressParts.push(address.city);
        
        const fullAddress = addressParts.join(', ');
        setInputValue(fullAddress);
        onLocationChange(fullAddress);
      } else {
        Alert.alert(
          'Standort nicht gefunden',
          'Wir konnten keine Adresse für deinen aktuellen Standort finden.'
        );
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert(
        'Fehler',
        'Dein aktueller Standort konnte nicht ermittelt werden. Bitte gib die Adresse manuell ein.'
      );
    } finally {
      setIsGettingLocation(false);
    }
  };

  // Render prediction item
  const renderPrediction = ({ item }: { item: PlacePrediction }) => (
    <TouchableOpacity
      style={[styles.predictionItem, { backgroundColor: surfaceColor }]}
      onPress={() => handlePredictionSelect(item)}
      activeOpacity={0.7}
    >
      <MaterialIcons name="location-on" size={20} color={theme.primary.main} />
      <View style={styles.predictionText}>
        <Text style={[styles.predictionMain, { color: textColor }]} numberOfLines={1}>
          {item.main_text}
        </Text>
        {item.secondary_text && (
          <Text style={[styles.predictionSecondary, { color: mutedColor }]} numberOfLines={1}>
            {item.secondary_text}
          </Text>
        )}
      </View>
      <MaterialIcons name="arrow-forward-ios" size={16} color={mutedColor} />
    </TouchableOpacity>
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      )}
      
      <View style={[styles.inputContainer, { backgroundColor: surfaceColor }]}>
        <MaterialIcons name="location-on" size={20} color={mutedColor} />
        
        <TextInput
          style={[styles.input, { color: textColor }]}
          value={inputValue}
          onChangeText={handleInputChange}
          placeholder={placeholder}
          placeholderTextColor={mutedColor}
          onFocus={() => {
            if (predictions.length > 0) {
              setShowPredictions(true);
            }
          }}
          onBlur={() => {
            // Verzögerung, damit der Touch auf ein Prediction-Item funktioniert
            setTimeout(() => setShowPredictions(false), 150);
          }}
        />
        
        {/* Current location button */}
        <TouchableOpacity 
          style={styles.locationButton}
          onPress={getCurrentLocation}
          disabled={isGettingLocation}
          activeOpacity={0.7}
        >
          {isGettingLocation ? (
            <ActivityIndicator size="small" color={theme.primary.main} />
          ) : (
            <MaterialIcons name="my-location" size={20} color={theme.primary.main} />
          )}
        </TouchableOpacity>
        
        {/* Loading indicator */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={mutedColor} />
          </View>
        )}
      </View>

      {/* Predictions dropdown */}
      {showPredictions && predictions.length > 0 && (
        <View style={[styles.predictionsContainer, { backgroundColor: surfaceColor }]}>
          <FlatList
            data={predictions}
            renderItem={renderPrediction}
            keyExtractor={(item) => item.place_id}
            showsVerticalScrollIndicator={false}
            maxToRenderPerBatch={5}
            windowSize={5}
            removeClippedSubviews={true}
            style={styles.predictionsList}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  locationButton: {
    padding: 4,
    borderRadius: 6,
  },
  loadingContainer: {
    padding: 4,
  },
  predictionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 9999,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderTopWidth: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    maxHeight: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 15,
  },
  predictionsList: {
    maxHeight: 200,
  },
  predictionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    gap: 12,
  },
  predictionText: {
    flex: 1,
  },
  predictionMain: {
    fontSize: 16,
    fontWeight: '500',
  },
  predictionSecondary: {
    fontSize: 14,
    marginTop: 2,
  },
});

