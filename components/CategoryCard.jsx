import theme from '@/utils/theme';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const CategoryCard = ({ item, onPress }) => {
  const handlePress = () => {
    if (onPress) {
      onPress(item);
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <View style={[styles.content, {
        backgroundColor: item.backgroundColor,
        borderColor: item.borderColor || 'transparent'
      }]}>
        <View style={styles.imageContainer}>
          <Image
            source={typeof item.image === 'string' ? { uri: item.image } : item.image}
            style={styles.categoryImage}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.categoryName} numberOfLines={2}>
          {item.name}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '48%',
    marginBottom: theme.spacing.xl,
  },
  content: {
    borderRadius: theme.components.categoryCard.borderRadius,
    paddingVertical: theme.spacing['3xl'],
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 190,
    borderWidth: 2,
  },
  imageContainer: {
    marginBottom: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryImage: {
    width: 80,
    height: 80,
  },
  categoryName: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: 'Outfit-SemiBold',
    color: theme.colors.text.primary,
    textAlign: 'center',
    lineHeight: theme.typography.fontSize.lg * theme.typography.lineHeight.tight,
  },
});

export default CategoryCard;