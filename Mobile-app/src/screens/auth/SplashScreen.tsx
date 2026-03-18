import React, { useEffect, useRef, memo } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, StatusBar, Easing } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { useTranslation } from '../../i18n/LanguageContext';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  // Animations
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(20)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const fadeOut = useRef(new Animated.Value(1)).current;
  
  // Advanced Animations
  const ringScale1 = useRef(new Animated.Value(0.5)).current;
  const ringScale2 = useRef(new Animated.Value(0.5)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;
  const spinValue = useRef(new Animated.Value(0)).current;
  const watermarkOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start the continuous rotation for the background "Chakra/Radar"
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 15000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Main entrance sequence
    Animated.sequence([
      // 1. Radar rings expand and fade in
      Animated.parallel([
        Animated.timing(ringOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(ringScale1, {
          toValue: 1,
          friction: 6,
          tension: 30,
          useNativeDriver: true,
        }),
        Animated.spring(ringScale2, {
          toValue: 1.5,
          friction: 8,
          tension: 20,
          useNativeDriver: true,
        }),
      ]),
      // 2. Shield pops in
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 5,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      // 3. Indian Watermark fades in softly
      Animated.timing(watermarkOpacity, {
        toValue: theme.isDark ? 0.08 : 0.05,
        duration: 500,
        useNativeDriver: true,
      }),
      // 4. Main Title and Tagline slide up
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(titleTranslateY, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 400,
          delay: 150, // Staggered slightly after title
          useNativeDriver: true,
        }),
      ]),
      // 5. Hold
      Animated.delay(1200),
      // 6. Exit transition
      Animated.timing(fadeOut, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onFinish();
    });
  }, []);

  // Continuous rotation interpolation
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Indian Theme Palette adapted for Dark/Light mode
  // Using Saffron/Orange accents to signify "Protection/Energy" (Rakshak)
  const bgColor = theme.isDark ? '#080C16' : '#FAFAFA'; // Deep navy black or pure white
  const saffronColor = theme.isDark ? '#F97316' : '#EA580C'; 
  const chakraColor = theme.isDark ? 'rgba(249, 115, 22, 0.15)' : 'rgba(234, 88, 12, 0.1)';

  return (
    <Animated.View style={[styles.container, { backgroundColor: bgColor, opacity: fadeOut }]}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={bgColor}
      />

      {/* Rotating Background Chakra / Radar */}
      <View style={styles.backgroundRingsContainer}>
        <Animated.View
          style={[
            styles.chakraRing,
            {
              borderColor: chakraColor,
              opacity: ringOpacity,
              transform: [{ scale: ringScale2 }, { rotate: spin }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.innerRing,
            {
              borderColor: chakraColor,
              opacity: ringOpacity,
              transform: [{ scale: ringScale1 }],
            },
          ]}
        />
      </View>

      <View style={styles.centerContent}>
        {/* Shield Logo with Saffron Theme */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              backgroundColor: theme.isDark ? 'rgba(249, 115, 22, 0.1)' : 'rgba(234, 88, 12, 0.08)',
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <View style={[styles.logoInner, { backgroundColor: saffronColor }]}>
            <MaterialIcons name="shield" size={50} color="#FFFFFF" />
            <View style={styles.pinOverlay}>
              <MaterialIcons name="location-on" size={16} color={saffronColor} />
            </View>
          </View>
        </Animated.View>

        {/* Text Area */}
        <View style={styles.textContainer}>
          {/* Devanagari Watermark */}
          <Animated.Text
            style={[
              styles.watermarkText,
              {
                color: theme.isDark ? '#FFFFFF' : '#000000',
                opacity: watermarkOpacity,
              },
            ]}
          >
            रक्षक
          </Animated.Text>

          {/* English App Name */}
          <Animated.Text
            style={[
              styles.appName,
              {
                color: theme.isDark ? '#F8FAFC' : '#0F172A',
                opacity: titleOpacity,
                transform: [{ translateY: titleTranslateY }],
              },
            ]}
          >
            Rakshak
          </Animated.Text>

          {/* Tagline */}
          <Animated.Text
            style={[
              styles.tagline,
              {
                color: theme.isDark ? '#94A3B8' : '#64748B',
                opacity: taglineOpacity,
              },
            ]}
          >
            {t('splash.tagline')}
          </Animated.Text>
        </View>
      </View>

      {/* Bottom Branding */}
      <Animated.View style={[styles.bottomBranding, { opacity: taglineOpacity }]}>
        <View style={styles.brandingRow}>
          <Text style={[styles.brandText, { color: theme.isDark ? '#475569' : '#94A3B8' }]}>
            {t('common.madeInIndia')}
          </Text>
        </View>
        <Text style={[styles.brandTextSmall, { color: theme.isDark ? '#334155' : '#CBD5E1' }]}>
          {t('common.poweredBy')}
        </Text>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  backgroundRingsContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chakraRing: {
    position: 'absolute',
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: width * 0.6,
    borderWidth: 2,
    borderStyle: 'dashed', // Gives it the Ashoka Chakra / Radar vibe
  },
  innerRing: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    borderWidth: 1,
  },
  centerContent: {
    alignItems: 'center',
    zIndex: 10,
  },
  logoContainer: {
    width: 130,
    height: 130,
    borderRadius: 65,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    // Add a soft glow
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  logoInner: {
    width: 86,
    height: 86,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '0deg' }], // Keeps it structured
  },
  pinOverlay: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  textContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
  },
  watermarkText: {
    position: 'absolute',
    fontSize: 90,
    fontWeight: '900',
    letterSpacing: 4,
    top: -30,
    zIndex: -1,
  },
  appName: {
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  tagline: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  bottomBranding: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
  },
  brandingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  brandText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  brandTextSmall: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});

export default memo(SplashScreen);