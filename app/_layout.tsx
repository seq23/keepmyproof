import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NotoSerif_700Bold } from '@expo-google-fonts/noto-serif/700Bold';
import { NotoSans_400Regular } from '@expo-google-fonts/noto-sans/400Regular';
import { NotoSans_600SemiBold } from '@expo-google-fonts/noto-sans/600SemiBold';
// The brand's type (Noto Serif headings, Noto Sans text), bundled with the app: nothing is fetched.
// If a font fails to load the app still opens, in the system font.
export default function Layout() {
  const [loaded, error] = useFonts({ NotoSerif_700Bold, NotoSans_400Regular, NotoSans_600SemiBold });
  if (!loaded && !error) return null;
  return <SafeAreaProvider><Stack screenOptions={{ headerShown:false }} /></SafeAreaProvider>;
}
