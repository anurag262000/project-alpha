import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen, Glass, Title, Sub, PrimaryButton, GhostButton } from '@/components/ui';
import { useTheme } from '@/theme/ThemeProvider';

export default function Welcome() {
  const router = useRouter();
  const { theme } = useTheme();

  const Feature = ({ icon, color, text }: { icon: any; color: string; text: string }) => (
    <Glass style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }}>
      <MaterialCommunityIcons name={icon} size={20} color={color} />
      <Text style={{ fontSize: 14, color: theme.textPrimary, flex: 1 }}>{text}</Text>
    </Glass>
  );

  return (
    <Screen ambient="default">
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <View
          style={{
            width: 60,
            height: 60,
            borderRadius: 18,
            backgroundColor: theme.ink,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MaterialCommunityIcons name="lightning-bolt" size={30} color={theme.onInk} />
        </View>
        <Title style={{ fontSize: 30, marginTop: 22, lineHeight: 36 }}>{'Plan it.\nTrack it.\nProgress.'}</Title>
        <Sub>One app for your steps, your training split, and the numbers that prove it's working.</Sub>
        <View style={{ gap: 10, marginTop: 26 }}>
          <Feature icon="walk" color={theme.green} text="Steps + activity, built in" />
          <Feature icon="calendar-check" color={theme.red} text="A split planned around your week" />
          <Feature icon="tune-variant" color={theme.textSecondary} text="Scroll-dial logging, no keyboard" />
        </View>
      </View>
      <View style={{ paddingBottom: 8 }}>
        <PrimaryButton label="Get started" onPress={() => router.push('/onboarding/basics')} />
        <GhostButton label="I already have an account" onPress={() => router.push('/login')} />
      </View>
    </Screen>
  );
}
