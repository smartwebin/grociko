import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import theme from '@/utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const PaymentMethods = () => {
  const [paymentMethods, setPaymentMethods] = useState([
    {
      id: '1',
      type: 'card',
      cardType: 'visa',
      last4: '4532',
      cardHolder: 'Shabeer Ahmed',
      expiryDate: '12/26',
      isDefault: true,
    },
    {
      id: '2',
      type: 'card',
      cardType: 'mastercard',
      last4: '8765',
      cardHolder: 'Shabeer Ahmed',
      expiryDate: '08/25',
      isDefault: false,
    },
    {
      id: '3',
      type: 'digital',
      provider: 'paypal',
      email: 'shabeer@grociko.com',
      isDefault: false,
    },
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [addCardData, setAddCardData] = useState({
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: '',
  });

  const getCardIcon = (cardType) => {
    switch (cardType) {
      case 'visa':
        return 'https://cdn.worldvectorlogo.com/logos/visa.svg';
      case 'mastercard':
        return 'https://cdn.worldvectorlogo.com/logos/mastercard-2.svg';
      default:
        return null;
    }
  };

  const getDigitalWalletIcon = (provider) => {
    switch (provider) {
      case 'paypal':
        return 'https://cdn.worldvectorlogo.com/logos/paypal-2.svg';
      case 'apple-pay':
        return 'https://cdn.worldvectorlogo.com/logos/apple-pay.svg';
      case 'google-pay':
        return 'https://cdn.worldvectorlogo.com/logos/google-pay-primary-logo-logo-horizontal.svg';
      default:
        return null;
    }
  };

  const handleSetDefault = (id) => {
    setPaymentMethods(methods =>
      methods.map(method => ({
        ...method,
        isDefault: method.id === id
      }))
    );
  };

  const handleDelete = (id) => {
    const method = paymentMethods.find(m => m.id === id);
    if (method?.isDefault && paymentMethods.length > 1) {
      Alert.alert(
        'Cannot Delete',
        'Please set another payment method as default before deleting this one.'
      );
      return;
    }

    Alert.alert(
      'Delete Payment Method',
      'Are you sure you want to remove this payment method?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedMethods = paymentMethods.filter(m => m.id !== id);

            // If deleted method was default and there are other methods, make the first one default
            if (method?.isDefault && updatedMethods.length > 0) {
              updatedMethods[0].isDefault = true;
            }

            setPaymentMethods(updatedMethods);
          },
        },
      ]
    );
  };

  const formatCardNumber = (text) => {
    // Remove all non-digit characters
    const cleaned = text.replace(/\D+/g, '');

    // Add spaces every 4 digits
    const formatted = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');

    return formatted.slice(0, 19); // Max 16 digits + 3 spaces
  };

  const formatExpiryDate = (text) => {
    // Remove all non-digit characters
    const cleaned = text.replace(/\D+/g, '');

    // Add slash after 2 digits
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }

    return cleaned;
  };

  const handleAddCard = () => {
    if (!addCardData.cardNumber || !addCardData.cardHolder || !addCardData.expiryDate || !addCardData.cvv) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    // Basic validation
    const cleanCardNumber = addCardData.cardNumber.replace(/\s/g, '');
    if (cleanCardNumber.length < 16) {
      Alert.alert('Error', 'Please enter a valid card number');
      return;
    }

    const newCard = {
      id: Date.now().toString(),
      type: 'card',
      cardType: cleanCardNumber.startsWith('4') ? 'visa' : 'mastercard',
      last4: cleanCardNumber.slice(-4),
      cardHolder: addCardData.cardHolder,
      expiryDate: addCardData.expiryDate,
      isDefault: paymentMethods.length === 0,
    };

    setPaymentMethods([...paymentMethods, newCard]);
    setModalVisible(false);
    setAddCardData({ cardNumber: '', cardHolder: '', expiryDate: '', cvv: '' });
  };

  const renderPaymentMethod = ({ item }) => (
    <View style={styles.paymentCard}>
      <View style={styles.cardContent}>
        {/* Card Icon/Info */}
        <View style={styles.cardInfo}>
          {item.type === 'card' ? (
            <View style={styles.cardDetails}>
              <View style={styles.cardIconContainer}>
                {getCardIcon(item.cardType) && (
                  <Image
                    source={{ uri: getCardIcon(item.cardType) }}
                    style={styles.cardIcon}
                    resizeMode="contain"
                  />
                )}
              </View>
              <View style={styles.cardTextInfo}>
                <Text style={styles.cardNumber}>
                  •••• •••• •••• {item.last4}
                </Text>
                <Text style={styles.cardHolder}>{item.cardHolder}</Text>
                <Text style={styles.expiryDate}>Expires {item.expiryDate}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.digitalWalletDetails}>
              <View style={styles.walletIconContainer}>
                {getDigitalWalletIcon(item.provider) && (
                  <Image
                    source={{ uri: getDigitalWalletIcon(item.provider) }}
                    style={styles.walletIcon}
                    resizeMode="contain"
                  />
                )}
              </View>
              <View style={styles.walletTextInfo}>
                <Text style={styles.walletProvider}>
                  {item.provider.charAt(0).toUpperCase() + item.provider.slice(1)}
                </Text>
                <Text style={styles.walletEmail}>{item.email}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Default Badge */}
        {item.isDefault && (
          <View style={styles.defaultBadge}>
            <Text style={styles.defaultText}>Default</Text>
          </View>
        )}
      </View>

      {/* Actions */}
      <View style={styles.cardActions}>
        {!item.isDefault && (
          <TouchableOpacity
            style={styles.setDefaultButton}
            onPress={() => handleSetDefault(item.id)}
          >
            <Text style={styles.setDefaultText}>Set as Default</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item.id)}
        >
          <Ionicons name="trash-outline" size={18} color={theme.colors.status.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

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
          <Text style={styles.headerTitle}>Payment Methods</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Payment Methods List */}
        <FlatList
          data={paymentMethods}
          renderItem={renderPaymentMethod}
          keyExtractor={(item) => item.id}
          style={styles.paymentList}
          contentContainerStyle={styles.paymentListContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="card-outline" size={64} color={theme.colors.text.tertiary} />
              <Text style={styles.emptyTitle}>No Payment Methods</Text>
              <Text style={styles.emptySubtitle}>
                Add a payment method to make checkout faster
              </Text>
            </View>
          }
        />

        {/* Add New Card Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={24} color={theme.colors.text.white} />
          <Text style={styles.addButtonText}>Add New Card</Text>
        </TouchableOpacity>

        {/* Add Card Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Add New Card</Text>
                  <TouchableOpacity
                    style={styles.modalCloseButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Ionicons name="close" size={24} color={theme.colors.text.primary} />
                  </TouchableOpacity>
                </View>

                {/* Card Form */}
                <View style={styles.cardForm}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Card Number</Text>
                    <TextInput
                      style={styles.textInput}
                      value={addCardData.cardNumber}
                      onChangeText={(text) => setAddCardData({
                        ...addCardData,
                        cardNumber: formatCardNumber(text)
                      })}
                      placeholder="1234 5678 9012 3456"
                      placeholderTextColor={theme.colors.text.placeholder}
                      keyboardType="numeric"
                      maxLength={19}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Cardholder Name</Text>
                    <TextInput
                      style={styles.textInput}
                      value={addCardData.cardHolder}
                      onChangeText={(text) => setAddCardData({
                        ...addCardData,
                        cardHolder: text
                      })}
                      placeholder="John Doe"
                      placeholderTextColor={theme.colors.text.placeholder}
                      autoCapitalize="words"
                    />
                  </View>

                  <View style={styles.rowInputs}>
                    <View style={[styles.inputGroup, styles.halfWidth]}>
                      <Text style={styles.inputLabel}>Expiry Date</Text>
                      <TextInput
                        style={styles.textInput}
                        value={addCardData.expiryDate}
                        onChangeText={(text) => setAddCardData({
                          ...addCardData,
                          expiryDate: formatExpiryDate(text)
                        })}
                        placeholder="MM/YY"
                        placeholderTextColor={theme.colors.text.placeholder}
                        keyboardType="numeric"
                        maxLength={5}
                      />
                    </View>

                    <View style={[styles.inputGroup, styles.halfWidth]}>
                      <Text style={styles.inputLabel}>CVV</Text>
                      <TextInput
                        style={styles.textInput}
                        value={addCardData.cvv}
                        onChangeText={(text) => setAddCardData({
                          ...addCardData,
                          cvv: text.replace(/\D/g, '').slice(0, 4)
                        })}
                        placeholder="123"
                        placeholderTextColor={theme.colors.text.placeholder}
                        keyboardType="numeric"
                        maxLength={4}
                        secureTextEntry
                      />
                    </View>
                  </View>
                </View>

                {/* Add Button */}
                <TouchableOpacity style={styles.modalAddButton} onPress={handleAddCard}>
                  <Text style={styles.modalAddButtonText}>Add Card</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
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
  headerRight: {
    width: 40,
  },

  // Payment List Styles
  paymentList: {
    flex: 1,
  },
  paymentListContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing['8xl'],
  },

  // Payment Card Styles
  paymentCard: {
    backgroundColor: theme.colors.surface.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.lg,
  },
  cardInfo: {
    flex: 1,
  },
  cardDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIconContainer: {
    width: 50,
    height: 32,
    marginRight: theme.spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardIcon: {
    width: 50,
    height: 32,
  },
  cardTextInfo: {
    flex: 1,
  },
  cardNumber: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: 'Outfit-SemiBold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  cardHolder: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: 'Outfit-Regular',
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  expiryDate: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: 'Outfit-Regular',
    color: theme.colors.text.secondary,
  },

  // Digital Wallet Styles
  digitalWalletDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletIconContainer: {
    width: 50,
    height: 32,
    marginRight: theme.spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletIcon: {
    width: 50,
    height: 32,
  },
  walletTextInfo: {
    flex: 1,
  },
  walletProvider: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: 'Outfit-SemiBold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  walletEmail: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: 'Outfit-Regular',
    color: theme.colors.text.secondary,
  },

  // Default Badge
  defaultBadge: {
    backgroundColor: theme.colors.primary.main,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  defaultText: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: 'Outfit-Medium',
    color: theme.colors.text.white,
  },

  // Card Actions
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.surface.divider,
    paddingTop: theme.spacing.lg,
  },
  setDefaultButton: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.primary.main,
  },
  setDefaultText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: 'Outfit-Medium',
    color: theme.colors.primary.main,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: `${theme.colors.status.error}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Add Button
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary.main,
    marginHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  addButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: 'Outfit-SemiBold',
    color: theme.colors.text.white,
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing['6xl'],
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
    paddingHorizontal: theme.spacing['3xl'],
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.background.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.background.primary,
    borderTopLeftRadius: theme.borderRadius['2xl'],
    borderTopRightRadius: theme.borderRadius['2xl'],
    paddingTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: 'Outfit-SemiBold',
    color: theme.colors.text.primary,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.surface.light,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Form Styles
  cardForm: {
    gap: theme.spacing.lg,
  },
  inputGroup: {
    gap: theme.spacing.sm,
  },
  inputLabel: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: 'Outfit-Medium',
    color: theme.colors.text.primary,
  },
  textInput: {
    backgroundColor: theme.colors.surface.input,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    fontSize: theme.typography.fontSize.base,
    fontFamily: 'Outfit-Regular',
    color: theme.colors.text.primary,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
  },
  halfWidth: {
    flex: 1,
  },
  modalAddButton: {
    backgroundColor: theme.colors.primary.main,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    marginTop: theme.spacing.xl,
  },
  modalAddButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: 'Outfit-SemiBold',
    color: theme.colors.text.white,
  },
});

export default PaymentMethods;