import SafeAreaWrapper2 from "@/components/SafeAreaWrapper2";
import {
  createUserAddress,
  getUserAddresses,
  getUserData,
  lookupPostcode,
  updateUserAddress,
} from "@/services/apiService";
import theme from "@/utils/theme";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const AddAddress = () => {
  const params = useLocalSearchParams();
  const addressId = params?.addressId;
  const paramMessage = params?.checkout ?? null;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [userData, setUserData] = useState(null);
  const [addressListModalVisible, setAddressListModalVisible] = useState(false);
  const [postcodeInput, setPostcodeInput] = useState("");
  const [foundAddresses, setFoundAddresses] = useState([]);
  const [selectedFoundAddress, setSelectedFoundAddress] = useState(null);
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "error",
  });
  const toastAnim = useRef(new Animated.Value(0)).current;
  const [formData, setFormData] = useState({
    line_1: "",
    line_2: "",
    line_3: "",
    post_town: "",
    city: "",
    pincode: "",
    county: "",
    district: "",
    ward: "",
    dependant_locality: "",
    landmark: "",
  });

  useFocusEffect(
    useCallback(() => {
      loadUserAndAddress();
    }, [addressId])
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

  const loadUserAndAddress = async () => {
    try {
      setLoading(true);

      const user = await getUserData();
      if (!user) {
        router.replace("/signin");
        return;
      }
      setUserData(user);

      // If editing, load address data
      if (addressId) {
        const response = await getUserAddresses(user.id);
        if (response.success) {
          const address = response.data.find(
            (addr) => addr.id.toString() === addressId.toString()
          );
          if (address) {
            setPostcodeInput(address.pincode || "");
            setFormData({
              line_1: address.line_1 || address.address1 || "",
              line_2: address.line_2 || address.address2 || "",
              line_3: address.line_3 || address.address3 || "",
              post_town: address.post_town || "",
              city: address.city || "",
              pincode: address.pincode || "",
              county: address.county || "",
              district: address.district || "",
              ward: address.ward || "",
              landmark: address.landmark || "",
            });
          } else {
            showToast("Address not found", "error");
            router.back();
          }
        }
      }
    } catch (error) {
      console.error("Error loading user/address:", error);
      showToast("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  };

  const handlePostcodeLookup = async () => {
    if (!postcodeInput.trim()) {
      showToast("Please enter a postcode", "error");
      return;
    }

    // Add format validation
    const postcodePattern = /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i;
    if (!postcodePattern.test(postcodeInput.trim())) {
      showToast(
        "Please enter a valid UK postcode format (e.g., SW1A 1AA, M1 1AE, B33 8TH)",
        "error"
      );
      return;
    }

    try {
      setLookingUp(true);
      const response = await lookupPostcode(postcodeInput);

      if (response.success && response.data.length > 0) {
                  console.log("response.data",response.data)

        setFoundAddresses(response.data);
        setAddressListModalVisible(true);
      } else {
        showToast("No addresses found for this postcode", "error");
        setFoundAddresses([]);
      }
    } catch (error) {
      console.error("Postcode lookup error:", error);
      showToast("Failed to lookup postcode. Please try again.", "error");
    } finally {
      setLookingUp(false);
    }
  };
const formatAddressLines = ({ line_1, line_2 }) => {
  let newLine1 = "";
  let newLine2 = "";
  let newLine3 = "";

  if (line_2 && line_2.trim() !== "") {
    // Case 1: line_2 exists → shift
    newLine2 = line_1;
    newLine3 = line_2;
  } else {
    // Case 2: no line_2 → move line_1 to line_2
    newLine3 = line_1;
    newLine2 = "";
  }

  return {
    line_1: newLine1,
    line_2: newLine2,
    line_3: newLine3,
  };
};

  const handleSelectFoundAddress = (address) => {
  setSelectedFoundAddress(address);

  const formatted = formatAddressLines({
    line_1: address.line_1,
    line_2: address.line_2
  });

  setFormData({
    ...formatted,
    post_town: address.post_town || "",
    city: address.post_town || address.city || "",
    pincode: address.postcode || postcodeInput,
    county: address.county || "",
    district: address.district || "",
    ward: address.ward || "",
    landmark: formData.landmark || "",
  });

  setAddressListModalVisible(false);
};


  const handleSave = async () => {
    // Validation
    if (
      !formData.line_1 ||
      !formData.city ||
      !formData.pincode ||
      !formData.landmark
    ) {
      showToast(
        "Please fill all required fields (Address Line 1, City, Postcode, Landmark)",
        "error"
      );
      return;
    }

    // UK Postcode validation (basic pattern)
    const postcodePattern = /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i;
    if (!postcodePattern.test(formData.pincode)) {
      showToast("Please enter a valid UK postcode", "error");
      return;
    }

    try {
      setSaving(true);

      const addressData = {
        user_id: userData.id,
        post_town: formData.post_town,
        city: formData.post_town || formData.city,
        pincode: formData.pincode,
        landmark: formData.landmark,
        address1: formData.line_1,
        address2: formData.line_2,
        address3: formData.line_3,
      };

      let response;
      if (addressId) {
        addressData.id = addressId;
        response = await updateUserAddress(addressData);
      } else {
        response = await createUserAddress(addressData);
      }

      if (response.success) {
        showToast(response.message || "Address saved successfully", "success");

        // Navigate back after a short delay
        setTimeout(() => {
          if (paramMessage) {
            router.push("/checkout");
          } else {
            router.back();
          }
        }, 1000);
      } else {
        showToast(response.error || "Failed to save address", "error");
      }
    } catch (error) {
      console.error("Save error:", error);
      showToast("Failed to save address", "error");
    } finally {
      setSaving(false);
    }
  };

  const renderFoundAddressItem = ({ item, index }) => (
    <TouchableOpacity
      style={styles.foundAddressItem}
      onPress={() => handleSelectFoundAddress(item)}
    >
      <View style={styles.foundAddressContent}>
        <Ionicons
          name="location-outline"
          size={20}
          color={theme.colors.secondary.main}
        />
        <View style={styles.foundAddressText}>
          {item.line_2 && (
            <Text style={styles.foundAddressLine}>{item.line_2}</Text>
          )}
          <Text style={styles.foundAddressLocation}>
            {item.post_town}, {item.postcode}
          </Text>
        </View>
      </View>
      <Ionicons
        name="chevron-forward"
        size={20}
        color={theme.colors.text.tertiary}
      />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaWrapper2>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.main} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaWrapper2>
    );
  }

  return (
    <SafeAreaWrapper2>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            disabled={saving}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={theme.colors.text.primary}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {addressId ? "Edit Address" : "Add New Address"}
          </Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          {/* Postcode Lookup Section */}
          <View style={styles.postcodeSection}>
            <Text style={styles.sectionTitle}>Find Your Address</Text>
            <Text style={styles.sectionSubtitle}>
              Enter your postcode to find your address
            </Text>

            <View style={styles.postcodeInputContainer}>
              <TextInput
                style={styles.postcodeInput}
                value={postcodeInput}
                onChangeText={setPostcodeInput}
                placeholder="Enter UK Postcode"
                placeholderTextColor={theme.colors.text.placeholder}
                autoCapitalize="characters"
                maxLength={8}
                editable={!lookingUp && !saving}
              />
              <TouchableOpacity
                style={[
                  styles.lookupButton,
                  lookingUp && styles.lookupButtonDisabled,
                ]}
                onPress={handlePostcodeLookup}
                disabled={lookingUp || saving}
              >
                {lookingUp ? (
                  <ActivityIndicator
                    size="small"
                    color={theme.colors.text.white}
                  />
                ) : (
                  <>
                    <Ionicons
                      name="search"
                      size={18}
                      color={theme.colors.text.white}
                    />
                    <Text style={styles.lookupButtonText}>Find</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {selectedFoundAddress && (
              <View style={styles.selectedAddressNotice}>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={theme.colors.status.success}
                />
                <Text style={styles.selectedAddressText}>
                  Address loaded! Edit details below if needed.
                </Text>
              </View>
            )}
          </View>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            <Text style={styles.formSectionTitle}>Address Details</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Address Line 1 <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                value={formData.line_1}
                onChangeText={(text) =>
                  setFormData({ ...formData, line_1: text })
                }
                placeholder="Address Line 1"
                placeholderTextColor={theme.colors.text.placeholder}
                editable={!saving}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Address Line 2 <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                value={formData.line_2}
                onChangeText={(text) =>
                  setFormData({ ...formData, line_2: text })
                }
                placeholder="Address Line 2"
                placeholderTextColor={theme.colors.text.placeholder}
                editable={!saving}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Address Line 3 <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                value={formData.line_3}
                onChangeText={(text) =>
                  setFormData({ ...formData, line_3: text })
                }
                placeholder="Address Line 3"
                placeholderTextColor={theme.colors.text.placeholder}
                editable={!saving}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                City/Town <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                value={formData.city}
                onChangeText={(text) =>
                  setFormData({ ...formData, city: text })
                }
                placeholder="City"
                placeholderTextColor={theme.colors.text.placeholder}
                editable={!saving}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Postcode <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                value={formData.pincode}
                onChangeText={(text) =>
                  setFormData({
                    ...formData,
                    pincode: text.toUpperCase(),
                  })
                }
                placeholder="SW1A 1AA"
                placeholderTextColor={theme.colors.text.placeholder}
                autoCapitalize="characters"
                maxLength={8}
                editable={!saving}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Landmark <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                value={formData.landmark}
                onChangeText={(text) =>
                  setFormData({ ...formData, landmark: text })
                }
                placeholder="Nearby landmark"
                placeholderTextColor={theme.colors.text.placeholder}
                editable={!saving}
              />
            </View>
          </View>
        </ScrollView>
        <View
          style={{
            paddingHorizontal: theme.spacing.lg,
            paddingBottom: theme.spacing["6xl"],
          }}
        >
          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={theme.colors.text.white} />
            ) : (
              <Text style={styles.saveButtonText}>
                {addressId ? "Update Address" : "Save Address"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
        {/* Address List Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={addressListModalVisible}
          onRequestClose={() => setAddressListModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardAvoidingView}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.addressListModalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Address</Text>
                  <TouchableOpacity
                    style={styles.modalCloseButton}
                    onPress={() => setAddressListModalVisible(false)}
                  >
                    <Ionicons
                      name="close"
                      size={24}
                      color={theme.colors.text.primary}
                    />
                  </TouchableOpacity>
                </View>

                <Text style={styles.addressListSubtitle}>
                  Found {foundAddresses.length} address
                  {foundAddresses.length !== 1 ? "es" : ""} for {postcodeInput}
                </Text>

                <FlatList
                  data={foundAddresses}
                  renderItem={renderFoundAddressItem}
                  keyExtractor={(item, index) => index.toString()}
                  style={styles.foundAddressList}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                />
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

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
                toast.type === "success" ? "checkmark-circle" : "alert-circle"
              }
              size={20}
              color={theme.colors.text.white}
            />
            <Text style={styles.toastText}>{toast.message}</Text>
          </Animated.View>
        )}
      </KeyboardAvoidingView>
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

  // KeyboardAvoidingView Style
  keyboardAvoidingView: {
    flex: 1,
  },

  // ScrollView Content Style
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing["6xl"],
  },

  // Postcode Section Styles
  postcodeSection: {
    backgroundColor: theme.colors.secondary[50],
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  sectionSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: "Outfit-Regular",
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
  },
  postcodeInputContainer: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  postcodeInput: {
    flex: 1,
    backgroundColor: theme.colors.surface.white,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    fontFamily: "Outfit-Regular",
    color: theme.colors.text.primary,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  lookupButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primary.main,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.xs,
    minWidth: 80,
  },
  lookupButtonDisabled: {
    opacity: 0.6,
  },
  lookupButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.text.white,
  },
  selectedAddressNotice: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.status.success + "20",
    borderRadius: theme.borderRadius.sm,
    gap: theme.spacing.sm,
  },
  selectedAddressText: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: "Outfit-Medium",
    color: theme.colors.status.success,
  },

  // Form Styles
  formContainer: {
    gap: theme.spacing.lg,
  },
  formSectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  inputGroup: {
    gap: theme.spacing.sm,
  },
  inputLabel: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: "Outfit-Medium",
    color: theme.colors.text.primary,
  },
  required: {
    color: theme.colors.status.error,
  },
  textInput: {
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

  // Save Button
  saveButton: {
    backgroundColor: theme.colors.primary.main,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    alignItems: "center",
    marginTop: theme.spacing.xl,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.text.white,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.background.overlay,
    justifyContent: "flex-end",
  },
  addressListModalContent: {
    backgroundColor: theme.colors.background.primary,
    borderTopLeftRadius: theme.borderRadius["2xl"],
    borderTopRightRadius: theme.borderRadius["2xl"],
    paddingTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
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

  // Found Address List Styles
  addressListSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: "Outfit-Regular",
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.lg,
  },
  foundAddressList: {
    flexGrow: 1,
  },
  foundAddressItem: {
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
  foundAddressContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
    gap: theme.spacing.sm,
  },
  foundAddressText: {
    flex: 1,
  },
  foundAddressLine: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: "Outfit-Regular",
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  foundAddressLocation: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: "Outfit-Medium",
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
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

export default AddAddress;
