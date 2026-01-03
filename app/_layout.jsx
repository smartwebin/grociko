import * as SplashScreen from "expo-splash-screen";
SplashScreen.preventAutoHideAsync();

import STRIPE_CONFIG from "@/config/stripe.config";
import { CartProvider } from "@/providers/CartProvider";
import { UserProvider } from "@/providers/UserProvider";
import { StripeProvider } from "@stripe/stripe-react-native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
export default function RootLayout() {
  const [loaded] = useFonts({
    "Outfit-Thin": require("../assets/fonts/Outfit-Thin.ttf"),
    "Outfit-ExtraLight": require("../assets/fonts/Outfit-ExtraLight.ttf"),
    "Outfit-Light": require("../assets/fonts/Outfit-Light.ttf"),
    "Outfit-Regular": require("../assets/fonts/Outfit-Regular.ttf"),
    "Outfit-Medium": require("../assets/fonts/Outfit-Medium.ttf"),
    "Outfit-SemiBold": require("../assets/fonts/Outfit-SemiBold.ttf"),
    "Outfit-Bold": require("../assets/fonts/Outfit-Bold.ttf"),
    "Outfit-ExtraBold": require("../assets/fonts/Outfit-ExtraBold.ttf"),
    "Outfit-Black": require("../assets/fonts/Outfit-Black.ttf"),
  });

 

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StripeProvider
        publishableKey={STRIPE_CONFIG.PUBLISHABLE_KEY}
        merchantIdentifier="merchant.com.grociko"
        urlScheme="grociko"
      >
        <UserProvider>
          <CartProvider>
            <Stack screenOptions={{ headerShown: false }} />
          </CartProvider>
        </UserProvider>
      </StripeProvider>
              <StatusBar translucent={false} style="dark" />

    </GestureHandlerRootView>
  );
}
