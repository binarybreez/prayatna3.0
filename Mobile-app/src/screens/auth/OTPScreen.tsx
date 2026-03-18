import React, { useState, useRef, useEffect, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { useAuthStore } from '../../state';
import Button from '../../components/common/Button';
import { useTranslation } from '../../i18n/LanguageContext';

interface OTPScreenProps {
  navigation: any;
  route: { params: { phone: string } };
}

const OTP_LENGTH = 6;

const shadowProps = {
  shadowColor: '#EA580C', // Saffron shadow for active state
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.2,
  shadowRadius: 8,
  elevation: 6,
};

const OTPScreen: React.FC<OTPScreenProps> = ({ navigation, route }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { phone } = route.params;
  
  // Replaced array state with a single string state for smooth typing
  const [code, setCode] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [timer, setTimer] = useState(30);
  
  const inputRef = useRef<TextInput>(null);
  const { verifyOTP, isLoading, error, clearError } = useAuthStore();

  const saffronColor = theme.isDark ? '#F97316' : '#EA580C';
  const { t } = useTranslation();
  const bgColor = theme.isDark ? '#080C16' : '#FAFAFA';

  useEffect(() => {
    // Auto-focus the hidden input when screen loads
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);

    const interval = setInterval(() => {
      setTimer((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCodeChange = (text: string) => {
    clearError();
    // Only allow numbers
    const numericText = text.replace(/[^0-9]/g, '');
    setCode(numericText);

    // Auto-submit when exactly 6 digits are entered
    if (numericText.length === OTP_LENGTH) {
      handleVerify(numericText);
    }
  };

  const handleVerify = async (otpCode?: string) => {
    const finalCode = otpCode || code;
    if (finalCode.length !== OTP_LENGTH) return;
    await verifyOTP(phone, finalCode);
    // On success, authStore sets isAuthenticated + isRegistered = true
    // AppNavigator automatically switches to MainTabs
  };

  const handleResend = () => {
    setTimer(30);
    setCode('');
    inputRef.current?.focus();
  };

  const focusInput = () => {
    inputRef.current?.focus();
  };

  // Generate the 6 visual boxes based on the single 'code' string
  const renderOTPBoxes = () => {
    return Array(OTP_LENGTH).fill(0).map((_, index) => {
      const digit = code[index] || '';
      // The box is active if it's the next empty box, or the last box if full
      const isCurrentActive = index === code.length || (index === OTP_LENGTH - 1 && code.length === OTP_LENGTH);
      const isFocused = isInputFocused && isCurrentActive;
      const isFilled = digit !== '';

      return (
        <View 
          key={index} 
          style={[
            styles.otpInputWrapper, 
            isFocused && shadowProps,
            { transform: [{ scale: isFocused ? 1.05 : 1 }] } // Smooth pop effect
          ]}
        >
          <View
            style={[
              styles.otpBox,
              {
                backgroundColor: theme.isDark ? '#111827' : '#FFFFFF',
                borderColor: error
                  ? '#DC2626'
                  : isFocused
                  ? saffronColor
                  : isFilled
                  ? (theme.isDark ? '#374151' : '#E2E8F0')
                  : (theme.isDark ? '#1F2937' : '#F1F5F9'),
              },
            ]}
          >
            <Text style={[styles.otpText, { color: theme.colors.text }]}>
              {digit}
            </Text>
          </View>
        </View>
      );
    });
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: bgColor }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* <MaterialIcons 
        name="local-police" 
        size={300} 
        color={theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'} 
        style={styles.watermark} 
      /> */}

      <View style={[styles.content, { paddingTop: insets.top + 20 }]}>
        
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <View style={[styles.backBtnInner, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }]}>
            <MaterialIcons name="arrow-back-ios" size={18} color={theme.colors.text} style={{ marginLeft: 6 }} />
          </View>
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          <MaterialIcons name="verified-user" size={32} color={saffronColor} style={styles.titleIcon} />
          <Text style={[styles.title, { color: theme.colors.text }]}>{t('auth.secureLogin')}</Text>
        </View>
        
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          {t('auth.otpSubtitle')}{'\n'}
          <Text style={[styles.phoneNumber, { color: theme.colors.text }]}>+91 {phone}</Text>
        </Text>

        <View style={[styles.hintBox, { backgroundColor: theme.isDark ? 'rgba(234, 88, 12, 0.1)' : 'rgba(234, 88, 12, 0.08)' }]}>
          <MaterialIcons name="security-update-good" size={18} color={saffronColor} />
          <Text style={[styles.hintText, { color: saffronColor }]}>
            {t('auth.demoHint')} <Text style={{ fontWeight: '800' }}>123456</Text>
          </Text>
        </View>

        {/* The Magic: A Pressable area that focuses the hidden input */}
        <Pressable style={styles.otpInteractionArea} onPress={focusInput}>
          <View style={styles.otpContainer} pointerEvents="none">
            {renderOTPBoxes()}
          </View>
          
          {/* Completely hidden input that does all the heavy lifting */}
          <TextInput
            ref={inputRef}
            value={code}
            onChangeText={handleCodeChange}
            maxLength={OTP_LENGTH}
            keyboardType="number-pad"
            textContentType="oneTimeCode" // iOS Auto-fill from SMS
            autoComplete="sms-otp" // Android Auto-fill from SMS
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            style={styles.hiddenInput}
            caretHidden={true}
          />
        </Pressable>

        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null}

        <View style={styles.buttonContainer}>
          <Button
            title={t('auth.verifyIdentity')}
            onPress={() => handleVerify()}
            loading={isLoading}
            fullWidth
            size="lg"
            style={{ backgroundColor: saffronColor }}
            disabled={code.length !== OTP_LENGTH}
          />
        </View>

        <View style={styles.resendContainer}>
          {timer > 0 ? (
            <Text style={[styles.resendText, { color: theme.colors.textSecondary }]}>
              {t('auth.didntReceive')} {t('auth.resendIn')} <Text style={{ color: saffronColor, fontWeight: '700' }}>00:{timer.toString().padStart(2, '0')}</Text>
            </Text>
          ) : (
            <View style={styles.resendRow}>
              <Text style={[styles.resendText, { color: theme.colors.textSecondary }]}>
                {t('auth.didntReceive')}{' '}
              </Text>
              <TouchableOpacity onPress={handleResend} activeOpacity={0.7}>
                <Text style={[styles.resendLink, { color: saffronColor }]}>
                  {t('auth.resendOTP')}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  watermark: { position: 'absolute', top: -40, right: -80, transform: [{ rotate: '15deg' }] },
  content: { flex: 1, paddingHorizontal: 24 },
  backBtn: { marginBottom: 32, alignSelf: 'flex-start' },
  backBtnInner: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  titleContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  titleIcon: { marginRight: 10 },
  title: { fontSize: 32, fontWeight: '800', letterSpacing: 0.5 },
  subtitle: { fontSize: 16, lineHeight: 24, marginBottom: 32, fontWeight: '500' },
  phoneNumber: { fontWeight: '800', fontSize: 18, letterSpacing: 1, marginTop: 4 },
  hintBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 12, marginBottom: 32, borderWidth: 1, borderColor: 'rgba(234, 88, 12, 0.2)' },
  hintText: { fontSize: 14, fontWeight: '600', letterSpacing: 0.5 },
  
  // New OTP Styles
  otpInteractionArea: { width: '100%', marginBottom: 32 },
  otpContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  otpInputWrapper: { borderRadius: 14 },
  otpBox: { width: 50, height: 60, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  otpText: { fontSize: 24, fontWeight: '700', textAlign: 'center' },
  hiddenInput: { position: 'absolute', width: 1, height: 1, opacity: 0 }, // Hides the native input
  
  errorText: { color: '#DC2626', fontSize: 14, fontWeight: '600', textAlign: 'center', marginBottom: 20, marginTop: -10 },
  buttonContainer: { marginTop: 10 },
  resendContainer: { alignItems: 'center', marginTop: 32 },
  resendRow: { flexDirection: 'row', alignItems: 'center' },
  resendText: { fontSize: 15, fontWeight: '500' },
  resendLink: { fontSize: 15, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
});

export default memo(OTPScreen);