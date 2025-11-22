import BannerCarousel from "@/components/BannerCarousel";
import ProductCard from "@/components/ProductCard";
import SafeAreaWrapper from "@/components/SafeAreaWrapper";
import { useUser } from "@/providers/UserProvider";
import {
  getBrands,
  getCategories,
  getMobileSliders,
  getProducts,
} from "@/services/apiService";
import theme from "@/utils/theme";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const Home = () => {
  // Get user context
  const { user, isAuthenticated, getUserImage } = useUser();

  // State for dynamic data
  const [bannerData, setBannerData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [bestSelling, setBestSelling] = useState([]);
  const [loading, setLoading] = useState(true);
  const [catProducts, setCatProducts] = useState([]);

  // Color mapping for categories (fallback to theme colors)
  const categoryColorMap = {
    fruits: {
      bg: theme.colors.category.fruits.background,
      border: theme.colors.category.fruits.border,
    },
    vegetable: {
      bg: theme.colors.category.fruits.background,
      border: theme.colors.category.fruits.border,
    },
    oil: {
      bg: theme.colors.category.oil.background,
      border: theme.colors.category.oil.border,
    },
    meat: {
      bg: theme.colors.category.meat.background,
      border: theme.colors.category.meat.border,
    },
    fish: {
      bg: theme.colors.category.meat.background,
      border: theme.colors.category.meat.border,
    },
    bakery: {
      bg: theme.colors.category.bakery.background,
      border: theme.colors.category.bakery.border,
    },
    snacks: {
      bg: theme.colors.category.bakery.background,
      border: theme.colors.category.bakery.border,
    },
    dairy: {
      bg: theme.colors.category.dairy.background,
      border: theme.colors.category.dairy.border,
    },
    eggs: {
      bg: theme.colors.category.dairy.background,
      border: theme.colors.category.dairy.border,
    },
    beverages: {
      bg: theme.colors.category.beverages.background,
      border: theme.colors.category.beverages.border,
    },
  };

  const getCategoryColors = (categoryName) => {
    const lowerName = categoryName?.toLowerCase() || "";
    for (const [key, colors] of Object.entries(categoryColorMap)) {
      if (lowerName.includes(key)) {
        return colors;
      }
    }
    return { bg: "#FFF8E1", border: "#FFD54F" }; // Default colors
  };

  // Fetch all data every time screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchHomeData();

      // Optional cleanup (runs when leaving screen)
      return () => {};
    }, [])
  );

  const fetchHomeData = async () => {
    try {
      setLoading(true);

      // Fetch all data in parallel
      const [
        slidersRes,
        categoriesRes,
        brandsRes,
        featuredRes,
        allProductsRes,
      ] = await Promise.all([
        getMobileSliders(),
        getCategories("active"),
        getBrands("active"),
        getProducts({ featured: "1", status: "active" }),
        getProducts({ status: "active" }),
      ]);

      // Map sliders data
      if (slidersRes.success && slidersRes.data.length > 0) {
        const mappedSliders = slidersRes.data.map((slider, index) => {
          const colors = getCategoryColors(slider.category);
          // console.log("slider.image",slider.image)
          return {
            id: slider.id,
            title: slider.category || `Slider ${slider.id}`,
            subtitle: "Fresh & Delicious",
            image: slider.image
              ? { uri: slider.image }
              : require("../../assets/images/slider/slider_1.png"),
            backgroundColor: colors.bg,
          };
        });
        setBannerData(mappedSliders);
      }

      // Map categories data
      if (categoriesRes.success && categoriesRes.data.length > 0) {
        const mappedCategories = categoriesRes.data.map((cat) => {
          const colors = getCategoryColors(cat.category);
          // console.log(`nameCat:`, cat);
          return {
            id: cat.id,
            name: cat.category,
            backgroundColor: colors.bg,
            borderColor: colors.border,
            image: cat.image
              ? { uri: cat.image }
              : require("../../assets/images/category/vegetables.png"),
            cat_id: cat.id,
          };
        });
        // ✅ Filter and prepare showhome categories with products
        const showHomeCats = categoriesRes.data
          .filter((cat) => cat.showhome === "yes")
          .map((cat) => ({
            id: cat.id,
            title: cat.category, // used for section title
            products: (cat.products || []).map((product) => ({
              id: product.id,
              name: product.name,
              vat_cat: product.vat_cat || "",
              tag:product.tag,
              tag_color:product.tag_color,
              quantity: product.quantity || 0,
              weight: product.weight,
              unit:
                product.unit ||
                `${product.weight || "1kg"}, Price per ${product.unit || "kg"}`,
              mrp: parseFloat(product.mrp) || 0,
              sellingPrice: parseFloat(product.sale_price) || 0,
              image: product.image
                ? { uri: product.image }
                : require("../../assets/images/products/large/01.png"),
              category: product.category?.toLowerCase() || "general",
            })),
          }));
        setCategories(mappedCategories);
        setCatProducts(showHomeCats);
      }

      // Map brands data
      if (brandsRes.data && brandsRes.data.length > 0) {
        // console.log(`brandsRes:`,brandsRes.data)

        const mappedBrands = brandsRes.data.map((brand) => ({
          id: brand.id,
          name: brand.brand,
          image:
            brand.image ||
            "https://images.pexels.com/photos/1143754/pexels-photo-1143754.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop",
        }));
        setBrands(mappedBrands);
      }

      // Map all products to best selling and meat products
      if (allProductsRes.success && allProductsRes.data.length > 0) {
        // console.log(`allProductsRes:`, allProductsRes.data);
        const allProducts = allProductsRes.data.map((product) => ({
          id: product.id,
          name: product.name,
          vat_cat: product.vat_cat || "",
          quantity: product.quantity || 0,
          tag:product.tag,
          tag_color:product.tag_color,
          weight: product.weight,
          unit:
            product.unit ||
            `${product.weight || "1kg"}, Price per ${product.unit || "kg"}`,
          mrp: parseFloat(product.mrp) || 0,
          sellingPrice: parseFloat(product.sale_price) || 0,
          image: product.image
            ? { uri: product.image }
            : require("../../assets/images/products/large/01.png"),
          category: product.category?.toLowerCase() || "general",
        }));

        // Best selling - first 6 products (excluding featured)
        setBestSelling(allProducts.slice(0, 6));
      }
    } catch (error) {
      console.error("Error fetching home data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductPress = (item) => {
    // Navigate to product details page with product ID
    router.push(`/product/${item.id}`);
  };

  const handleBannerPress = (item) => {
    // Navigate to category or promotion page
    router.push(`/search?cat_id=${item.id}`);
  };

  const handleCategoryPress = (item) => {
    // Navigate to search page with category ID
    router.push(`/search?cat_id=${item.cat_id}`);
  };

  const handleSeeAll = (section) => {
    switch (section) {
      case "categories":
        router.push("/categories");
        break;
      case "exclusive":
      case "best-selling":
      case "meat":
      case "brands":
        router.push("/search");
        break;
      default:
        router.push("/search");
        break;
    }
  };

  const handleBrandPress = (brand) => {
    // Navigate to search page with brand filter
    router.push(`/search?brand_id=${brand.id}`);
  };

  const handleProfilePress = () => {
    if (isAuthenticated) {
      router.push("/my-details");
    } else {
      router.push("/(auth)/signin");
    }
  };

  const renderProductCard = ({ item }) => (
    <ProductCard item={item} onPress={handleProductPress} />
  );

  const renderCategoryCard = ({ item }) => (
    <TouchableOpacity
      style={styles.categoryItem}
      onPress={() => handleCategoryPress(item)}
    >
      <View
        style={[
          styles.categoryImageContainer,
          {
            backgroundColor: item.backgroundColor,
            borderColor: item.borderColor || "transparent",
          },
        ]}
      >
        <Image
          source={
            typeof item.image === "string" ? { uri: item.image } : item.image
          }
          style={styles.categoryImage}
          resizeMode="cover"
        />
        <Text style={styles.categoryNameInside} numberOfLines={2}>
          {item.name}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderBrandItem = ({ item }) => (
    <TouchableOpacity
      style={styles.brandItem}
      onPress={() => handleBrandPress(item)}
    >
      <View style={styles.brandImageContainer}>
        <Image
          source={{ uri: item.image }}
          style={styles.brandImage}
          resizeMode="cover"
        />
      </View>
      <Text style={styles.brandName} numberOfLines={1}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaWrapper>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.main} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              {/* Company Logo */}
              <View style={styles.logoContainer}>
                <Image
                  source={require("../../assets/company/logo.png")}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>

              {/* Profile Section */}
              <TouchableOpacity
                style={styles.profileSection}
                onPress={handleProfilePress}
              >
                <Image
                  source={
                    isAuthenticated && getUserImage()
                      ? { uri: getUserImage() }
                      : require("../../assets/company/profile.png")
                  }
                  style={styles.profileImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <TouchableOpacity
              style={styles.searchBar}
              onPress={() => router.push("/search")}
            >
              <Ionicons
                name="search"
                size={20}
                color={theme.colors.text.secondary}
              />
              <Text style={styles.searchPlaceholder}>Search Store</Text>
            </TouchableOpacity>
          </View>

          {/* Banner */}
          <BannerCarousel data={bannerData} onPress={handleBannerPress} />

          {/* Categories */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Shop by Category</Text>
              <TouchableOpacity onPress={() => handleSeeAll("categories")}>
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={categories}
              renderItem={renderCategoryCard}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesList}
            />
          </View>

          {/* Best Selling */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Exclusive Offers</Text>
              <TouchableOpacity onPress={() => handleSeeAll("best-selling")}>
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={bestSelling}
              renderItem={renderProductCard}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.productList}
            />
          </View>

          {/* Brands */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Shop by Brand</Text>
              <TouchableOpacity onPress={() => handleSeeAll("brands")}>
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={brands}
              renderItem={renderBrandItem}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.brandsList}
            />
          </View>

          {catProducts
            .filter((cat) => cat.products && cat.products.length > 0) // ✅ only show categories that have products
            .map((cat) => (
              <View key={cat.id} style={[styles.section, styles.lastSection]}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{cat.title}</Text>
                  <TouchableOpacity
                    onPress={() => router.push(`/search?cat_id=${cat.id}`)}
                  >
                    <Text style={styles.seeAllText}>See all</Text>
                  </TouchableOpacity>
                </View>

                <FlatList
                  data={cat.products}
                  renderItem={renderProductCard}
                  keyExtractor={(item) => item.id.toString()}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.productList}
                />
              </View>
            ))}
        </ScrollView>
      )}
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
    marginTop: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    fontFamily: "Outfit-Medium",
    color: theme.colors.text.secondary,
  },

  // Header Styles
  header: {
    // paddingTop: theme.spacing.md,
    // marginBottom: theme.spacing.lg,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    // paddingHorizontal: theme.spacing.lg,
  },
  logoContainer: {
    flex: 1,
    alignItems: "flex-start",
  },
  logo: {
    width: 140,
    height: 70,
  },
  profileSection: {
    alignItems: "center",
  },
  profileImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: theme.colors.primary.main,
  },

  // Search Styles
  searchContainer: {
    // paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface.input,
    borderRadius: theme.components.searchBar.borderRadius,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.components.searchBar.padding,
    height: theme.components.searchBar.height,
    borderWidth: 1,
    borderColor: theme.colors.secondary.main,
    paddingBottom: 10,
  },
  searchPlaceholder: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: "Outfit-Regular",
    color: theme.colors.text.placeholder,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },

  // Section Styles
  section: {
    marginBottom: theme.spacing.xl,
  },
  lastSection: {
    marginBottom: theme.spacing["4xl"],
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xs,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.text.primary,
  },
  seeAllText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: "Outfit-Medium",
    color: theme.colors.secondary.main,
  },

  // List Styles
  productList: {
    paddingLeft: theme.spacing.xs,
  },
  categoriesList: {
    paddingLeft: theme.spacing.xs,
  },
  categoryItem: {
    alignItems: "center",
    marginRight: theme.spacing.sm,
    width: 120,
  },
  categoryImageContainer: {
    width: 120,
    flex: 1,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 2,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.xs,
    overflow: "hidden",
  },
  categoryImage: {
    width: "100%",
    height: 100,
  },
  categoryNameInside: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: "Outfit-Medium",
    color: theme.colors.text.primary,
    textAlign: "center",
    lineHeight: theme.typography.fontSize.xs * 1.3,
    marginTop: theme.spacing.xs,
  },

  // Brand Styles
  brandsList: {
    paddingLeft: theme.spacing.xs,
  },
  brandItem: {
    alignItems: "center",
    marginRight: theme.spacing.lg,
    width: 80,
  },
  brandImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: theme.spacing.sm,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: theme.colors.surface.border,
  },
  brandImage: {
    width: "100%",
    height: "100%",
  },
  brandName: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: "Outfit-Medium",
    color: theme.colors.text.primary,
    textAlign: "center",
  },
});

export default Home;