import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/store/auth';
import { getProfile } from '@/db/profileRepo';

/**
 * Entry gate: signed out → onboarding welcome (which offers login);
 * signed in without a local profile → onboarding; otherwise → home.
 */
export default function Index() {
  const status = useAuth((s) => s.status);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);

  useEffect(() => {
    if (status === 'signedIn') {
      getProfile().then((p) => setHasProfile(p !== null));
    }
  }, [status]);

  if (status === 'loading' || (status === 'signedIn' && hasProfile === null)) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (status === 'signedOut') return <Redirect href="/onboarding/welcome" />;
  return hasProfile ? <Redirect href="/home" /> : <Redirect href="/onboarding/welcome" />;
}
