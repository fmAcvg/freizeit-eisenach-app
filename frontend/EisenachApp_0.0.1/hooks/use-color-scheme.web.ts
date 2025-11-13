import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

// um statisches rendering zu unterstützen muss dieser wert auf der client seite für web neu berechnet werden
export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const colorScheme = useRNColorScheme();

  if (hasHydrated) {
    return colorScheme;
  }

  return 'light';
}
