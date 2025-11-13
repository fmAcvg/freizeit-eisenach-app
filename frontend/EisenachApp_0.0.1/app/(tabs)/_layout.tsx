// import der expo router tabs und material icons
import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  Dimensions,
  PanResponder,
} from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// import der eigenen komponenten und hooks
import { HapticTab } from '@/components/haptic-tab';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useTranslations } from '@/hooks/use-translations';

// bildschirmbreite für die tab bar berechnung
const { width } = Dimensions.get('window');

// tab icon komponente für die untere navigationsleiste
function TabBarIcon({ name, color }: { name: React.ComponentProps<typeof MaterialIcons>['name']; color: string }) {
  return <MaterialIcons size={24} name={name} color={color} style={{ marginBottom: -3 }} />;
}


// custom tab bar mit drag funktionalität für bessere ux
// hier wird eine eigene tab navigation erstellt die man durch ziehen verwenden kann
function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const theme = useAppTheme();
  const translations = useTranslations();
  const insets = useSafeAreaInsets();
  
  // animations und drag state für die gleitende tab bar
  const [slideAnim] = React.useState(new Animated.Value(0));
  const [isDragging, setIsDragging] = React.useState(false);

  // tab bar breitenberechnung für responsive design
  const tabBarWidth = width - 40; // minus outer padding (20px each side)
  const tabBarInnerWidth = tabBarWidth - 16; // minus inner padding (8px each side)
  const tabWidth = tabBarInnerWidth / state.routes.length;

  // pan responder für drag funktionalität zwischen tabs
  // ermöglicht es dem nutzer durch ziehen zwischen den tabs zu wechseln
  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setIsDragging(true);
        // haptisches feedback beim start des ziehens
        if (Platform.OS === 'ios') {
          // könnte hier haptisches feedback hinzufügen
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        if (isDragging) {
          const currentPosition = state.index * tabWidth;
          const maxPosition = tabBarInnerWidth - tabWidth;
          const newPosition = Math.max(0, Math.min(maxPosition, currentPosition + gestureState.dx));
          slideAnim.setValue(newPosition);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        setIsDragging(false);
        const currentPosition = state.index * tabWidth;
        const finalPosition = currentPosition + gestureState.dx;
        
        // ziel tab basierend auf zieh distanz und geschwindigkeit bestimmen
        const dragDistance = gestureState.dx;
        const velocity = gestureState.vx;
        
        // wenn zieh distanz signifikant oder geschwindigkeit hoch tabs wechseln
        const threshold = tabWidth * 0.3; // 30% der tab breite
        let targetIndex = state.index;
        
        if (Math.abs(dragDistance) > threshold || Math.abs(velocity) > 0.5) {
          if (dragDistance > 0) {
            // nach rechts ziehen nächster tab
            targetIndex = Math.min(state.routes.length - 1, state.index + 1);
          } else {
            // nach links ziehen vorheriger tab
            targetIndex = Math.max(0, state.index - 1);
          }
        }
        
        if (targetIndex !== state.index) {
          // zum neuen tab navigieren
          const route = state.routes[targetIndex];
          navigation.navigate(route.name, route.params);
        } else {
          // zurück zur ursprünglichen position mit sanfter animation
          Animated.timing(slideAnim, {
            toValue: currentPosition,
            duration: 200,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  // animation für tab wechsel wenn nicht gerade gezogen wird
  React.useEffect(() => {
    if (!isDragging) {
      const slidePosition = state.index * tabWidth;
      Animated.timing(slideAnim, {
        toValue: slidePosition,
        duration: 250,
        useNativeDriver: false,
      }).start();
    }
  }, [state.index, tabWidth, isDragging]);

  return (
    <View style={styles.outerContainer}>
      <View style={[styles.tabBar, { backgroundColor: theme.background.secondary }]}>
        {/* gleitender hintergrund der aktiven tab anzeigt */}
        <Animated.View
          style={[
            styles.slidingBackground,
            {
              backgroundColor: theme.primary.main + '20',
              transform: [
                { translateX: slideAnim },
                { scale: isDragging ? 1.05 : 1.0 }
              ],
              width: tabWidth,
            },
          ]}
          {...panResponder.panHandlers}
        />

        {/* tab buttons für alle verfügbaren screens */}
        <View style={styles.tabsContainer}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = getTabLabel(route.name, translations);
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          const iconName = getIconForRoute(route.name);

          return (
            <HapticTab
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tabButton}
            >
              <View style={styles.tabContent}>
                <TabBarIcon
                  name={iconName}
                  color={isFocused ? theme.primary.main : theme.text.muted}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: isFocused ? theme.primary.main : theme.text.muted,
                    },
                  ]}
                >
                  {label}
                </Text>
              </View>
            </HapticTab>
          );
        })}
        </View>
      </View>
    </View>
  );
}

// icon für jeden tab route bestimmen
function getIconForRoute(routeName: string): React.ComponentProps<typeof MaterialIcons>['name'] {
  switch (routeName) {
    case 'index':
      return 'home';
    case 'friends':
      return 'group';
    case 'upload':
      return 'upload';
    case 'profile':
      return 'person';
    default:
      return 'circle';
  }
}

// tab label für jeden route aus übersetzungen holen
function getTabLabel(routeName: string, translations: any): string {
  switch (routeName) {
    case 'index':
      return translations.tabs.feed;
    case 'friends':
      return translations.tabs.friends;
    case 'upload':
      return translations.tabs.upload;
    case 'profile':
      return translations.tabs.profile;
    default:
      return routeName;
  }
}

// haupt tab layout komponente
export default function TabLayout() {
  const theme = useAppTheme();
  const translations = useTranslations();

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        headerTitle: '',
        title: ''
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: translations.tabs.feed,
          headerShown: false,
          headerTitle: '',
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: translations.tabs.friends,
          headerShown: false,
          headerTitle: '',
        }}
      />
      <Tabs.Screen
        name="upload"
        options={{
          title: translations.tabs.upload,
          headerShown: false,
          headerTitle: '',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: translations.tabs.profile,
          headerShown: false,
          headerTitle: '',
        }}
      />
    </Tabs>
  );
}

// stylesheet für die tab bar komponenten
const styles = StyleSheet.create({
  // äußerer container für die tab bar position
  outerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 10,
  },
  // haupt tab bar container mit schatten und runden ecken
  tabBar: {
    flexDirection: 'row',
    height: 70,
    borderRadius: 35,
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
    borderWidth: 0,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  // gleitender hintergrund für aktiven tab
  slidingBackground: {
    position: 'absolute',
    top: 8,
    left: 8, // berücksichtigt tabbar padding
    height: 54,
    borderRadius: 27,
    zIndex: 1,
  },
  // container für alle tab buttons
  tabsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // einzelner tab button
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  // inhalt eines tab buttons icon und text
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  // text label für jeden tab
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 14,
  },
});