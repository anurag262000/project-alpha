import { useState } from 'react';
import { ScrollView, View, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen, Title, Sub, TextField, PrimaryButton, GhostButton } from '@/components/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { useAuth } from '@/store/auth';
import { ApiError } from '@/lib/api';

export default function Login() {
  const router = useRouter();
  const { theme } = useTheme();
  const signIn = useAuth((s) => s.signIn);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError(null);
    if (!email || !password) return setError('Enter your email and password.');
    setBusy(true);
    try {
      await signIn(email, password);
      router.replace('/home');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not log you in.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen ambient="default">
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              backgroundColor: theme.ink,
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 8,
            }}
          >
            <MaterialCommunityIcons name="lightning-bolt" size={26} color={theme.onInk} />
          </View>
          <Title style={{ fontSize: 26, marginTop: 18 }}>Welcome back</Title>
          <Sub>Log in to pick up your plan where you left off.</Sub>

          <View style={{ gap: 14, marginTop: 24 }}>
            <TextField
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
            />
            <TextField
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Your password"
              secureTextEntry
              autoCapitalize="none"
              error={error ?? undefined}
            />
          </View>
        </ScrollView>

        <View style={{ paddingTop: 12 }}>
          <PrimaryButton label={busy ? 'Logging in…' : 'Log in'} onPress={busy ? undefined : submit} />
          <GhostButton label="Back" onPress={() => router.replace('/onboarding/welcome')} />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
