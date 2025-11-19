import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import theme from '@/utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const Success = () => {
  // Animation references
  const checkmarkScale = useRef(new Animated.Value(0)).current;
  const checkmarkOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const buttonsTranslateY = useRef(new Animated.Value(50)).current;

  // Floating elements animation
  const floatingElements = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    // Staggered entrance animations
    const animationSequence = Animated.sequence([
      // Checkmark entrance
      Animated.parallel([
        Animated.timing(checkmarkOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(checkmarkScale, {
          toValue: 1,
          tension: 100,
          friction: 6,
          useNativeDriver: true,
        }),
      ]),
      // Text fade in
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 400,
        delay: 200,
        useNativeDriver: true,
      }),
      // Buttons slide up
      Animated.timing(buttonsTranslateY, {
        toValue: 0,
        duration: 400,
        delay: 100,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]);

    // Start floating elements animation
    const floatingAnimations = floatingElements.map((element, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(element, {
            toValue: 1,
            duration: 3000 + (index * 500),
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(element, {
            toValue: 0,
            duration: 3000 + (index * 500),
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      )
    );

    // Start all animations
    animationSequence.start();
    floatingAnimations.forEach((animation, index) => {
      setTimeout(() => animation.start(), index * 200);
    });

    return () => {
      floatingAnimations.forEach(animation => animation.stop());
    };
  }, []);

  const handleTrackOrder = () => {
    router.push('/orders');
  };

  const handleBackToHome = () => {
    router.replace('/home');
  };

  return (
    <SafeAreaWrapper>
      <View style={styles.container}>
        {/* Floating Elements */}
        <Animated.View
          style={[
            styles.floatingElement,
            styles.element1,
            {
              transform: [{
                translateY: floatingElements[0].interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -20],
                }),
              }],
            },
          ]}
        >
          <View style={[styles.circle, { backgroundColor: theme.colors.primary.light }]} />
        </Animated.View>

        <Animated.View
          style={[
            styles.floatingElement,
            styles.element2,
            {
              transform: [{
                translateX: floatingElements[1].interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 15],
                }),
              }],
            },
          ]}
        >
          <View style={[styles.smallCircle, { backgroundColor: theme.colors.secondary.main }]} />
        </Animated.View>

        <Animated.View
          style={[
            styles.floatingElement,
            styles.element3,
            {
              transform: [{
                rotate: floatingElements[2].interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '15deg'],
                }),
              }],
            },
          ]}
        >
          <View style={[styles.line, { backgroundColor: theme.colors.secondary.main }]} />
        </Animated.View>

        <Animated.View
          style={[
            styles.floatingElement,
            styles.element4,
            {
              transform: [{
                scale: floatingElements[3].interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.2],
                }),
              }],
            },
          ]}
        >
          <View style={[styles.ringOutline, { borderColor: theme.colors.secondary.light }]} />
        </Animated.View>

        <Animated.View
          style={[
            styles.floatingElement,
            styles.element5,
            {
              transform: [{
                translateY: floatingElements[4].interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 10],
                }),
              }],
            },
          ]}
        >
          <View style={[styles.smallCircle, { backgroundColor: theme.colors.secondary.main }]} />
        </Animated.View>

        <Animated.View
          style={[
            styles.floatingElement,
            styles.element6,
            {
              transform: [{
                rotate: floatingElements[5].interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '-20deg'],
                }),
              }],
            },
          ]}
        >
          <View style={[styles.arc, { borderColor: theme.colors.primary.light }]} />
        </Animated.View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Success Icon */}
          <Animated.View
            style={[
              styles.checkmarkContainer,
              {
                opacity: checkmarkOpacity,
                transform: [{ scale: checkmarkScale }],
              },
            ]}
          >
            <View style={styles.checkmarkBackground}>
              <Ionicons
                name="checkmark"
                size={64}
                color={theme.colors.text.white}
              />
            </View>
          </Animated.View>

          {/* Success Message */}
          <Animated.View style={[styles.messageContainer, { opacity: textOpacity }]}>
            <Text style={styles.title}>Your Order has been{'\n'}accepted</Text>
            <Text style={styles.subtitle}>
              Your items has been placed and is on{'\n'}it's way to being processed
            </Text>
          </Animated.View>
        </View>

        {/* Action Buttons */}
        <Animated.View
          style={[
            styles.buttonsContainer,
            {
              transform: [{ translateY: buttonsTranslateY }],
            },
          ]}
        >
          <TouchableOpacity style={styles.trackButton} onPress={handleTrackOrder}>
            <Text style={styles.trackButtonText}>Track Order</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.homeButton} onPress={handleBackToHome}>
            <Text style={styles.homeButtonText}>Back to home</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
    position: 'relative',
  },

  // Floating Elements
  floatingElement: {
    position: 'absolute',
  },
  element1: {
    top: '15%',
    left: '20%',
  },
  element2: {
    top: '25%',
    right: '25%',
  },
  element3: {
    top: '20%',
    right: '15%',
  },
  element4: {
    top: '40%',
    left: '15%',
  },
  element5: {
    bottom: '35%',
    left: '25%',
  },
  element6: {
    bottom: '30%',
    right: '20%',
  },

  circle: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  smallCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  line: {
    width: 30,
    height: 4,
    borderRadius: 2,
  },
  ringOutline: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
  },
  arc: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
  },

  // Main Content
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },

  checkmarkContainer: {
    marginBottom: theme.spacing['4xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.secondary.main,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: theme.colors.secondary.main + '40',
  },

  messageContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: theme.typography.fontSize['2xl'],
    fontFamily: 'Outfit-Bold',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    lineHeight: theme.typography.fontSize['2xl'] * 1.3,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: 'Outfit-Regular',
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: theme.typography.fontSize.base * 1.5,
  },

  // Buttons
  buttonsContainer: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing['4xl'],
    gap: theme.spacing.lg,
  },
  trackButton: {
    backgroundColor: theme.colors.primary.main,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
  },
  trackButtonText: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: 'Outfit-SemiBold',
    color: theme.colors.text.white,
  },
  homeButton: {
    backgroundColor: 'transparent',
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
  },
  homeButtonText: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: 'Outfit-SemiBold',
    color: theme.colors.text.primary,
  },
});

export default Success;