import SafeAreaWrapper from "@/components/SafeAreaWrapper";
import { useCart } from "@/providers/CartProvider";
import theme from "@/utils/theme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const Cart = () => {
  const { items, totalPrice, removeFromCart, updateQuantity, getCartSummary } =
    useCart();

  const { formattedPrice, totalItems } = getCartSummary();

  // Calculate VAT based on product vat_cat
  const calculateVATAmount = () => {
    let vatAmount = 0;
    items.forEach((item) => {
      const itemPrice =
        parseFloat(item.sellingPrice || item.price || 0) * item.quantity;
      // Only apply VAT if vat_cat is 'B'
      if (item.vat_cat === "B") {
        vatAmount += itemPrice * 0.2; // 20% VAT
      }
    });
    return vatAmount;
  };

  const vatAmount = calculateVATAmount();
  const subtotal = parseFloat(formattedPrice.replace(/[£$,]/g, "")) || 0;
  const totalWithVAT = subtotal + vatAmount;

  const handleRemoveItem = (itemId) => {
    removeFromCart(itemId);
  };

  const handleUpdateQuantity = (itemId, quantity) => {
    updateQuantity(itemId, quantity);
  };

  const handleIncrement = (item) => {
    // Check if item has available stock limit
    if (item.availableStock && item.quantity >= item.availableStock) {
      // Show alert when stock limit is reached
      Alert.alert(
        "Stock Limit Reached",
        `Only ${item.availableStock} units available in stock.`,
        [{ text: "OK" }]
      );
      return;
    }

    updateQuantity(item.id, item.quantity + 1);
  };

  const handleDecrement = (item) => {
    if (item.quantity > 1) {
      updateQuantity(item.id, item.quantity - 1);
    }
  };

  const handleCheckout = () => {
    router.push("/checkout");
  };

  const renderCartItem = ({ item }) => {
    // Calculate VAT if applicable
    const vatRate = item.vat_cat === "B" ? 0.2 : 0;
    const itemBasePrice =
      (item.sellingPrice || item.price || 0) * item.quantity;
    const itemVatAmount = itemBasePrice * vatRate;
    const itemTotalPrice = itemBasePrice + itemVatAmount;
// {console.log("item",item)}
    return (
      <View style={styles.cartItem}>
        <Image
          source={
            typeof item.image === "string" ? { uri: item.image } : item.image
          }
          style={styles.productImage}
          resizeMode="contain"
        />

        <View style={styles.itemDetails}>
          <View style={styles.itemHeader}>
            <Text style={styles.productName} numberOfLines={2}>
              {item.name}
            </Text>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleRemoveItem(item.id)}
            >
              <Ionicons
                name="close"
                size={20}
                color={theme.colors.text.secondary}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.productUnit}>{item.unit}</Text>

          <View style={styles.itemFooter}>
            <View style={styles.quantityContainer}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => handleDecrement(item)}
              >
                <Ionicons
                  name="remove"
                  size={16}
                  color={theme.colors.text.white}
                />
              </TouchableOpacity>

              <Text style={styles.quantityText}>{item.quantity}</Text>

              <TouchableOpacity
                style={[
                  styles.quantityButton,
                  item.availableStock &&
                    item.quantity >= item.availableStock &&
                    styles.quantityButtonDisabled,
                ]}
                onPress={() => handleIncrement(item)}
                disabled={
                  item.availableStock && item.quantity >= item.availableStock
                }
              >
                <Ionicons
                  name="add"
                  size={16}
                  color={
                    item.availableStock && item.quantity >= item.availableStock
                      ? theme.colors.text.tertiary
                      : theme.colors.text.white
                  }
                />
              </TouchableOpacity>
            </View>

            <View style={styles.priceContainer}>
              <Text style={styles.itemPrice}>£{itemTotalPrice.toFixed(2)}</Text>
              {item.vat_cat === "B" && (
                <Text style={styles.vatDetails}>
                  incl. VAT £{itemVatAmount.toFixed(2)}
                </Text>
              )}
              {item.availableStock && item.quantity >= item.availableStock && (
                <Text style={styles.stockLimitText}>Max stock</Text>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  if (items.length === 0) {
    return (
      <SafeAreaWrapper>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>My Cart</Text>
          </View>

          {/* Empty Cart */}
          <View style={styles.emptyCart}>
            <Ionicons
              name="bag-outline"
              size={80}
              color={theme.colors.text.tertiary}
            />
            <Text style={styles.emptyTitle}>Your cart is empty</Text>
            <Text style={styles.emptySubtitle}>
              Add some items to get started
            </Text>
            <TouchableOpacity
              style={styles.shopButton}
              onPress={() => router.push("/home")}
            >
              <Text style={styles.shopButtonText}>Start Shopping</Text>
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
          <Text style={styles.headerTitle}>My Cart</Text>
        </View>

        {/* Cart Items */}
        <FlatList
          data={items}
          renderItem={renderCartItem}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.cartList}
          ListFooterComponent={() => (
            <>
              <View style={styles.summarySection}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal</Text>
                  <Text style={styles.summaryValue}>
                    £{subtotal.toFixed(2)}
                  </Text>
                </View>

                {vatAmount > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>VAT (20%)</Text>
                    <Text style={styles.summaryValue}>
                      £{vatAmount.toFixed(2)}
                    </Text>
                  </View>
                )}

                <View style={[styles.summaryRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>
                    £{totalWithVAT.toFixed(2)}
                  </Text>
                </View>
              </View>

              {/* Checkout Section */}
              <View style={styles.checkoutSection}>
                <TouchableOpacity
                  style={styles.checkoutButton}
                  onPress={handleCheckout}
                >
                  <Text style={styles.checkoutButtonText}>Go to Checkout</Text>
                  <Text style={styles.checkoutPrice}>
                    £{totalWithVAT.toFixed(2)}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        />

        {/* Cart Summary */}
      </View>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
    paddingHorizontal: theme.spacing.lg,
  },

  // Header Styles
  header: {
    alignItems: "center",
    paddingVertical: theme.spacing.xl,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize["3xl"],
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.text.primary,
  },

  // Empty Cart Styles
  emptyCart: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.text.primary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  emptySubtitle: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: "Outfit-Regular",
    color: theme.colors.text.secondary,
    textAlign: "center",
    marginBottom: theme.spacing.xl,
  },
  shopButton: {
    backgroundColor: theme.colors.primary.main,
    paddingHorizontal: theme.spacing["3xl"],
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
  },
  shopButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.text.white,
  },

  // Cart List Styles
  cartList: {
    paddingBottom: theme.spacing.xl,
  },
  cartItem: {
    flexDirection: "row",
    backgroundColor: theme.colors.surface.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surface.light,
  },
  itemDetails: {
    flex: 1,
    marginLeft: theme.spacing.lg,
    justifyContent: "space-between",
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  productName: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.text.primary,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  removeButton: {
    padding: theme.spacing.xs,
  },
  productUnit: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: "Outfit-Regular",
    color: theme.colors.text.secondary,
    marginVertical: theme.spacing.xs,
  },
  itemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  // Quantity Styles
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.secondary.main,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.xs,
    height: 36,
  },
  quantityButton: {
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.secondary.main,
    borderRadius: theme.borderRadius.sm,
  },
  quantityButtonDisabled: {
    opacity: 0.5,
  },
  quantityText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.text.white,
    marginHorizontal: theme.spacing.sm,
    minWidth: 20,
    textAlign: "center",
  },
  priceContainer: {
    alignItems: "flex-end",
  },
  itemPrice: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.text.primary,
  },
  vatDetails: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: "Outfit-Regular",
    color: theme.colors.text.tertiary,
    marginTop: 2,
  },
  stockLimitText: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: "Outfit-Regular",
    color: theme.colors.status.error,
    marginTop: 2,
  },

  // Summary Section Styles
  summarySection: {
    paddingVertical: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surface.border,
    backgroundColor: theme.colors.surface.card,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  summaryLabel: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: "Outfit-Regular",
    color: theme.colors.text.secondary,
  },
  summaryValue: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.text.primary,
  },
  totalRow: {
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surface.border,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.text.primary,
  },
  totalValue: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.primary.main,
  },

  // Checkout Styles
  checkoutSection: {
    paddingVertical: theme.spacing.lg,
  },
  checkoutButton: {
    backgroundColor: theme.colors.primary.main,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    height: 56,
  },
  checkoutButtonText: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.text.white,
  },
  checkoutPrice: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.text.white,
  },
});

export default Cart;
