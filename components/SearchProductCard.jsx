import { useCart } from '@/providers/CartProvider';
import theme from '@/utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const SearchProductCard = ({ item, onPress }) => {
  const { addToCart, updateQuantity, getItemQuantity } = useCart();
  const quantity = getItemQuantity(item.id);

  // Calculate discount percentage
  const discount = item.mrp > item.sellingPrice 
    ? Math.round(((item.mrp - item.sellingPrice) / item.mrp) * 100) 
    : 0;

  // Get image URL
  const getImageUrl = (imageName) => {
    if (!imageName) return null;
    return `${imageName}`;
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    addToCart(item, 1);
  };

  const handleIncrement = (e) => {
    e.stopPropagation();
    if (quantity > 0) {
      updateQuantity(item.id, quantity + 1);
    } else {
      addToCart(item, 1);
    }
  };

  const handleDecrement = (e) => {
    e.stopPropagation();
    if (quantity > 1) {
      updateQuantity(item.id, quantity - 1);
    } else if (quantity === 1) {
      updateQuantity(item.id, 0);
    }
  };

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      {/* Image Container */}
      <View style={styles.imageContainer}>
        {item.image ? (
          <Image
            source={{ uri: getImageUrl(item.image) }}
            style={styles.productImage}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="image-outline" size={32} color={theme.colors.text.tertiary} />
          </View>
        )}
        
        {/* Discount Badge */}
        {discount > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discount}% OFF</Text>
          </View>
        )}
      </View>

      {/* Product Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.name}
        </Text>
        
        <Text style={styles.productUnit} numberOfLines={1}>
          {item.weight ? item.weight : item.unit}
        </Text>

        {/* Price Info */}
        <View style={styles.priceInfo}>
          {item.mrp > item.sellingPrice && (
            <Text style={styles.originalPrice}>£{item.mrp.toFixed(2)}</Text>
          )}
          <Text style={styles.price}>£{item.sellingPrice.toFixed(2)}</Text>
        </View>

        {/* Add to Cart Button or Quantity Selector */}
        <View style={styles.actionContainer}>
          {quantity === 0 ? (
            <TouchableOpacity 
              style={styles.addButton}
              onPress={handleAddToCart}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={18} color={theme.colors.text.white} />
            </TouchableOpacity>
          ) : (
            <View style={styles.quantityContainer}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={handleDecrement}
                activeOpacity={0.7}
              >
                <Ionicons name="remove" size={14} color={theme.colors.text.white} />
              </TouchableOpacity>

              <Text style={styles.quantityText}>{quantity}</Text>

              <TouchableOpacity
                style={styles.quantityButton}
                onPress={handleIncrement}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={14} color={theme.colors.text.white} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  imageContainer: {
    width: '100%',
    height: 140,
    backgroundColor: theme.colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surface.light,
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: theme.colors.secondary.main,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.sm,
  },
  discountText: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: 'Outfit-Bold',
    color: theme.colors.text.white,
  },
  infoContainer: {
    padding: theme.spacing.md,
  },
  productName: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: 'Outfit-SemiBold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
    lineHeight: 18,
    height: 36,
  },
  productUnit: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: 'Outfit-Regular',
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  priceInfo: {
    marginBottom: theme.spacing.sm,
  },
  originalPrice: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: 'Outfit-Regular',
    color: theme.colors.text.secondary,
    textDecorationLine: 'line-through',
    marginBottom: 2,
  },
  price: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: 'Outfit-Bold',
    color: theme.colors.text.primary,
  },
  actionContainer: {
    alignItems: 'flex-end',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.secondary.main,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: 4,
    height: 32,
  },
  quantityButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.secondary.main,
    borderRadius: theme.borderRadius.xs,
  },
  quantityText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: 'Outfit-Bold',
    color: theme.colors.text.white,
    marginHorizontal: theme.spacing.sm,
    minWidth: 20,
    textAlign: 'center',
  },
});

export default SearchProductCard;