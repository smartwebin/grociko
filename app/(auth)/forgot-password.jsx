import SafeAreaWrapper2 from "@/components/SafeAreaWrapper2";
import { forgotPassword } from "@/services/apiService";
import theme from "@/utils/theme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useRef, useState } from "react";
import {
    Animated,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Toast state
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "error",
  });
  const toastAnim = useRef(new Animated.Value(0)).current;

  // Error states
  const [emailError, setEmailError] = useState("");

  // Show toast notification
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

  // Validation function
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleResetPassword = async () => {
    // Reset errors
    setEmailError("");

    // Trim input
    const trimmedEmail = email.trim();

    // Validate email
    if (!trimmedEmail) {
      setEmailError("Email address is required");
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    setLoading(true);

    try {
      // Call API using apiService
      const response = await forgotPassword(trimmedEmail);

      if (response.success) {
        setEmailSent(true);
        showToast(
          response.message || "Password reset instructions sent to your email",
          "success"
        );
      } else {
        showToast(
          response.error || "Failed to send reset email. Please try again.",
          "error"
        );
      }
    } catch (error) {
      console.error("❌ Forgot Password Error:", error);
      showToast(
        "An unexpected error occurred. Please try again.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.back();
  };

  return (
    <SafeAreaWrapper2 backgroundColor={theme.colors.background.primary}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBackToLogin}
            >
              <Ionicons
                name="chevron-back"
                size={24}
                color={theme.colors.text.primary}
              />
            </TouchableOpacity>
          </View>

          {/* Logo */}
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <Image
                source={require("../../assets/company/logo.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
          </View>

          {!emailSent ? (
            <>
              {/* Title Section */}
              <View style={styles.titleSection}>
                <Text style={styles.mainTitle}>Forgot Password?</Text>
                <Text style={styles.subtitle}>
                  Don't worry! Enter your email address and we'll send you
                  instructions to reset your password.
                </Text>
              </View>

              {/* Form Section */}
              <View style={styles.formSection}>
                {/* Email Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      emailError && styles.inputError,
                    ]}
                  >
                    <Ionicons
                      name="mail-outline"
                      size={20}
                      color={theme.colors.text.secondary}
                    />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter your email"
                      placeholderTextColor={theme.colors.text.placeholder}
                      value={email}
                      onChangeText={(text) => {
                        setEmail(text);
                        if (emailError) setEmailError("");
                      }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                    />
                  </View>
                  {emailError ? (
                    <Text style={styles.errorText}>{emailError}</Text>
                  ) : null}
                </View>

                {/* Reset Password Button */}
                <TouchableOpacity
                  style={[
                    styles.resetButton,
                    loading && styles.buttonDisabled,
                  ]}
                  onPress={handleResetPassword}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <View style={styles.loadingContainer}>
                      <Text style={styles.loadingText}>Sending...</Text>
                    </View>
                  ) : (
                    <>
                      <Text style={styles.resetButtonText}>
                        Send Reset Link
                      </Text>
                      <Ionicons
                        name="mail"
                        size={20}
                        color={theme.colors.text.white}
                      />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              {/* Success State */}
              <View style={styles.successSection}>
                <View style={styles.successIconContainer}>
                  <Ionicons
                    name="mail"
                    size={60}
                    color={theme.colors.primary.main}
                  />
                </View>

                <Text style={styles.successTitle}>Check Your Email</Text>
                <Text style={styles.successSubtitle}>
                  We've sent password reset instructions to
                </Text>
                <Text style={styles.emailText}>{email}</Text>

                <View style={styles.infoCard}>
                  <Ionicons
                    name="information-circle"
                    size={24}
                    color={theme.colors.primary.main}
                  />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoText}>
                      The link will expire in 1 hour. If you don't see the
                      email, check your spam folder.
                    </Text>
                  </View>
                </View>

                {/* Resend Button */}
                <TouchableOpacity
                  style={styles.resendButton}
                  onPress={() => {
                    setEmailSent(false);
                    showToast("You can now request a new reset link", "info");
                  }}
                >
                  <Text style={styles.resendButtonText}>
                    Didn't receive the email?
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={handleBackToLogin}>
              <View style={styles.backToLoginContainer}>
                <Ionicons
                  name="arrow-back"
                  size={16}
                  color={theme.colors.primary.main}
                />
                <Text style={styles.backToLoginText}>Back to Sign In</Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Toast Notification */}
        {toast.visible && (
          <Animated.View
            style={[
              styles.toastContainer,
              toast.type === "success" && styles.toastSuccess,
              toast.type === "info" && styles.toastInfo,
              {
                opacity: toastAnim,
                transform: [
                  {
                    translateY: toastAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [100, 0],
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
                  : toast.type === "info"
                  ? "information-circle"
                  : "alert-circle"
              }
              size={24}
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
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing["2xl"],
  },

  // Header
  header: {
    paddingTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.surface.light,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },

  // Logo Section
  logoSection: {
    alignItems: "center",
    marginBottom: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
  },
  logoContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 160,
    height: 90,
  },

  // Title Section
  titleSection: {
    marginBottom: theme.spacing["2xl"],
  },
  mainTitle: {
    fontSize: theme.typography.fontSize["4xl"],
    fontFamily: "Outfit-Bold",
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: "Outfit-Regular",
    color: theme.colors.text.secondary,
    lineHeight: theme.typography.fontSize.base * 1.6,
  },

  // Form Section
  formSection: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: theme.spacing.xl,
  },
  inputLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface.input,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.lg,
    height: 56,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  inputError: {
    borderColor: theme.colors.status.error,
    backgroundColor: theme.colors.status.error + "10",
  },
  textInput: {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    fontFamily: "Outfit-Regular",
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.md,
  },
  errorText: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: "Outfit-Regular",
    color: theme.colors.status.error,
    marginTop: theme.spacing.xs,
    marginLeft: theme.spacing.sm,
  },

  // Reset Button
  resetButton: {
    backgroundColor: theme.colors.primary.main,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.xl,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.xl,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  resetButtonText: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.text.white,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: "Outfit-Medium",
    color: theme.colors.text.white,
  },

  // Success Section
  successSection: {
    flex: 1,
    alignItems: "center",
    paddingTop: theme.spacing["2xl"],
  },
  successIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.primary[50],
    justifyContent: "center",
    alignItems: "center",
    marginBottom: theme.spacing["2xl"],
  },
  successTitle: {
    fontSize: theme.typography.fontSize["3xl"],
    fontFamily: "Outfit-Bold",
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    textAlign: "center",
  },
  successSubtitle: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: "Outfit-Regular",
    color: theme.colors.text.secondary,
    textAlign: "center",
    marginBottom: theme.spacing.xs,
  },
  emailText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.primary.main,
    textAlign: "center",
    marginBottom: theme.spacing["2xl"],
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: theme.colors.primary[50],
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing["2xl"],
    borderWidth: 1,
    borderColor: theme.colors.primary[100],
  },
  infoTextContainer: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  infoText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: "Outfit-Regular",
    color: theme.colors.text.secondary,
    lineHeight: theme.typography.fontSize.sm * 1.5,
  },
  resendButton: {
    paddingVertical: theme.spacing.md,
  },
  resendButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.primary.main,
  },

  // Footer
  footer: {
    alignItems: "center",
    paddingVertical: theme.spacing.xl,
  },
  backToLoginContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  backToLoginText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.primary.main,
  },

  // Toast Notification
  toastContainer: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 40 : 20,
    left: 20,
    right: 20,
    backgroundColor: theme.colors.status.error,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  toastSuccess: {
    backgroundColor: theme.colors.status.success,
  },
  toastInfo: {
    backgroundColor: theme.colors.status.info,
  },
  toastText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: "Outfit-Medium",
    color: theme.colors.text.white,
    marginLeft: theme.spacing.md,
    flex: 1,
  },
});

export default ForgotPassword;