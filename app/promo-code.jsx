import SafeAreaWrapper from "@/components/SafeAreaWrapper";
import { getOfferCodes2 } from "@/services/apiService";
import theme from "@/utils/theme";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Clipboard,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const PromoCode = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [availablePromos, setAvailablePromos] = useState([]);

  // Load promo codes when screen focuses
  useFocusEffect(
    useCallback(() => {
      loadPromoCodes();
    }, [])
  );

  const loadPromoCodes = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);

      // Fetch all active offer codes from API
      const response = await getOfferCodes2({ status: "active" });

      if (response.success) {
        const codes = response.data || [];
        
        // Only show available (non-expired) promos
        const available = codes.filter(code => !code.is_expired);
        setAvailablePromos(available);
      } else {
        Alert.alert("Error", response.error || "Failed to load promo codes");
      }
    } catch (error) {
      console.error("Error loading promo codes:", error);
      Alert.alert("Error", "Failed to load promo codes");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadPromoCodes(false);
  };

  const handleCopyCode = (code) => {
    Clipboard.setString(code);
    Alert.alert("Copied!", `${code} copied to clipboard`, [
      { text: "OK" }
    ]);
  };

  const getExpiryStatus = (daysUntilExpiry) => {
    if (daysUntilExpiry === 0) {
      return { text: "Expires today", color: theme.colors.status.error, icon: "alert-circle" };
    } else if (daysUntilExpiry <= 3) {
      return { text: `${daysUntilExpiry} day${daysUntilExpiry > 1 ? 's' : ''} left`, color: theme.colors.status.warning, icon: "time" };
    } else if (daysUntilExpiry <= 7) {
      return { text: `${daysUntilExpiry} days left`, color: theme.colors.primary.main, icon: "time-outline" };
    } else {
      return { text: `${daysUntilExpiry} days left`, color: theme.colors.status.success, icon: "checkmark-circle" };
    }
  };

  const renderPromoItem = ({ item }) => {
    const expiryStatus = getExpiryStatus(item.days_until_expiry);

    return (
      <TouchableOpacity 
        style={styles.promoCard}
        onPress={() => handleCopyCode(item.offer_code)}
        activeOpacity={0.7}
      >
        {/* Promo Image */}
        {item.image_url && (
          <View style={styles.promoImageContainer}>
            <Image
              source={{ uri: item.image_url }}
              style={styles.promoImage}
              resizeMode="cover"
            />
            
            {/* Discount Badge on Image */}
            <View style={styles.imageDiscountBadge}>
              <Text style={styles.imageDiscountText}>{item.discount_text}</Text>
            </View>
          </View>
        )}

        {/* Card Content */}
        <View style={styles.cardContent}>
          {/* Background Pattern */}
          <View style={styles.cardBackground}>
            <View style={styles.circlePattern1} />
            <View style={styles.circlePattern2} />
            <View style={styles.circlePattern3} />
          </View>

          {/* Top Section */}
          <View style={styles.topSection}>
            {/* Left Side - Code & Description */}
            <View style={styles.leftSection}>
              <View style={styles.codeHeader}>
                <View style={styles.iconBadge}>
                  <Ionicons
                    name="pricetag"
                    size={18}
                    color={theme.colors.primary.main}
                  />
                </View>
                <Text style={styles.promoCode}>{item.offer_code}</Text>
              </View>
              
              {item.description && (
                <Text style={styles.description} numberOfLines={2}>
                  {item.description}
                </Text>
              )}
            </View>

            {/* Right Side - Discount Badge (only show if no image) */}
            {!item.image_url && (
              <View style={styles.discountContainer}>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>{item.discount_text}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Bottom Section */}
          <View style={styles.bottomSection}>
            {/* Details */}
            <View style={styles.detailsRow}>
              <View style={styles.detailItem}>
                <Ionicons
                  name="cart"
                  size={14}
                  color={theme.colors.text.secondary}
                />
                <Text style={styles.detailText}>
                  Min £{item.minimum_order}
                </Text>
              </View>

              <View style={styles.detailSeparator} />

              <View style={styles.detailItem}>
                <Ionicons
                  name={expiryStatus.icon}
                  size={14}
                  color={expiryStatus.color}
                />
                <Text style={[styles.detailText, { color: expiryStatus.color }]}>
                  {expiryStatus.text}
                </Text>
              </View>
            </View>

            {/* Copy Button */}
            <TouchableOpacity
              style={styles.copyButton}
              onPress={() => handleCopyCode(item.offer_code)}
            >
              <Ionicons name="copy" size={16} color={theme.colors.text.white} />
              <Text style={styles.copyButtonText}>Copy Code</Text>
            </TouchableOpacity>
          </View>
        </View>

      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="gift-outline" size={64} color={theme.colors.primary.main} />
      </View>
      <Text style={styles.emptyStateTitle}>No Active Offers</Text>
      <Text style={styles.emptyStateText}>
        We're cooking up some amazing deals for you.{'\n'}Check back soon!
      </Text>
      <TouchableOpacity
        style={styles.shopNowButton}
        onPress={() => router.push("/home")}
      >
        <Text style={styles.shopNowButtonText}>Continue Shopping</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaWrapper>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color={theme.colors.text.primary}
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Promo Codes</Text>
            <View style={styles.headerRight} />
          </View>

          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary.main} />
            <Text style={styles.loadingText}>Loading offers...</Text>
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
            <Ionicons
              name="arrow-back"
              size={24}
              color={theme.colors.text.primary}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Promo Codes</Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
            disabled={refreshing}
          >
            <Ionicons
              name="refresh"
              size={24}
              color={theme.colors.primary.main}
            />
          </TouchableOpacity>
        </View>

        {/* Stats Banner */}
        {availablePromos.length > 0 && (
          <View style={styles.statsBanner}>
            <View style={styles.statsContent}>
              <View style={styles.statsIconContainer}>
                <Ionicons name="gift" size={24} color={theme.colors.primary.main} />
              </View>
              <View style={styles.statsTextContainer}>
                <Text style={styles.statsNumber}>{availablePromos.length}</Text>
                <Text style={styles.statsLabel}>
                  Active Offer{availablePromos.length !== 1 ? 's' : ''} Available
                </Text>
              </View>
            </View>
            <View style={styles.statsDecoration} />
          </View>
        )}

        {/* Promo Codes List */}
        <FlatList
          data={availablePromos}
          renderItem={renderPromoItem}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContent,
            availablePromos.length === 0 && styles.emptyListContent,
          ]}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary.main]}
              tintColor={theme.colors.primary.main}
            />
          }
        />
      </View>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },

  // Loading Styles
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: theme.spacing.lg,
    fontSize: theme.typography.fontSize.base,
    fontFamily: "Outfit-Regular",
    color: theme.colors.text.secondary,
  },

  // Header Styles
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.surface.light,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: theme.typography.fontSize["2xl"],
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.text.primary,
    flex: 1,
    textAlign: "center",
  },
  headerRight: {
    width: 40,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.surface.light,
    justifyContent: "center",
    alignItems: "center",
  },

  // Stats Banner
  statsBanner: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.primary[50],
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    position: "relative",
    overflow: "hidden",
  },
  statsContent: {
    flexDirection: "row",
    alignItems: "center",
    zIndex: 1,
  },
  statsIconContainer: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.text.white,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.md,
  },
  statsTextContainer: {
    flex: 1,
  },
  statsNumber: {
    fontSize: theme.typography.fontSize["3xl"],
    fontFamily: "Outfit-Bold",
    color: theme.colors.primary.main,
    lineHeight: theme.typography.fontSize["3xl"] * 1.2,
  },
  statsLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: "Outfit-Medium",
    color: theme.colors.primary.dark,
  },
  statsDecoration: {
    position: "absolute",
    right: -20,
    top: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.primary[100],
    opacity: 0.5,
  },

  // List Styles
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing["6xl"],
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: "center",
  },

  // Promo Card Styles
  promoCard: {
    backgroundColor: theme.colors.surface.card,
    borderRadius: theme.borderRadius.xl,
    marginBottom: theme.spacing.lg,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  promoImageContainer: {
    width: "100%",
    height: 200,
    position: "relative",
  },
  promoImage: {
    width: "100%",
    height: "100%",
  },
 
  imageDiscountBadge: {
    position: "absolute",
    top: theme.spacing.md,
    right: theme.spacing.md,
    backgroundColor: theme.colors.primary.main,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
  },
  imageDiscountText: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: "Outfit-Bold",
    color: theme.colors.text.white,
  },
  cardBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  circlePattern1: {
    position: "absolute",
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.primary[50],
    opacity: 0.3,
  },
  circlePattern2: {
    position: "absolute",
    bottom: -20,
    left: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.secondary[50],
    opacity: 0.3,
  },
  circlePattern3: {
    position: "absolute",
    top: "50%",
    right: 30,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary[100],
    opacity: 0.4,
  },
  cardContent: {
    padding: theme.spacing.lg,
    zIndex: 1,
  },
  topSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  leftSection: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  codeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary[50],
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.sm,
  },
  promoCode: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: "Outfit-Bold",
    color: theme.colors.text.primary,
    letterSpacing: 1,
  },
  description: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: "Outfit-Regular",
    color: theme.colors.text.secondary,
    lineHeight: theme.typography.fontSize.sm * 1.4,
  },
  discountContainer: {
    alignItems: "flex-end",
  },
  discountBadge: {
    backgroundColor: theme.colors.primary.main,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    minWidth: 70,
    alignItems: "center",
  },
  discountText: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: "Outfit-Bold",
    color: theme.colors.text.white,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.surface.divider,
    marginVertical: theme.spacing.md,
  },
  bottomSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs / 2,
  },
  detailSeparator: {
    width: 1,
    height: 12,
    backgroundColor: theme.colors.surface.divider,
    marginHorizontal: theme.spacing.sm,
  },
  detailText: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: "Outfit-Medium",
    color: theme.colors.text.secondary,
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.primary.main,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
  },
  copyButtonText: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.text.white,
  },
  

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: theme.spacing["6xl"],
    paddingHorizontal: theme.spacing.xl,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.primary[50],
    justifyContent: "center",
    alignItems: "center",
    marginBottom: theme.spacing.xl,
  },
  emptyStateTitle: {
    fontSize: theme.typography.fontSize["2xl"],
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  emptyStateText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: "Outfit-Regular",
    color: theme.colors.text.secondary,
    textAlign: "center",
    lineHeight: theme.typography.fontSize.base * 1.5,
    marginBottom: theme.spacing.xl,
  },
  shopNowButton: {
    backgroundColor: theme.colors.primary.main,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  shopNowButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.text.white,
  },
});

export default PromoCode;