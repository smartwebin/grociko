import ProductCard from "@/components/ProductCard";
import SafeAreaWrapper from "@/components/SafeAreaWrapper";
import SafeAreaWrapper2 from "@/components/SafeAreaWrapper2";
import { getFilters, getProducts } from "@/services/apiService";
import theme from "@/utils/theme";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const Search = () => {
  const searchParams = useLocalSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [showSortModal, setShowSortModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    category: "all",
    priceRange: { min: 0, max: 50000 },
    brand: "all",
    discount: 0,
  });

  // Dynamic data state
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [mainCategories, setMainCategories] = useState([]);
  const [subcategories, setSubcategories] = useState({});
  const [brandOptions, setBrandOptions] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  // Sort options
  const sortOptions = [
    { id: "name", name: "Name (A-Z)" },
    { id: "name-desc", name: "Name (Z-A)" },
    { id: "price-low", name: "Price: Low to High" },
    { id: "price-high", name: "Price: High to Low" },
    { id: "popular", name: "Most Popular" },
    { id: "newest", name: "Newest First" },
  ];

  // Load filters from API
  const loadFilters = async () => {
    try {
      setLoading(true);
      const response = await getFilters();

      if (response.success && response.data) {
        const categories = [
          {
            id: "all",
            name: "All Categories",
            count: response.data.total_products || 0,
          },
        ];

        if (response.data.categories) {
          response.data.categories.forEach((cat) => {
            categories.push({
              id: cat.id.toString(),
              name: cat.category,
              count: cat.count || 0,
            });
          });
        }

        setMainCategories(categories);

        const subcatsObj = {};
        if (response.data.subcategories) {
          response.data.subcategories.forEach((subcat) => {
            const catId = subcat.cat_id.toString();
            if (!subcatsObj[catId]) {
              subcatsObj[catId] = [];
            }
            subcatsObj[catId].push({
              id: subcat.id.toString(),
              name: subcat.subcategory,
              count: subcat.count || 0,
            });
          });
        }

        setSubcategories(subcatsObj);

        const brands = [{ id: "all", name: "All Brands" }];

        if (response.data.brands) {
          response.data.brands.forEach((brand) => {
            brands.push({
              id: brand.id.toString(),
              name: brand.brand,
              count: brand.count || 0,
            });
          });
        }

        setBrandOptions(brands);
      }
    } catch (error) {
      console.error("❌ Error loading filters:", error);
    } finally {
      setLoading(false);
    }
  };
  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);

      const filters = {};
      if (selectedFilter !== "all") filters.cat_id = selectedFilter;
      if (selectedSubcategory !== "all") filters.sub_id = selectedSubcategory;
      if (filterOptions.brand !== "all") filters.brand_id = filterOptions.brand;

      loadProducts(filters, nextPage, true); // true = append to existing
    }
  };
  // Load products from API
  const loadProducts = useCallback(
    async (filters = {}, pageNum = 1, append = false) => {
      try {
        // Show appropriate loader
        if (pageNum === 1) {
          setProductsLoading(true);
        } else {
          setIsLoadingMore(true);
        }

        const apiFilters = {
          status: "active",
          limit: 50,
          page: pageNum,
          ...filters,
        };

        const response = await getProducts(apiFilters);

        if (response.success && response.data && Array.isArray(response.data)) {
          const products = response.data.map((prod) => ({
            id: parseInt(prod.id),
            name: prod.name,
            description: prod.description || "",
            vat_cat: prod.vat_cat || "",
            tag: prod.tag,
            tag_color: prod.tag_color,
            quantity: prod.quantity || 0,
            unit: prod.unit || prod.weight || "1 unit",
            weight: prod.weight || "",
            mrp: parseFloat(prod.mrp) || 0,
            sale_price: parseFloat(prod.sale_price) || 0,
            sellingPrice: parseFloat(prod.sale_price) || 0,
            image: prod.image,
            sub_images: prod.sub_images || [],
            cat_id: prod.cat_id,
            sub_id: prod.sub_id,
            brand_id: prod.brand_id,
            category: prod.category || "",
            subcategory: prod.subcategory || "",
            brand: prod.brand || "",
            featured: prod.featured === "yes",
            status: prod.status || "",
          }));

          // Either append to existing products or replace them
          if (append) {
            setAllProducts((prev) => [...prev, ...products]);
          } else {
            setAllProducts(products);
          }

          // Check if there are more products to load
          // If we got less than 50 products, there are no more
          setHasMore(products.length === 50);
        } else {
          if (!append) {
            setAllProducts([]);
          }
          setHasMore(false);
        }
      } catch (error) {
        console.error("❌ Error loading products:", error);
        if (!append) {
          setAllProducts([]);
        }
        setHasMore(false);
      } finally {
        setProductsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [],
  );

  const resetFilters = () => {
    setFilterOptions({
      category: "all",
      priceRange: { min: 0, max: 50000 },
      brand: "all",
      discount: 0,
    });
    setSelectedFilter("all");
    setSelectedSubcategory("all");
    setSearchQuery("");
    setSortBy("name");
  };

  useFocusEffect(
    useCallback(() => {
      loadFilters();

      // Reset filters or apply params
      if (searchParams.cat_id || searchParams.brand_id) {
        // If params exist, set only those params and reset everything else
        if (searchParams.cat_id) {
          setSelectedFilter(searchParams.cat_id);
          setSelectedSubcategory("all");
        } else {
          setSelectedFilter("all");
          setSelectedSubcategory("all");
        }

        if (searchParams.brand_id) {
          setFilterOptions((prev) => ({
            category: "all",
            priceRange: { min: 0, max: 50000 },
            brand: searchParams.brand_id,
            discount: 0,
          }));
        } else {
          setFilterOptions((prev) => ({
            category: "all",
            priceRange: { min: 0, max: 50000 },
            brand: "all",
            discount: 0,
          }));
        }

        // Reset other filters
        setSearchQuery("");
        setSortBy("name");
      } else {
        // No params, reset everything
        resetFilters();
      }

      loadProducts();
    }, [searchParams.cat_id, searchParams.brand_id, loadProducts]),
  );

  useEffect(() => {
    setPage(1);
    setHasMore(true);

    const filters = {};
    if (selectedFilter !== "all") filters.cat_id = selectedFilter;
    if (selectedSubcategory !== "all") filters.sub_id = selectedSubcategory;
    if (filterOptions.brand !== "all") filters.brand_id = filterOptions.brand;

    loadProducts(filters, 1, false); // false = replace existing
  }, [selectedFilter, selectedSubcategory, filterOptions.brand]);

  // Filter and sort products
  const filteredAndSortedProducts = allProducts
    .filter((product) => {
      const matchesSearch = product.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedFilter === "all" ||
        product.cat_id.toString() === selectedFilter;
      const matchesSubcategory =
        selectedSubcategory === "all" ||
        product.sub_id.toString() === selectedSubcategory;
      const matchesPriceRange =
        product.sellingPrice >= filterOptions.priceRange.min &&
        product.sellingPrice <= filterOptions.priceRange.max;
      const matchesFilterBrand =
        filterOptions.brand === "all" ||
        product.brand_id.toString() === filterOptions.brand;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesSubcategory &&
        matchesPriceRange &&
        matchesFilterBrand
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "price-low":
          return a.sellingPrice - b.sellingPrice;
        case "price-high":
          return b.sellingPrice - a.sellingPrice;
        case "popular":
          return b.id - a.id;
        case "newest":
          return b.id - a.id;
        default:
          return 0;
      }
    });

  const handleCategoryPress = (filter) => {
    setSelectedFilter(filter.id);
    setSelectedSubcategory("all");
  };

  const applyFilters = () => {
    setShowFilterModal(false);
  };

  const handleProductPress = (item) => {
    router.push(`/product/${item.id}`);
  };

  const handleSortPress = () => {
    setShowSortModal(true);
  };

  const handleSortSelect = (option) => {
    setSortBy(option.id);
    setShowSortModal(false);
  };

  const getCurrentSubcategories = () => {
    if (selectedFilter === "all") return [];
    return subcategories[selectedFilter] || [];
  };

  // Get current category name for header
  const getCurrentCategoryName = () => {
    const category = mainCategories.find((cat) => cat.id === selectedFilter);
    return category ? category.name : "Find Products";
  };

  const renderSubcategoryItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.subcategoryItem,
        selectedSubcategory === item.id && styles.selectedSubcategoryItem,
      ]}
      onPress={() => setSelectedSubcategory(item.id)}
    >
      <Text
        style={[
          styles.subcategoryText,
          selectedSubcategory === item.id && styles.selectedSubcategoryText,
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderProductItem = ({ item }) => (
    <ProductCard item={item} onPress={handleProductPress} />
  );

  if (loading) {
    return (
      <SafeAreaWrapper>
        <View style={styles.container}>
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
            <Text style={styles.headerTitle}>Find Products</Text>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary.main} />
            <Text style={styles.loadingText}>Loading filters...</Text>
          </View>
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper>
      <View style={styles.container}>
        {/* Header with Dynamic Title */}
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
          <Text style={styles.headerTitle} numberOfLines={1}>
            {getCurrentCategoryName()}
          </Text>
          <View style={styles.placeholder} />
        </View>

        {/* Search and Controls Row */}
        <View style={styles.searchControlsRow}>
          <View style={styles.searchBar}>
            <Ionicons
              name="search"
              size={20}
              color={theme.colors.text.secondary}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search products..."
              placeholderTextColor={theme.colors.text.placeholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={theme.colors.text.secondary}
                />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity style={styles.sortButton} onPress={handleSortPress}>
            <Ionicons
              name="swap-vertical"
              size={20}
              color={theme.colors.text.primary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilterModal(true)}
          >
            <Ionicons
              name="options"
              size={20}
              color={theme.colors.text.white}
            />
          </TouchableOpacity>
        </View>

        {/* Subcategories */}
        {selectedFilter !== "all" && getCurrentSubcategories().length > 0 && (
          <View style={styles.subcategoriesContainer}>
            <FlatList
              data={[
                {
                  id: "all",
                  name: "All",
                  count: allProducts.filter(
                    (p) => p.cat_id.toString() === selectedFilter,
                  ).length,
                },
                ...getCurrentSubcategories(),
              ]}
              renderItem={renderSubcategoryItem}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.subcategoriesList}
            />
          </View>
        )}

        {/* Products Section */}
        <View style={styles.productsSection}>
          <Text style={styles.resultsText}>
            {filteredAndSortedProducts.length} products
          </Text>

          {productsLoading ? (
            <View style={styles.productsLoadingContainer}>
              <ActivityIndicator
                size="large"
                color={theme.colors.primary.main}
              />
              <Text style={styles.loadingText}>Loading products...</Text>
            </View>
          ) : filteredAndSortedProducts.length > 0 ? (
            <FlatList
              data={filteredAndSortedProducts}
              renderItem={renderProductItem}
              showsVerticalScrollIndicator={false}
              keyExtractor={(item) => item.id.toString()}
              numColumns={2}
              ItemSeparatorComponent={
                <View
                  style={{
                    height: 15,
                  }}
                />
              }
              contentContainerStyle={styles.productsList}
              columnWrapperStyle={styles.row}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.5} // Load when 50% from bottom
              ListFooterComponent={() =>
                isLoadingMore ? (
                  <ActivityIndicator
                    size="small"
                    color={theme.colors.primary.main}
                    style={{ marginVertical: 20 }}
                  />
                ) : null
              }
            />
          ) : (
            <View style={styles.noResults}>
              <Ionicons
                name="search-outline"
                size={60}
                color={theme.colors.text.tertiary}
              />
              <Text style={styles.noResultsTitle}>No products found</Text>
              <Text style={styles.noResultsSubtitle}>
                Try searching with different keywords
              </Text>
            </View>
          )}
        </View>

        {/* Sort Modal */}
        {showSortModal && (
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={styles.modalOverlayTouchable}
              activeOpacity={1}
              onPress={() => setShowSortModal(false)}
            >
              <View style={styles.sortModal}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Sort by</Text>
                  <TouchableOpacity onPress={() => setShowSortModal(false)}>
                    <Ionicons
                      name="close"
                      size={24}
                      color={theme.colors.text.primary}
                    />
                  </TouchableOpacity>
                </View>
                {sortOptions.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.sortOption,
                      sortBy === option.id && styles.selectedSortOption,
                    ]}
                    onPress={() => handleSortSelect(option)}
                  >
                    <Text
                      style={[
                        styles.sortOptionText,
                        sortBy === option.id && styles.selectedSortOptionText,
                      ]}
                    >
                      {option.name}
                    </Text>
                    {sortBy === option.id && (
                      <Ionicons
                        name="checkmark"
                        size={20}
                        color={theme.colors.primary.main}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Filter Modal */}
        <Modal
          visible={showFilterModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaWrapper2>
            <View style={styles.filterModalContainer}>
              <View style={styles.filterModalHeader}>
                <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                  <Ionicons
                    name="close"
                    size={24}
                    color={theme.colors.text.primary}
                  />
                </TouchableOpacity>
                <Text style={styles.filterModalTitle}>Filters</Text>
                <TouchableOpacity onPress={resetFilters}>
                  <Text style={styles.resetText}>Reset</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.filterModalContent}>
                {/* Categories Section */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Categories</Text>
                  <View style={styles.categoryGrid}>
                    {mainCategories.map((category) => (
                      <TouchableOpacity
                        key={category.id}
                        style={[
                          styles.categoryCard,
                          selectedFilter === category.id &&
                            styles.categoryCardSelected,
                        ]}
                        onPress={() => handleCategoryPress(category)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.categoryCardText,
                            selectedFilter === category.id &&
                              styles.categoryCardTextSelected,
                          ]}
                        >
                          {category.name}
                        </Text>
                        <Text
                          style={[
                            styles.categoryCardCount,
                            selectedFilter === category.id &&
                              styles.categoryCardCountSelected,
                          ]}
                        >
                          {category.count} items
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Price Range</Text>
                  <View style={styles.priceRangeContainer}>
                    <Text style={styles.priceLabel}>
                      £{filterOptions.priceRange.min} - £
                      {filterOptions.priceRange.max}
                    </Text>

                    {/* Min Price Slider */}
                    <View style={styles.sliderContainer}>
                      <Text style={styles.sliderLabel}>
                        Minimum: £{filterOptions.priceRange.min}
                      </Text>
                      <Slider
                        style={styles.slider}
                        minimumValue={0}
                        maximumValue={50000}
                        step={100}
                        value={filterOptions.priceRange.min}
                        onValueChange={(value) =>
                          setFilterOptions({
                            ...filterOptions,
                            priceRange: {
                              ...filterOptions.priceRange,
                              min: Math.min(
                                value,
                                filterOptions.priceRange.max - 100,
                              ),
                            },
                          })
                        }
                        minimumTrackTintColor={theme.colors.primary.main}
                        maximumTrackTintColor={theme.colors.surface.border}
                        thumbTintColor={theme.colors.primary.main}
                      />
                    </View>

                    {/* Max Price Slider */}
                    <View style={styles.sliderContainer}>
                      <Text style={styles.sliderLabel}>
                        Maximum: £{filterOptions.priceRange.max}
                      </Text>
                      <Slider
                        style={styles.slider}
                        minimumValue={0}
                        maximumValue={50000}
                        step={100}
                        value={filterOptions.priceRange.max}
                        onValueChange={(value) =>
                          setFilterOptions({
                            ...filterOptions,
                            priceRange: {
                              ...filterOptions.priceRange,
                              max: Math.max(
                                value,
                                filterOptions.priceRange.min + 100,
                              ),
                            },
                          })
                        }
                        minimumTrackTintColor={theme.colors.primary.main}
                        maximumTrackTintColor={theme.colors.surface.border}
                        thumbTintColor={theme.colors.primary.main}
                      />
                    </View>
                  </View>
                </View>

                {/* Brand */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Brand</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.brandOptionsContainer}>
                      {brandOptions.map((brand) => (
                        <TouchableOpacity
                          key={brand.id}
                          style={[
                            styles.brandOption,
                            filterOptions.brand === brand.id &&
                              styles.selectedBrandOption,
                          ]}
                          onPress={() =>
                            setFilterOptions({
                              ...filterOptions,
                              brand: brand.id,
                            })
                          }
                        >
                          <Text
                            style={[
                              styles.brandOptionText,
                              filterOptions.brand === brand.id &&
                                styles.selectedBrandOptionText,
                            ]}
                          >
                            {brand.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>

                {/* Discount */}
                {/* <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Discount</Text>
                  <View style={styles.discountContainer}>
                    {[50, 40, 30, 20, 10].map((discount) => (
                      <TouchableOpacity
                        key={discount}
                        style={[
                          styles.discountOption,
                          filterOptions.discount === discount &&
                            styles.selectedDiscountOption,
                        ]}
                        onPress={() =>
                          setFilterOptions({ ...filterOptions, discount })
                        }
                      >
                        <Text
                          style={[
                            styles.discountText,
                            filterOptions.discount === discount &&
                              styles.selectedDiscountText,
                          ]}
                        >
                          {discount}% & above
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View> */}
              </ScrollView>

              <View style={styles.filterModalFooter}>
                <TouchableOpacity
                  style={styles.applyButton}
                  onPress={applyFilters}
                >
                  <Text style={styles.applyButtonText}>Apply Filters</Text>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaWrapper2>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing.xl,
  },
  loadingText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: "Outfit-Medium",
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.surface.light,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: theme.typography.fontSize.xl,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.text.primary,
    textAlign: "center",
    marginHorizontal: theme.spacing.md,
  },
  placeholder: {
    width: 40,
    height: 40,
  },
  searchControlsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface.input,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    height: 44,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: "Outfit-Regular",
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.sm,
  },
  sortButton: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface.light,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary.main,
    justifyContent: "center",
    alignItems: "center",
  },
  subcategoriesContainer: {
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface.border,
  },
  subcategoriesList: {
    paddingHorizontal: theme.spacing.lg,
  },
  subcategoryItem: {
    backgroundColor: theme.colors.surface.card,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    marginRight: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  selectedSubcategoryItem: {
    backgroundColor: theme.colors.primary.main,
    borderColor: theme.colors.primary.main,
  },
  subcategoryText: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: "Outfit-Medium",
    color: theme.colors.text.secondary,
  },
  selectedSubcategoryText: {
    color: theme.colors.text.white,
  },
  productsSection: {
    flex: 1,
    paddingTop: theme.spacing.md,
  },
  resultsText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: "Outfit-Medium",
    color: theme.colors.text.secondary,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  productsLoadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: theme.spacing["4xl"],
  },
  productsList: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing["6xl"],
  },
  row: {
    justifyContent: "space-between",
  },
  noResults: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: theme.spacing["4xl"],
  },
  noResultsTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.text.primary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  noResultsSubtitle: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: "Outfit-Regular",
    color: theme.colors.text.secondary,
    textAlign: "center",
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalOverlayTouchable: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sortModal: {
    backgroundColor: theme.colors.background.primary,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    paddingBottom: theme.spacing["4xl"],
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface.border,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.text.primary,
  },
  sortOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface.divider,
  },
  selectedSortOption: {
    backgroundColor: theme.colors.primary[50],
  },
  sortOptionText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: "Outfit-Regular",
    color: theme.colors.text.primary,
  },
  selectedSortOptionText: {
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.secondary.main,
  },
  filterModalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  filterModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface.border,
  },
  filterModalTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.text.primary,
  },
  resetText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: "Outfit-Medium",
    color: theme.colors.secondary.main,
  },
  filterModalContent: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  filterModalFooter: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surface.border,
  },
  applyButton: {
    backgroundColor: theme.colors.primary.main,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.lg,
    alignItems: "center",
  },
  applyButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.text.white,
  },
  filterSection: {
    marginBottom: theme.spacing["3xl"],
  },
  filterSectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
  },
  categoryCard: {
    flex: 1,
    minWidth: "47%",
    backgroundColor: theme.colors.surface.light,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1.5,
    borderColor: theme.colors.surface.border,
  },
  categoryCardSelected: {
    backgroundColor: theme.colors.secondary.main,
    borderColor: theme.colors.secondary.main,
  },
  categoryCardText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: "Outfit-SemiBold",
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  categoryCardTextSelected: {
    color: theme.colors.text.white,
  },
  categoryCardCount: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: "Outfit-Medium",
    color: theme.colors.text.secondary,
  },
  categoryCardCountSelected: {
    color: "rgba(255, 255, 255, 0.8)",
  },
  priceRangeContainer: {
    backgroundColor: theme.colors.surface.input,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  priceLabel: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: "Outfit-Medium",
    color: theme.colors.text.primary,
    textAlign: "center",
    marginBottom: theme.spacing.md,
  },
  sliderContainer: {
    marginBottom: theme.spacing.md,
  },
  sliderLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: "Outfit-Medium",
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  // sliderRow: {
  //   flexDirection: "row",
  //   alignItems: "center",
  //   gap: theme.spacing.sm,
  // },
  // sliderButton: {
  //   width: 32,
  //   height: 32,
  //   borderRadius: theme.borderRadius.sm,
  //   backgroundColor: theme.colors.primary.main,
  //   justifyContent: "center",
  //   alignItems: "center",
  // },
  // sliderButtonText: {
  //   fontSize: theme.typography.fontSize.lg,
  //   fontFamily: "Outfit-SemiBold",
  //   color: theme.colors.text.white,
  // },
  // sliderTrack: {
  //   flex: 1,
  //   height: 6,
  //   backgroundColor: theme.colors.surface.border,
  //   borderRadius: 3,
  //   overflow: "hidden",
  // },

  // sliderProgress: {
  //   height: "100%",
  //   backgroundColor: theme.colors.primary.main,
  //   borderRadius: 3,
  // },
  sliderContainer: {
    marginBottom: theme.spacing.lg,
  },
  sliderLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: "Outfit-Medium",
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  brandOptionsContainer: {
    flexDirection: "row",
    paddingVertical: theme.spacing.sm,
  },
  brandOption: {
    backgroundColor: theme.colors.surface.card,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    marginRight: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  selectedBrandOption: {
    backgroundColor: theme.colors.primary.main,
    borderColor: theme.colors.primary.main,
  },
  brandOptionText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: "Outfit-Medium",
    color: theme.colors.text.primary,
  },
  selectedBrandOptionText: {
    color: theme.colors.text.white,
  },
  discountContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  discountOption: {
    backgroundColor: theme.colors.surface.card,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  selectedDiscountOption: {
    backgroundColor: theme.colors.primary.main,
    borderColor: theme.colors.primary.main,
  },
  discountText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: "Outfit-Medium",
    color: theme.colors.text.primary,
  },
  selectedDiscountText: {
    color: theme.colors.text.white,
  },
});

export default Search;
