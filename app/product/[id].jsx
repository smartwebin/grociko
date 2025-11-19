import SafeAreaWrapper2 from "@/components/SafeAreaWrapper2";
import { useCart } from "@/providers/CartProvider";
import { getProductById } from "@/services/apiService";
import theme from "@/utils/theme";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

export default function ProductDetail() {
  const { id } = useLocalSearchParams();
  const { addToCart, updateQuantity, getItemQuantity } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isDetailExpanded, setIsDetailExpanded] = useState(false);
  const [isFeature1Expanded, setIsFeature1Expanded] = useState(false);
  const [isFeature2Expanded, setIsFeature2Expanded] = useState(false);
  const [isFeature3Expanded, setIsFeature3Expanded] = useState(false);
  const [isFeature4Expanded, setIsFeature4Expanded] = useState(false);
  const [isFeature5Expanded, setIsFeature5Expanded] = useState(false);

  const quantity = product ? getItemQuantity(product.id) : 0;

  // Fetch product details
  useEffect(() => {
    fetchProductDetails();
  }, [id]);

  const fetchProductDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getProductById(id);

      if (response.success) {
        setProduct(response.data);
      } else {
        setError(response.error || "Failed to load product");
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      setError("An error occurred while loading product");
    } finally {
      setLoading(false);
    }
  };

  const handleImageScroll = (event) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
    setCurrentImageIndex(index);
  };

  const handleAddToCart = () => {
    if (!product) return;

    const cartProduct = {
      id: product.id,
      name: product.name,
      unit: product.unit,
      mrp: parseFloat(product.mrp),
      sellingPrice: parseFloat(product.sale_price),
      image: product.image,
      availableStock: product.quantity,
    };
    addToCart(cartProduct, 1);
  };

  const handleViewCart = () => {
    router.push("/cart");
  };

  const handleIncrement = () => {
    // Check if we've reached the available stock limit
    if (product && quantity >= product.quantity) {
      // Optional: Show an alert or toast message

      return;
    }

    if (quantity > 0) {
      updateQuantity(product.id, quantity + 1);
    } else {
      handleAddToCart();
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      updateQuantity(product.id, quantity - 1);
    }
  };

  // Build images array
  const getProductImages = () => {
    if (!product) return [];

    const images = [];

    // Add main image
    if (product.image) {
      images.push(product.image);
    }

    // Add sub images
    if (product.sub_images && product.sub_images.length > 0) {
      product.sub_images.forEach((img) => {
        if (img.sub_image) {
          images.push(img.sub_image);
        }
      });
    }

    return images;
  };

  const productImages = getProductImages();

  const renderImage = ({ item }) => (
    <View style={styles.imageSlide}>
      <Image
        source={{ uri: item }}
        style={styles.productImage}
        resizeMode="cover"
      />
    </View>
  );

  // Loading state
  if (loading) {
    return (
      <SafeAreaWrapper2>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.main} />
          <Text style={styles.loadingText}>Loading product...</Text>
        </View>
      </SafeAreaWrapper2>
    );
  }

  // Error state
  if (error || !product) {
    return (
      <SafeAreaWrapper2>
        <View style={styles.centerContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={64}
            color={theme.colors.status.error}
          />
          <Text style={styles.errorTitle}>{error || "Product not found"}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchProductDetails}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.backButtonError}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaWrapper2>
    );
  }

  // Calculate discount percentage
  const discountPercentage =
    product.mrp && product.sale_price
      ? Math.round(
          ((parseFloat(product.mrp) - parseFloat(product.sale_price)) /
            parseFloat(product.mrp)) *
            100
        )
      : 0;

  return (
    <SafeAreaWrapper2>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color={theme.colors.text.primary}
            />
          </TouchableOpacity>
          {/* <TouchableOpacity style={styles.shareButton}>
            <Ionicons
              name="share-outline"
              size={24}
              color={theme.colors.text.primary}
            />
          </TouchableOpacity> */}
        </View>

        {/* Image Carousel */}
        {productImages.length > 0 && (
          <View style={styles.imageContainer}>
            <FlatList
              data={productImages}
              renderItem={renderImage}
              keyExtractor={(item, index) => index.toString()}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={handleImageScroll}
              snapToAlignment="center"
              decelerationRate="fast"
            />

            {/* Pagination Dots */}
            {productImages.length > 1 && (
              <View style={styles.pagination}>
                {productImages.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.paginationDot,
                      index === currentImageIndex && styles.activePaginationDot,
                    ]}
                  />
                ))}
              </View>
            )}

            {/* Discount Badge */}
            {product?.tag && (
              <View
                style={[
                  styles.discountBadge,
                  {
                    backgroundColor:
                      product.tag_color || theme.colors.status.error,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.discountText,
                    {
                      color:
                        product.tag_color == "yellow"
                          ? "black"
                          : theme.colors.text.white,
                    },
                  ]}
                >
                  {product.tag}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Product Info */}
        <View style={styles.productInfo}>
          <View style={styles.titleContainer}>
            <Text style={styles.productName}>{product.name}</Text>
            {product.unit && (
              <Text style={styles.productUnit}>
                {product.weight ? product.weight : product.unit}
              </Text>
            )}

            {/* Category and Brand Tags */}
            <View style={styles.tagsContainer}>
              {product.category && (
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{product.category}</Text>
                </View>
              )}
              {product.brand && (
                <View style={[styles.tag, styles.brandTag]}>
                  <Text style={styles.tagText}>{product.brand}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Quantity and Price Row */}
          <View style={styles.quantityPriceRow}>
            <View style={styles.quantitySection}>
              <TouchableOpacity
                style={[
                  styles.quantityButton,
                  quantity === 0 && styles.quantityButtonDisabled,
                ]}
                onPress={handleDecrement}
                disabled={quantity === 0}
              >
                <Ionicons
                  name="remove"
                  size={20}
                  color={
                    quantity === 0
                      ? theme.colors.text.tertiary
                      : theme.colors.primary.main
                  }
                />
              </TouchableOpacity>

              <View style={styles.quantityDisplay}>
                <Text style={styles.quantityText}>{quantity || 0}</Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.quantityButton,
                  quantity >= product.quantity && styles.quantityButtonDisabled,
                ]}
                onPress={handleIncrement}
                disabled={quantity >= product.quantity}
              >
                <Ionicons
                  name="add"
                  size={20}
                  color={
                    quantity >= product.quantity
                      ? theme.colors.text.tertiary
                      : theme.colors.primary.main
                  }
                />
              </TouchableOpacity>
            </View>

            <View style={styles.priceContainer}>
              {product.mrp &&
                parseFloat(product.mrp) > parseFloat(product.sale_price) && (
                  <Text style={styles.originalPrice}>
                    £{parseFloat(product.mrp).toFixed(2)}
                  </Text>
                )}
              <Text style={styles.price}>
                £{parseFloat(product.sale_price).toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Short Description */}
        {product.short_description && (
          <View style={styles.section}>
            <View style={styles.sectionContent}>
              <Text style={styles.shortDescription}>
                {product.short_description}
              </Text>
            </View>
          </View>
        )}
        {/* Product Specifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Specifications</Text>
          <View style={styles.specsContainer}>
            {product.weight && (
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Weight</Text>
                <Text style={styles.specValue}>{product.weight}</Text>
              </View>
            )}
            {product.quantity && (
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Available Quantity</Text>
                <Text style={styles.specValue}>{product.quantity}</Text>
              </View>
            )}
            {product.tag && (
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Tags</Text>
                <Text style={styles.specValue}>{product.tag}</Text>
              </View>
            )}
          </View>
        </View>
        {/* Product Detail Section */}
        {product.description && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => setIsDetailExpanded(!isDetailExpanded)}
            >
              <Text style={styles.sectionTitle}>Product Detail</Text>
              <Ionicons
                name={isDetailExpanded ? "chevron-up" : "chevron-down"}
                size={20}
                color={theme.colors.text.secondary}
              />
            </TouchableOpacity>

            {isDetailExpanded && (
              <View style={styles.sectionContent}>
                <Text style={styles.description}>{product.description}</Text>
              </View>
            )}
          </View>
        )}

        {/* Feature Sections */}
        {product.feature_title1 && product.feature_description1 && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => setIsFeature1Expanded(!isFeature1Expanded)}
            >
              <Text style={styles.sectionTitle}>{product.feature_title1}</Text>
              <Ionicons
                name={isFeature1Expanded ? "chevron-up" : "chevron-down"}
                size={20}
                color={theme.colors.text.secondary}
              />
            </TouchableOpacity>

            {isFeature1Expanded && (
              <View style={styles.sectionContent}>
                <Text style={styles.description}>
                  {product.feature_description1}
                </Text>
              </View>
            )}
          </View>
        )}

        {product.feature_title2 && product.feature_description2 && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => setIsFeature2Expanded(!isFeature2Expanded)}
            >
              <Text style={styles.sectionTitle}>{product.feature_title2}</Text>
              <Ionicons
                name={isFeature2Expanded ? "chevron-up" : "chevron-down"}
                size={20}
                color={theme.colors.text.secondary}
              />
            </TouchableOpacity>

            {isFeature2Expanded && (
              <View style={styles.sectionContent}>
                <Text style={styles.description}>
                  {product.feature_description2}
                </Text>
              </View>
            )}
          </View>
        )}

        {product.feature_title3 && product.feature_description3 && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => setIsFeature3Expanded(!isFeature3Expanded)}
            >
              <Text style={styles.sectionTitle}>{product.feature_title3}</Text>
              <Ionicons
                name={isFeature3Expanded ? "chevron-up" : "chevron-down"}
                size={20}
                color={theme.colors.text.secondary}
              />
            </TouchableOpacity>

            {isFeature3Expanded && (
              <View style={styles.sectionContent}>
                <Text style={styles.description}>
                  {product.feature_description3}
                </Text>
              </View>
            )}
          </View>
        )}

        {product.feature_title4 && product.feature_description4 && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => setIsFeature4Expanded(!isFeature4Expanded)}
            >
              <Text style={styles.sectionTitle}>{product.feature_title4}</Text>
              <Ionicons
                name={isFeature4Expanded ? "chevron-up" : "chevron-down"}
                size={20}
                color={theme.colors.text.secondary}
              />
            </TouchableOpacity>

            {isFeature4Expanded && (
              <View style={styles.sectionContent}>
                <Text style={styles.description}>
                  {product.feature_description4}
                </Text>
              </View>
            )}
          </View>
        )}

        {product.feature_title5 && product.feature_description5 && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => setIsFeature5Expanded(!isFeature5Expanded)}
            >
              <Text style={styles.sectionTitle}>{product.feature_title5}</Text>
              <Ionicons
                name={isFeature5Expanded ? "chevron-up" : "chevron-down"}
                size={20}
                color={theme.colors.text.secondary}
              />
            </TouchableOpacity>

            {isFeature5Expanded && (
              <View style={styles.sectionContent}>
                <Text style={styles.description}>
                  {product.feature_description5}
                </Text>
              </View>
            )}
          </View>
        )}
        {product.quantity <= 10 && (
          <Text style={styles.stockWarning}>
            Only {product.quantity} left in stock
          </Text>
        )}
        {/* Add To Basket Button */}
        {product?.quantity > 0 && (
          <View style={styles.addToBasketContainer}>
            <TouchableOpacity
              style={[
                styles.addToBasketButton,
                quantity > 0 && styles.viewCartButton,
              ]}
              onPress={quantity > 0 ? handleViewCart : handleAddToCart}
            >
              <Text style={styles.addToBasketText}>
                {quantity > 0 ? `View Cart (${quantity})` : "Add To Basket"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom Padding */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaWrapper2>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  stockWarning: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: "Outfit-Medium",
    color: theme.colors.status.error,
    marginTop: theme.spacing.xs,
    textAlign: "center",
  },
  // Center Container for Loading/Error
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.xl,
  },
  loadingText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: "Outfit-Regular",
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.md,
  },
  errorTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.text.primary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: theme.colors.primary.main,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginTop: theme.spacing.lg,
  },
  retryButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.text.white,
  },
  backButtonError: {
    marginTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
  },
  backButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: "Outfit-Medium",
    color: theme.colors.primary.main,
  },

  // Header Styles
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.surface.light,
    justifyContent: "center",
    alignItems: "center",
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.surface.light,
    justifyContent: "center",
    alignItems: "center",
  },

  // Image Carousel Styles
  imageContainer: {
    height: 350,
    backgroundColor: theme.colors.surface.light,
    marginBottom: theme.spacing.xl,
    position: "relative",
  },
  imageSlide: {
    width: width,
    height: 350,
    justifyContent: "center",
    alignItems: "center",
  },
  productImage: {
    width: width * 0.8,
    height: 280,
    borderRadius: theme.borderRadius.lg,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    bottom: theme.spacing.lg,
    left: 0,
    right: 0,
  },
  paginationDot: {
    width: 8,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    marginHorizontal: theme.spacing.xs / 2,
  },
  activePaginationDot: {
    backgroundColor: theme.colors.primary.main,
    width: 20,
  },
  discountBadge: {
    position: "absolute",
    top: theme.spacing.lg,
    right: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
  },
  discountText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: "Outfit-Bold",
  },

  // Product Info Styles
  productInfo: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  titleContainer: {
    marginBottom: theme.spacing.lg,
  },
  productName: {
    fontSize: theme.typography.fontSize["2xl"],
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  productUnit: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: "Outfit-Regular",
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: theme.spacing.sm,
  },
  tag: {
    backgroundColor: theme.colors.primary[50],
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  brandTag: {
    backgroundColor: theme.colors.secondary[50],
  },
  tagText: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: "Outfit-Medium",
    color: theme.colors.text.secondary,
  },

  // Quantity and Price Styles
  quantityPriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  quantitySection: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantityButton: {
    width: 45,
    height: 45,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.surface.input,
    justifyContent: "center",
    alignItems: "center",
  },
  quantityButtonDisabled: {
    opacity: 0.5,
  },
  quantityDisplay: {
    width: 60,
    height: 45,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    borderRadius: theme.borderRadius.lg,
  },
  quantityText: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.text.primary,
  },
  priceContainer: {
    alignItems: "flex-end",
  },
  price: {
    fontSize: theme.typography.fontSize["2xl"],
    fontFamily: "Outfit-Bold",
    color: theme.colors.text.primary,
  },
  originalPrice: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: "Outfit-Regular",
    color: theme.colors.text.secondary,
    textDecorationLine: "line-through",
    marginBottom: theme.spacing.xs / 2,
  },

  // Section Styles
  section: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface.border,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.text.primary,
  },
  sectionContent: {
    paddingTop: theme.spacing.md,
  },
  shortDescription: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: "Outfit-Medium",
    color: theme.colors.text.primary,
    lineHeight: theme.typography.fontSize.base * 1.5,
  },
  description: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: "Outfit-Regular",
    color: theme.colors.text.secondary,
    lineHeight: theme.typography.fontSize.base * 1.5,
  },

  // Specifications
  specsContainer: {
    backgroundColor: theme.colors.surface.light,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.md,
  },
  specRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface.border,
  },
  specLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: "Outfit-Regular",
    color: theme.colors.text.secondary,
  },
  specValue: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.text.primary,
  },

  // Add To Basket Styles
  addToBasketContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.xl,
  },
  addToBasketButton: {
    backgroundColor: theme.colors.primary.main,
    height: 56,
    borderRadius: theme.borderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  addToBasketText: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.text.white,
  },
  viewCartButton: {
    backgroundColor: theme.colors.secondary.main,
  },
});
