import SafeAreaWrapper2 from "@/components/SafeAreaWrapper2";
import {
  deleteUserAddress,
  getUserAddresses,
  getUserData,
  setDefaultAddress,
} from "@/services/apiService";
import theme from "@/utils/theme";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const AddressManagement = () => {
  const paramsData = useLocalSearchParams();
  const paramMessage = paramsData?.checkout ?? null;

  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [toast, setToast] = useState({ visible: false, message: "", type: "error" });
  const toastAnim = useRef(new Animated.Value(0)).current;

  // Load addresses when screen focuses
  useFocusEffect(
    useCallback(() => {
      loadUserAddresses();
    }, [])
  );

  const showToast = (message, type = "error") => {
    setToast({ visible: true, message, type });

    Animated.sequence([
      Animated.timing(toastAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(3000),
      Animated.timing(toastAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToast({ visible: false, message: "", type: "error" });
    });
  };

  const loadUserAddresses = async () => {
    try {
      setLoading(true);

      const user = await getUserData();
      if (!user) {
        router.replace("/signin");
        return;
      }
      setUserData(user);

      const response = await getUserAddresses(user.id);

      if (response.success) {
        setAddresses(response.data);
      } else {
        showToast(response.error, "error");
      }
    } catch (error) {
      console.error("Error loading addresses:", error);
      showToast("Failed to load addresses", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    router.push({
      pathname: "/add-address",
      params: { checkout: paramMessage },
    });
  };

  const handleEdit = (address) => {
    router.push({
      pathname: "/add-address",
      params: {
        addressId: address.id,
        checkout: paramMessage,
      },
    });
  };

  const handleDelete = (address) => {
    Alert.alert(
      "Delete Address",
      "Are you sure you want to delete this address?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await deleteUserAddress(address.id, userData.id);

              if (response.success) {
                showToast("Address deleted successfully", "success");
                loadUserAddresses();
              } else {
                showToast(response.error || "Failed to delete address", "error");
              }
            } catch (error) {
              console.error("Delete error:", error);
              showToast("Failed to delete address", "error");
            }
          },
        },
      ]
    );
  };

  const handleSetDefault = async (address) => {
    try {
      const response = await setDefaultAddress(address.id, userData.id);

      if (response.success) {
        setAddresses((prevAddresses) =>
          prevAddresses.map((addr) => ({
            ...addr,
            is_default: addr.id === address.id ? "yes" : "no",
          }))
        );
        showToast("Default address updated", "success");
      } else {
        showToast(response.error || "Failed to set default address", "error");
      }
    } catch (error) {
      console.error("Set default error:", error);
      showToast("Failed to set default address", "error");
    }
  };

  const formatAddressDisplay = (address) => {
    const parts = [];

    if (address.line_1 || address.address1)
      parts.push(address.line_1 || address.address1);
    if (address.line_2 || address.address2)
      parts.push(address.line_2 || address.address2);
    if (address.line_3 || address.address3)
      parts.push(address.line_3 || address.address3);

    return parts.filter(Boolean);
  };

  const renderAddressItem = ({ item }) => {
    const addressLines = formatAddressDisplay(item);

    return (
      <View style={styles.addressCard}>
        <View style={styles.addressHeader}>
          <View style={styles.addressTitleContainer}>
            <Text style={styles.addressTitle}>
              {item.address_label || "Delivery Address"}
            </Text>
            {item.is_default === "yes" && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultText}>Default</Text>
              </View>
            )}
            {item.address_type && (
              <View
                style={[
                  styles.typeBadge,
                  styles[`typeBadge${item.address_type}`],
                ]}
              >
                <Ionicons
                  name={
                    item.address_type === "home"
                      ? "home"
                      : item.address_type === "work"
                      ? "briefcase"
                      : "location"
                  }
                  size={12}
                  color={theme.colors.text.white}
                />
              </View>
            )}
          </View>
          <View style={styles.addressActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleEdit(item)}
            >
              <Ionicons
                name="pencil-outline"
                size={18}
                color={theme.colors.text.secondary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDelete(item)}
            >
              <Ionicons
                name="trash-outline"
                size={18}
                color={theme.colors.status.error}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.addressContent}>
          <View style={styles.addressRow}>
            <Ionicons
              name="location"
              size={20}
              color={theme.colors.secondary.main}
            />
            <View style={styles.addressTextContainer}>
              {addressLines.map((line, index) => (
                <Text key={index} style={styles.addressText}>
                  {line}
                </Text>
              ))}
              <Text style={styles.addressLocation}>
                {item.city || item.post_town}, {item.pincode}
              </Text>
              {item.county && (
                <Text style={styles.addressCounty}>{item.county}</Text>
              )}
              {item.landmark && (
                <Text style={styles.addressLandmark}>
                  Landmark: {item.landmark}
                </Text>
              )}
              {item.delivery_instructions && (
                <View style={styles.instructionsContainer}>
                  <Ionicons
                    name="information-circle-outline"
                    size={14}
                    color={theme.colors.primary.main}
                  />
                  <Text style={styles.instructionsText}>
                    {item.delivery_instructions}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {item.is_default !== "yes" && (
          <TouchableOpacity
            style={styles.setDefaultButton}
            onPress={() => handleSetDefault(item)}
          >
            <Text style={styles.setDefaultText}>Set as Default</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons
        name="location-outline"
        size={80}
        color={theme.colors.text.tertiary}
      />
      <Text style={styles.emptyStateTitle}>No Addresses Yet</Text>
      <Text style={styles.emptyStateText}>
        Add your delivery address to get started
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaWrapper2>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.main} />
          <Text style={styles.loadingText}>Loading addresses...</Text>
        </View>
      </SafeAreaWrapper2>
    );
  }

  return (
    <SafeAreaWrapper2>
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
          <Text style={styles.headerTitle}>Delivery Address</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Address List */}
        <FlatList
          data={addresses}
          renderItem={renderAddressItem}
          keyExtractor={(item) => item.id.toString()}
          style={styles.addressList}
          contentContainerStyle={[
            styles.addressListContent,
            addresses.length === 0 && styles.addressListEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
        />

        {/* Add New Address Button */}
        <TouchableOpacity style={styles.addButton} onPress={handleAddNew}>
          <Ionicons name="add" size={24} color={theme.colors.text.white} />
          <Text style={styles.addButtonText}>Add New Address</Text>
        </TouchableOpacity>

        {/* Toast Notification */}
        {toast.visible && (
          <Animated.View
            style={[
              styles.toastContainer,
              toast.type === "success" && styles.toastSuccess,
              toast.type === "error" && styles.toastError,
              {
                opacity: toastAnim,
                transform: [
                  {
                    translateY: toastAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Ionicons
              name={
                toast.type === "success"
                  ? "checkmark-circle"
                  : "alert-circle"
              }
              size={20}
              color={theme.colors.text.white}
            />
            <Text style={styles.toastText}>{toast.message}</Text>
          </Animated.View>
        )}
      </View>
    </SafeAreaWrapper2>
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

  // Address List Styles
  addressList: {
    flex: 1,
  },
  addressListContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing["8xl"],
  },
  addressListEmpty: {
    flexGrow: 1,
    justifyContent: "center",
  },
  addressCard: {
    backgroundColor: theme.colors.surface.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  addressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  addressTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: theme.spacing.sm,
  },
  addressTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.text.primary,
  },
  defaultBadge: {
    backgroundColor: theme.colors.secondary.main,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  defaultText: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: "Outfit-Medium",
    color: theme.colors.text.white,
  },
  typeBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  typeBadgehome: {
    backgroundColor: theme.colors.primary.main,
  },
  typeBadgework: {
    backgroundColor: theme.colors.secondary.main,
  },
  typeBadgeother: {
    backgroundColor: theme.colors.text.tertiary,
  },
  addressActions: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surface.light,
    justifyContent: "center",
    alignItems: "center",
  },
  addressContent: {
    marginBottom: theme.spacing.sm,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  addressTextContainer: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  addressText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: "Outfit-Regular",
    color: theme.colors.text.primary,
    lineHeight:
      theme.typography.fontSize.base * theme.typography.lineHeight.normal,
    marginBottom: 2,
  },
  addressLocation: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: "Outfit-Medium",
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  addressCounty: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: "Outfit-Regular",
    color: theme.colors.text.tertiary,
    marginTop: 2,
  },
  addressLandmark: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: "Outfit-Regular",
    color: theme.colors.text.tertiary,
    marginTop: theme.spacing.xs,
  },
  instructionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: theme.spacing.sm,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.primary[50],
    borderRadius: theme.borderRadius.sm,
    gap: theme.spacing.xs,
  },
  instructionsText: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: "Outfit-Regular",
    color: theme.colors.primary.main,
  },
  setDefaultButton: {
    alignSelf: "flex-start",
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.secondary.main,
    marginTop: theme.spacing.sm,
  },
  setDefaultText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: "Outfit-Medium",
    color: theme.colors.secondary.main,
  },

  // Empty State Styles
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: theme.spacing["6xl"],
  },
  emptyStateTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.text.primary,
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.sm,
  },
  emptyStateText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: "Outfit-Regular",
    color: theme.colors.text.secondary,
    textAlign: "center",
  },

  // Add Button Styles
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primary.main,
    marginHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  addButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.text.white,
  },

  // Toast Styles
  toastContainer: {
    position: "absolute",
    top: 60,
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.sm,
    zIndex: 9999,
  },
  toastSuccess: {
    backgroundColor: theme.colors.status.success,
  },
  toastError: {
    backgroundColor: theme.colors.status.error,
  },
  toastText: {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    fontFamily: "Outfit-Medium",
    color: theme.colors.text.white,
  },
});

export default AddressManagement;