import theme from "@/utils/theme";
import { useState } from "react";
import { Dimensions, Image, StyleSheet, TouchableOpacity, View } from "react-native";
import Swiper from "react-native-swiper";

const { width: screenWidth } = Dimensions.get("window");
const BANNER_PADDING = theme.spacing.lg;
const BANNER_WIDTH = screenWidth - (BANNER_PADDING * 2);
const IMAGE_ASPECT_RATIO = 365 / 100; // width / height
const BANNER_HEIGHT = BANNER_WIDTH / IMAGE_ASPECT_RATIO;

const BannerCarousel = ({ data, onPress }) => {
  const [index, setIndex] = useState(0);
// console.log("data",data)
  return (
    <View style={styles.container}>
      <Swiper
        autoplay
        autoplayTimeout={4}
        showsPagination={false}
        // paginationStyle={styles.pagination}
        dotStyle={styles.dot}
        activeDotStyle={styles.activeDot}
        onIndexChanged={setIndex}
        height={BANNER_HEIGHT + theme.spacing['2xl']}
      >
        {data.map((item, i) => (
          <TouchableOpacity
            key={i}
            activeOpacity={0.9}
            style={styles.slide}
            onPress={() => onPress && onPress(item)}
          >
            <View style={styles.imageContainer}>
              <Image
                source={typeof item.image === "string" ? { uri: item.image } : item.image}
                style={styles.bannerImage}
                resizeMode="cover"
              />
            </View>
          </TouchableOpacity>
        ))}
      </Swiper>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: screenWidth,
    height: BANNER_HEIGHT + theme.spacing['2xl'],
    alignSelf: "center",
    marginBottom: theme.spacing.sm,
  },
  slide: {
    flex: 1,
    paddingHorizontal: BANNER_PADDING,
    justifyContent: "center",
    alignItems: "center",
  },
  imageContainer: {
    width: BANNER_WIDTH,
    height: BANNER_HEIGHT,
    borderRadius: theme.borderRadius.lg,
    overflow: "hidden",
    backgroundColor: theme.colors.background.secondary,
  },
  bannerImage: {
    width: "100%",
    height: "100%",
  },
  pagination: {
    bottom: theme.spacing.xs,
    paddingBottom:10
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surface.border,
    marginHorizontal: theme.spacing.xs,
  },
  activeDot: {
    width: 20,
    height: 8,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.primary.main,
    marginHorizontal: theme.spacing.xs,
  },
});

export default BannerCarousel;