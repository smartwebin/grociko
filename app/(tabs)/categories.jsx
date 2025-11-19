import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { getCategories } from '@/services/apiService';
import theme from '@/utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🟩 Category Color Mapping (same as in Home)
  const categoryColorMap = {
    fruits: { bg: theme.colors.category.fruits.background, border: theme.colors.category.fruits.border },
    vegetable: { bg: theme.colors.category.fruits.background, border: theme.colors.category.fruits.border },
    oil: { bg: theme.colors.category.oil.background, border: theme.colors.category.oil.border },
    meat: { bg: theme.colors.category.meat.background, border: theme.colors.category.meat.border },
    fish: { bg: theme.colors.category.meat.background, border: theme.colors.category.meat.border },
    bakery: { bg: theme.colors.category.bakery.background, border: theme.colors.category.bakery.border },
    snacks: { bg: theme.colors.category.bakery.background, border: theme.colors.category.bakery.border },
    dairy: { bg: theme.colors.category.dairy.background, border: theme.colors.category.dairy.border },
    eggs: { bg: theme.colors.category.dairy.background, border: theme.colors.category.dairy.border },
    beverages: { bg: theme.colors.category.beverages.background, border: theme.colors.category.beverages.border },
  };

  const getCategoryColors = (name) => {
    const lower = name?.toLowerCase() || '';
    for (const [key, colors] of Object.entries(categoryColorMap)) {
      if (lower.includes(key)) return colors;
    }
    return { bg: '#FFF8E1', border: '#FFD54F' };
  };

  // 🟦 Fetch dynamic categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const res = await getCategories('active');
        if (res.success && res.data.length > 0) {
          const mapped = res.data.map((cat) => {
            const colors = getCategoryColors(cat.category);
            return {
              id: cat.id,
              name: cat.category,
              backgroundColor: colors.bg,
              borderColor: colors.border,
              image: cat.image ? { uri: cat.image } : require('../../assets/images/category/vegetables.png'),
              cat_id: cat.id,
            };
          });
          setCategories(mapped);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // 🟨 Responsive grid (always 3 columns)
  const getCardDimensions = () => {
    const padding = theme.spacing.lg * 2;
    const numColumns = 3;
    const totalGaps = theme.spacing.md * (numColumns - 1);
    const availableWidth = screenWidth - padding - totalGaps;
    const cardWidth = availableWidth / numColumns;
    const cardHeight = Math.max(cardWidth * 1.2, 140);
    return { numColumns, cardWidth: Math.floor(cardWidth), cardHeight: Math.floor(cardHeight) };
  };

  const { numColumns, cardWidth, cardHeight } = getCardDimensions();

  // 🟧 Handlers
  const handleCategoryPress = (item) => {
    router.push(`/search?cat_id=${item.cat_id}`);
  };

  // 🟥 Render each category
  const renderCategory = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryCard,
        {
          width: cardWidth,
          height: cardHeight,
          backgroundColor: item.backgroundColor,
          borderColor: item.borderColor,
        },
      ]}
      onPress={() => handleCategoryPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        <Image source={item.image} style={styles.categoryImage} resizeMode="cover" />
      </View>
      <Text style={styles.categoryName} numberOfLines={2}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  // 🧭 Render main screen
  return (
    <SafeAreaWrapper>
      <View style={styles.container}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>Find Products</Text>
        </View>

        {/* Search Bar */}
        <TouchableOpacity style={styles.searchBar} onPress={() => router.push('/search')} activeOpacity={0.8}>
          <Ionicons
            name="search-outline"
            size={20}
            color={theme.colors.text.secondary}
            style={styles.searchIcon}
          />
          <Text style={styles.searchPlaceholder}>Search Store</Text>
        </TouchableOpacity>

        {/* Category List */}
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary.main} />
            <Text style={styles.loaderText}>Loading categories...</Text>
          </View>
        ) : (
          <FlatList
            data={categories}
            renderItem={renderCategory}
            keyExtractor={(item) => item.id.toString()}
            numColumns={numColumns}
            key={`${numColumns}-${screenWidth}`}
            contentContainerStyle={styles.categoriesContainer}
            columnWrapperStyle={styles.categoryRow}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
    paddingHorizontal: theme.spacing.lg,
  },

  headerSection: {
    alignItems: 'center',
    paddingVertical: theme.spacing['2xl'],
  },
  headerTitle: {
    fontSize: theme.typography.fontSize['3xl'],
    fontFamily: 'Outfit-SemiBold',
    color: theme.colors.text.primary,
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface.input,
    borderColor: theme.colors.secondary.main,
    borderWidth: 1,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    marginBottom: theme.spacing['2xl'],
  },
  searchIcon: {
    marginRight: theme.spacing.md,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    fontFamily: 'Outfit-Regular',
    color: theme.colors.text.placeholder,
  },

  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    marginTop: 100,
  },
  loaderText: {
    marginTop: theme.spacing.md,
    color: theme.colors.text.secondary,
    fontFamily: 'Outfit-Medium',
  },

  categoriesContainer: {
    paddingBottom: theme.spacing['6xl'],
  },
  categoryRow: {
    justifyContent: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  categoryCard: {
    borderRadius: theme.borderRadius.xl,
    borderWidth: 2,
    padding: theme.spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
    overflow: 'hidden',
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    flex: 1,
    marginBottom: theme.spacing.xs,
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  categoryName: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: 'Outfit-Medium',
    color: theme.colors.text.primary,
    textAlign: 'center',
    lineHeight: theme.typography.fontSize.xs * 1.3,
  },
});

export default Categories;