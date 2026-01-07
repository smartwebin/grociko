import SafeAreaWrapper2 from "@/components/SafeAreaWrapper2";
import { getLegalPolicy } from "@/services/apiService";
import theme from "@/utils/theme";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import RenderHtml from "react-native-render-html";

/**
 * Modern Legal/Policy Page Component
 * Features:
 * - Animated hero section with gradient
 * - Smooth scroll animations
 * - Modern card design with glassmorphism
 * - Enhanced typography and spacing
 * - Interactive elements with micro-animations
 */
const LegalPolicy = () => {
  const { type = "terms" } = useLocalSearchParams();
  const { width } = useWindowDimensions();

  const [loading, setLoading] = useState(true);
  const [policyData, setPolicyData] = useState(null);
  const [error, setError] = useState(null);
  const [scrollY] = useState(new Animated.Value(0));

  // Policy type configurations with modern color schemes
  const policyConfig = {
    terms: {
      title: "Terms & Conditions",
      subtitle: "Your agreement with Grociko",
      icon: "document-text",
      apiEndpoint: "get-terms-conditions.php",
      gradient: [theme.colors.primary.main, theme.colors.primary.dark],
      accentColor: theme.colors.primary.main,
    },
    cancellation: {
      title: "Cancellation & Refund",
      subtitle: "Our commitment to flexibility",
      icon: "refresh-circle",
      apiEndpoint: "get-cancellation-refund-policy.php",
      // gradient: [theme.colors.secondary.main, theme.colors.secondary.dark],
      gradient: [theme.colors.primary.main, theme.colors.primary.dark],

      accentColor: theme.colors.secondary.main,
    },
    privacy: {
      title: "Privacy Policy",
      subtitle: "How we protect your data",
      icon: "shield-checkmark",
      apiEndpoint: "get-privacy-policy.php",
      // gradient: ["#2196F3", "#1976D2"],
      gradient: [theme.colors.primary.main, theme.colors.primary.dark],

      accentColor: "#2196F3",
    },
  };

  const currentPolicy = policyConfig[type] || policyConfig.terms;

  useEffect(() => {
    loadPolicyData();
  }, [type]);

  const loadPolicyData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getLegalPolicy(currentPolicy.apiEndpoint);

      if (response.success && response.data) {
        setPolicyData(response.data);
      } else {
        setError(response.error || "Failed to load policy information");
      }
    } catch (err) {
      console.error("Error loading policy:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Animated header opacity based on scroll
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const heroScale = scrollY.interpolate({
    inputRange: [-100, 0],
    outputRange: [1.2, 1],
    extrapolate: "clamp",
  });
  const formatHtmlContent = (html) => {
    if (!html) return "";

    let formattedHtml = html.trim();

    // Remove ALL <br> tags
    formattedHtml = formattedHtml.replace(/<br\s*\/?>/gi, " ");

    // Remove empty paragraphs
    formattedHtml = formattedHtml.replace(/<p>\s*<\/p>/gi, "");

    // Remove excessive whitespace between tags
    formattedHtml = formattedHtml.replace(/>\s+</g, "><");

    // Normalize spaces inside paragraphs
    formattedHtml = formattedHtml.replace(/\s{2,}/g, " ");

    return formattedHtml;
  };
  // Enhanced HTML styling with MINIMAL spacing
  const htmlStyles = {
    body: {
      fontFamily: "Outfit-Regular",
      fontSize: theme.typography.fontSize.base,
      color: theme.colors.text.primary,
      lineHeight: 22,
      margin: 0,
      padding: 0,
    },

    /* HEADINGS — no top margins (hero already shows title) */
    h1: {
      fontFamily: "Outfit-Bold",
      fontSize: theme.typography.fontSize["3xl"],
      color: theme.colors.text.primary,
      marginTop: 0,
      marginBottom: 6,
      lineHeight: 32,
    },
    h2: {
      fontFamily: "Outfit-SemiBold",
      fontSize: theme.typography.fontSize.xl,
      color: theme.colors.text.primary,
      marginTop: 8,
      marginBottom: 4,
      lineHeight: 26,
    },
    h3: {
      fontFamily: "Outfit-Medium",
      fontSize: theme.typography.fontSize.lg,
      color: theme.colors.text.primary,
      marginTop: 6,
      marginBottom: 2,
      lineHeight: 24,
    },

    /* PARAGRAPHS — ZERO margins (RN stacks margins) */
    p: {
      fontFamily: "Outfit-Regular",
      fontSize: theme.typography.fontSize.base,
      color: theme.colors.text.secondary,
      marginTop: 0,
      marginBottom: 0,
      paddingTop: 0,
      paddingBottom: 0,
      lineHeight: 22,
    },

    /* STRONG / EMPHASIS */
    strong: {
      fontFamily: "Outfit-SemiBold",
      color: theme.colors.text.primary,
    },
    em: {
      fontStyle: "italic",
    },

    /* LISTS — NO vertical margins */
    ul: {
      marginTop: 0,
      marginBottom: 0,
      paddingLeft: theme.spacing.lg,
    },
    ol: {
      marginTop: 0,
      marginBottom: 0,
      paddingLeft: theme.spacing.lg,
    },
    li: {
      fontFamily: "Outfit-Regular",
      fontSize: theme.typography.fontSize.base,
      color: theme.colors.text.secondary,
      marginTop: 0,
      marginBottom: 0,
      paddingTop: 0,
      paddingBottom: 0,
      lineHeight: 22,
    },

    /* LINKS */
    a: {
      color: currentPolicy.accentColor,
      textDecorationLine: "underline",
      fontFamily: "Outfit-Medium",
    },

    /* BLOCKS */
    div: {
      margin: 0,
      padding: 0,
    },
    span: {
      fontFamily: "Outfit-Regular",
    },

    /* HARD KILL LINE BREAKS */
    br: {
      display: "none",
    },
  };

  if (loading) {
    return (
      <SafeAreaWrapper2>
        <View style={styles.container}>
          {/* Modern Loading State */}
          <View style={styles.loadingContainer}>
            <View
              style={[
                styles.loadingCard,
                { borderColor: currentPolicy.accentColor + "30" },
              ]}
            >
              <View
                style={[
                  styles.loadingIconContainer,
                  { backgroundColor: currentPolicy.accentColor + "15" },
                ]}
              >
                <Ionicons
                  name={currentPolicy.icon}
                  size={48}
                  color={currentPolicy.accentColor}
                />
              </View>
              <ActivityIndicator
                size="large"
                color={currentPolicy.accentColor}
                style={{ marginTop: theme.spacing.xl }}
              />
              <Text style={styles.loadingTitle}>Loading Policy</Text>
              <Text style={styles.loadingSubtitle}>
                Please wait a moment...
              </Text>
            </View>
          </View>
        </View>
      </SafeAreaWrapper2>
    );
  }

  if (error) {
    return (
      <SafeAreaWrapper2>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.headerButton}
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color={theme.colors.text.primary}
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{currentPolicy.title}</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Modern Error State */}
          <View style={styles.errorContainer}>
            <View style={styles.errorCard}>
              <View style={styles.errorIconContainer}>
                <Ionicons
                  name="cloud-offline-outline"
                  size={64}
                  color={theme.colors.status.error}
                />
              </View>
              <Text style={styles.errorTitle}>Connection Issue</Text>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={[
                  styles.retryButton,
                  { backgroundColor: currentPolicy.accentColor },
                ]}
                onPress={loadPolicyData}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="refresh"
                  size={20}
                  color={theme.colors.text.white}
                />
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaWrapper2>
    );
  }

  return (
    <SafeAreaWrapper2>
      <View style={styles.container}>
        {/* Floating Header with Scroll Effect */}
        <Animated.View
          style={[
            styles.floatingHeader,
            {
              backgroundColor: theme.colors.background.primary,
              opacity: headerOpacity,
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.headerButton}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={theme.colors.text.primary}
            />
          </TouchableOpacity>
          <Text style={styles.floatingHeaderTitle} numberOfLines={1}>
            {currentPolicy.title}
          </Text>
          <View style={{ width: 40 }} />
        </Animated.View>

        {/* Initial Header */}
        <View style={styles.initialHeader}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.headerButtonAbsolute}
          >
            <View style={styles.headerButtonBlur}>
              <Ionicons
                name="arrow-back"
                size={24}
                color={theme.colors.text.primary}
              />
            </View>
          </TouchableOpacity>
        </View>

        <Animated.ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
        >
          {/* Modern Hero Section with Gradient */}
          <Animated.View
            style={[
              styles.heroSection,
              {
                transform: [{ scale: heroScale }],
              },
            ]}
          >
            {/* Gradient Background */}
            <View
              style={[
                styles.gradientBg,
                { backgroundColor: currentPolicy.gradient[0] },
              ]}
            >
              <View
                style={[
                  styles.gradientOverlay,
                  { backgroundColor: currentPolicy.gradient[1] },
                ]}
              />
            </View>

            {/* Hero Content */}
            <View style={styles.heroContent}>
              <View style={styles.heroIconWrapper}>
                <View style={styles.heroIconBg}>
                  <Ionicons
                    name={currentPolicy.icon}
                    size={40}
                    color={theme.colors.text.white}
                  />
                </View>
              </View>

              <Text style={styles.heroTitle}>{currentPolicy.title}</Text>
              <Text style={styles.heroSubtitle}>{currentPolicy.subtitle}</Text>

              {/* Meta Info Pills */}
              <View style={styles.metaPills}>
                <View style={styles.metaPill}>
                  <Ionicons
                    name="time-outline"
                    size={14}
                    color={theme.colors.text.white}
                  />
                  <Text style={styles.metaPillText}>
                    {policyData.created_date}
                  </Text>
                </View>
                <View style={styles.metaPill}>
                  <Ionicons
                    name="document-text-outline"
                    size={14}
                    color={theme.colors.text.white}
                  />
                  <Text style={styles.metaPillText}>{currentPolicy.title}</Text>
                </View>
              </View>
            </View>

            {/* Decorative Elements */}
            <View style={styles.heroDecor1} />
            <View style={styles.heroDecor2} />
          </Animated.View>

          {/* Content Section with Modern Cards */}
          <View style={styles.contentSection}>
            {/* Main Content Card */}
            <View style={styles.contentCard}>
              <View style={styles.contentHeader}>
                <View
                  style={[
                    styles.contentAccent,
                    { backgroundColor: currentPolicy.accentColor },
                  ]}
                />
                <Text style={styles.contentTitle}>Policy Details</Text>
              </View>

              <RenderHtml
                contentWidth={width - 40}
                source={{ html: formatHtmlContent(policyData.description) }} // ✅ Now sanitized
                tagsStyles={htmlStyles}
                baseStyle={{ margin: 0, padding: 0 }}
                enableExperimentalMarginCollapsing={true}
              />
            </View>

            {/* Key Points Card */}
            <View style={styles.keyPointsCard}>
              <View style={styles.keyPointsHeader}>
                <View
                  style={[
                    styles.keyPointsIcon,
                    { backgroundColor: currentPolicy.accentColor + "15" },
                  ]}
                >
                  <Ionicons
                    name="bulb"
                    size={20}
                    color={currentPolicy.accentColor}
                  />
                </View>
                <Text style={styles.keyPointsTitle}>Quick Summary</Text>
              </View>
              <Text style={styles.keyPointsText}>
                This document outlines the terms and conditions for using
                Grociko services. Please read carefully to understand your
                rights and responsibilities.
              </Text>
            </View>

            {/* Help Section */}
            <TouchableOpacity
              onPress={() => router.push("/help")}
              style={styles.helpCard}
              activeOpacity={0.7}
            >
              <View style={styles.helpContent}>
                <View
                  style={[
                    styles.helpIcon,
                    { backgroundColor: currentPolicy.accentColor + "15" },
                  ]}
                >
                  <Ionicons
                    name="chatbubble-ellipses"
                    size={24}
                    color={currentPolicy.accentColor}
                  />
                </View>
                <View style={styles.helpText}>
                  <Text style={styles.helpTitle}>Need Help?</Text>
                  <Text style={styles.helpSubtitle}>
                    Our support team is here to answer your questions
                  </Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={theme.colors.text.tertiary}
              />
            </TouchableOpacity>

            {/* Trust Badges */}
            <View style={styles.trustBadges}>
              <View style={styles.trustBadge}>
                <Ionicons
                  name="shield-checkmark"
                  size={20}
                  color={theme.colors.status.success}
                />
                <Text style={styles.trustBadgeText}>Secure</Text>
              </View>
              <View style={styles.trustBadge}>
                <Ionicons
                  name="lock-closed"
                  size={20}
                  color={theme.colors.status.success}
                />
                <Text style={styles.trustBadgeText}>Private</Text>
              </View>
              <View style={styles.trustBadge}>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={theme.colors.status.success}
                />
                <Text style={styles.trustBadgeText}>Verified</Text>
              </View>
            </View>
          </View>

          {/* Bottom Spacing */}
          <View style={{ height: theme.spacing["6xl"] }} />
        </Animated.ScrollView>
      </View>
    </SafeAreaWrapper2>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
  },

  // Floating Header
  floatingHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface.border,
  },
  floatingHeaderTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.text.primary,
    flex: 1,
    textAlign: "center",
  },

  // Initial Header
  initialHeader: {
    position: "absolute",
    top: theme.spacing.lg,
    left: theme.spacing.lg,
    zIndex: 100,
  },
  headerButtonAbsolute: {
    zIndex: 100,
  },
  headerButtonBlur: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.background.primary + "F0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.background.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },

  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing.xl,
  },
  loadingCard: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius["3xl"],
    padding: theme.spacing["4xl"],
    alignItems: "center",
    borderWidth: 2,
    width: "100%",
    maxWidth: 320,
  },
  loadingIconContainer: {
    width: 96,
    height: 96,
    borderRadius: theme.borderRadius["2xl"],
    justifyContent: "center",
    alignItems: "center",
    marginBottom: theme.spacing.lg,
  },
  loadingTitle: {
    marginTop: theme.spacing.lg,
    fontSize: theme.typography.fontSize.xl,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.text.primary,
  },
  loadingSubtitle: {
    marginTop: theme.spacing.xs,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: "Outfit-Regular",
    color: theme.colors.text.secondary,
  },

  // Error State
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface.border,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.text.primary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing.xl,
  },
  errorCard: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius["3xl"],
    padding: theme.spacing["4xl"],
    alignItems: "center",
    width: "100%",
    maxWidth: 320,
  },
  errorIconContainer: {
    marginBottom: theme.spacing.xl,
  },
  errorTitle: {
    fontSize: theme.typography.fontSize["2xl"],
    fontFamily: "Outfit-Bold",
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    textAlign: "center",
  },
  errorText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: "Outfit-Regular",
    color: theme.colors.text.secondary,
    textAlign: "center",
    marginBottom: theme.spacing.xl,
    lineHeight: 24,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing["2xl"],
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
    gap: theme.spacing.sm,
  },
  retryButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.text.white,
  },

  // Scroll View
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing["6xl"],
  },

  // Hero Section
  heroSection: {
    height: 340,
    position: "relative",
    overflow: "hidden",
  },
  gradientBg: {
    ...StyleSheet.absoluteFillObject,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.7,
  },
  heroContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing["5xl"],
    zIndex: 10,
  },
  heroIconWrapper: {
    marginBottom: theme.spacing.xl,
  },
  heroIconBg: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius["2xl"],
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  heroTitle: {
    fontSize: theme.typography.fontSize["4xl"],
    fontFamily: "Outfit-Bold",
    color: theme.colors.text.white,
    textAlign: "center",
    marginBottom: theme.spacing.sm,
  },
  heroSubtitle: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: "Outfit-Regular",
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    marginBottom: theme.spacing.xl,
  },
  metaPills: {
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.xl,
    gap: theme.spacing.xs,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  metaPillText: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: "Outfit-Medium",
    color: theme.colors.text.white,
  },
  heroDecor1: {
    position: "absolute",
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  heroDecor2: {
    position: "absolute",
    bottom: -80,
    left: -80,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },

  // Content Section
  contentSection: {
    paddingHorizontal: theme.spacing.lg,
    marginTop: -16,
    zIndex: 20,
  },
  contentCard: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius["2xl"],
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  contentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  contentAccent: {
    width: 4,
    height: 24,
    borderRadius: 2,
  },
  contentTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.text.primary,
  },

  // Key Points Card
  keyPointsCard: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  keyPointsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  keyPointsIcon: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  keyPointsTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.text.primary,
  },
  keyPointsText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: "Outfit-Regular",
    color: theme.colors.text.secondary,
    lineHeight: 22,
  },

  // Help Card
  helpCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  helpContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: theme.spacing.md,
  },
  helpIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  helpText: {
    flex: 1,
  },
  helpTitle: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  helpSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: "Outfit-Regular",
    color: theme.colors.text.secondary,
    lineHeight: 18,
  },

  // Trust Badges
  trustBadges: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  trustBadge: {
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  trustBadgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: "Outfit-Medium",
    color: theme.colors.text.secondary,
  },
});

export default LegalPolicy;
