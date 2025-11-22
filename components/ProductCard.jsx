import { useCart } from "@/providers/CartProvider";
import theme from "@/utils/theme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const ProductCard = ({ item, onPress }) => {
  const { addToCart, updateQuantity, getItemQuantity } = useCart();
  const quantity = getItemQuantity(item.id);

  const handleAddToCart = () => {
    const cartProduct = {
      ...item,
      unit:item.weight ? item.weight : item.unit,
      availableStock: item.quantity,
    };
    // console.log("cartProduct",cartProduct)
    addToCart(cartProduct, 1);
  };

  const handleIncrement = () => {
    // Check if we've reached the available stock limit
    if (item.quantity && quantity >= item.quantity) {
      return;
    }

    if (quantity > 0) {
      updateQuantity(item.id, quantity + 1);
    } else {
      handleAddToCart();
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      updateQuantity(item.id, quantity - 1);
    } else if (quantity === 1) {
      updateQuantity(item.id, 0);
    }
  };

  const handlePress = () => {
    // Navigate to product detail page
    router.push(`/product/${item.id}`);
  };

  // Check if product is out of stock
  const isOutOfStock = !item.quantity || item.quantity === 0;
  const isLowStock = item.quantity && item.quantity <= 10 && item.quantity > 0;
  const isStockLimitReached = item.quantity && quantity >= item.quantity;

  return (
    <View style={styles.container}>
      {/* Clickable area for navigation - Image, Title, Price */}
      <TouchableOpacity
        onPress={handlePress}
        disabled={isOutOfStock}
        activeOpacity={0.7}
      >
        <View style={styles.imageContainer}>
          <Image
            source={
              typeof item.image === "string" ? { uri: item.image } : item.image
            }
            style={[
              styles.productImage,
              isOutOfStock && styles.outOfStockImage,
            ]}
            resizeMode="cover"
          />
          {item.tag && (
            <View
              style={[
                styles.offerTag,
                {
                  backgroundColor:
                    item.tag_color || theme.colors.secondary.main,
                },
              ]}
            >
              <Text style={[styles.offerText,{
                    color: item.tag_color =="yellow" ? "black": theme.colors.text.white,

              }]}>{item.tag}</Text>
            </View>
          )}

          {isOutOfStock && (
            <View style={styles.outOfStockBadge}>
              <Text style={styles.outOfStockText}>Out of Stock</Text>
            </View>
          )}
        </View>

        <View style={styles.content}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.productUnit}>
            {item.weight ? item.weight : item.unit}
          </Text>

          <View style={styles.priceContainer}>
            <View style={styles.priceRow}>
              <Text style={styles.mrpPrice}>£{item.mrp.toFixed(2)}</Text>
              <Text style={styles.sellingPrice}>
                £{item.sellingPrice.toFixed(2)}
              </Text>
            </View>

            {/* Stock availability indicator */}
            {!isOutOfStock && (
              <View style={styles.stockIndicator}>
                {isLowStock ? (
                  <Text style={styles.lowStockText}>
                    Only {item.quantity} left
                  </Text>
                ) : (
                  <Text style={styles.inStockText}>
                    {item.quantity} in stock
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>

      {/* Non-clickable action area - Quantity controls */}
      <View style={styles.actionContainer}>
        {isOutOfStock ? (
          <View style={styles.disabledButton}>
            <Text style={styles.disabledButtonText}>Unavailable</Text>
          </View>
        ) : quantity === 0 ? (
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddToCart}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={16} color={theme.colors.text.white} />
          </TouchableOpacity>
        ) : (
          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={handleDecrement}
              activeOpacity={0.7}
            >
              <Ionicons
                name="remove"
                size={12}
                color={theme.colors.text.white}
              />
            </TouchableOpacity>

            <Text style={styles.quantityText}>{quantity}</Text>

            <TouchableOpacity
              style={[
                styles.quantityButton,
                isStockLimitReached && styles.quantityButtonDisabled,
              ]}
              onPress={handleIncrement}
              disabled={isStockLimitReached}
              activeOpacity={0.7}
            >
              <Ionicons
                name="add"
                size={12}
                color={
                  isStockLimitReached
                    ? theme.colors.text.tertiary
                    : theme.colors.text.white
                }
              />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 173,
    backgroundColor: theme.colors.surface.card,
    borderRadius: theme.components.productCard.borderRadius,
    borderWidth: theme.borderWidth[1],
    borderColor: theme.colors.surface.border,
    marginRight: theme.spacing.md,
    marginLeft: theme.spacing.xs,
    overflow: "hidden",
  },
  imageContainer: {
    width: "100%",
    height: 110,
    backgroundColor: theme.colors.surface.light,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.xs,
    position: "relative",
  },
  productImage: {
    width: "100%",
    height: "100%",
    borderRadius: theme.borderRadius.sm,
  },
  outOfStockImage: {
    opacity: 0.4,
  },
  content: {
    padding: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    minHeight: 140,
  },
  productName: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
    height: 38,
    textAlign: "left",
  },
  productUnit: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: "Outfit-Regular",
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  priceContainer: {
    marginBottom: theme.spacing.sm,
    flex: 1,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.xs,
  },
  mrpPrice: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: "Outfit-Regular",
    color: theme.colors.text.secondary,
    textDecorationLine: "line-through",
    marginRight: theme.spacing.sm,
  },
  sellingPrice: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.text.primary,
  },
  stockIndicator: {
    marginTop: 2,
  },
  inStockText: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: "Outfit-Regular",
    color: theme.colors.status.success,
  },
  lowStockText: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.status.warning,
  },
  offerTag: {
    position: "absolute",
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
    zIndex: 2,
  },
  offerText: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: "Outfit-SemiBold",
  },
  outOfStockBadge: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -40 }, { translateY: -12 }],
    backgroundColor: theme.colors.status.error,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    zIndex: 3,
  },
  outOfStockText: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.text.white,
  },
  actionContainer: {
    alignItems: "flex-end",
    padding: theme.spacing.md,
    paddingTop: 0,
  },
  addButton: {
    backgroundColor: theme.colors.primary.main,
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: theme.colors.surface.border,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  disabledButtonText: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: "Outfit-Medium",
    color: theme.colors.text.secondary,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.secondary.main,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.xs,
    height: 32,
  },
  quantityButton: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.secondary.main,
    borderRadius: theme.borderRadius.sm,
  },
  quantityButtonDisabled: {
    opacity: 0.5,
  },
  quantityText: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.text.white,
    marginHorizontal: theme.spacing.sm,
    minWidth: 16,
    textAlign: "center",
  },
});

export default ProductCard;
