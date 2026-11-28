import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { usePalette } from '../src/ui';
import { NotoSerif_700Bold } from '@expo-google-fonts/noto-serif/700Bold';
import { NotoSans_400Regular } from '@expo-google-fonts/noto-sans/400Regular';
import { NotoSans_600SemiBold } from '@expo-google-fonts/noto-sans/600SemiBold';
// The brand's type (Noto Serif headings, Noto Sans text), bundled with the app: nothing is fetched.
// If a font fails to load the app still opens, in the system font.
export default function Layout() {
  const [loaded, error] = useFonts({ NotoSerif_700Bold, NotoSans_400Regular, NotoSans_600SemiBold });
  // Every screen and the moment before the fonts load paint the brand background, light or dark: the navigator's own
  // default is light grey (#F2F2F2), which flashed for ~0.3 s on every dark-mode screen change (video watch, finding 15).
  const palette = usePalette();
  if (!loaded && !error) return <View style={{ flex:1, backgroundColor:palette.bg }} />;
  return <SafeAreaProvider><Stack screenOptions={{ headerShown:false, contentStyle:{ backgroundColor:palette.bg } }} /></SafeAreaProvider>;
}
