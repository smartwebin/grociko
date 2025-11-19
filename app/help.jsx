import SafeAreaWrapper2 from "@/components/SafeAreaWrapper2";
import { contactUs, getContactAndFaq } from "@/services/apiService";
import theme from "@/utils/theme";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";

import {
  ActivityIndicator,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const Help = () => {
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [contactData, setContactData] = useState(null);
  const [toast, setToast] = useState({ visible: false, message: "", type: "error" });
  const toastAnim = useRef(new Animated.Value(0)).current;

  const [contactForm, setContactForm] = useState({
    fname: "",
    lname: "",
    email: "",
    phone: "",
    message: "",
  });

  const quickLinks = [
    {
      id: "1",
      title: "Order Issues",
      description: "Problems with your current or past orders",
      icon: "bag-outline",
      action: () => router.push("/orders"),
    },
    {
      id: "3",
      title: "Delivery Address",
      description: "Update or manage delivery addresses",
      icon: "location-outline",
      action: () => router.push("/address-management"),
    },
    {
      id: "4",
      title: "Account Settings",
      description: "Profile, preferences, and security",
      icon: "person-outline",
      action: () => router.push("/my-details"),
    },
  ];

  // Load contact us data when screen focuses
  useFocusEffect(
    useCallback(() => {
      loadContactData();
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

  const loadContactData = async () => {
    try {
      setLoading(true);
      const response = await getContactAndFaq();

      if (response.success) {
        setContactData(response.contact);
      } else {
        console.error("❌ API Error:", response.error);
        showToast(response.error || "Failed to load data", "error");
      }
    } catch (error) {
      console.error("❌ Error loading contact data:", error);
      showToast("Failed to load data. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Build contact options dynamically from API data
  const getContactOptions = () => {
    if (!contactData) return [];

    const options = [];

    if (contactData.phone) {
      options.push({
        id: "1",
        title: "Call Us",
        description: contactData.phone,
        subtitle: "Available 24/7",
        icon: "call-outline",
        action: () => Linking.openURL(`tel:${contactData.phone}`),
      });
    }

    if (contactData.email) {
      options.push({
        id: "2",
        title: "Email Support",
        description: contactData.email,
        subtitle: "Response within 2 hours",
        icon: "mail-outline",
        action: () => Linking.openURL(`mailto:${contactData.email}`),
      });
    }

    if (contactData.whatsapp) {
      options.push({
        id: "4",
        title: "WhatsApp",
        description: contactData.whatsapp,
        subtitle: "Quick assistance via WhatsApp",
        icon: "logo-whatsapp",
        action: () =>
          Linking.openURL(`whatsapp://send?phone=${contactData.whatsapp}`),
      });
    }

    return options;
  };

  const handleSendMessage = async () => {
    // Validation
    if (!contactForm.fname.trim()) {
      showToast("Please enter your first name", "error");
      return;
    }
    if (!contactForm.lname.trim()) {
      showToast("Please enter your last name", "error");
      return;
    }
    if (!contactForm.email.trim()) {
      showToast("Please enter your email", "error");
      return;
    }
    if (!contactForm.phone.trim()) {
      showToast("Please enter your phone number", "error");
      return;
    }
    if (!contactForm.message.trim()) {
      showToast("Please enter your message", "error");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactForm.email)) {
      showToast("Please enter a valid email address", "error");
      return;
    }

    try {
      setSending(true);

      const response = await contactUs({
        fname: contactForm.fname,
        lname: contactForm.lname,
        email: contactForm.email,
        phone: contactForm.phone,
        message: contactForm.message,
      });

      if (response.success) {
        showToast(response.message, "success");
        // Reset form
        setContactForm({
          fname: "",
          lname: "",
          email: "",
          phone: "",
          message: "",
        });
      } else {
        showToast(response.error || "Failed to send message. Try again.", "error");
      }
    } catch (error) {
      console.error("❌ Send Message Error:", error);
      showToast("Failed to send message. Please try again.", "error");
    } finally {
      setSending(false);
    }
  };

  const renderQuickLink = ({ item }) => (
    <TouchableOpacity style={styles.quickLinkItem} onPress={item.action}>
      <View style={styles.quickLinkIcon}>
        <Ionicons
          name={item.icon}
          size={24}
          color={theme.colors.secondary.main}
        />
      </View>
      <View style={styles.quickLinkContent}>
        <Text style={styles.quickLinkTitle}>{item.title}</Text>
        <Text style={styles.quickLinkDescription}>{item.description}</Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={20}
        color={theme.colors.text.tertiary}
      />
    </TouchableOpacity>
  );

  const renderContactOption = ({ item }) => (
    <TouchableOpacity style={styles.contactItem} onPress={item.action}>
      <View style={styles.contactIcon}>
        <Ionicons
          name={item.icon}
          size={24}
          color={theme.colors.secondary.main}
        />
      </View>
      <View style={styles.contactContent}>
        <Text style={styles.contactTitle}>{item.title}</Text>
        <Text style={styles.contactDescription}>{item.description}</Text>
        <Text style={styles.contactSubtitle}>{item.subtitle}</Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={20}
        color={theme.colors.text.tertiary}
      />
    </TouchableOpacity>
  );

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={theme.colors.primary.main} />
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="information-circle-outline"
        size={64}
        color={theme.colors.text.tertiary}
      />
      <Text style={styles.emptyText}>No data available</Text>
      <TouchableOpacity style={styles.retryButton} onPress={loadContactData}>
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaWrapper2>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
        keyboardVerticalOffset={0}
      >
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
          <Text style={styles.headerTitle}>Contact Us</Text>
          <View style={styles.headerRight} />
        </View>

        {loading ? (
          renderLoading()
        ) : (
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            {/* Quick Links */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Help</Text>
              <FlatList
                data={quickLinks}
                renderItem={renderQuickLink}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            </View>

            {/* Contact Options */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Get in Touch</Text>
              {getContactOptions().length > 0 ? (
                <FlatList
                  data={getContactOptions()}
                  renderItem={renderContactOption}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                />
              ) : (
                renderEmptyState()
              )}
            </View>

            {/* Contact Address */}
            {contactData?.address && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Our Address</Text>
                <View style={styles.addressCard}>
                  <Ionicons
                    name="location"
                    size={24}
                    color={theme.colors.primary.main}
                  />
                  <Text style={styles.addressText}>{contactData.address}</Text>
                </View>
              </View>
            )}

            {/* Contact Form */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Send us a Message</Text>
              <View style={styles.contactForm}>
                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, styles.halfWidth]}>
                    <Text style={styles.inputLabel}>
                      First Name <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                      style={styles.textInput}
                      value={contactForm.fname}
                      onChangeText={(text) =>
                        setContactForm({ ...contactForm, fname: text })
                      }
                      placeholder="John"
                      placeholderTextColor={theme.colors.text.placeholder}
                      editable={!sending}
                    />
                  </View>

                  <View style={[styles.inputGroup, styles.halfWidth]}>
                    <Text style={styles.inputLabel}>
                      Last Name <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                      style={styles.textInput}
                      value={contactForm.lname}
                      onChangeText={(text) =>
                        setContactForm({ ...contactForm, lname: text })
                      }
                      placeholder="Doe"
                      placeholderTextColor={theme.colors.text.placeholder}
                      editable={!sending}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    Email <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    value={contactForm.email}
                    onChangeText={(text) =>
                      setContactForm({ ...contactForm, email: text })
                    }
                    placeholder="john.doe@example.com"
                    placeholderTextColor={theme.colors.text.placeholder}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!sending}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    Phone <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    value={contactForm.phone}
                    onChangeText={(text) =>
                      setContactForm({ ...contactForm, phone: text })
                    }
                    placeholder="+44 1234 567890"
                    placeholderTextColor={theme.colors.text.placeholder}
                    keyboardType="phone-pad"
                    editable={!sending}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    Message <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={[styles.textInput, styles.messageInput]}
                    value={contactForm.message}
                    onChangeText={(text) =>
                      setContactForm({ ...contactForm, message: text })
                    }
                    placeholder="Describe your issue or question..."
                    placeholderTextColor={theme.colors.text.placeholder}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    editable={!sending}
                  />
                </View>

                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    sending && styles.sendButtonDisabled,
                  ]}
                  onPress={handleSendMessage}
                  disabled={sending}
                >
                  {sending ? (
                    <ActivityIndicator
                      size="small"
                      color={theme.colors.text.white}
                    />
                  ) : (
                    <Text style={styles.sendButtonText}>Send Message</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        )}

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
    fontSize: theme.typography.fontSize.xl,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.text.primary,
    flex: 1,
    textAlign: "center",
  },
  headerRight: {
    width: 40,
  },

  // Content Styles
  content: {
    flex: 1,
  },
  scrollContent: {
    // paddingBottom: theme.spacing["6xl"],
  },

  // Loading Styles
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: theme.spacing["6xl"],
  },
  loadingText: {
    marginTop: theme.spacing.lg,
    fontSize: theme.typography.fontSize.base,
    fontFamily: "Outfit-Regular",
    color: theme.colors.text.secondary,
  },

  // Empty State Styles
  emptyContainer: {
    alignItems: "center",
    paddingVertical: theme.spacing["4xl"],
  },
  emptyText: {
    marginTop: theme.spacing.lg,
    fontSize: theme.typography.fontSize.base,
    fontFamily: "Outfit-Regular",
    color: theme.colors.text.secondary,
  },
  retryButton: {
    marginTop: theme.spacing.lg,
    backgroundColor: theme.colors.primary.main,
    paddingHorizontal: theme.spacing["2xl"],
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
  },
  retryButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.text.white,
  },

  // Section Styles
  section: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
  },

  // Quick Link Styles
  quickLinkItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  quickLinkIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: `${theme.colors.secondary.main}20`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.lg,
  },
  quickLinkContent: {
    flex: 1,
  },
  quickLinkTitle: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  quickLinkDescription: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: "Outfit-Regular",
    color: theme.colors.text.secondary,
  },

  // Contact Styles
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: `${theme.colors.secondary.main}20`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.lg,
  },
  contactContent: {
    flex: 1,
  },
  contactTitle: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  contactDescription: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: "Outfit-Medium",
    color: theme.colors.secondary.main,
    marginBottom: theme.spacing.xs,
  },
  contactSubtitle: {
    fontSize: theme.typography.fontSize.xs,
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
    gap: theme.spacing.lg,
  },
  addressText: {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    fontFamily: "Outfit-Regular",
    color: theme.colors.text.primary,
    lineHeight:
      theme.typography.fontSize.base * theme.typography.lineHeight.relaxed,
  },

  // Contact Form Styles
  contactForm: {
    backgroundColor: theme.colors.surface.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  inputRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  inputGroup: {
    marginBottom: theme.spacing.lg,
  },
  halfWidth: {
    flex: 1,
  },
  inputLabel: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: "Outfit-Medium",
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  required: {
    color: theme.colors.status.error,
  },
  textInput: {
    backgroundColor: theme.colors.surface.input,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    fontSize: theme.typography.fontSize.base,
    fontFamily: "Outfit-Regular",
    color: theme.colors.text.primary,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  messageInput: {
    height: 120,
    textAlignVertical: "top",
  },
  sendButton: {
    backgroundColor: theme.colors.primary.main,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    alignItems: "center",
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
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

export default Help;