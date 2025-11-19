import theme from "@/utils/theme";
import { useState } from "react";
import { Dimensions, Image, StyleSheet, TouchableOpacity, View } from "react-native";
import Swiper from "react-native-swiper";

const { width: screenWidth } = Dimensions.get("window");

const BannerCarousel = ({ data, onPress }) => {
  const [index, setIndex] = useState(0);

  return (
    <View style={styles.container}>
      <Swiper
        autoplay
        autoplayTimeout={4}
        showsPagination={true}
        paginationStyle={styles.pagination}
        dotStyle={styles.dot}
        activeDotStyle={styles.activeDot}
        onIndexChanged={setIndex}
        height={130} // height auto-adjusts because we use resizeMode="contain"
      >
        {data.map((item, i) => (
          <TouchableOpacity
            key={i}
            activeOpacity={0.9}
            style={styles.slide}
            onPress={() => onPress && onPress(item)}
          >
            <Image
              source={typeof item.image === "string" ? { uri: item.image } : item.image}
              style={styles.bannerImage}
              resizeMode="contain"  // ⛔ No image cut — keeps aspect ratio
            />
          </TouchableOpacity>
        ))}
      </Swiper>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: screenWidth,
    alignSelf: "center",
        marginBottom:10

  },
  slide: {
    width: screenWidth,
    height: 130,
    paddingHorizontal: theme.spacing.md,
    justifyContent: "center",
    alignItems: "center",
  },
  bannerImage: {
    width: "100%",
    height: "100%",
    borderRadius:20,
  },

  // Pagination
  pagination: {
    bottom: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.surface.border,
  },
  activeDot: {
    width: 20,
    borderRadius: 4,
    backgroundColor: theme.colors.primary.main,
  },
});

export default BannerCarousel;
