import SafeAreaWrapper from "@/components/SafeAreaWrapper";
import { useCart } from "@/providers/CartProvider";
import theme from "@/utils/theme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
} from "react-native";

const Cart = () => {
  const { items, totalPrice, removeFromCart, updateQuantity, getCartSummary } =
    useCart();

  const { formattedPrice, totalItems } = getCartSummary();

  const [showAgeModal, setShowAgeModal] = React.useState(false);
  const [ageAcknowledged, setAgeAcknowledged] = React.useState(false);

  // Age restriction logic
  const ageRestrictedItems = items.filter(
    (item) => item.age_verification_req === "yes"
  );

  const highestAge = ageRestrictedItems.reduce((max, item) => {
    const age = parseInt(item.age) || 0;
    return age > max ? age : max;
  }, 0);

  // Reset acknowledgment if no age restricted items
  React.useEffect(() => {
    if (ageRestrictedItems.length === 0 && ageAcknowledged) {
      setAgeAcknowledged(false);
    }
  }, [ageRestrictedItems.length]);

  const subtotal = parseFloat(formattedPrice.replace(/[£$,]/g, "")) || 0;
  const total = subtotal;

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
    if (ageRestrictedItems.length > 0 && !ageAcknowledged) {
      setShowAgeModal(true);
      return;
    }
    router.push("/checkout");
  };

  const renderCartItem = ({ item }) => {
    const itemTotalPrice = (item.sellingPrice || item.price || 0) * item.quantity;
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
              {item.includes_tax === "yes" && parseFloat(item.tax) > 0 && (
                <Text style={styles.vatDetails}>
                  (Inclusive of all taxes)
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

                <View style={[styles.summaryRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>
                    £{total.toFixed(2)}
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
                    £{total.toFixed(2)}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        />

        {/* Cart Summary */}
      </View>

      {/* Age Restriction Modal */}
      <Modal
        visible={showAgeModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.ageModalContainer}>
            <View style={styles.ageModalHeader}>
              <Ionicons name="warning" size={24} color="#f44336" />
              <Text style={styles.ageModalTitle}>Age Restriction Warning</Text>
            </View>
            <Text style={styles.ageModalText}>
              Your cart contains age-restricted items. You must meet the required age to purchase these products:
            </Text>

            <View style={styles.ageItemsList}>
              {ageRestrictedItems.map((item) => (
                <View key={item.id} style={styles.ageItemRow}>
                  <Text style={styles.ageItemName} numberOfLines={1}>{item.name}</Text>
                  <View style={styles.ageBadge}>
                    <Text style={styles.ageBadgeText}>{item.age}+</Text>
                  </View>
                </View>
              ))}
            </View>

            <Text style={styles.ageConfirmText}>
              By proceeding, you confirm that you are at least {highestAge} years old.
            </Text>

            <View style={styles.ageModalActions}>
              <TouchableOpacity
                style={styles.ageRemoveButton}
                onPress={() => {
                  ageRestrictedItems.forEach(item => removeFromCart(item.id));
                  setShowAgeModal(false);
                }}
              >
                <Text style={styles.ageRemoveText}>Remove Items</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.ageAckButton}
                onPress={() => {
                  setAgeAcknowledged(true);
                  setShowAgeModal(false);
                  router.push("/checkout");
                }}
              >
                <Text style={styles.ageAckText}>I Acknowledge</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  // Age Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  ageModalContainer: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    width: '100%',
    maxWidth: 400,
  },
  ageModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  ageModalTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: 'Outfit-Bold',
    color: '#f44336',
  },
  ageModalText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: 'Outfit-Regular',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  ageItemsList: {
    backgroundColor: theme.colors.surface.light,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  ageItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  ageItemName: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: 'Outfit-Medium',
    color: theme.colors.text.primary,
    marginRight: theme.spacing.sm,
  },
  ageBadge: {
    backgroundColor: '#f44336',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  ageBadgeText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'Outfit-Bold',
  },
  ageConfirmText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: 'Outfit-SemiBold',
    color: '#f44336',
    marginBottom: theme.spacing.xl,
  },
  ageModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  ageRemoveButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    alignItems: 'center',
  },
  ageRemoveText: {
    color: theme.colors.text.secondary,
    fontFamily: 'Outfit-Medium',
    fontSize: theme.typography.fontSize.base,
  },
  ageAckButton: {
    flex: 1,
    backgroundColor: '#f44336',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  ageAckText: {
    color: 'white',
    fontFamily: 'Outfit-SemiBold',
    fontSize: theme.typography.fontSize.base,
  },
});

export default Cart;
