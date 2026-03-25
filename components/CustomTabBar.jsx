import { useCart } from '@/providers/CartProvider';
import theme from '@/utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { router, usePathname, useSegments } from 'expo-router';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CustomTabBar = () => {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const segments = useSegments();
  const { totalItems } = useCart();

  const tabs = [
    {
      name: 'home',
      route: '/home',
      title: 'Shop',
      icon: 'home',
      iconOutline: 'home-outline',
    },
    {
      name: 'categories',
      route: '/categories',
      title: 'Explore',
      icon: 'grid',
      iconOutline: 'grid-outline',
    },
    {
      name: 'search',
      route: '/search',
      title: 'Search',
      icon: 'search',
      iconOutline: 'search-outline',
    },
    {
      name: 'cart',
      route: '/cart',
      title: 'Cart',
      icon: 'bag',
      iconOutline: 'bag-outline',
      showBadge: true,
    },
    {
      name: 'account',
      route: '/account',
      title: 'Account',
      icon: 'person',
      iconOutline: 'person-outline',
    },
  ];

  const handleTabPress = (route) => {
    router.push(route);
  };

  const isActiveTab = (tabName) => {
    const currentTab = segments[1]; // Get the tab segment
    return currentTab === tabName;
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom || theme.spacing.sm }]}>
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const isActive = isActiveTab(tab.name);
          const showCartBadge = tab.showBadge && totalItems > 0;
          
          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tabItem}
              onPress={() => handleTabPress(tab.route)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, isActive && styles.activeIconContainer]}>
                <Ionicons
                  name={isActive ? tab.icon : tab.iconOutline}
                  size={20}
                  color={isActive ? theme.colors.primary.main : theme.colors.text.primary}
                />
                {showCartBadge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {totalItems > 99 ? '99+' : totalItems}
                    </Text>
                  </View>
                )}
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  isActive ? styles.activeTabLabel : styles.inactiveTabLabel,
                ]}
                numberOfLines={1}
              >
                {tab.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    paddingTop: theme.spacing.sm,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    // paddingHorizontal: theme.spacing.lg,
    height: 60,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: theme.spacing.xs,
  },
  iconContainer: {
    marginBottom: theme.spacing.xs,
    position: 'relative',
  },
  activeIconContainer: {
    // Add any active state styling if needed
  },
  tabLabel: {
    fontSize: 12,
    fontFamily: 'Outfit-Medium',
    textAlign: 'center',
  },
  activeTabLabel: {
    color: theme.colors.primary.main,
  },
  inactiveTabLabel: {
    color: theme.colors.text.tertiary,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    backgroundColor: theme.colors.status.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: 'white',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontFamily: 'Outfit-SemiBold',
    textAlign: 'center',
  },
});

export default CustomTabBar;