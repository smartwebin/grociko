import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { getAboutUs } from '@/services/apiService';
import theme from '@/utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import RenderHtml from 'react-native-render-html';

const About = () => {
  const [loading, setLoading] = useState(true);
  const [aboutData, setAboutData] = useState(null);
  const { width } = useWindowDimensions();

  const appInfo = {
    version: '1.2.3',
    buildNumber: '2024.01.15',
  };

  const socialLinks = [
    {
      id: '1',
      name: 'Website',
      icon: 'globe-outline',
      url: 'https://grociko.com',
      color: theme.colors.secondary.main,
    },
    {
      id: '2',
      name: 'Facebook',
      icon: 'logo-facebook',
      url: 'https://facebook.com',
      color: '#1877F2',
    },
    {
      id: '3',
      name: 'Instagram',
      icon: 'logo-instagram',
      url: 'https://instagram.com',
      color: '#E4405F',
    },
    {
      id: '4',
      name: 'Twitter',
      icon: 'logo-twitter',
      url: 'https://twitter.com',
      color: '#1DA1F2',
    },
  ];

  const features = [
    {
      id: '1',
      icon: 'flash-outline',
      text: 'Lightning-fast delivery in 30-120 minutes',
    },
    {
      id: '2',
      icon: 'leaf-outline',
      text: 'Fresh, organic produce from local farms',
    },
    {
      id: '3',
      icon: 'shield-checkmark-outline',
      text: 'Quality guaranteed or money back',
    },
    {
      id: '4',
      icon: 'card-outline',
      text: 'Secure payment options including COD',
    },
    {
      id: '5',
      icon: 'people-outline',
      text: '24/7 customer support',
    },
  ];

  // Load about us data when screen focuses
  useFocusEffect(
    useCallback(() => {
      loadAboutData();
    }, [])
  );

  const loadAboutData = async () => {
    try {
      setLoading(true);
      const response = await getAboutUs();

      // console.log('📦 Full API Response:', response);

      if (response.success && response.data) {
        // console.log('📋 Loaded About Data:', response.data);

        if (response.data && (response.data.title || response.data.description)) {
          setAboutData(response.data);
        } else {
          console.error('❌ Invalid data structure:', response.data);
          Alert.alert('Error', 'Invalid data received from server');
        }
      } else {
        console.error('❌ API Error:', response);
        Alert.alert('Error', response.error || 'Failed to load About Us');
      }
    } catch (error) {
      console.error('❌ Error loading about data:', error);
      Alert.alert('Error', 'Failed to load About Us. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialPress = (url) => {
    Linking.openURL(url);
  };

  const handleRateApp = () => {
    Linking.openURL('https://play.google.com/store/apps/details?id=com.grociko.app');
  };

  const handleShareApp = () => {
    Linking.openURL('https://grociko.com/download');
  };

 // Clean and format HTML content - COMPLETELY FIXED VERSION
const formatHtmlContent = (html) => {
  if (!html) return '';
  
  let formattedHtml = html.trim();
  
  // Remove ALL <br> tags completely (they're causing spacing issues)
  formattedHtml = formattedHtml.replace(/<br\s*\/?>/gi, ' ');
  
  // Remove empty paragraphs
  formattedHtml = formattedHtml.replace(/<p>\s*<\/p>/gi, '');
  
  // Remove excessive whitespace between tags
  formattedHtml = formattedHtml.replace(/>\s+</g, '><');
  
  // Normalize spaces inside paragraphs
  formattedHtml = formattedHtml.replace(/\s{2,}/g, ' ');
  
  return formattedHtml;
};

// HTML rendering configuration - ULTRA MINIMAL SPACING VERSION
const htmlBaseStyle = {
  fontSize: theme.typography.fontSize.base,
  fontFamily: 'Outfit-Regular',
  color: theme.colors.text.secondary,
  lineHeight: theme.typography.fontSize.base * 1.35, // Even tighter line height
};

const htmlTagsStyles = {
  body: {
    ...htmlBaseStyle,
    margin: 0,
    padding: 0,
  },
  p: {
    ...htmlBaseStyle,
    marginBottom: 0, // ULTRA minimal - just 2px between paragraphs
    marginTop: 0,
    paddingBottom: 0,
    paddingTop: 0,
  },
  span: {
    ...htmlBaseStyle,
    margin: 0,
  },
  div: {
    ...htmlBaseStyle,
    marginBottom: 0,
    marginTop: 0,
  },
  br: {
    display: 'none', // Completely hide <br> tags
  },
  h1: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: 'Outfit-Bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  h2: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: 'Outfit-SemiBold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
    marginTop: theme.spacing.md,
  },
  h3: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: 'Outfit-SemiBold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
  ul: {
  margin: 0,
  paddingLeft: theme.spacing.lg,
},
ol: {
  margin: 0,
  paddingLeft: theme.spacing.lg,
},
li: {
  marginBottom: 0,
  paddingBottom: 0,
},

};
  // Beautiful Loading State
  if (loading) {
    return (
      <SafeAreaWrapper>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>About</Text>
            <View style={styles.headerRight} />
          </View>

          {/* Loading Animation */}
          <View style={styles.loadingContainer}>
            <View style={styles.loadingCard}>
              {/* Animated Logo Placeholder */}
              <View style={styles.loadingLogoContainer}>
                <View style={styles.loadingLogo}>
                  <ActivityIndicator size="large" color={theme.colors.primary.main} />
                </View>
              </View>

              {/* Text Loading Animation */}
              <View style={styles.loadingTextContainer}>
                <View style={[styles.loadingBar, styles.loadingBarLarge]} />
                <View style={[styles.loadingBar, styles.loadingBarMedium]} />
                <View style={[styles.loadingBar, styles.loadingBarSmall]} />
              </View>

              {/* Loading Message */}
              <Text style={styles.loadingText}>Loading About Us...</Text>

              {/* Decorative Elements */}
              <View style={styles.loadingDotsContainer}>
                <View style={[styles.loadingDot, styles.loadingDot1]} />
                <View style={[styles.loadingDot, styles.loadingDot2]} />
                <View style={[styles.loadingDot, styles.loadingDot3]} />
              </View>
            </View>
          </View>
        </View>
      </SafeAreaWrapper>
    );
  }

  // Error State (No Data)
  if (!aboutData) {
    return (
      <SafeAreaWrapper>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>About</Text>
            <View style={styles.headerRight} />
          </View>

          <View style={styles.errorContainer}>
            <Ionicons
              name="alert-circle-outline"
              size={80}
              color={theme.colors.text.tertiary}
            />
            <Text style={styles.errorTitle}>Unable to Load Content</Text>
            <Text style={styles.errorText}>
              We couldn't load the About Us information. Please try again.
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadAboutData}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>About</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Hero Section with Gradient */}
          <View style={styles.heroSection}>
            <View style={styles.heroGradient}>
              {aboutData.image ? (
                <Image
                  source={{ uri: aboutData.image }}
                  style={styles.heroImage}
                  resizeMode="cover"
                />
              ) : (
                <Image
                  source={{
                    uri: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&h=400&fit=crop',
                  }}
                  style={styles.heroImage}
                  resizeMode="cover"
                />
              )}
              <View style={styles.heroOverlay} />
              <View style={styles.heroContent}>
                <View style={styles.logoContainer}>
                  <Image
                    source={require('@/assets/company/logo1.png')}
                    style={styles.appLogo}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.appName}>Grociko</Text>
                <Text style={styles.appTagline}>Fresh groceries at your doorstep</Text>
              </View>
            </View>
          </View>

          {/* About Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="information-circle"
                size={24}
                color={theme.colors.primary.main}
              />
              <Text style={styles.sectionTitle}>{aboutData.title || 'About Us'}</Text>
            </View>

            <View style={styles.contentCard}>
              {/* Render HTML content */}
              {aboutData.description && (
                <View style={styles.htmlContainer}>
                  <RenderHtml
                    contentWidth={width - (theme.spacing.lg * 4)}
                    source={{ html: formatHtmlContent(aboutData.description) }}
                    tagsStyles={htmlTagsStyles}
                    baseStyle={htmlBaseStyle}
                    enableExperimentalMarginCollapsing={true}
                  />
                </View>
              )}

              {aboutData.created_date && (
                <View style={styles.infoRow}>
                  <Ionicons
                    name="calendar-outline"
                    size={16}
                    color={theme.colors.text.tertiary}
                  />
               {/* {   <Text style={styles.infoText}>
                    Established: {aboutData.created_date}
                  </Text>} */}
                </View>
              )}
            </View>
          </View>

          {/* Features Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="star" size={24} color={theme.colors.primary.main} />
              <Text style={styles.sectionTitle}>What We Offer</Text>
            </View>

            <View style={styles.featuresGrid}>
              {features.map((feature) => (
                <View key={feature.id} style={styles.featureCard}>
                  <View style={styles.featureIconContainer}>
                    <Ionicons
                      name={feature.icon}
                      size={24}
                      color={theme.colors.primary.main}
                    />
                  </View>
                  <Text style={styles.featureText}>{feature.text}</Text>
                </View>
              ))}
            </View>
          </View>

        

          {/* Actions Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="heart" size={24} color={theme.colors.primary.main} />
              <Text style={styles.sectionTitle}>Support Us</Text>
            </View>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={handleRateApp}
              activeOpacity={0.7}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="star" size={24} color={theme.colors.status.warning} />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Rate Our App</Text>
                <Text style={styles.actionDescription}>
                  Help us improve with your feedback
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={theme.colors.text.tertiary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={handleShareApp}
              activeOpacity={0.7}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons
                  name="share-social"
                  size={24}
                  color={theme.colors.secondary.main}
                />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Share With Friends</Text>
                <Text style={styles.actionDescription}>
                  Spread the word about Grociko
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={theme.colors.text.tertiary}
              />
            </TouchableOpacity>
          </View>

          {/* App Info Footer */}
          <View style={styles.footerSection}>
            <View style={styles.footerCard}>
              <View style={styles.footerRow}>
                <Text style={styles.footerLabel}>Version</Text>
                <Text style={styles.footerValue}>{appInfo.version}</Text>
              </View>
              <View style={styles.footerDivider} />
              <View style={styles.footerRow}>
                <Text style={styles.footerLabel}>Build</Text>
                <Text style={styles.footerValue}>{appInfo.buildNumber}</Text>
              </View>
            </View>

            <Text style={styles.copyright}>© 2024 Grociko. All rights reserved.</Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },

  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.background.primary,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.surface.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: 'Outfit-SemiBold',
    color: theme.colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },

  // Loading Styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  loadingCard: {
    width: '100%',
    backgroundColor: theme.colors.surface.card,
    borderRadius: theme.borderRadius['2xl'],
    padding: theme.spacing['3xl'],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  loadingLogoContainer: {
    marginBottom: theme.spacing['3xl'],
  },
  loadingLogo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingTextContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  loadingBar: {
    height: 12,
    backgroundColor: theme.colors.surface.light,
    borderRadius: theme.borderRadius.sm,
  },
  loadingBarLarge: {
    width: '80%',
  },
  loadingBarMedium: {
    width: '60%',
  },
  loadingBarSmall: {
    width: '40%',
  },
  loadingText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: 'Outfit-Medium',
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.lg,
  },
  loadingDotsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary.main,
  },
  loadingDot1: {
    opacity: 1,
  },
  loadingDot2: {
    opacity: 0.6,
  },
  loadingDot3: {
    opacity: 0.3,
  },

  // Error Styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  errorTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: 'Outfit-SemiBold',
    color: theme.colors.text.primary,
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.sm,
  },
  errorText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: 'Outfit-Regular',
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  retryButton: {
    backgroundColor: theme.colors.primary.main,
    paddingHorizontal: theme.spacing['3xl'],
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
  },
  retryButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: 'Outfit-SemiBold',
    color: theme.colors.text.white,
  },

  // Content Styles
  content: {
    flex: 1,
  },

  // Hero Section
  heroSection: {
    marginBottom: theme.spacing.xl,
  },
  heroGradient: {
    height: 280,
    position: 'relative',
    backgroundColor: theme.colors.primary[50],
  },
  heroImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  heroContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    borderWidth: 3,
    borderColor: theme.colors.primary.main,
  },
  appLogo: {
    width: 60,
    height: 60,
  },
  appName: {
    fontSize: theme.typography.fontSize['3xl'],
    fontFamily: 'Outfit-Bold',
    color: theme.colors.text.white,
    marginBottom: theme.spacing.xs,
  },
  appTagline: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: 'Outfit-Regular',
    color: theme.colors.text.white,
    textAlign: 'center',
  },

  // Section Styles
  section: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing['3xl'],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: 'Outfit-SemiBold',
    color: theme.colors.text.primary,
  },

  // Content Card
  contentCard: {
    backgroundColor: theme.colors.surface.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  htmlContainer: {
    marginBottom: theme.spacing.lg,
  },
  aboutText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: 'Outfit-Regular',
    color: theme.colors.text.secondary,
    lineHeight: theme.typography.fontSize.base * theme.typography.lineHeight.relaxed,
    marginBottom: theme.spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surface.divider,
  },
  infoText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: 'Outfit-Medium',
    color: theme.colors.text.tertiary,
  },

  // Features Grid
  featuresGrid: {
    gap: theme.spacing.sm,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    gap: theme.spacing.lg,
  },
  featureIconContainer: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: 'Outfit-Regular',
    color: theme.colors.text.secondary,
  },

  // Social Grid
  socialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  socialCard: {
    width: '48%',
    backgroundColor: theme.colors.surface.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  socialIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  socialName: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: 'Outfit-Medium',
    color: theme.colors.text.primary,
  },

  // Action Card
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.lg,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: 'Outfit-SemiBold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  actionDescription: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: 'Outfit-Regular',
    color: theme.colors.text.secondary,
  },

  // Footer Section
  footerSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing['6xl'],
  },
  footerCard: {
    backgroundColor: theme.colors.surface.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  footerLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: 'Outfit-Regular',
    color: theme.colors.text.secondary,
  },
  footerValue: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: 'Outfit-SemiBold',
    color: theme.colors.text.primary,
  },
  footerDivider: {
    height: 1,
    backgroundColor: theme.colors.surface.divider,
    marginVertical: theme.spacing.xs,
  },
  copyright: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: 'Outfit-Regular',
    color: theme.colors.text.tertiary,
    textAlign: 'center',
  },
});

export default About;