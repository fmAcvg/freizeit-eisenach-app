import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

// hook für app theme mit hell dunkel modus unterstützung
export function useAppTheme() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];

  return {
    // theme informationen
    colorScheme,
    isDark: colorScheme === 'dark',
    
    // basis farben
    colors: theme,
    
    // primärfarben
    primary: {
      main: theme.primary,
      light: theme.primaryLight,
      dark: theme.primaryDark,
    },
    
    // sekundärfarben
    secondary: {
      main: theme.secondary,
      light: theme.secondaryLight,
      dark: theme.secondaryDark,
    },
    
    // statusfarben erfolg warnung fehler
    status: {
      success: theme.success,
      successLight: theme.successLight,
      warning: theme.warning,
      warningLight: theme.warningLight,
      error: theme.error,
      errorLight: theme.errorLight,
    },
    
    // freundestatus farben
    friends: {
      online: theme.online,
      away: theme.away,
      offline: theme.offline,
    },
    
    // textfarben
    text: {
      primary: theme.text,
      secondary: theme.textSecondary,
      muted: theme.textMuted,
    },
    
    // hintergrundfarben
    background: {
      primary: theme.background,
      secondary: theme.backgroundSecondary,
      surface: theme.surface,
      surfaceSecondary: theme.surfaceSecondary,
    },
    
    // ui farben rahmen schatten etc
    ui: {
      muted: theme.muted,
      border: theme.border,
      borderLight: theme.borderLight,
      shadow: theme.shadow,
    },
  };
}


