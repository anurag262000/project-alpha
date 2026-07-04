import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { useDrizzleStudio } from 'expo-drizzle-studio-plugin';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';
import { useAuth } from '@/store/auth';
import { db, sqlite } from '@/db/client';
import { seedExercisesIfEmpty } from '@/db/seed';
import migrations from '../drizzle/migrations';

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
    if (migrated) seedExercisesIfEmpty().then(() => setSeeded(true));
  }, [migrated]);

  if (migrationError) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text>Database migration failed: {migrationError.message}</Text>
      </View>
    );
  }
  if (!migrated || !seeded) return null; // brief: migrations run in ms on launch

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <Nav />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
