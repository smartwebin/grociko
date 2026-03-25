import theme from '@/utils/theme';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const SafeAreaWrapper = ({ children, style, backgroundColor }) => {
  const insets = useSafeAreaInsets(); // gives you top, bottom, left, right safe area

  return (
    <View
      style={[
        styles.container,
        style,
        backgroundColor && { backgroundColor },
      ]}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {children}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  safeArea: {
    flex: 1,
  },
});

export default SafeAreaWrapper;
