import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import theme from '@/utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const Notifications = () => {
  const [notifications, setNotifications] = useState([
    {
      id: '1',
      title: 'Order Delivered',
      message: 'Your order #ORD001 has been delivered successfully',
      time: '2 minutes ago',
      type: 'order',
      read: false,
      icon: 'bag-check-outline',
      iconColor: theme.colors.status.success,
    },
    {
      id: '2',
      title: 'Special Offer',
      message: '30% off on fresh vegetables this weekend only',
      time: '1 hour ago',
      type: 'promotion',
      read: false,
      icon: 'pricetag-outline',
      iconColor: theme.colors.status.warning,
    },
    {
      id: '3',
      title: 'Order Confirmed',
      message: 'Your order #ORD002 has been confirmed and is being prepared',
      time: '3 hours ago',
      type: 'order',
      read: true,
      icon: 'checkmark-circle-outline',
      iconColor: theme.colors.status.info,
    },
  
    {
      id: '5',
      title: 'New Products Available',
      message: 'Check out our latest organic collection now available',
      time: '2 days ago',
      type: 'product',
      read: true,
      icon: 'leaf-outline',
      iconColor: theme.colors.secondary.main,
    },
  ]);

  const [settings, setSettings] = useState({
    orderUpdates: true,
    promotions: true,
    newProducts: false,
    general: true,
  });

  const handleNotificationPress = (notification) => {
    // Mark as read and navigate if needed
    setNotifications(prevNotifications =>
      prevNotifications.map(n =>
        n.id === notification.id ? { ...n, read: true } : n
      )
    );

    // Navigate based on notification type
    switch (notification.type) {
      case 'order':
        router.push('/orders');
        break;
      case 'promotion':
        router.push('/search');
        break;
      
      default:
        break;
    }
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  const handleSettingChange = (setting, value) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      [setting]: value,
    }));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const renderNotificationItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.notificationCard, !item.read && styles.unreadCard]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.notificationContent}>
        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: `${item.iconColor}20` }]}>
          <Ionicons name={item.icon} size={24} color={item.iconColor} />
        </View>

        {/* Content */}
        <View style={styles.textContent}>
          <Text style={[styles.notificationTitle, !item.read && styles.unreadTitle]}>
            {item.title}
          </Text>
          <Text style={styles.notificationMessage} numberOfLines={2}>
            {item.message}
          </Text>
          <Text style={styles.notificationTime}>{item.time}</Text>
        </View>

        {/* Unread Indicator */}
        {!item.read && <View style={styles.unreadIndicator} />}
      </View>
    </TouchableOpacity>
  );

  const renderSettingItem = ({ item }) => (
    <View style={styles.settingItem}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingTitle}>{item.title}</Text>
        <Text style={styles.settingDescription}>{item.description}</Text>
      </View>
      <Switch
        value={settings[item.key]}
        onValueChange={(value) => handleSettingChange(item.key, value)}
        trackColor={{
          false: theme.colors.surface.border,
          true: theme.colors.primary.light,
        }}
        thumbColor={
          settings[item.key] ? theme.colors.secondary.main : theme.colors.surface.medium
        }
      />
    </View>
  );

  const notificationSettings = [
    {
      key: 'orderUpdates',
      title: 'Order Updates',
      description: 'Get notified about your order status',
    },
    {
      key: 'promotions',
      title: 'Promotions & Offers',
      description: 'Receive updates about special deals',
    },
    {
      key: 'newProducts',
      title: 'New Products',
      description: 'Be the first to know about new arrivals',
    },
   
    {
      key: 'general',
      title: 'General Notifications',
      description: 'Important app updates and announcements',
    },
  ];

  return (
    <SafeAreaWrapper>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClearAll}
            disabled={notifications.length === 0}
          >
            <Text style={[
              styles.clearButtonText,
              notifications.length === 0 && styles.disabledText
            ]}>
              Clear All
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Notification Badge */}
          {unreadCount > 0 && (
            <View style={styles.badgeContainer}>
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>
                  {unreadCount} new notification{unreadCount > 1 ? 's' : ''}
                </Text>
              </View>
            </View>
          )}

          {/* Notifications List */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Notifications</Text>
            {notifications.length > 0 ? (
              <View>
                {notifications.map((item) => (
                  <View key={item.id}>
                    {renderNotificationItem({ item })}
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="notifications-off-outline" size={64} color={theme.colors.text.tertiary} />
                <Text style={styles.emptyTitle}>No Notifications</Text>
                <Text style={styles.emptySubtitle}>
                  You're all caught up! New notifications will appear here.
                </Text>
              </View>
            )}
          </View>

          {/* Notification Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notification Settings</Text>
            <View style={styles.settingsContainer}>
              {notificationSettings.map((item, index) => (
                <View key={item.key}>
                  {renderSettingItem({ item })}
                  {index < notificationSettings.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },

  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.surface.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: 'Outfit-SemiBold',
    color: theme.colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  clearButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  clearButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: 'Outfit-Medium',
    color: theme.colors.secondary.main,
  },
  disabledText: {
    color: theme.colors.text.tertiary,
  },

  // ScrollView Content
  scrollContent: {
    paddingBottom: theme.spacing['4xl'],
  },

  // Badge Styles
  badgeContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  unreadBadge: {
    backgroundColor: theme.colors.secondary.main,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    alignSelf: 'flex-start',
  },
  unreadBadgeText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: 'Outfit-SemiBold',
    color: theme.colors.text.white,
  },

  // Section Styles
  section: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: 'Outfit-SemiBold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
  },

  // Notifications List
  notificationCard: {
    backgroundColor: theme.colors.surface.card,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  unreadCard: {
    borderColor: theme.colors.primary.light,
    backgroundColor: `${theme.colors.secondary.main}05`,
  },
  notificationContent: {
    flexDirection: 'row',
    padding: theme.spacing.lg,
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.lg,
  },
  textContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: 'Outfit-SemiBold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  unreadTitle: {
    color: theme.colors.primary.dark,
  },
  notificationMessage: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: 'Outfit-Regular',
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
    lineHeight: theme.typography.fontSize.sm * theme.typography.lineHeight.normal,
  },
  notificationTime: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: 'Outfit-Regular',
    color: theme.colors.text.tertiary,
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.secondary.main,
    marginLeft: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing['4xl'],
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: 'Outfit-SemiBold',
    color: theme.colors.text.primary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  emptySubtitle: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: 'Outfit-Regular',
    color: theme.colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: theme.spacing['2xl'],
  },

  // Settings Styles
  settingsContainer: {
    backgroundColor: theme.colors.surface.card,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
  settingInfo: {
    flex: 1,
    marginRight: theme.spacing.lg,
  },
  settingTitle: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: 'Outfit-SemiBold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  settingDescription: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: 'Outfit-Regular',
    color: theme.colors.text.secondary,
    lineHeight: theme.typography.fontSize.sm * theme.typography.lineHeight.normal,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.surface.divider,
    marginHorizontal: theme.spacing.lg,
  },
});

export default Notifications;