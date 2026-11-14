import { Redirect } from 'expo-router';
// An address the app does not have (an old link, or a mistyped one in the web preview) opens the app's
// first screen instead of the router's developer page.
export default function NotFound() { return <Redirect href="/" />; }
