import React, { useState, useRef, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  Animated,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { useAuthStore } from '../../state';
import Button from '../../components/common/Button';
import { useTranslation } from '../../i18n/LanguageContext';

const { width, height } = Dimensions.get('window');

// Upgraded Slides with Tricolor-inspired themes
const slides = [
  {
    id: '1',
    icon: 'gpp-good' as const,
    titleKey: 'onboarding.slide1Title',
    descKey: 'onboarding.slide1Desc',
    color: '#F97316',
    bgLight: '#FFF7ED',
    bgDark: '#1E120A',
  },
  {
    id: '2',
    icon: 'explore' as const,
    titleKey: 'onboarding.slide2Title',
    descKey: 'onboarding.slide2Desc',
    color: '#1E3A8A',
    bgLight: '#F0F4FF',
    bgDark: '#0A1224',
  },
  {
    id: '3',
    icon: 'support-agent' as const,
    titleKey: 'onboarding.slide3Title',
    descKey: 'onboarding.slide3Desc',
    color: '#15803D',
    bgLight: '#F0FDF4',
    bgDark: '#0B1C10',
  },
];

interface OnboardingScreenProps {
  navigation: any;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const { setOnboardingComplete } = useAuthStore();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  
  // Animation value for scroll position
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      handleGetStarted();
    }
  };

  const handleGetStarted = () => {
    setOnboardingComplete();
    navigation.replace('Login'); // Or your next screen
  };

  // Interpolate background color across the entire screen based on scroll position
  const backgroundColor = scrollX.interpolate({
    inputRange: [0, width, width * 2],
    outputRange: theme.isDark
      ? [slides[0].bgDark, slides[1].bgDark, slides[2].bgDark]
      : [slides[0].bgLight, slides[1].bgLight, slides[2].bgLight],
    extrapolate: 'clamp',
  });

  const renderSlide = ({ item, index }: { item: typeof slides[0]; index: number }) => {
    // Animate individual elements based on scroll position
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    
    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.6, 1, 0.6],
      extrapolate: 'clamp',
    });

    const translateY = scrollX.interpolate({
      inputRange,
      outputRange: [50, 0, 50],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0, 1, 0],
      extrapolate: 'clamp',
    });

    return (
      <View style={[styles.slide, { width }]}>
        <Animated.View style={{ transform: [{ scale }], opacity }}>
          {/* Outer Dashed Chakra Ring */}
          <View style={[styles.chakraRing, { borderColor: `${item.color}40` }]}>
            <View style={[styles.iconCircle, { backgroundColor: `${item.color}15` }]}>
              <View style={[styles.iconInner, { backgroundColor: item.color }]}>
                <MaterialIcons name={item.icon} size={54} color="#FFFFFF" />
              </View>
            </View>
          </View>
        </Animated.View>

        <Animated.View style={{ transform: [{ translateY }], opacity, alignItems: 'center' }}>
          <Text style={[styles.title, { color: theme.colors.text }]}>{t(item.titleKey)}</Text>
          <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
            {t(item.descKey)}
          </Text>
        </Animated.View>
      </View>
    );
  };

  return (
    <Animated.View style={[styles.container, { backgroundColor, paddingTop: insets.top }]}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />
      
      {/* Top Header Row */}
      <View style={styles.header}>
        {/* Abstract watermark representing India (Ashoka Chakra) */}
        <MaterialIcons 
          name="data-usage" 
          size={120} 
          color={theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'} 
          style={styles.watermark} 
        />
        
        <TouchableOpacity style={styles.skipBtn} onPress={handleGetStarted} activeOpacity={0.7}>
          <Text style={[styles.skipText, { color: theme.colors.textSecondary }]}>{t('common.skip')}</Text>
        </TouchableOpacity>
      </View>

      {/* Slides */}
      <Animated.FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false } // Required for color interpolation
        )}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
      />

      {/* Bottom Section: Pagination & Button */}
      <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 24 }]}>
        {/* Animated Pagination */}
        <View style={styles.pagination}>
          {slides.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
            
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 24, 8],
              extrapolate: 'clamp',
            });

            const dotColor = scrollX.interpolate({
              inputRange,
              outputRange: [theme.colors.gray300, slides[i].color, theme.colors.gray300],
              extrapolate: 'clamp',
            });

            return (
              <Animated.View
                key={i}
                style={[
                  styles.dot,
                  { width: dotWidth, backgroundColor: dotColor }
                ]}
              />
            );
          })}
        </View>

        {/* Dynamic Action Button */}
        <Button
          title={currentIndex === slides.length - 1 ? t('onboarding.startExploring') : t('common.next')}
          onPress={handleNext}
          fullWidth
          size="lg"
          // Changes button color to match the current slide's theme
          style={{ backgroundColor: slides[currentIndex].color }} 
        />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 60,
  },
  watermark: {
    position: 'absolute',
    left: -20,
    top: -20,
    transform: [{ rotate: '45deg' }],
  },
  skipBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 60, // Lift content slightly up
  },
  chakraRing: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 48,
  },
  iconCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 40,
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
    paddingHorizontal: 10,
  },
  bottomSection: {
    paddingHorizontal: 24,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 32,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});

export default memo(OnboardingScreen);