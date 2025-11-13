// theme konfiguration für die eisenach app
// hier sind alle farben für hellen und dunklen modus definiert
// alternative styling ansätze nativewind tamagui unistyles

import { Platform } from 'react-native';

// zentrale farbpalette änderungen hier passen die gesamte app an
const ColorTheme = {
  // primärfarben hauptfarbe der app
  primary: '#0A84FF',
  primaryLight: '#4DA6FF',
  primaryDark: '#0066CC',
  
  // sekundärfarben akzentfarben
  secondary: '#FF6B35',
  secondaryLight: '#FF8A65',
  secondaryDark: '#E55100',
  
  // statusfarben erfolg warnung fehler
  success: '#4CAF50',
  successLight: '#81C784',
  successDark: '#388E3C',
  
  warning: '#FF9800',
  warningLight: '#FFB74D',
  warningDark: '#F57C00',
  
  error: '#F44336',
  errorLight: '#EF5350',
  errorDark: '#D32F2F',
  
  // neutrale farben grautöne
  neutral: '#9E9E9E',
  neutralLight: '#E0E0E0',
  neutralDark: '#424242',
  
  // freundestatus farben
  online: '#4CAF50',
  away: '#FF9800',
  offline: '#9E9E9E',
};

// theme farben basierend auf der zentralen farbpalette generieren
export const Colors = {
  light: {
    // textfarben für hellen modus
    text: '#11181C',
    textSecondary: ColorTheme.neutralDark,
    textMuted: ColorTheme.neutral,
    
    // hintergrundfarben für hellen modus
    background: '#F4F6FB',
    backgroundSecondary: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceSecondary: '#F8F9FA',
    
    // primary colors
    primary: ColorTheme.primary,
    primaryLight: ColorTheme.primaryLight,
    primaryDark: ColorTheme.primaryDark,
    
    // secondary colors
    secondary: ColorTheme.secondary,
    secondaryLight: ColorTheme.secondaryLight,
    secondaryDark: ColorTheme.secondaryDark,
    
    // status colors
    success: ColorTheme.success,
    successLight: ColorTheme.successLight,
    warning: ColorTheme.warning,
    warningLight: ColorTheme.warningLight,
    error: ColorTheme.error,
    errorLight: ColorTheme.errorLight,
    
    // status colors for friends
    online: ColorTheme.online,
    away: ColorTheme.away,
    offline: ColorTheme.offline,
    
    // ui colors
    muted: ColorTheme.neutral,
    glass: 'rgba(255,255,255,0.72)',
    tint: ColorTheme.primary,
    icon: ColorTheme.neutral,
    tabIconDefault: ColorTheme.neutral,
    tabIconSelected: ColorTheme.primary,
    
    // border colors
    border: ColorTheme.neutralLight,
    borderLight: '#E3E8EF',
    
    // shadow colors
    shadow: 'rgba(0,0,0,0.1)',
  },
  dark: {
    // textfarben für dunklen modus
    text: '#ECEDEE',
    textSecondary: 'rgba(255,255,255,0.8)',
    textMuted: 'rgba(255,255,255,0.65)',
    
    // hintergrundfarben für dunklen modus
    background: '#050608',
    backgroundSecondary: '#0A0B0D',
    surface: 'rgba(20,22,28,0.85)',
    surfaceSecondary: 'rgba(30,32,38,0.85)',
    
    // primary colors
    primary: ColorTheme.primary,
    primaryLight: ColorTheme.primaryLight,
    primaryDark: ColorTheme.primaryDark,
    
    // secondary colors
    secondary: ColorTheme.secondary,
    secondaryLight: ColorTheme.secondaryLight,
    secondaryDark: ColorTheme.secondaryDark,
    
    // status colors
    success: ColorTheme.success,
    successLight: ColorTheme.successLight,
    warning: ColorTheme.warning,
    warningLight: ColorTheme.warningLight,
    error: ColorTheme.error,
    errorLight: ColorTheme.errorLight,
    
    // status colors for friends
    online: ColorTheme.online,
    away: ColorTheme.away,
    offline: ColorTheme.offline,
    
    // ui colors
    muted: 'rgba(255,255,255,0.65)',
    glass: 'rgba(20,22,28,0.85)',
    tint: ColorTheme.primary,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: ColorTheme.primary,
    
    // border colors
    border: 'rgba(255,255,255,0.1)',
    borderLight: 'rgba(255,255,255,0.2)',
    
    // shadow colors
    shadow: 'rgba(0,0,0,0.3)',
  },
};

// farbpalette exportieren für einfache anpassungen
export { ColorTheme };

// plattform spezifische schriftarten
export const Fonts = Platform.select({
  ios: {
    // ios system design default
    sans: 'system-ui',
    // ios system design serif
    serif: 'ui-serif',
    // ios system design rounded
    rounded: 'ui-rounded',
    // ios system design monospaced
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
