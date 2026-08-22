import { useEffect, useRef, useState } from 'react';
import { ScrollView, View, Text, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen, Title, Sub, TextField, PrimaryButton, GhostButton } from '@/components/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { useAuth } from '@/store/auth';
import { useOnboarding } from '@/store/onboarding';
import { ApiError } from '@/lib/api';
import { getProfile } from '@/db/profileRepo';

const RESEND_COOLDOWN = 60; // seconds — mirrors the backend cooldown

export default function Verify() {
  const router = useRouter();
  const { theme } = useTheme();
  const { email, mode } = useLocalSearchParams<{ email: string; mode?: 'signup' | 'login' }>();

  const verifyEmail = useAuth((s) => s.verifyEmail);
  const resendVerification = useAuth((s) => s.resendVerification);
  const draft = useOnboarding((s) => s.draft);
  const resetDraft = useOnboarding((s) => s.reset);

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // A code was just sent by signup/login, so start the resend timer ticking.
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timer.current = setInterval(() => setCooldown((c) => (c <= 1 ? 0 : c - 1)), 1000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  const submit = async () => {
    setError(null);
    if (code.trim().length !== 6) return setError('Enter the 6-digit code from your email.');
    setBusy(true);
    try {
      await verifyEmail(email, code.trim());
      // Verified + signed in. The signup path still owes the user their plan,
      // so it hands off to the plan screen, which is what calls
      // completeOnboarding(). On login, just route by whether this device
      // already has a profile.
      if (mode === 'signup') {
        router.replace('/onboarding/plan');
      } else {
        const profile = await getProfile();
        router.replace(profile ? '/home' : '/onboarding/basics');
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not verify the code.');
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    if (cooldown > 0) return;
    setError(null);
    try {
      await resendVerification(email);
      setCooldown(RESEND_COOLDOWN);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not resend the code.');
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
            <MaterialCommunityIcons name="email-check" size={26} color={theme.onInk} />
          </View>
          <Title style={{ fontSize: 26, marginTop: 18 }}>Check your email</Title>
          <Sub>
            We sent a 6-digit code to {email}. Enter it below to confirm your address and finish setting up.
          </Sub>

          <View style={{ marginTop: 24 }}>
            <TextField
              label="Verification code"
              value={code}
              onChangeText={(t) => setCode(t.replace(/[^0-9]/g, '').slice(0, 6))}
              placeholder="123456"
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
              error={error ?? undefined}
            />
          </View>
        </ScrollView>

        <View style={{ paddingTop: 12 }}>
          <PrimaryButton label={busy ? 'Verifying…' : 'Verify'} onPress={busy ? undefined : submit} />
          <GhostButton
            label={cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
            onPress={cooldown > 0 ? undefined : resend}
          />
          <Text
            onPress={() => router.replace('/onboarding/welcome')}
            style={{ fontSize: 12, color: theme.textMuted, textAlign: 'center', marginTop: 8 }}
          >
            Use a different email
          </Text>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
