import React, { useState, useEffect, useRef, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Keyboard,
  TouchableWithoutFeedback,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { useAuthStore } from '../../state';
import Button from '../../components/common/Button';
import { validatePhone } from '../../utils/validation';
import { useTranslation } from '../../i18n/LanguageContext';

interface LoginScreenProps {
  navigation: any;
}

const shadowProps = {
  shadowColor: '#EA580C', // Saffron shadow
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.2,
  shadowRadius: 8,
  elevation: 6,
};

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const { sendOTP, isLoading, error, clearError } = useAuthStore();
  const { t } = useTranslation();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Theme Colors
  const saffronColor = theme.isDark ? '#F97316' : '#EA580C';
  const bgColor = theme.isDark ? '#080C16' : '#FAFAFA';

  useEffect(() => {
    // Smooth entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleSendOTP = async () => {
    Keyboard.dismiss();
    setPhoneError('');
    clearError();

    if (!validatePhone(phone)) {
      setPhoneError('Please enter a valid 10-digit mobile number');
      return;
    }

    const success = await sendOTP(phone);
    if (success) {
      navigation.navigate('OTP', { phone });
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: bgColor }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Massive Background Watermark for Premium Feel */}
        {/* <MaterialIcons  */}
          {/* name="admin-panel-settings"  */}
          {/* size={350}  */}
          {/* color={theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'}  */}
          {/* style={styles.watermark}  */}
        {/* /> */}

        <Animated.View 
          style={[
            styles.content, 
            { 
              paddingTop: insets.top + 60,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          
          {/* Logo Area */}
          <View style={styles.logoArea}>
            <View style={[styles.logoContainer, { backgroundColor: theme.isDark ? 'rgba(234, 88, 12, 0.1)' : 'rgba(234, 88, 12, 0.08)' }]}>
              <View style={[styles.logoInner, { backgroundColor: saffronColor }]}>
                <MaterialIcons name="shield" size={32} color="#FFFFFF" />
              </View>
            </View>
          </View>

          {/* Welcome Text */}
          <Text style={[styles.title, { color: theme.colors.text }]}>{t('auth.loginTitle')}</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            {t('auth.loginSubtitle')}
          </Text>

          {/* Phone Input Section */}
          <View style={styles.inputSection}>
            <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
              {t('auth.mobileNumber')}
            </Text>
            
            <View
              style={[
                styles.inputRow,
                {
                  backgroundColor: theme.isDark ? '#111827' : '#FFFFFF',
                  borderColor: phoneError || error
                    ? '#DC2626'
                    : isFocused
                    ? saffronColor
                    : (theme.isDark ? '#1F2937' : '#E2E8F0'),
                  borderWidth: isFocused ? 2 : 1.5,
                  transform: [{ scale: isFocused ? 1.02 : 1 }], // Smooth pop on focus
                },
                isFocused && shadowProps,
              ]}
            >
              {/* Country Code Block */}
              <View style={styles.countryCodeBlock}>
                <Text style={styles.flag}>🇮🇳</Text>
                <Text style={[styles.countryCode, { color: theme.colors.text }]}>+91</Text>
              </View>
              
              <View style={[styles.divider, { backgroundColor: theme.isDark ? '#374151' : '#E2E8F0' }]} />
              
              {/* Phone Input */}
              <TextInput
                style={[styles.input, { color: theme.colors.text }]}
                value={phone}
                onChangeText={(text) => {
                  setPhone(text.replace(/[^0-9]/g, ''));
                  setPhoneError('');
                  clearError();
                }}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="00000 00000"
                placeholderTextColor={theme.colors.textTertiary}
                keyboardType="phone-pad"
                maxLength={10}
                cursorColor={saffronColor}
                autoFocus
              />
              
              {/* Validation Checkmark */}
              {phone.length === 10 && !phoneError && !error && (
                <MaterialIcons name="check-circle" size={20} color="#10B981" style={styles.checkIcon} />
              )}
            </View>

            {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>

          {/* Submit Button */}
          <View style={styles.buttonContainer}>
            <Button
              title={t('auth.getOTP')}
              onPress={handleSendOTP}
              loading={isLoading}
              fullWidth
              size="lg"
              style={{ backgroundColor: saffronColor }}
              disabled={phone.length < 10}
            />
          </View>

          {/* Terms & Conditions */}
          <View style={styles.termsContainer}>
            <MaterialIcons name="security" size={14} color={theme.colors.textTertiary} style={{ marginRight: 4 }} />
            <Text style={[styles.terms, { color: theme.colors.textTertiary }]}>
              {t('auth.termsPrefix')}{' '}
              <Text style={{ color: saffronColor, fontWeight: '600' }}>{t('auth.terms')}</Text>
              {' & '}
              <Text style={{ color: saffronColor, fontWeight: '600' }}>{t('auth.privacy')}</Text>
            </Text>
          </View>

        </Animated.View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  watermark: {
    position: 'absolute',
    top: -50,
    left: -80,
    transform: [{ rotate: '-15deg' }],
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoInner: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 48,
    paddingHorizontal: 10,
  },
  inputSection: {
    marginBottom: 32,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 10,
    marginLeft: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    height: 64,
    paddingHorizontal: 16,
  },
  countryCodeBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  flag: {
    fontSize: 20,
  },
  countryCode: {
    fontSize: 18,
    fontWeight: '700',
  },
  divider: {
    width: 2,
    height: 28,
    marginHorizontal: 14,
    borderRadius: 1,
  },
  input: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 2, // Makes the numbers space out cleanly
  },
  checkIcon: {
    marginLeft: 8,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
    marginLeft: 4,
  },
  buttonContainer: {
    marginBottom: 32,
  },
  termsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 40,
  },
  terms: {
    fontSize: 13,
    fontWeight: '500',
  },
});

export default memo(LoginScreen);