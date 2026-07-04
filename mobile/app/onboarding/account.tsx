import { useState } from 'react';
import { ScrollView, View, Text, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen, Title, Sub, TextField, PrimaryButton, GhostButton } from '@/components/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { useAuth } from '@/store/auth';
import { ApiError } from '@/lib/api';
import { useOnboarding } from '@/store/onboarding';
import { completeOnboarding } from '@/db/profileRepo';

export default function Account() {
  const router = useRouter();
  const { theme } = useTheme();
  const signUp = useAuth((s) => s.signUp);
  const status = useAuth((s) => s.status);
  const draft = useOnboarding((s) => s.draft);
  const resetDraft = useOnboarding((s) => s.reset);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError(null);
    if (status !== 'signedIn') {
      if (password.length < 8) return setError('Password must be at least 8 characters.');
      if (password !== confirm) return setError('Passwords do not match.');
    }
    setBusy(true);
    try {
      if (status !== 'signedIn') await signUp(email, password);
      await completeOnboarding(draft); // profile + first measurement + screening
      resetDraft();
      router.replace('/home');
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : 'Could not create your account.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen ambient="green">
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
            <MaterialCommunityIcons name="shield-check" size={26} color={theme.onInk} />
          </View>
          <Title style={{ fontSize: 26, marginTop: 18 }}>Save your plan</Title>
          <Sub>
            {status === 'signedIn'
              ? 'You’re signed in — save your plan to this device and start training.'
              : 'Create an account so your program, logs, and progress stay yours across devices.'}
          </Sub>

          <View style={{ gap: 14, marginTop: 24, display: status === 'signedIn' ? 'none' : 'flex' }}>
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
              placeholder="At least 8 characters"
              secureTextEntry
              autoCapitalize="none"
            />
            <TextField
              label="Confirm password"
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Re-enter your password"
              secureTextEntry
              autoCapitalize="none"
              error={error ?? undefined}
            />
          </View>
        </ScrollView>

        <View style={{ paddingTop: 12 }}>
          <PrimaryButton
            label={busy ? 'Saving…' : status === 'signedIn' ? 'Save my plan' : 'Create account'}
            onPress={busy ? undefined : submit}
          />
          {status !== 'signedIn' && (
            <GhostButton label="I already have an account" onPress={() => router.replace('/login')} />
          )}
          {status === 'signedIn' && error != null && (
            <Text style={{ fontSize: 12, color: theme.redText, textAlign: 'center', marginTop: 8 }}>{error}</Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
