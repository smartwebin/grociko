import SafeAreaWrapper2 from "@/components/SafeAreaWrapper2";
import { useUser } from "@/providers/UserProvider";
import { loginUser } from "@/services/apiService";
import theme from "@/utils/theme";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
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

const { width } = Dimensions.get("window");

const SignIn = () => {
  // Get user context
  const { loginUser: loginUserContext } = useUser();
  const paramsData = useLocalSearchParams();
  const paramMessage = paramsData?.checkout ?? null;

  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");

  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Toast state
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "error",
  });
  const toastAnim = useRef(new Animated.Value(0)).current;

  // Error states
  const [emailOrPhoneError, setEmailOrPhoneError] = useState("");
  const [passwordError, setPasswordError] = useState("");

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

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^[0-9]{10,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ""));
  };

  const isPhoneNumber = (input) => {
    return /^[0-9\s]+$/.test(input);
  };

  const handleSignIn = async () => {
    // Reset errors
    setEmailOrPhoneError("");
    setPasswordError("");

    let hasError = false;

    // Trim input
    const trimmedInput = emailOrPhone.trim();
    const trimmedPassword = password.trim();

    // Validate email/phone input
    if (!trimmedInput) {
      setEmailOrPhoneError("Email or phone number is required");
      hasError = true;
    } else {
      const isPhone = isPhoneNumber(trimmedInput);
      if (isPhone) {
        if (!validatePhone(trimmedInput)) {
          setEmailOrPhoneError(
            "Please enter a valid phone number (10-15 digits)"
          );
          hasError = true;
        }
      } else if (!validateEmail(trimmedInput)) {
        setEmailOrPhoneError("Please enter a valid email address");
        hasError = true;
      }
    }

    // Validate password
    if (!trimmedPassword) {
      setPasswordError("Password is required");
      hasError = true;
    } else if (trimmedPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      hasError = true;
    }

    if (hasError) return;

    setLoading(true);

    try {
      const isPhone = isPhoneNumber(trimmedInput);

      const loginPayload = {
        email: isPhone ? "" : trimmedInput,
        phone: isPhone ? trimmedInput.replace(/\s/g, "") : "",
        password: trimmedPassword,
      };

      const response = await loginUser(loginPayload);

      if (response.success) {
        // Save user to context
        await loginUserContext(response.data, response.jwt);

        showToast("Login successful! Welcome back.", "success");
        setTimeout(
          () => router.replace(paramMessage ? "/checkout" : "/home"),
          1000
        );
      } else {
        showToast(response.error || "Invalid credentials. Please try again.");
      }
    } catch (error) {
      console.error("Login error:", error);
      showToast("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    router.push("/forgot-password");
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
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.push("/home")}
            >
              <Ionicons
                name="chevron-back"
                size={24}
                color={theme.colors.text.primary}
              />
            </TouchableOpacity>
          </View>

          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.mainTitle}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue shopping</Text>
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

          {/* Form Section */}
          <View style={styles.formSection}>
            {/* Email or Phone Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email or Phone Number</Text>
              <View
                style={[
                  styles.inputWrapper,
                  emailOrPhoneError && styles.inputError,
                ]}
              >
                <Ionicons
                  name={
                    isPhoneNumber(emailOrPhone)
                      ? "call-outline"
                      : "mail-outline"
                  }
                  size={20}
                  color={theme.colors.text.secondary}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter email or phone"
                  placeholderTextColor={theme.colors.text.placeholder}
                  value={emailOrPhone}
                  onChangeText={(text) => {
                    setEmailOrPhone(text);
                    if (emailOrPhoneError) setEmailOrPhoneError("");
                  }}
                  keyboardType="default"
                  autoCapitalize="none"
                  autoComplete="off"
                />
              </View>
              {emailOrPhoneError ? (
                <Text style={styles.errorText}>{emailOrPhoneError}</Text>
              ) : null}
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <View
                style={[
                  styles.inputWrapper,
                  passwordError && styles.inputError,
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={theme.colors.text.secondary}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your password"
                  placeholderTextColor={theme.colors.text.placeholder}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (passwordError) setPasswordError("");
                  }}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color={theme.colors.text.secondary}
                  />
                </TouchableOpacity>
              </View>
              {passwordError ? (
                <Text style={styles.errorText}>{passwordError}</Text>
              ) : null}
            </View>

            {/* Remember Me & Forgot Password Row */}
            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={styles.rememberMeContainer}
                onPress={() => setRememberMe(!rememberMe)}
                activeOpacity={0.7}
              >
                <View
                  style={[styles.checkbox, rememberMe && styles.checkedBox]}
                >
                  {rememberMe && (
                    <Ionicons
                      name="checkmark"
                      size={14}
                      color={theme.colors.text.white}
                    />
                  )}
                </View>
                <Text style={styles.rememberMeText}>Remember me</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleForgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/(auth)/signup",
                  params: paramMessage ? { checkout: paramMessage } : {},
                })
              }
            >
              <Text style={styles.signUpLink}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Sign In Button - Fixed at bottom */}
        <View style={styles.fixedButtonContainer}>
          <TouchableOpacity
            style={[styles.signInButton, loading && styles.buttonDisabled]}
            onPress={handleSignIn}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Signing in...</Text>
              </View>
            ) : (
              <>
                <Text style={styles.signInButtonText}>Sign In</Text>
                <Ionicons
                  name="arrow-forward"
                  size={20}
                  color={theme.colors.text.white}
                />
              </>
            )}
          </TouchableOpacity>
        </View>

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
    paddingBottom: theme.spacing.md,
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

  // Title Section
  titleSection: {
    marginBottom: theme.spacing.xl,
  },
  mainTitle: {
    fontSize: theme.typography.fontSize["4xl"],
    fontFamily: "Outfit-Bold",
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: "Outfit-Regular",
    color: theme.colors.text.secondary,
    lineHeight: theme.typography.fontSize.base * 1.5,
  },

  // Logo Section
  logoSection: {
    alignItems: "center",
    marginBottom: theme.spacing["2xl"],
    paddingVertical: theme.spacing.xl,
  },
  logoContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 180,
    height: 100,
  },

  // Form Section
  formSection: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: theme.spacing.lg,
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
  passwordToggle: {
    padding: theme.spacing.xs,
  },
  errorText: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: "Outfit-Regular",
    color: theme.colors.status.error,
    marginTop: theme.spacing.xs,
    marginLeft: theme.spacing.sm,
  },

  // Options Row
  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.xs,
  },
  rememberMeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: theme.colors.surface.border,
    borderRadius: theme.borderRadius.sm,
    marginRight: theme.spacing.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  checkedBox: {
    backgroundColor: theme.colors.primary.main,
    borderColor: theme.colors.primary.main,
  },
  rememberMeText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: "Outfit-Regular",
    color: theme.colors.text.secondary,
  },
  forgotPasswordText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.primary.main,
  },

  // Fixed Button Container - NEW
  fixedButtonContainer: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.md,
    paddingBottom: Platform.OS === "ios" ? theme.spacing.lg : theme.spacing.xl,
    backgroundColor: theme.colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surface.border,
  },

  // Sign In Button
  signInButton: {
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
  signInButtonText: {
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

  // Footer
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.xl,
  },
  footerText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: "Outfit-Regular",
    color: theme.colors.text.secondary,
  },
  signUpLink: {
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

export default SignIn;
