import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Easing,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import Header from '../../components/common/Header';
import { safetyApi } from '../../api/safety';
import { useTranslation } from '../../i18n/LanguageContext';

const INCIDENT_CATEGORIES = [
  { key: 'waterlogging', labelKey: 'report.waterlogging', icon: 'water-drop', color: '#3B82F6', descKey: 'report.waterloggingDesc' },
  { key: 'traffic_anomaly', labelKey: 'report.trafficAnomaly', icon: 'traffic', color: '#F59E0B', descKey: 'report.trafficAnomalyDesc' },
  { key: 'street_light_outage', labelKey: 'report.streetLight', icon: 'lightbulb', color: '#8B5CF6', descKey: 'report.streetLightDesc' },
  { key: 'noise_complaint', labelKey: 'report.noise', icon: 'volume-up', color: '#EC4899', descKey: 'report.noiseDesc' },
  { key: 'suspicious_activity', labelKey: 'report.suspicious', icon: 'visibility', color: '#EF4444', descKey: 'report.suspiciousDesc' },
] as const;

const shadowProps = {
  shadowColor: '#EA580C',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.15,
  shadowRadius: 12,
  elevation: 6,
};

interface ReportIncidentScreenProps {
  navigation: any;
}

const ReportIncidentScreen: React.FC<ReportIncidentScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState(t('report.acquiringGPS') || 'Acquiring GPS lock...');

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const successScale = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const isDark = theme.isDark;
  const saffronColor = isDark ? '#F97316' : '#EA580C';
  const bgColor = isDark ? '#080C16' : '#FAFAFA';

  useEffect(() => {
    // Fetch user's GPS location
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
        setLocationName(`${loc.coords.latitude.toFixed(5)}°N, ${loc.coords.longitude.toFixed(5)}°E`);
      } else {
        setLocationName(t('report.locationDenied') || 'Location access denied');
      }
    })();

    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }),
    ]).start();

    // Live GPS Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // --- Camera & Media Handlers ---
  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Rakshak needs camera access to capture evidence.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7, // Compress slightly for faster uploads
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSubmit = useCallback(async () => {
    Keyboard.dismiss();
    if (!selectedCategory) {
      Alert.alert(t('report.selectCategory') || 'Select Category', t('report.selectCategoryMsg') || 'Please select an incident type.');
      return;
    }
    if (!userLocation) {
      Alert.alert(t('report.locationUnavailable') || 'Location Unavailable', t('report.locationUnavailableMsg') || 'Cannot submit report without GPS.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Note: Make sure your safetyApi.sendTelemetry can handle description & imageUri payloads
      const success = await safetyApi.sendTelemetry(
        userLocation.lat,
        userLocation.lng,
        selectedCategory,
        // Passing these conceptually. Backend handling required!
        // description, 
        // imageUri 
      );

      if (success) {
        setIsSuccess(true);
        Animated.spring(successScale, { toValue: 1, friction: 5, tension: 40, useNativeDriver: true }).start();
        setTimeout(() => navigation.goBack(), 2500);
      } else {
        Alert.alert(t('report.submissionFailed') || 'Submission Failed', t('report.submissionFailedMsg') || 'Could not submit report.');
      }
    } catch (err) {
      Alert.alert('Network Error', 'Failed to reach the server. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedCategory, description, imageUri, userLocation, navigation, t]);

  // Success Confirmation Screen
  if (isSuccess) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: bgColor }]}>
        <Animated.View style={[styles.successContainer, { transform: [{ scale: successScale }] }]}>
          <View style={[styles.successIconRing, { borderColor: 'rgba(16, 185, 129, 0.3)' }]}>
            <View style={[styles.successIconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <MaterialIcons name="verified-user" size={60} color="#10B981" />
            </View>
          </View>
          <Text style={[styles.successTitle, { color: theme.colors.text }]}>
            {t('report.reportSecured') || 'Report Secured'}
          </Text>
          <Text style={[styles.successDesc, { color: theme.colors.textSecondary }]}>
            {t('report.thankYou') || 'Thank you for keeping your city safe. Your report has been securely encrypted.'}
          </Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: bgColor }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1 }}>
          {/* Background Watermark */}
          <MaterialIcons
            name="report-problem"
            size={350}
            color={isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'}
            style={styles.watermark}
          />

          <Header title={t('report.title') || 'Report Incident'} subtitle={t('report.subtitle') || 'Help secure your community'} showBack onBack={() => navigation.goBack()} />

          <Animated.ScrollView
            contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 24, 40) }]}
            showsVerticalScrollIndicator={false}
            style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
            keyboardShouldPersistTaps="handled"
          >
            {/* GPS Location Card */}
            <View style={[styles.locationCard, { backgroundColor: theme.colors.surface }, shadowProps]}>
              <View style={styles.locationRow}>
                <View style={[styles.locationIcon, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)' }]}>
                  <MaterialIcons name="gps-fixed" size={24} color="#3B82F6" />
                </View>
                <View style={styles.locationTextContainer}>
                  <Text style={[styles.locationLabel, { color: theme.colors.textTertiary }]}>
                    {t('report.gpsCoordinates') || 'ACTIVE GPS COORDINATES'}
                  </Text>
                  <Text style={[styles.locationValue, { color: theme.colors.text }]}>{locationName}</Text>
                </View>
                <View style={[styles.liveBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                  <Animated.View style={[styles.liveDot, { opacity: pulseAnim }]} />
                  <Text style={styles.liveText}>{t('report.live') || 'LIVE'}</Text>
                </View>
              </View>
            </View>

            {/* Category Selection */}
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textTertiary }]}>
                {t('report.selectType') || 'SELECT INCIDENT CLASSIFICATION'}
              </Text>
              <MaterialIcons name="category" size={16} color={theme.colors.textTertiary} />
            </View>

            {INCIDENT_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.key;
              return (
                <TouchableOpacity
                  key={cat.key}
                  style={[
                    styles.categoryCard,
                    {
                      backgroundColor: isSelected ? (isDark ? '#111827' : '#FFFFFF') : theme.colors.surface,
                      borderColor: isSelected ? cat.color : theme.colors.border,
                      borderWidth: isSelected ? 2 : 1,
                      transform: [{ scale: isSelected ? 1.02 : 1 }], 
                    },
                    isSelected && [shadowProps, { shadowColor: cat.color }],
                  ]}
                  onPress={() => {
                    setSelectedCategory(cat.key);
                    Keyboard.dismiss();
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.categoryRow}>
                    <View style={[styles.categoryIcon, { backgroundColor: `${cat.color}15` }]}>
                      <MaterialIcons name={cat.icon as any} size={24} color={cat.color} />
                    </View>
                    <View style={styles.categoryTextContainer}>
                      <Text style={[styles.categoryLabel, { color: theme.colors.text }]}>{t(cat.labelKey) || cat.labelKey}</Text>
                      <Text style={[styles.categoryDesc, { color: theme.colors.textSecondary }]}>{t(cat.descKey) || cat.descKey}</Text>
                    </View>
                    {isSelected ? (
                      <MaterialIcons name="check-circle" size={24} color={cat.color} />
                    ) : (
                      <View style={[styles.unselectedRadio, { borderColor: theme.colors.border }]} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Optional Description */}
            <View style={[styles.sectionHeaderRow, { marginTop: 12 }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textTertiary }]}>
                {t('report.additionalDetails') || 'ADDITIONAL DETAILS (OPTIONAL)'}
              </Text>
              <MaterialIcons name="edit-note" size={18} color={theme.colors.textTertiary} />
            </View>
            
            <View style={[styles.inputWrapper, isInputFocused && shadowProps, isInputFocused && { shadowColor: saffronColor }]}>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: isDark ? '#111827' : '#FFFFFF',
                    color: theme.colors.text,
                    borderColor: isInputFocused ? saffronColor : theme.colors.border,
                    borderWidth: isInputFocused ? 2 : 1.5,
                  },
                ]}
                placeholder={t('report.descPlaceholder') || 'Briefly describe what you observed...'}
                placeholderTextColor={theme.colors.textTertiary}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                value={description}
                onChangeText={setDescription}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                cursorColor={saffronColor}
              />
            </View>

            {/* Evidence / Photo Section */}
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textTertiary }]}>
                ATTACH EVIDENCE (OPTIONAL)
              </Text>
              <MaterialIcons name="camera-alt" size={16} color={theme.colors.textTertiary} />
            </View>

            {!imageUri ? (
              <View style={styles.photoActionRow}>
                <TouchableOpacity 
                  style={[styles.photoBtn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]} 
                  onPress={handleTakePhoto}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="photo-camera" size={24} color={saffronColor} />
                  <Text style={[styles.photoBtnText, { color: theme.colors.text }]}>Take Photo</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.photoBtn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]} 
                  onPress={handlePickImage}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="photo-library" size={24} color={saffronColor} />
                  <Text style={[styles.photoBtnText, { color: theme.colors.text }]}>Upload</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                <TouchableOpacity 
                  style={styles.removeImageBtn} 
                  onPress={() => setImageUri(null)}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="close" size={20} color="#FFF" />
                </TouchableOpacity>
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                {
                  backgroundColor: selectedCategory ? saffronColor : (isDark ? '#374151' : '#D1D5DB'),
                  opacity: isSubmitting ? 0.7 : 1,
                  marginTop: 16,
                },
                selectedCategory && shadowProps
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting || !selectedCategory}
              activeOpacity={0.85}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <>
                  <MaterialIcons name="send" size={20} color={selectedCategory ? "#FFF" : theme.colors.textTertiary} style={{ marginRight: 10 }} />
                  <Text style={[styles.submitText, { color: selectedCategory ? "#FFF" : theme.colors.textTertiary }]}>
                    {t('report.submitReport') || 'Submit Secure Report'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Privacy Notice */}
            <View style={styles.privacyContainer}>
              <MaterialIcons name="lock" size={14} color={theme.colors.textTertiary} />
              <Text style={[styles.privacyText, { color: theme.colors.textTertiary }]}>
                {t('report.privacyNote') || 'Data is encrypted and anonymized via URIN Platform.'}
              </Text>
            </View>

          </Animated.ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  watermark: {
    position: 'absolute',
    top: '20%',
    left: -80,
    transform: [{ rotate: '-15deg' }],
  },
  scrollContent: {
    padding: 16,
  },
  locationCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 28,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationTextContainer: {
    flex: 1,
    marginLeft: 14,
  },
  locationLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  locationValue: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  liveText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#10B981',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  categoryCard: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTextContainer: {
    flex: 1,
    marginLeft: 14,
    marginRight: 10,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  categoryDesc: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  unselectedRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
  },
  inputWrapper: {
    borderRadius: 16,
    marginBottom: 24,
  },
  textInput: {
    borderRadius: 16,
    padding: 16,
    fontSize: 15,
    fontWeight: '500',
    minHeight: 100,
  },
  // --- New Evidence Styles ---
  photoActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  photoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  photoBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  imagePreviewContainer: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // ----------------------------
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    paddingVertical: 18,
    marginBottom: 16,
  },
  submitText: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  privacyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  privacyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  successContainer: {
    alignItems: 'center',
  },
  successIconRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  successDesc: {
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
    fontWeight: '500',
    paddingHorizontal: 20,
  },
});

export default memo(ReportIncidentScreen);