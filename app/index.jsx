import theme from "@/utils/theme";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Platform,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");

export default function SplashScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Main entrance animation - fade and scale
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Subtle bounce animation - continuous loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Navigate to home after 3 seconds
    const timer = setTimeout(() => {
      router.replace("/home");
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Interpolations for smooth animations
  const bounceTranslate = bounceAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, -10, 0],
  });

  const pulseScale = bounceAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.05, 1],
  });

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={theme.colors.background.gradient.splash}
        translucent={false}
      />

      {/* Splash background */}
      <Image
        source={require("../assets/company/splash.png")}
        style={styles.splashImage}
        resizeMode="cover"
      />

      {/* Center logo with animations */}
      <Animated.View
        style={[
          styles.centerLogoContainer,
          {
            opacity: fadeAnim,
            transform: [
              { scale: Animated.multiply(scaleAnim, pulseScale) },
              { translateY: bounceTranslate },
            ],
          },
        ]}
      >
        <Image
          source={require("../assets/company/center.png")}
          style={styles.centerLogo}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Loading bar */}
      <View style={styles.loadingContainer}>
        <View style={styles.loadingTrack}>
          <Animated.View style={[styles.loadingBar, { opacity: fadeAnim }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.gradient.splash,
    alignItems: "center",
    justifyContent: "center",
  },
  splashImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  centerLogoContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: width * 0.75,
    height: width * 0.75,
  },
  centerLogo: {
    width: "100%",
    height: "100%",
  },
  loadingContainer: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? theme.spacing["6xl"] : theme.spacing["5xl"],
    left: 0,
    right: 0,
    alignItems: "center",
    marginBottom:
      Platform.OS === "ios" ? theme.spacing["6xl"] : theme.spacing["5xl"],
  },
  loadingTrack: {
    width: 100,
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: theme.borderRadius.sm,
    overflow: "hidden",
  },
  loadingBar: {
    width: "70%",
    height: "100%",
    backgroundColor: theme.colors.text.white,
    borderRadius: theme.borderRadius.sm,
    opacity: theme.opacity[90],
  },
});
