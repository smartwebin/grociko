import theme from "@/utils/theme";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SafeAreaWrapper2 = ({ children, style, backgroundColor }) => {
  return (
    <SafeAreaView
      style={[styles.safeArea, style, backgroundColor && { backgroundColor }]}
      edges={["top", "bottom"]}   // FIXED HERE
    >
      {children}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
});

export default SafeAreaWrapper2;
