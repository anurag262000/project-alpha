import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { useDrizzleStudio } from 'expo-drizzle-studio-plugin';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';
import { useAuth } from '@/store/auth';
import { db, sqlite } from '@/db/client';
import { seedExercises } from '@/db/seed';
import { getProfile } from '@/db/profileRepo';
import { ensureActiveProgram } from '@/db/programRepo';
import migrations from '../drizzle/migrations';

// The native splash hides itself the moment the root component first renders —
// which is while migrations, the seed and the icon font are still in flight, so
// what you actually see is a blank screen. Hold it until we render for real.
SplashScreen.preventAutoHideAsync().catch(() => {});

function Nav() {
  const { name } = useTheme();
  return (
    <>
      <StatusBar style={name === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: 'transparent' },
        }}
      />
    </>
  );
}

export default function RootLayout() {
  const { success: migrated, error: migrationError } = useMigrations(db, migrations);
  // @expo/vector-icons loads its font on first render and draws an empty glyph
  // until it lands — silently, so icons just go missing (bug B3). Preload it
  // here; `fontError` still lets the app through rather than hanging on a gate.
  const [fontsLoaded, fontError] = useFonts(MaterialCommunityIcons.font);
  // A failed icon font is invisible: `createIconSet` renders an empty <Text />
  // rather than tofu, so every icon in the app silently disappears (bugs B3/B4).
  // Never swallow the reason.
  if (fontError) console.error('[icons] MaterialCommunityIcons font failed to load:', fontError);
  // Serves the on-device DB to Drizzle Studio via the Expo dev server
  // (shift+m in the expo start terminal). No-op in production builds.
  useDrizzleStudio(sqlite);
  const [seeded, setSeeded] = useState(false);

  // Restore any persisted session on launch (see mobile/src/store/auth.ts).
  const hydrate = useAuth((s) => s.hydrate);
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!migrated) return;
    (async () => {
      await seedExercises();
      // Back-fill a program for profiles that predate the split generator.
      const profile = await getProfile();
      if (profile) await ensureActiveProgram(profile);
      setSeeded(true);
    })();
  }, [migrated]);

  if (migrationError) {
    return (
      <View
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}
        onLayout={() => SplashScreen.hideAsync()}
      >
        <Text>Database migration failed: {migrationError.message}</Text>
      </View>
    );
  }
  // brief: migrations run in ms on launch
  const ready = migrated && seeded && (fontsLoaded || fontError);
  if (!ready) return null; // the splash is still up

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={() => SplashScreen.hideAsync()}>
      <SafeAreaProvider>
        <ThemeProvider>
          <Nav />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
