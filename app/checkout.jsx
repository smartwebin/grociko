import SafeAreaWrapper2 from "@/components/SafeAreaWrapper2";
import { useCart } from "@/providers/CartProvider";
import {
  confirmPaymentAndCreateOrder,
  createOrder,
  createPaymentIntent,
  getDeliveryCharge,
  getOfferCodes,
  getUserAddresses,
  getUserData,
  verifyStock,
} from "@/services/apiService";

import theme from "@/utils/theme";
import { Ionicons } from "@expo/vector-icons";
import { useStripe } from "@stripe/stripe-react-native";
import { Image } from "expo-image";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const Checkout = () => {
  const { items, getCartSummary, clearCart, removeFromCart, updateQuantity } = useCart();
  const { formattedPrice, totalItems } = getCartSummary();
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [userData, setUserData] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("card");
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [showPromoSuggestions, setShowPromoSuggestions] = useState(false);
  const [promoCodes, setPromoCodes] = useState([]);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [deliveryZone, setDeliveryZone] = useState("");
  const [isServiceable, setIsServiceable] = useState(true);
  const [serviceabilityMessage, setServiceabilityMessage] = useState("");
  
  // Stock verification states
  const [stockVerified, setStockVerified] = useState(false);
  const [unavailableItems, setUnavailableItems] = useState([]);
  const [verifying, setVerifying] = useState(false);
  const [stockChanges, setStockChanges] = useState([]);

  // Stripe payment states
  const [processingPayment, setProcessingPayment] = useState(false);
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  // Calculate VAT based on product vat_cat
  const calculateVATAmount = () => {
    let vatAmount = 0;
    items.forEach((item) => {
      const itemPrice = parseFloat(item.sellingPrice) * item.quantity;
      // Only apply VAT if vat_cat is 'B'
      if (item.vat_cat === "B") {
        vatAmount += itemPrice * 0.2; // 20% VAT
      }
    });
    return vatAmount;
  };

  const subtotal = parseFloat(formattedPrice.replace(/[£$,]/g, "")) || 0;
  const promoDiscount = appliedPromo
    ? appliedPromo.offer_percentage
      ? subtotal * (parseFloat(appliedPromo.offer_percentage) / 100)
      : parseFloat(appliedPromo.offer_price || 0)
    : 0;
  const discountedSubtotal = subtotal - promoDiscount;
  const vatAmount = calculateVATAmount();
  const totalAmount = discountedSubtotal + deliveryFee + vatAmount;

  const paymentMethods = [
    {
      id: "card",
      name: "Online Payment",
      icon: "card-outline",
      details: "Pay with Card, Apple Pay, Google Pay",
      description: "Secure payment via Stripe",
    },
    {
      id: "cod",
      name: "Click & Collect",
      icon: "storefront-outline",
      details: "Pay when you collect",
      description: "Collect from store and pay in cash",
    },
  ];

  // Load data on screen focus
  useFocusEffect(
    useCallback(() => {
      loadCheckoutData();
    }, [])
  );

  const loadCheckoutData = async () => {
    try {
      setLoading(true);

      // Get user data
      const user = await getUserData();
      if (!user) {
        Alert.alert("Authentication Required", "Please sign in to continue", [
          {
            text: "OK",
            onPress: () =>
              router.replace({
                pathname: "/signin",
                params: {
                  checkout: 1,
                },
              }),
          },
        ]);
        return;
      }
      setUserData(user);

      // Get user addresses
      const addressesResponse = await getUserAddresses(user.id);
      if (addressesResponse.success && addressesResponse.data.length > 0) {
        setAddresses(addressesResponse.data);

        // Select default address or first address
        const defaultAddr = addressesResponse.data.find(
          (addr) => addr.is_default === "yes"
        );
        const selectedAddr = defaultAddr || addressesResponse.data[0];
        setSelectedAddress(selectedAddr);

        // Get delivery charge for selected address
        await loadDeliveryCharge(selectedAddr.id);
      } else {
        // No addresses found, prompt to add one
        Alert.alert(
          "No Delivery Address",
          "Please add a delivery address to continue",
          [
            { text: "Cancel", style: "cancel", onPress: () => router.back() },
            {
              text: "Add Address",
              onPress: () => router.push("/address-management"),
            },
          ]
        );
      }

      // Load available promo codes
      const promoResponse = await getOfferCodes({ status: "active" });
      if (promoResponse.success) {
        setPromoCodes(promoResponse.data);
      }
    } catch (error) {
      console.error("Error loading checkout data:", error);
      Alert.alert("Error", "Failed to load checkout information");
    } finally {
      setLoading(false);
    }
  };

  const loadDeliveryCharge = async (addressId) => {
    try {
      const response = await getDeliveryCharge(addressId);

      if (response.success && response.data) {
        const chargeData = response.data[0] || response.data;
        setDeliveryFee(parseFloat(chargeData.delivery_charge) || 0);
        setDeliveryZone(chargeData.delivery_zone || "");
        setIsServiceable(true);
        setServiceabilityMessage("");
      } else {
        // No delivery zone found for this postcode - not serviceable
        setIsServiceable(false);
        setServiceabilityMessage(
          "Sorry, we don't deliver to this postcode yet. Please select a different address or contact support."
        );
        setDeliveryFee(0);
        setDeliveryZone("");
      }
    } catch (error) {
      console.error("Error loading delivery charge:", error);
      setIsServiceable(false);
      setServiceabilityMessage(
        "Unable to verify delivery availability for this address."
      );
      setDeliveryFee(0);
      setDeliveryZone("");
    }
  };

  // Verify stock before checkout
  const verifyStockAvailability = async () => {
    try {
      setVerifying(true);

      // Prepare product data for verification
      const product_data = items.map((item) => ({
        prod_id: item.id,
        quantity: item.quantity,
      }));

      const response = await verifyStock(product_data);

      if (!response.success) {
        Alert.alert("Error", response.error || "Failed to verify stock");
        return false;
      }

      const stockData = response.data;

      if (!stockData.all_available) {
        // Track changes made to cart
        const changes = [];
        
        // Process unavailable products
        stockData.unavailable_products.forEach((product) => {
          const cartItem = items.find(item => item.id === product.prod_id);
          
          if (product.available_quantity > 0 && product.available_quantity < product.requested_quantity) {
            // Reduce quantity to available stock
            updateQuantity(product.prod_id, product.available_quantity);
            changes.push({
              type: 'reduced',
              name: product.name,
              oldQuantity: product.requested_quantity,
              newQuantity: product.available_quantity,
            });
          } else if (product.available_quantity === 0) {
            // Remove item completely
            removeFromCart(product.prod_id);
            changes.push({
              type: 'removed',
              name: product.name,
              reason: product.reason,
            });
          }
        });

        setStockChanges(changes);
        setUnavailableItems(stockData.unavailable_products);
        setStockVerified(false);

        // Build alert message
        let alertMessage = "The following changes were made to your cart:\n\n";
        
        const removedItems = changes.filter(c => c.type === 'removed');
        const reducedItems = changes.filter(c => c.type === 'reduced');
        
        if (removedItems.length > 0) {
          alertMessage += "Removed Items:\n";
          removedItems.forEach(item => {
            alertMessage += `• ${item.name} (${item.reason})\n`;
          });
          alertMessage += "\n";
        }
        
        if (reducedItems.length > 0) {
          alertMessage += "Quantity Adjusted:\n";
          reducedItems.forEach(item => {
            alertMessage += `• ${item.name}: ${item.oldQuantity} → ${item.newQuantity}\n`;
          });
        }

        alertMessage += "\nWould you like to continue with the updated cart?";

        Alert.alert(
          "Cart Updated",
          alertMessage,
          [
            {
              text: "Cancel",
              style: "cancel",
              onPress: () => {
                setStockChanges([]);
              }
            },
            {
              text: "Continue",
              onPress: () => {
                setUnavailableItems([]);
                setStockVerified(true);
                setStockChanges([]);
              },
            },
          ]
        );
        return false;
      }

      setStockVerified(true);
      setUnavailableItems([]);
      setStockChanges([]);
      return true;
    } catch (error) {
      console.error("Error verifying stock:", error);
      Alert.alert("Error", "Failed to verify product availability");
      return false;
    } finally {
      setVerifying(false);
    }
  };

  // Get suggested promo codes based on subtotal
  const getSuggestedPromos = () => {
    return promoCodes.filter(
      (promo) =>
        subtotal >= parseFloat(promo.minimum_order || 0) &&
        !appliedPromo &&
        promo.status === "active"
    );
  };

  const handlePaymentMethodSelect = (method) => {
    setSelectedPaymentMethod(method.id);
  };

  const handleApplyPromo = () => {
    const foundPromo = promoCodes.find(
      (p) => p.offer_code.toLowerCase() === promoCode.toLowerCase()
    );

    if (!foundPromo) {
      Alert.alert("Invalid Code", "Please enter a valid promo code.");
      return;
    }

    if (foundPromo.status !== "active") {
      Alert.alert("Expired Code", "This promo code has expired.");
      return;
    }

    const minOrder = parseFloat(foundPromo.minimum_order || 0);
    if (subtotal < minOrder) {
      Alert.alert(
        "Minimum Order Not Met",
        `This promo code requires a minimum order of £${minOrder.toFixed(2)}.`
      );
      return;
    }

    setAppliedPromo(foundPromo);
    setPromoCode("");
    setShowPromoSuggestions(false);

    const discountAmount = foundPromo.offer_percentage
      ? subtotal * (parseFloat(foundPromo.offer_percentage) / 100)
      : parseFloat(foundPromo.offer_price || 0);

    Alert.alert(
      "Promo Applied!",
      `You saved £${discountAmount.toFixed(2)} with ${foundPromo.offer_code}!`
    );
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
  };

  const handlePromoSuggestion = (promo) => {
    setPromoCode(promo.offer_code);
    setShowPromoSuggestions(false);
  };

  const handleAddressChange = () => {
    if (addresses.length > 1) {
      setShowAddressModal(true);
    } else {
      router.push("/address-management");
    }
  };

  const handleSelectAddress = async (address) => {
    setSelectedAddress(address);
    setShowAddressModal(false);
    await loadDeliveryCharge(address.id);
  };

  // Handle Card Payment with Stripe Payment Sheet
  const handleCardPayment = async () => {
    try {
      setProcessingPayment(true);
      setPlacing(true);

      // Step 1: Create Payment Intent
      const paymentIntentResponse = await createPaymentIntent({
        user_id: userData.id,
        amount: totalAmount,
        currency: "gbp",
        description: `Grociko Order - ${totalItems} items`,
        metadata: {
          order_items: totalItems,
          subtotal: subtotal.toFixed(2),
          delivery_fee: deliveryFee.toFixed(2),
          vat_amount: vatAmount.toFixed(2),
        },
      });

      if (!paymentIntentResponse.success) {
        throw new Error(
          paymentIntentResponse.error || "Failed to initialize payment"
        );
      }

      // Step 2: Initialize Payment Sheet
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: "Grociko",
        paymentIntentClientSecret: paymentIntentResponse.data.client_secret,
        defaultBillingDetails: {
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
        },
        allowsDelayedPaymentMethods: false,
        returnURL: "grociko://checkout",
      });

      if (initError) {
        throw new Error(initError.message || "Failed to initialize payment");
      }

      // Step 3: Present Payment Sheet
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        // User cancelled or error occurred
        if (presentError.code === "Canceled") {
          return;
        }
        throw new Error(presentError.message || "Payment failed");
      }

      // Step 4: Prepare product data array matching backend format
      const product_data = items.map((item) => ({
        prod_id: item.id,
        quantity: item.quantity,
      }));

      // Step 5: Create order with confirmed payment
      const orderData = {
        payment_intent_id: paymentIntentResponse.data.payment_intent_id,
        user_id: userData.id,
        address_id: selectedAddress.id,
        product_data: JSON.stringify(product_data),
        off_code_id: appliedPromo ? appliedPromo.id : "",
        pay_method: "online_payment",
      };

      const orderResponse = await confirmPaymentAndCreateOrder(orderData);

      if (!orderResponse.success) {
        throw new Error(orderResponse.error || "Failed to create order");
      }

      // Clear cart
      clearCart();

      router.replace("/success");
    } catch (error) {
      console.error("❌ Payment Error:", error);
      Alert.alert(
        "Payment Failed",
        error.message || "Unable to process payment. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setProcessingPayment(false);
      setPlacing(false);
    }
  };

  // Handle Click & Collect Order
  const handleClickAndCollectOrder = async () => {
    try {
      setPlacing(true);

      // Prepare product data array matching backend format
      const product_data = items.map((item) => ({
        prod_id: item.id,
        quantity: item.quantity,
      }));

      // Prepare order data matching backend API
      const orderData = {
        user_id: userData.id,
        address_id: selectedAddress.id,
        product_data: JSON.stringify(product_data),
        off_code_id: appliedPromo ? appliedPromo.id : "",
        pay_method: "click_and_collect",
      };

      // Create order
      const response = await createOrder(orderData);

      if (response.success) {
        // Clear cart
        clearCart();

        router.replace("/success");
      } else {
        Alert.alert(
          "Order Failed",
          response.error || "Unable to place order. Please try again."
        );
      }
    } catch (error) {
      console.error("Error placing order:", error);
      Alert.alert("Error", "Failed to place order. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  // Main place order handler
  const handlePlaceOrder = async () => {
    // Validations
    if (!userData) {
      Alert.alert("Error", "User data not found. Please try again.");
      return;
    }

    if (!selectedAddress) {
      Alert.alert("Error", "Please select a delivery address");
      return;
    }

    if (items.length === 0) {
      Alert.alert("Error", "Your cart is empty");
      return;
    }

    if (!isServiceable) {
      Alert.alert("Delivery Not Available", serviceabilityMessage);
      return;
    }

    // Verify stock before proceeding
    const stockAvailable = await verifyStockAvailability();
    if (!stockAvailable) {
      return;
    }

    // Route to appropriate payment handler
    if (selectedPaymentMethod === "card") {
      await handleCardPayment();
    } else {
      await handleClickAndCollectOrder();
    }
  };

  if (loading) {
    return (
      <SafeAreaWrapper2>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.main} />
          <Text style={styles.loadingText}>Loading checkout...</Text>
        </View>
      </SafeAreaWrapper2>
    );
  }

  const suggestedPromos = getSuggestedPromos();

  return (
    <SafeAreaWrapper2>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={theme.colors.text.primary}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Serviceability Warning Message */}
          {!isServiceable && serviceabilityMessage && (
            <View style={styles.warningBanner}>
              <View style={styles.warningContent}>
                <Ionicons
                  name="warning"
                  size={24}
                  color={theme.colors.status.warning}
                />
                <View style={styles.warningTextContainer}>
                  <Text style={styles.warningTitle}>Delivery Unavailable</Text>
                  <Text style={styles.warningMessage}>
                    {serviceabilityMessage}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Stock Changes Banner */}
          {stockChanges.length > 0 && (
            <View style={styles.stockChangesBanner}>
              <View style={styles.warningContent}>
                <Ionicons
                  name="information-circle"
                  size={24}
                  color={theme.colors.status.info}
                />
                <View style={styles.warningTextContainer}>
                  <Text style={styles.warningTitle}>Cart Updated</Text>
                  {stockChanges.map((change, index) => (
                    <Text key={index} style={styles.changeText}>
                      {change.type === 'removed' 
                        ? `• ${change.name} removed (${change.reason})`
                        : `• ${change.name}: ${change.oldQuantity} → ${change.newQuantity}`
                      }
                    </Text>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* Delivery Address Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Delivery Address</Text>
              <TouchableOpacity onPress={handleAddressChange}>
                <Text style={styles.changeText}>Change</Text>
              </TouchableOpacity>
            </View>

            {selectedAddress && (
              <View style={styles.addressCard}>
                <View style={styles.addressIconContainer}>
                  <Ionicons
                    name="location"
                    size={20}
                    color={theme.colors.primary.main}
                  />
                </View>
                <View style={styles.addressInfo}>
                  <Text style={styles.addressType}>
                    {selectedAddress.address1}
                  </Text>
                  <Text style={styles.addressText}>
                    {selectedAddress.address2}
                    {selectedAddress.address3
                      ? `, ${selectedAddress.address3}`
                      : ""}
                  </Text>
                  <Text style={styles.addressCity}>
                    {selectedAddress.city}, {selectedAddress.pincode}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Order Items Summary */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Order Items</Text>
              <Text style={styles.itemCount}>{totalItems} items</Text>
            </View>

            {items.map((item, index) => {
              // Calculate VAT if applicable
              const vatRate = item.vat_cat === "B" ? 0.2 : 0;
              const itemVatAmount = item.sellingPrice * vatRate * item.quantity;
              const itemSubtotal = item.sellingPrice * item.quantity;
              const itemTotal = itemSubtotal + itemVatAmount;

              return (
                <View
                  key={item.id}
                  style={styles.orderItem}
                >
                  <Image
                    source={{
                      uri: item.image.uri ? item.image.uri : item.image,
                    }}
                    style={styles.orderItemImage}
                    contentFit="cover"
                  />
                  <View style={styles.orderItemInfo}>
                    <Text
                      style={styles.orderItemName}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                    <Text
                      style={styles.orderItemDetails}
                    >
                      {item.quantity} x £{item.sellingPrice.toFixed(2)}
                    </Text>
                    {item.vat_cat === "B" && (
                      <Text style={styles.vatDetails}>
                        VAT: £{itemVatAmount.toFixed(2)}
                      </Text>
                    )}
                  </View>
                  <Text
                    style={styles.orderItemTotal}
                  >
                    £{itemTotal.toFixed(2)}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Payment Method Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Method</Text>

            {paymentMethods.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.paymentMethod,
                  selectedPaymentMethod === method.id &&
                    styles.selectedPaymentMethod,
                  !isServiceable && styles.paymentMethodDisabled,
                ]}
                onPress={() =>
                  isServiceable && handlePaymentMethodSelect(method)
                }
                disabled={!isServiceable}
              >
                <View style={styles.paymentMethodContent}>
                  <View
                    style={[
                      styles.radioButton,
                      selectedPaymentMethod === method.id &&
                        styles.radioButtonSelected,
                    ]}
                  >
                    {selectedPaymentMethod === method.id && (
                      <View style={styles.radioButtonInner} />
                    )}
                  </View>
                  <View style={styles.paymentIconContainer}>
                    <Ionicons
                      name={method.icon}
                      size={24}
                      color={
                        !isServiceable
                          ? theme.colors.text.muted
                          : selectedPaymentMethod === method.id
                          ? theme.colors.primary.main
                          : theme.colors.text.secondary
                      }
                    />
                  </View>
                  <View style={styles.paymentMethodInfo}>
                    <Text
                      style={[
                        styles.paymentMethodName,
                        !isServiceable && styles.disabledText,
                      ]}
                    >
                      {method.name}
                    </Text>
                    <Text
                      style={[
                        styles.paymentMethodDetails,
                        !isServiceable && styles.disabledText,
                      ]}
                    >
                      {method.details}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Payment Info Note - Only show when online payment is selected */}
          {selectedPaymentMethod === "card" && isServiceable && (
            <View style={styles.section}>
              <View style={styles.paymentInfoCard}>
                <View style={styles.paymentInfoHeader}>
                  <Ionicons
                    name="shield-checkmark"
                    size={24}
                    color={theme.colors.status.success}
                  />
                  <Text style={styles.paymentInfoTitle}>Secure Payment</Text>
                </View>
                <Text style={styles.paymentInfoText}>
                  Complete your payment securely with Stripe. Accepts all major
                  credit cards, Apple Pay, and Google Pay.
                </Text>
              </View>
            </View>
          )}

          {/* Promo Code Section */}
          <View style={styles.section}>
            {appliedPromo ? (
              <View style={styles.appliedPromoContainer}>
                <View style={styles.appliedPromoContent}>
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={theme.colors.status.success}
                  />
                  <View style={styles.appliedPromoInfo}>
                    <Text style={styles.appliedPromoCode}>
                      {appliedPromo.offer_code}
                    </Text>
                    <Text style={styles.appliedPromoDesc}>
                      You saved £{promoDiscount.toFixed(2)}!
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={handleRemovePromo}
                  style={styles.removePromoButton}
                >
                  <Ionicons
                    name="close-circle"
                    size={24}
                    color={theme.colors.text.secondary}
                  />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.promoContainer}>
                <Text style={styles.sectionTitle}>Have a Promo Code?</Text>
                <View style={styles.promoInputContainer}>
                  <TextInput
                    style={styles.promoInput}
                    placeholder="Enter promo code"
                    placeholderTextColor={theme.colors.text.placeholder}
                    value={promoCode}
                    onChangeText={setPromoCode}
                    autoCapitalize="characters"
                  />
                  <TouchableOpacity
                    style={[
                      styles.applyButton,
                      !promoCode && styles.applyButtonDisabled,
                    ]}
                    onPress={handleApplyPromo}
                    disabled={!promoCode}
                  >
                    <Text style={styles.applyButtonText}>Apply</Text>
                  </TouchableOpacity>
                </View>

                {/* Suggested Promo Codes */}
                {suggestedPromos.length > 0 && !showPromoSuggestions && (
                  <TouchableOpacity
                    onPress={() => setShowPromoSuggestions(true)}
                    style={styles.viewPromosButton}
                  >
                    <Text style={styles.viewPromosText}>
                      View {suggestedPromos.length} available promo
                      {suggestedPromos.length !== 1 ? "s" : ""}
                    </Text>
                    <Ionicons
                      name="chevron-down"
                      size={16}
                      color={theme.colors.primary.main}
                    />
                  </TouchableOpacity>
                )}

                {showPromoSuggestions && suggestedPromos.length > 0 && (
                  <View style={styles.promoSuggestions}>
                    <View style={styles.suggestionsHeader}>
                      <Text style={styles.suggestionsTitle}>
                        Available Offers
                      </Text>
                      <TouchableOpacity
                        onPress={() => setShowPromoSuggestions(false)}
                      >
                        <Ionicons
                          name="chevron-up"
                          size={16}
                          color={theme.colors.text.secondary}
                        />
                      </TouchableOpacity>
                    </View>

                    {suggestedPromos.map((promo) => (
                      <TouchableOpacity
                        key={promo.id}
                        style={styles.promoSuggestion}
                        onPress={() => handlePromoSuggestion(promo)}
                      >
                        <View style={styles.promoSuggestionContent}>
                          <Text style={styles.promoSuggestionCode}>
                            {promo.offer_code}
                          </Text>
                          <Text style={styles.promoSuggestionDesc}>
                            {promo.offer_percentage
                              ? `${promo.offer_percentage}% OFF`
                              : `£${promo.offer_price} OFF`}
                            {promo.minimum_order &&
                              ` on orders above £${promo.minimum_order}`}
                          </Text>
                        </View>
                        <Ionicons
                          name="chevron-forward"
                          size={20}
                          color={theme.colors.text.secondary}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Order Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Summary</Text>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>£{subtotal.toFixed(2)}</Text>
            </View>

            {promoDiscount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, styles.discountLabel]}>
                  Discount
                </Text>
                <Text style={[styles.summaryValue, styles.discountValue]}>
                  -£{promoDiscount.toFixed(2)}
                </Text>
              </View>
            )}

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery Fee</Text>
              <Text style={styles.summaryValue}>
                {isServiceable ? `£${deliveryFee.toFixed(2)}` : "N/A"}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>VAT (20%)</Text>
              <Text style={styles.summaryValue}>£{vatAmount.toFixed(2)}</Text>
            </View>

            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>
                {isServiceable ? `£${totalAmount.toFixed(2)}` : "N/A"}
              </Text>
            </View>
          </View>
          <View style={styles.bottomSection}>
          <TouchableOpacity
            style={[
              styles.placeOrderButton,
              (placing || processingPayment || !isServiceable || verifying) &&
                styles.placeOrderButtonDisabled,
            ]}
            onPress={handlePlaceOrder}
            disabled={placing || processingPayment || !isServiceable || verifying}
          >
            {placing || processingPayment || verifying ? (
              <View style={styles.loadingButtonContent}>
                <ActivityIndicator size="small" color={theme.colors.text.white} />
                <Text style={styles.placeOrderText}>
                  {verifying ? "Verifying..." : processingPayment ? "Processing Payment..." : "Placing Order..."}
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.placeOrderText}>
                  {!isServiceable
                    ? "Delivery Unavailable"
                    : selectedPaymentMethod === "card"
                    ? "Pay Now"
                    : "Place Order"}
                </Text>
                {isServiceable && (
                  <Text style={styles.placeOrderPrice}>
                    £{totalAmount.toFixed(2)}
                  </Text>
                )}
              </>
            )}
          </TouchableOpacity>
        </View>
        </ScrollView>

        

        {/* Address Selection Modal */}
        <Modal
          visible={showAddressModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowAddressModal(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowAddressModal(false)}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Address</Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setShowAddressModal(false)}
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color={theme.colors.text.primary}
                  />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.addressList}>
                {addresses.map((address) => (
                  <TouchableOpacity
                    key={address.id}
                    style={[
                      styles.addressOption,
                      selectedAddress?.id === address.id &&
                        styles.selectedAddressOption,
                    ]}
                    onPress={() => handleSelectAddress(address)}
                  >
                    <View style={styles.addressOptionContent}>
                      <Ionicons
                        name="location"
                        size={20}
                        color={
                          selectedAddress?.id === address.id
                            ? theme.colors.primary.main
                            : theme.colors.text.secondary
                        }
                      />
                      <View style={styles.addressOptionText}>
                        <Text style={styles.addressOptionTitle}>
                          {address.address1}
                        </Text>
                        <Text style={styles.addressOptionAddress}>
                          {address.address2}, {address.city}
                        </Text>
                      </View>
                    </View>
                    {selectedAddress?.id === address.id && (
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color={theme.colors.primary.main}
                      />
                    )}
                  </TouchableOpacity>
                ))}

                <TouchableOpacity
                  style={styles.addNewAddressButton}
                  onPress={() => {
                    setShowAddressModal(false);
                    router.push("/address-management");
                  }}
                >
                  <Ionicons
                    name="add-circle-outline"
                    size={24}
                    color={theme.colors.primary.main}
                  />
                  <Text style={styles.addNewAddressText}>Add New Address</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </SafeAreaWrapper2>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: theme.spacing.md,
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
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface.border,
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
  },
  vatLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: "Outfit-Regular",
    color: theme.colors.text.tertiary,
  },
  vatDetails: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: "Outfit-Regular",
    color: theme.colors.text.tertiary,
    marginTop: 2,
  },
  // Scroll View Styles
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    // paddingBottom: theme.spacing["4xl"],
  },

  // Warning Banner Styles
  warningBanner: {
    backgroundColor: theme.colors.status.warning + "15",
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.status.warning,
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
  },
  stockChangesBanner: {
    backgroundColor: theme.colors.status.info + "15",
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.status.info,
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
  },
  warningContent: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  warningTextContainer: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  warningTitle: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.status.warning,
    marginBottom: theme.spacing.xs,
  },
  warningMessage: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: "Outfit-Regular",
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  changeText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: "Outfit-Regular",
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs / 2,
  },

  // Section Styles
  section: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface.divider,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.text.primary,
  },
  itemCount: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: "Outfit-Regular",
    color: theme.colors.text.secondary,
  },

  // Address Card Styles
  addressCard: {
    flexDirection: "row",
    backgroundColor: theme.colors.surface.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  addressIconContainer: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.primary[50],
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.md,
  },
  addressInfo: {
    flex: 1,
  },
  addressType: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs / 2,
  },
  addressText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: "Outfit-Regular",
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs / 2,
  },
  addressCity: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: "Outfit-Regular",
    color: theme.colors.text.secondary,
  },

  // Order Items Styles
  orderItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface.divider,
  },
  orderItemImage: {
    width: 50,
    height: 50,
    borderRadius: theme.borderRadius.md,
    marginRight: theme.spacing.md,
  },
  orderItemInfo: {
    flex: 1,
  },
  orderItemName: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: "Outfit-Medium",
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs / 2,
  },
  orderItemDetails: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: "Outfit-Regular",
    color: theme.colors.text.secondary,
  },
  orderItemTotal: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.text.primary,
  },
  moreItems: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: "Outfit-Regular",
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.sm,
    textAlign: "center",
  },

  // Payment Method Styles
  paymentMethod: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  selectedPaymentMethod: {
    borderColor: theme.colors.primary.main,
    backgroundColor: theme.colors.primary[50],
  },
  paymentMethodDisabled: {
    opacity: 0.5,
    backgroundColor: theme.colors.surface.light,
  },
  paymentMethodContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.colors.surface.border,
    marginRight: theme.spacing.md,
    justifyContent: "center",
    alignItems: "center",
  },
  radioButtonSelected: {
    borderColor: theme.colors.primary.main,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary.main,
  },
  paymentIconContainer: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.surface.light,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.md,
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodName: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs / 2,
  },
  paymentMethodDetails: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: "Outfit-Regular",
    color: theme.colors.text.secondary,
  },
  disabledText: {
    color: theme.colors.text.muted,
  },

  // Payment Info Card
  paymentInfoCard: {
    backgroundColor: theme.colors.status.success + "15",
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.status.success + "30",
  },
  paymentInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  paymentInfoTitle: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.status.success,
    marginLeft: theme.spacing.sm,
  },
  paymentInfoText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: "Outfit-Regular",
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },

  // Order Summary Styles
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

  // Bottom Section Styles
  bottomSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surface.border,
    backgroundColor: theme.colors.background.primary,
  },
  placeOrderButton: {
    backgroundColor: theme.colors.primary.main,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    height: 56,
    // marginBottom: theme.spacing["4xl"],
  },
  placeOrderButtonDisabled: {
    opacity: 0.6,
    backgroundColor: theme.colors.surface.border,
  },
  loadingButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    gap: theme.spacing.sm,
  },
  placeOrderText: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.text.white,
  },
  placeOrderPrice: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.text.white,
  },

  // Promo Code Styles
  promoContainer: {
    backgroundColor: theme.colors.surface.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  promoInputContainer: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  promoInput: {
    flex: 1,
    backgroundColor: theme.colors.surface.input,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    fontFamily: "Outfit-Regular",
    color: theme.colors.text.primary,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  applyButton: {
    backgroundColor: theme.colors.primary.main,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 70,
  },
  applyButtonDisabled: {
    backgroundColor: theme.colors.surface.border,
  },
  applyButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.text.white,
  },
  viewPromosButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  viewPromosText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: "Outfit-Medium",
    color: theme.colors.primary.main,
    marginRight: theme.spacing.xs,
  },
  promoSuggestions: {
    marginTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surface.divider,
    paddingTop: theme.spacing.md,
  },
  suggestionsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  suggestionsTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.text.primary,
  },
  promoSuggestion: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surface.light,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  promoSuggestionContent: {
    flex: 1,
  },
  promoSuggestionCode: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.secondary.main,
    marginBottom: theme.spacing.xs / 2,
  },
  promoSuggestionDesc: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: "Outfit-Regular",
    color: theme.colors.text.secondary,
  },
  appliedPromoContainer: {
    backgroundColor: theme.colors.status.success + "20",
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.status.success,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  appliedPromoContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  appliedPromoInfo: {
    marginLeft: theme.spacing.sm,
  },
  appliedPromoCode: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.status.success,
    marginBottom: theme.spacing.xs / 2,
  },
  appliedPromoDesc: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: "Outfit-Regular",
    color: theme.colors.text.secondary,
  },
  removePromoButton: {
    padding: theme.spacing.xs,
  },
  discountLabel: {
    color: theme.colors.status.success,
  },
  discountValue: {
    color: theme.colors.status.success,
    fontFamily: "Outfit-SemiBold",
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.background.overlay,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: theme.colors.background.primary,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    paddingTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    // paddingBottom: theme.spacing["4xl"],
    maxHeight: "80%",
    height: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.lg,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.text.primary,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.surface.light,
    justifyContent: "center",
    alignItems: "center",
  },
  addressList: {
    flexGrow: 1,
  },
  addressOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.colors.surface.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  selectedAddressOption: {
    borderColor: theme.colors.primary.main,
    backgroundColor: theme.colors.primary[50],
  },
  addressOptionContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  addressOptionText: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  addressOptionTitle: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs / 2,
  },
  addressOptionAddress: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: "Outfit-Regular",
    color: theme.colors.text.secondary,
  },
  addNewAddressButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surface.light,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.primary.main,
    borderStyle: "dashed",
  },
  addNewAddressText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.primary.main,
    marginLeft: theme.spacing.sm,
  },
});

export default Checkout;