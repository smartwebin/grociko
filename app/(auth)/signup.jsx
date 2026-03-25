import SafeAreaWrapper2 from "@/components/SafeAreaWrapper2";
import { useUser } from "@/providers/UserProvider";
import {
  createSignupFormData,
  signupUser,
  validateImageFile,
} from "@/services/apiService";
import theme from "@/utils/theme";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
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

const SignUp = () => {
  // Get user context
  const { loginUser: loginUserContext } = useUser();
  const paramsData = useLocalSearchParams();
  const paramMessage = paramsData?.checkout ?? null;
  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileImage, setProfileImage] = useState(null);

  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  // Toast state
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "error",
  });
  const toastAnim = useRef(new Animated.Value(0)).current;

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

  // Error states
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^[0-9]{10,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ""));
  };

  const validatePassword = (password) => {
    return password.length >= 6;
  };

  // Image picker function
  const pickImage = async () => {
    try {
      // Request permission
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        showToast("Permission to access camera roll is required!", "error");
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const selectedImage = result.assets[0];

        // Validate image
        const validation = validateImageFile({
          fileSize: selectedImage.fileSize,
          mimeType: selectedImage.mimeType,
        });

        if (!validation.isValid) {
          showToast(validation.errors.join(". "), "error");
          return;
        }

        setProfileImage(selectedImage);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      showToast("Failed to pick image. Please try again.", "error");
    }
  };

  // Remove selected image
  const removeImage = () => {
    setProfileImage(null);
  };

  // Handle signup
  const handleSignUp = async () => {
    // Reset errors
    setNameError("");
    setEmailError("");
    setPhoneError("");
    setPasswordError("");
    setConfirmPasswordError("");

    let hasError = false;

    // Name validation
    if (!name.trim()) {
      setNameError("Full name is required");
      hasError = true;
    } else if (name.trim().length < 2) {
      setNameError("Name must be at least 2 characters");
      hasError = true;
    }

    // Email validation
    if (!email.trim()) {
      setEmailError("Email is required");
      hasError = true;
    } else if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      hasError = true;
    }

    // Phone validation
    if (!phone.trim()) {
      setPhoneError("Phone number is required");
      hasError = true;
    } else if (!validatePhone(phone)) {
      setPhoneError("Please enter a valid phone number (10-15 digits)");
      hasError = true;
    }

    // Password validation
    if (!password.trim()) {
      setPasswordError("Password is required");
      hasError = true;
    } else if (!validatePassword(password)) {
      setPasswordError("Password must be at least 6 characters");
      hasError = true;
    }

    // Confirm password validation
    if (!confirmPassword.trim()) {
      setConfirmPasswordError("Please confirm your password");
      hasError = true;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      hasError = true;
    }

    // Terms agreement
    if (!agreeToTerms) {
      showToast("Please agree to Terms & Conditions to continue", "error");
      return;
    }

    if (hasError) return;

    setLoading(true);

    try {
      // Create form data
      const formData = createSignupFormData(
        {
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          password: password,
          c_password: confirmPassword,
        },
        profileImage?.uri
      );

      // Call API
      const response = await signupUser(formData);

      if (response.success) {
        // Save user to context
        await loginUserContext(response.data, response.jwt);

        showToast(
          response.message || "Account created successfully!",
          "success"
        );
        setTimeout(() => {
          router.replace({
            pathname: paramMessage ? "/address-management" : "/home",
            params: {
              checkout: 1,
            },
          });
        }, 1500);
      } else {
        // Show errors
        const errorMessage = Array.isArray(response.errors)
          ? response.errors.join(". ")
          : response.error;

        showToast(errorMessage, "error");
      }
    } catch (error) {
      console.error("Signup error:", error);
      showToast("An unexpected error occurred. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneNumber = (text) => {
    // Remove non-numeric characters
    const cleaned = text.replace(/\D/g, "");

    // Limit to 15 digits
    return cleaned.slice(0, 15);
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
              onPress={() => router.back()}
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
            <Text style={styles.mainTitle}>Create Account</Text>
            <Text style={styles.subtitle}>
              Sign up to get started with fresh groceries
            </Text>
          </View>

          {/* Profile Image Picker */}
          <View style={styles.imagePickerSection}>
            <TouchableOpacity
              style={styles.imagePickerContainer}
              onPress={pickImage}
            >
              {profileImage ? (
                <View style={styles.selectedImageContainer}>
                  <Image
                    source={{ uri: profileImage.uri }}
                    style={styles.selectedImage}
                  />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={removeImage}
                  >
                    <Ionicons
                      name="close-circle"
                      size={28}
                      color={theme.colors.status.error}
                    />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.imagePlaceholder}>
                  <View style={styles.cameraIconContainer}>
                    <Ionicons
                      name="camera"
                      size={32}
                      color={theme.colors.primary.main}
                    />
                  </View>
                  <Text style={styles.addPhotoText}>Add Profile Photo</Text>
                  <Text style={styles.addPhotoSubtext}>Optional</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            {/* Name Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <View
                style={[styles.inputWrapper, nameError && styles.inputError]}
              >
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={theme.colors.text.secondary}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your full name"
                  placeholderTextColor={theme.colors.text.placeholder}
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    if (nameError) setNameError("");
                  }}
                  autoCapitalize="words"
                  autoComplete="name"
                />
              </View>
              {nameError ? (
                <Text style={styles.errorText}>{nameError}</Text>
              ) : null}
            </View>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <View
                style={[styles.inputWrapper, emailError && styles.inputError]}
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

            {/* Phone Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <View
                style={[styles.inputWrapper, phoneError && styles.inputError]}
              >
                <Ionicons
                  name="call-outline"
                  size={20}
                  color={theme.colors.text.secondary}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter phone number"
                  placeholderTextColor={theme.colors.text.placeholder}
                  value={phone}
                  onChangeText={(text) => {
                    const formatted = formatPhoneNumber(text);
                    setPhone(formatted);
                    if (phoneError) setPhoneError("");
                  }}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  maxLength={15}
                />
              </View>
              {phoneError ? (
                <Text style={styles.errorText}>{phoneError}</Text>
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
                  placeholder="Create password"
                  placeholderTextColor={theme.colors.text.placeholder}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (passwordError) setPasswordError("");
                  }}
                  secureTextEntry={!showPassword}
                  autoComplete="password-new"
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
              <Text style={styles.passwordHint}>
                Must be at least 6 characters
              </Text>
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <View
                style={[
                  styles.inputWrapper,
                  confirmPasswordError && styles.inputError,
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={theme.colors.text.secondary}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="Confirm your password"
                  placeholderTextColor={theme.colors.text.placeholder}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (confirmPasswordError) setConfirmPasswordError("");
                  }}
                  secureTextEntry={!showConfirmPassword}
                  autoComplete="password-new"
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons
                    name={
                      showConfirmPassword ? "eye-outline" : "eye-off-outline"
                    }
                    size={20}
                    color={theme.colors.text.secondary}
                  />
                </TouchableOpacity>
              </View>
              {confirmPasswordError ? (
                <Text style={styles.errorText}>{confirmPasswordError}</Text>
              ) : null}
            </View>

            {/* Terms and Conditions */}
            <TouchableOpacity
              style={styles.termsContainer}
              onPress={() => setAgreeToTerms(!agreeToTerms)}
              activeOpacity={0.7}
            >
              <View
                style={[styles.checkbox, agreeToTerms && styles.checkedBox]}
              >
                {agreeToTerms && (
                  <Ionicons
                    name="checkmark"
                    size={16}
                    color={theme.colors.text.white}
                  />
                )}
              </View>
              <View style={styles.termsTextContainer}>
                <Text style={styles.termsText}>
                  I agree to the{" "}
                  <Text
                    style={styles.termsLink}
                    onPress={(e) => {
                      e.stopPropagation();
                      router.push("/legal-policy?type=terms");
                    }}
                  >
                    Terms & Conditions
                  </Text>
                  {" "}and{" "}
                  <Text
                    style={styles.termsLink}
                    onPress={(e) => {
                      e.stopPropagation();
                      router.push("/legal-policy?type=privacy");
                    }}
                  >
                    Privacy Policy
                  </Text>
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/signin")}>
              <Text style={styles.signInLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Sign Up Button - Fixed at bottom */}
        <View style={styles.fixedButtonContainer}>
          <TouchableOpacity
            style={[styles.signUpButton, loading && styles.buttonDisabled]}
            onPress={handleSignUp}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Creating account...</Text>
              </View>
            ) : (
              <>
                <Text style={styles.signUpButtonText}>Create Account</Text>
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

  // Image Picker Section
  imagePickerSection: {
    alignItems: "center",
    marginBottom: theme.spacing["2xl"],
  },
  imagePickerContainer: {
    width: 120,
    height: 120,
  },
  selectedImageContainer: {
    width: 120,
    height: 120,
    position: "relative",
  },
  selectedImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: theme.colors.primary.main,
  },
  removeImageButton: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: theme.colors.surface.white,
    borderRadius: 14,
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.primary[50],
    borderWidth: 2,
    borderColor: theme.colors.primary.main,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.md,
  },
  cameraIconContainer: {
    marginBottom: theme.spacing.xs,
  },
  addPhotoText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.primary.main,
    textAlign: "center",
  },
  addPhotoSubtext: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: "Outfit-Regular",
    color: theme.colors.text.tertiary,
    marginTop: 2,
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
  passwordHint: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: "Outfit-Regular",
    color: theme.colors.text.tertiary,
    marginTop: theme.spacing.xs,
    marginLeft: theme.spacing.sm,
  },

  // Terms
  termsContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: theme.spacing.xl,
    paddingVertical: theme.spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: theme.colors.surface.border,
    borderRadius: theme.borderRadius.sm,
    marginRight: theme.spacing.md,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkedBox: {
    backgroundColor: theme.colors.primary.main,
    borderColor: theme.colors.primary.main,
  },
  termsTextContainer: {
    flex: 1,
  },
  termsText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: "Outfit-Regular",
    color: theme.colors.text.secondary,
    lineHeight: theme.typography.fontSize.sm * 1.5,
  },
  termsLink: {
    color: theme.colors.primary.main,
    fontFamily: "Outfit-SemiBold",
    textDecorationLine: "underline",
  },

  // Fixed Button Container - NEW
  fixedButtonContainer: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.md,
    paddingBottom: Platform.OS === 'ios' ? theme.spacing.lg : theme.spacing.xl,
    backgroundColor: theme.colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surface.border,
  },

  // Sign Up Button
  signUpButton: {
    backgroundColor: theme.colors.primary.main,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.xl,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom:theme.spacing.xl
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  signUpButtonText: {
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
  signInLink: {
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

export default SignUp;