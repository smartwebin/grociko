import SafeAreaWrapper from "@/components/SafeAreaWrapper";
import SafeAreaWrapper2 from "@/components/SafeAreaWrapper2";
import { useCart } from "@/providers/CartProvider";
import { getUserData, getUserOrders } from "@/services/apiService";
import theme from "@/utils/theme";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const Orders = () => {
  const { addToCart } = useCart();
  const [activeTab, setActiveTab] = useState("ongoing");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [ongoingOrders, setOngoingOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  // Load orders when screen focuses
  useFocusEffect(
    useCallback(() => {
      setPage(1);
      setHasMore(true);
      loadOrders(1, false); // false = replace existing
    }, []),
  );

  const loadOrders = async (pageNum = 1, append = false) => {
    try {
      // Show appropriate loader
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      // Get user data
      const user = await getUserData();
      if (!user) {
        Alert.alert(
          "Authentication Required",
          "Please sign in to view your orders",
          [{ text: "OK", onPress: () => router.replace("/signin") }],
        );
        return;
      }

      if (pageNum === 1) {
        setUserData(user);
      }

      // Fetch ongoing orders with pagination
      const ongoingResponse = await getUserOrders(user.id, "ongoing", {
        limit: 20,
        page: pageNum,
      });

      if (ongoingResponse.success) {
        if (append) {
          setOngoingOrders((prev) => [...prev, ...ongoingResponse.data]);
        } else {
          setOngoingOrders(ongoingResponse.data);
        }

        // Check if there are more orders
        if (activeTab === "ongoing") {
          setHasMore(ongoingResponse.data.length === 20);
        }
      }

      // Fetch completed orders with pagination
      const completedResponse = await getUserOrders(user.id, "completed", {
        limit: 20,
        page: pageNum,
      });

      if (completedResponse.success) {
        if (append) {
          setCompletedOrders((prev) => [...prev, ...completedResponse.data]);
        } else {
          setCompletedOrders(completedResponse.data);
        }

        // Check if there are more orders
        if (activeTab === "completed") {
          setHasMore(completedResponse.data.length === 20);
        }
      }
    } catch (error) {
      console.error("Error loading orders:", error);
      Alert.alert("Error", "Failed to load orders");
      setHasMore(false);
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadOrders(nextPage, true); // true = append to existing
    }
  };
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1);
    setHasMore(true);
  };

  const getCurrentOrders = () => {
    return activeTab === "ongoing" ? ongoingOrders : completedOrders;
  };

  const handleOrderPress = (order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const handleReorder = (order) => {
    Alert.alert(
      "Add to Cart",
      `Add all ${order.items.length} items from this order to your cart?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Add to Cart",
          onPress: () => {
            // Add all order items to cart with their original quantities
            let addedCount = 0;
            order.items.forEach((item) => {
              const cartItem = {
                id: item.id,
                name: item.name,
                unit: item.unit,
                mrp: item.unit_mrp,
                sellingPrice: item.price,
                image: item.image,
                quantity: item.quantity, // This is already the correct quantity from the order
              };
              addToCart(cartItem, item.quantity); // Pass the original quantity
              addedCount++;
            });

            Alert.alert(
              "Items Added!",
              `${addedCount} items have been added to your cart.`,
              [
                {
                  text: "Continue Shopping",
                  style: "default",
                },
                {
                  text: "View Cart",
                  onPress: () => router.push("/cart"),
                },
              ],
            );
          },
        },
      ],
    );
  };

  // Helper function to get payment method display info
  const getPaymentMethodInfo = (paymentMethod) => {
    if (paymentMethod === "online_payment") {
      return {
        icon: "card",
        text: "Online Payment",
        color: theme.colors.status.success,
        bgColor: theme.colors.status.success + "15",
      };
    } else if (paymentMethod === "click_and_collect") {
      return {
        icon: "cash",
        text: "Click & Collect",
        color: theme.colors.secondary.main,
        bgColor: theme.colors.secondary[50],
      };
    }
    return {
      icon: "help-circle",
      text: "N/A",
      color: theme.colors.text.tertiary,
      bgColor: theme.colors.surface.light,
    };
  };

  const renderOrderItem = ({ item }) => {
    const paymentInfo = getPaymentMethodInfo(item.paymentMethod);
    // console.log("renderOrderItem",item)
    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => handleOrderPress(item)}
      >
        {/* Order Header */}
        <View style={styles.orderHeader}>
          <View style={styles.orderInfo}>
            <Text style={styles.orderId}>Order #{item.id}</Text>
            <Text style={styles.orderDate}>{item.orderDate}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: `${item.statusColor}20` },
            ]}
          >
            <Text style={[styles.statusText, { color: item.statusColor }]}>
              {item.status}
            </Text>
          </View>
        </View>

        {/* Items Preview */}
        <View style={styles.itemsContainer}>
          <View style={styles.itemsPreview}>
            {item.items &&
              item.items.slice(0, 3).map((product, index) => (
                <View key={index} style={styles.itemPreview}>
                  <Image
                    source={
                      typeof product.image === "string"
                        ? { uri: product.image }
                        : product.image
                    }
                    style={styles.itemImage}
                    resizeMode="contain"
                  />
                  <Text style={styles.itemQuantity}>{product.quantity}</Text>
                </View>
              ))}
            {item.items && item.items.length > 3 && (
              <View style={styles.moreItems}>
                <Text style={styles.moreItemsText}>
                  +{item.items.length - 3}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.orderSummary}>
            <Text style={styles.itemCount}>
              {item.items ? item.items.length : 0} items
            </Text>
            <Text style={styles.totalAmount}>
              £{parseFloat(item.totalAmount || 0).toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Payment Method Display */}
        <View style={styles.paymentMethodContainer}>
          <View
            style={[
              styles.paymentMethodBadge,
              { backgroundColor: paymentInfo.bgColor },
            ]}
          >
            <Ionicons
              name={paymentInfo.icon}
              size={16}
              color={paymentInfo.color}
            />
            <Text
              style={[styles.paymentMethodText, { color: paymentInfo.color }]}
            >
              {paymentInfo.text}
            </Text>
          </View>
        </View>

        {/* Order Status/Actions */}
        <View style={styles.ongoingActions}>
          {(item.deliveredDate || item.deliveryTime) && (
            <Text style={styles.deliveredInfo}>
              Delivered on {item.deliveredDate} at {item.deliveryTime}
            </Text>
          )}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.detailsButton}
              onPress={() => handleOrderPress(item)}
            >
              <Text style={styles.detailsButtonText}>View Details</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.reorderButton}
              onPress={() => handleReorder(item)}
            >
              <Ionicons
                name="refresh-outline"
                size={16}
                color={theme.colors.secondary.main}
              />
              <Text style={styles.reorderButtonText}>Reorder</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name={
          activeTab === "ongoing" ? "time-outline" : "checkmark-circle-outline"
        }
        size={64}
        color={theme.colors.text.tertiary}
      />
      <Text style={styles.emptyTitle}>{"No Order History"}</Text>
      <Text style={styles.emptySubtitle}>
        {activeTab === "ongoing"
          ? "You have no orders in progress at the moment"
          : "You haven't completed any orders yet"}
      </Text>
    </View>
  );

  // Loading state
  if (loading) {
    return (
      <SafeAreaWrapper>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.main} />
          <Text style={styles.loadingText}>Loading orders...</Text>
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
          <Text style={styles.headerTitle}>My Orders</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Orders List */}
        <FlatList
          data={getCurrentOrders()}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item.id}
          style={styles.ordersList}
          contentContainerStyle={styles.ordersListContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5} // Load when 50% from bottom
          ListFooterComponent={() =>
            isLoadingMore ? (
              <ActivityIndicator
                size="small"
                color={theme.colors.primary.main}
                style={{ marginVertical: 20 }}
              />
            ) : null
          }
        />

        {/* Order Details Modal */}
        <Modal
          visible={showOrderDetails}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaWrapper2>
            <View style={styles.modalContainer}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowOrderDetails(false)}>
                  <Ionicons
                    name="close"
                    size={24}
                    color={theme.colors.text.primary}
                  />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>
                  Order #{selectedOrder?.id}
                </Text>
                <View style={styles.placeholder} />
              </View>

              <ScrollView style={styles.modalContent}>
                {selectedOrder && (
                  <>
                    {/* Order Status */}
                    <View style={styles.orderStatusSection}>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: `${selectedOrder.statusColor}20` },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            { color: selectedOrder.statusColor },
                          ]}
                        >
                          {selectedOrder.status}
                        </Text>
                      </View>
                      <Text style={styles.orderDateText}>
                        Ordered on {selectedOrder.orderDate}{" "}
                        {selectedOrder.orderTime
                          ? `at ${selectedOrder.orderTime}`
                          : ""}
                      </Text>
                      {selectedOrder.deliveredDate &&
                        selectedOrder.deliveryTime && (
                          <Text style={styles.deliveredDateText}>
                            Delivered on {selectedOrder.deliveredDate} at{" "}
                            {selectedOrder.deliveryTime}
                          </Text>
                        )}
                    </View>

                    {/* Items List */}
                    <View style={styles.itemsSection}>
                      <Text style={styles.sectionTitle}>Items Ordered</Text>
                      {selectedOrder.items &&
                        selectedOrder.items.map((item, index) => (
                          <View key={index} style={styles.modalOrderItem}>
                            <Image
                              source={
                                typeof item.image === "string"
                                  ? { uri: item.image }
                                  : item.image
                              }
                              style={styles.modalItemImage}
                              resizeMode="contain"
                            />
                            <View style={styles.modalItemDetails}>
                              <Text style={styles.modalItemName}>
                                {item.name}
                              </Text>
                              <Text style={styles.modalItemQuantity}>
                                Quantity: {item.quantity}
                              </Text>
                              <View style={styles.modalItemPriceBreakdown}>
                                <Text style={styles.modalItemBreakdownText}>
                                  Price: £
                                  {parseFloat(item.price || 0).toFixed(2)}
                                </Text>
                                {item.vat && parseFloat(item.vat) > 0 && (
                                  <Text style={styles.modalItemBreakdownText}>
                                    VAT: £{parseFloat(item.vat).toFixed(2)}
                                  </Text>
                                )}
                                <Text style={styles.modalItemBreakdownTotal}>
                                  Total: £
                                  {parseFloat(
                                    item.total_price || item.price || 0,
                                  ).toFixed(2)}
                                </Text>
                              </View>
                            </View>
                          </View>
                        ))}
                    </View>

                    {/* Billing Details */}
                    <View style={styles.billingSection}>
                      <Text style={styles.sectionTitle}>Billing Details</Text>
                      <View style={styles.billingCard}>
                        <View style={styles.billingRow}>
                          <Text style={styles.billingLabel}>Subtotal</Text>
                          <Text style={styles.billingValue}>
                            £
                            {parseFloat(selectedOrder.subtotal || 0).toFixed(2)}
                          </Text>
                        </View>
                        <View style={styles.billingRow}>
                          <Text style={styles.billingLabel}>
                            Delivery Charge
                          </Text>
                          <Text style={styles.billingValue}>
                            £
                            {parseFloat(selectedOrder.deliveryFee || 0).toFixed(
                              2,
                            )}
                          </Text>
                        </View>
                        <View style={styles.billingRow}>
                          <Text style={styles.billingLabel}>VAT (20%)</Text>
                          <Text style={styles.billingValue}>
                            £{parseFloat(selectedOrder.vat || 0).toFixed(2)}
                          </Text>
                        </View>
                        <View style={styles.billingRow}>
                          <Text
                            style={{
                              fontSize: theme.typography.fontSize.base,
                              fontFamily: "Outfit-Regular",
                              color: "red",
                            }}
                          >
                            Discount
                          </Text>
                          <Text
                            style={{
                              fontSize: theme.typography.fontSize.base,
                              fontFamily: "Outfit-SemiBold",
                              color: "red",
                            }}
                          >
                            {parseFloat(selectedOrder.discount) > 0
                              ? `- £${parseFloat(
                                  selectedOrder.discount,
                                ).toFixed(2)}`
                              : `£${parseFloat(
                                  selectedOrder.discount || 0,
                                ).toFixed(2)}`}
                          </Text>
                        </View>
                        <View
                          style={[styles.billingRow, styles.totalBillingRow]}
                        >
                          <Text style={styles.billingTotalLabel}>
                            Total Paid
                          </Text>
                          <Text style={styles.billingTotalValue}>
                            £
                            {parseFloat(selectedOrder.totalAmount || 0).toFixed(
                              2,
                            )}
                          </Text>
                        </View>
                        <View style={styles.billingRow}>
                          <Text style={styles.billingLabel}>
                            Payment Method
                          </Text>
                          <Text style={styles.billingValue}>
                            {selectedOrder.paymentMethod == "online_payment"
                              ? "Online Payment"
                              : selectedOrder.paymentMethod ==
                                  "click_and_collect"
                                ? "Click & Collect"
                                : "N/A"}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </>
                )}
              </ScrollView>

              {/* Modal Actions */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.reorderModalButton}
                  onPress={() => {
                    setShowOrderDetails(false);
                    handleReorder(selectedOrder);
                  }}
                >
                  <Ionicons
                    name="refresh-outline"
                    size={20}
                    color={theme.colors.text.white}
                  />
                  <Text style={styles.reorderModalButtonText}>
                    Reorder Items
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaWrapper2>
        </Modal>
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
    backgroundColor: theme.colors.background.primary,
  },
  loadingText: {
    marginTop: theme.spacing.lg,
    fontSize: theme.typography.fontSize.base,
    fontFamily: "Outfit-Medium",
    color: theme.colors.text.secondary,
  },

  // Header Styles
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.background.primary,
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
    fontSize: theme.typography.fontSize.xl,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.text.primary,
    flex: 1,
    textAlign: "center",
  },
  headerRight: {
    width: 40,
  },

  // Orders List Styles
  ordersList: {
    flex: 1,
  },
  ordersListContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing["6xl"],
  },

  // Order Card Styles
  orderCard: {
    backgroundColor: theme.colors.surface.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.lg,
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  orderDate: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: "Outfit-Regular",
    color: theme.colors.text.secondary,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  statusText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: "Outfit-Medium",
  },

  // Items Styles
  itemsContainer: {
    marginBottom: theme.spacing.md,
  },
  itemsPreview: {
    flexDirection: "row",
    marginBottom: theme.spacing.sm,
  },
  itemPreview: {
    marginRight: theme.spacing.sm,
    alignItems: "center",
  },
  itemImage: {
    width: 40,
    height: 40,
    backgroundColor: theme.colors.surface.light,
    borderRadius: theme.borderRadius.sm,
  },
  itemQuantity: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: theme.colors.secondary.main,
    color: theme.colors.text.white,
    fontSize: 10,
    fontFamily: "Outfit-Medium",
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    textAlign: "center",
    lineHeight: 16,
  },
  moreItems: {
    width: 40,
    height: 40,
    backgroundColor: theme.colors.surface.light,
    borderRadius: theme.borderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  moreItemsText: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: "Outfit-Medium",
    color: theme.colors.text.secondary,
  },
  orderSummary: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemCount: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: "Outfit-Regular",
    color: theme.colors.text.secondary,
  },
  totalAmount: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.text.primary,
  },

  // Payment Method Styles
  paymentMethodContainer: {
    marginBottom: theme.spacing.md,
    paddingTop: theme.spacing.sm,
  },
  paymentMethodBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.xs,
  },
  paymentMethodText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: "Outfit-Medium",
  },

  // Actions Styles
  ongoingActions: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.surface.divider,
    paddingTop: theme.spacing.md,
  },
  actionsRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  deliveredInfo: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: "Outfit-Medium",
    color: theme.colors.status.success,
    marginBottom: theme.spacing.xs,
  },
  detailsButton: {
    flex: 1,
    backgroundColor: theme.colors.primary.main,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.xs,
  },
  detailsButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.text.white,
  },
  reorderButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.secondary.main,
    gap: theme.spacing.xs,
  },
  reorderButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: "Outfit-Medium",
    color: theme.colors.secondary.main,
  },

  // Empty State Styles
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: theme.spacing["6xl"],
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.lg,
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
    paddingHorizontal: theme.spacing["3xl"],
    lineHeight:
      theme.typography.fontSize.base * theme.typography.lineHeight.normal,
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
    paddingBottom: theme.spacing.lg,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface.border,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.text.primary,
  },
  placeholder: {
    width: 24,
    height: 24,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  orderStatusSection: {
    alignItems: "center",
    paddingVertical: theme.spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface.divider,
    marginBottom: theme.spacing.xl,
  },
  orderDateText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: "Outfit-Regular",
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.sm,
  },
  deliveredDateText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: "Outfit-Medium",
    color: theme.colors.status.success,
    marginTop: theme.spacing.sm,
  },
  itemsSection: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
  },
  modalOrderItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  modalItemImage: {
    width: 60,
    height: 60,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surface.light,
  },
  modalItemDetails: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  modalItemName: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  modalItemQuantity: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: "Outfit-Regular",
    color: theme.colors.text.secondary,
  },
  modalItemPrice: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.text.primary,
  },
  billingSection: {
    marginBottom: theme.spacing.xl,
  },
  billingCard: {
    backgroundColor: theme.colors.surface.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  billingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  billingLabel: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: "Outfit-Regular",
    color: theme.colors.text.secondary,
  },
  billingValue: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.text.primary,
  },
  totalBillingRow: {
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surface.border,
    marginBottom: 0,
  },
  billingTotalLabel: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.text.primary,
  },
  billingTotalValue: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.primary.main,
  },
  modalActions: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surface.border,
  },
  reorderModalButton: {
    backgroundColor: theme.colors.primary.main,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.sm,
  },
  reorderModalButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.text.white,
  },
  modalItemVat: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: "Outfit-Regular",
    color: theme.colors.text.tertiary,
    marginTop: 2,
  },
  modalOrderItem: {
    flexDirection: "row",
    alignItems: "flex-start", // Changed from "center" to "flex-start"
    backgroundColor: theme.colors.surface.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },

  modalItemPriceBreakdown: {
    marginTop: theme.spacing.xs,
    gap: 2,
  },

  modalItemBreakdownText: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: "Outfit-Regular",
    color: theme.colors.text.secondary,
  },

  modalItemBreakdownTotal: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.primary.main,
    marginTop: 2,
  },
});

export default Orders;
