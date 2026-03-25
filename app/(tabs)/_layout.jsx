import CustomTabBar from "@/components/CustomTabBar";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "transparent", // remove white background
          position: "absolute", // overlays content
          borderTopWidth: 0, // remove top border
          elevation: 0, // Android shadow fix
          height: 60 + insets.bottom, // keep height consistent with safe area
        },
      }}
    >
      <Tabs.Screen name="home" options={{ title: "Shop" }} />
      <Tabs.Screen name="categories" options={{ title: "Explore" }} />
      <Tabs.Screen name="search" options={{ title: "Search" }} />
      <Tabs.Screen name="cart" options={{ title: "Cart" }} />
      <Tabs.Screen name="account" options={{ title: "Account" }} />
    </Tabs>
  );
}
