import SafeAreaWrapper from "@/components/SafeAreaWrapper";
import { useCart } from "@/providers/CartProvider";
import { useUser } from "@/providers/UserProvider";
import { clearUserData, getUserData } from "@/services/apiService";
import theme from "@/utils/theme";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const Account = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { clearCart } = useCart(); // Import cart context to clear on logout
  const { user, isAuthenticated, getUserImage } = useUser();

  // Check authentication status when screen is focused
  useFocusEffect(
    useCallback(() => {
      checkAuthStatus();
    }, [])
  );

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      const user = await getUserData();
      // console.log("User data loaded:", user);
      if (!user) {
        // User not logged in, redirect to sign in
        router.replace("/signin");
        return;
      }

      setUserData(user);
    } catch (error) {
      console.error("Error checking auth status:", error);
      router.replace("/signin");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out of your account?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            try {
              // Clear user data from SecureStore
              await clearUserData();

              // Clear cart data
              clearCart();

              // Show success message
              Alert.alert("Success", "You have been signed out successfully.", [
                {
                  text: "OK",
                  onPress: () => router.replace("/signin"),
                },
              ]);
            } catch (error) {
              console.error("Logout error:", error);
              Alert.alert("Error", "Failed to sign out. Please try again.");
            }
          },
        },
      ]
    );
  };

  const menuItems = [
    {
      id: 1,
      title: "Orders",
      icon: "bag-outline",
      onPress: () => router.push("/orders"),
    },
    {
      id: 2,
      title: "My Details",
      icon: "person-outline",
      onPress: () => router.push("/my-details"),
    },
    {
      id: 3,
      title: "Delivery Address",
      icon: "location-outline",
      onPress: () => router.push("/address-management"),
    },
    {
      id: 4,
      title: "Promo Code",
      icon: "ticket-outline",
      onPress: () => router.push("/promo-code"),
    },
    // {
    //   id: 5,
    //   title: 'Notifications',
    //   icon: 'notifications-outline',
    //   onPress: () => router.push('/notifications'),
    // },
    {
      id: 6,
      title: "Help",
      icon: "help-circle-outline",
      onPress: () => router.push("/help"),
    },
    
    {
      id: 7,
      title: "About",
      icon: "information-circle-outline",
      onPress: () => router.push("/about"),
    },
    {
      id: 8,
      title: "Privacy Policy",
      icon: "shield-checkmark-outline",
      onPress: () => router.push("/legal-policy?type=privacy"),
    },
    {
      id: 9,
      title: "Terms & Conditions",
      icon: "document-text-outline",
      onPress: () => router.push("/legal-policy?type=terms"),
    },
    {
      id: 10,
      title: "Cancellation & Refund Policy",
      icon: "refresh-circle-outline",
      onPress: () => router.push("/legal-policy?type=cancellation"),
    },
  ];

  const renderMenuItem = (item) => (
    <TouchableOpacity
      key={item.id}
      style={styles.menuItem}
      onPress={item.onPress}
    >
      <View style={styles.menuItemContent}>
        <Ionicons
          name={item.icon}
          size={24}
          color={theme.colors.text.primary}
        />
        <Text style={styles.menuItemText}>{item.title}</Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={20}
        color={theme.colors.text.tertiary}
      />
    </TouchableOpacity>
  );

  // Show loading indicator while checking auth
  if (loading) {
    return (
      <SafeAreaWrapper>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.main} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  // If no user data after loading, don't render anything (will redirect)
  if (!userData) {
    return null;
  }

  return (
    <SafeAreaWrapper>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Account</Text>
        </View>
{/* {console.log("Rendering Account with userData:", getUserImage())} */}
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <Image
              source={
                isAuthenticated && getUserImage()
                  ? { uri: getUserImage() }
                  : require("../../assets/company/profile.png")
              }
              style={styles.profileImage}
              resizeMode="cover"
            />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{userData.name || "User"}</Text>
            <Text style={styles.userEmail}>
              {userData.email || userData.phone || "No email"}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => router.push("/my-details")}
          >
            <Ionicons
              name="pencil-outline"
              size={20}
              color={theme.colors.secondary.main}
            />
          </TouchableOpacity>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>{menuItems.map(renderMenuItem)}</View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <View style={styles.logoutContent}>
            <Ionicons
              name="log-out-outline"
              size={24}
              color={theme.colors.status.error}
            />
            <Text style={styles.logoutText}>Sign Out</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
    paddingHorizontal: theme.spacing.lg,
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
    alignItems: "center",
    paddingVertical: theme.spacing.xl,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize["3xl"],
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.text.primary,
  },

  // Profile Section Styles
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  profileImageContainer: {
    marginRight: theme.spacing.lg,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: theme.components.avatar.borderRadius,
    borderWidth: 2,
    borderColor: theme.colors.secondary.main,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  userEmail: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: "Outfit-Regular",
    color: theme.colors.text.secondary,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.surface.light,
    justifyContent: "center",
    alignItems: "center",
  },

  // Menu Section Styles
  menuSection: {
    backgroundColor: theme.colors.surface.card,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface.divider,
  },
  menuItemContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  menuItemText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: "Outfit-Regular",
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.lg,
  },

  // Logout Button Styles
  logoutButton: {
    backgroundColor: theme.colors.surface.card,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing["6xl"],
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  logoutContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
  logoutText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: "Outfit-Medium",
    color: theme.colors.status.error,
    marginLeft: theme.spacing.lg,
  },
});

export default Account;
