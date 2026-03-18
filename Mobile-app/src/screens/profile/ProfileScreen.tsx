import React, { useState, memo, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Switch, 
  Alert, 
  Modal,
  Image,
  Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../theme';
import { useAuthStore } from '../../state';
import Header from '../../components/common/Header';
import { SUPPORTED_LANGUAGES } from '../../i18n/i18n';
import { useTranslation } from '../../i18n/LanguageContext';

interface ProfileScreenProps {
  navigation: any;
}

interface SettingsRowProps {
  icon: string;
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
  onPress?: () => void;
  danger?: boolean;
  isLast?: boolean;
}

// Flat, SaaS-style Row Component
const SettingsRow = memo(({ icon, title, subtitle, rightElement, onPress, danger, isLast }: SettingsRowProps) => {
  const { theme } = useTheme();
  
  // Use muted, professional colors instead of bright blocks
  const isDark = theme.isDark;
  const iconBgColor = danger 
    ? (isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)')
    : (isDark ? '#1E293B' : '#F1F5F9');
  
  const iconColor = danger ? '#EF4444' : (isDark ? '#94A3B8' : '#64748B');
  const textColor = danger ? '#EF4444' : theme.colors.text;

  return (
    <TouchableOpacity
      style={[
        styles.settingsRow,
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: isDark ? '#1E293B' : '#E2E8F0' },
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View style={[styles.settingsIcon, { backgroundColor: iconBgColor }]}>
        <MaterialIcons name={icon as any} size={20} color={iconColor} />
      </View>
      <View style={styles.settingsContent}>
        <Text style={[styles.settingsTitle, { color: textColor }]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.settingsSubtitle, { color: theme.colors.textTertiary }]}>
            {subtitle}
          </Text>
        )}
      </View>
      {rightElement || (onPress && (
        <MaterialIcons name="chevron-right" size={20} color={theme.colors.textTertiary} />
      ))}
    </TouchableOpacity>
  );
});

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { theme, themeMode, setThemeMode } = useTheme();
  const { user, logout } = useAuthStore();
  
  const [locationSharing, setLocationSharing] = useState(user?.preferences?.liveLocationSharing ?? true);
  const [safetyAlerts, setSafetyAlerts] = useState(user?.preferences?.areaSafetyAlerts ?? true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(user?.profileImage || null);

  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const { t, locale, changeLanguage } = useTranslation();

  const isDarkMode = theme.isDark;
  const saffronColor = isDarkMode ? '#F97316' : '#EA580C';
  const bgColor = isDarkMode ? '#0B0F19' : '#F8FAFC'; // Matte SaaS backgrounds
  const borderColor = isDarkMode ? '#1E293B' : '#E2E8F0';

  const handleLanguageSelect = useCallback(async (langCode: string) => {
    await changeLanguage(langCode);
    setShowLanguageModal(false);
  }, [changeLanguage]);

  const handleThemeToggle = () => {
    setThemeMode(isDarkMode ? 'light' : 'dark');
  };

  const handleLogout = async () => {
    await logout();
  };

  // Profile Image Picker
  const handleUpdatePhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('profile.permissionDenied') || 'Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], // Square for avatars
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
      // TODO: Dispatch update to backend/store here
    }
  };

  // Biometric Enrollment
  const handleBiometricToggle = async (newValue: boolean) => {
    if (newValue) {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        Alert.alert(t('profile.hardwareNotSupported'), t('profile.hardwareNotSupportedMsg'));
        return;
      }
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        Alert.alert(t('profile.notEnrolled'), t('profile.notEnrolledMsg'));
        return;
      }
      const authResult = await LocalAuthentication.authenticateAsync({
        promptMessage: t('profile.verifyBiometric') || 'Verify identity',
        fallbackLabel: 'Use Passcode',
        cancelLabel: 'Cancel',
      });
      if (authResult.success) {
        setBiometricEnabled(true);
      }
    } else {
      setBiometricEnabled(false);
    }
  };

  const firstName = user?.name?.split(' ')[0] || 'User';

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <Header title={t('profile.myProfile') || 'Account Settings'} />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Flat SaaS User Card */}
        <View style={[styles.userCard, { backgroundColor: theme.colors.surface, borderColor }]}>
          <View style={styles.userCardHeader}>
            
            {/* Interactive Avatar */}
            <TouchableOpacity onPress={handleUpdatePhoto} activeOpacity={0.8} style={styles.avatarWrapper}>
              <View style={[styles.avatar, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]}>
                {profileImage ? (
                  <Image source={{ uri: profileImage }} style={styles.avatarImage} />
                ) : (
                  <Text style={[styles.avatarText, { color: theme.colors.textSecondary }]}>
                    {user?.name?.charAt(0) || 'U'}
                  </Text>
                )}
              </View>
              <View style={[styles.cameraBadge, { backgroundColor: saffronColor, borderColor: theme.colors.surface }]}>
                <MaterialIcons name="camera-alt" size={12} color="#FFF" />
              </View>
            </TouchableOpacity>

            {/* User Info */}
            <View style={styles.userInfo}>
              <View style={styles.nameRow}>
                <Text style={[styles.userName, { color: theme.colors.text }]}>
                  {'Sujal Sharma'}
                </Text>
                <MaterialIcons name="verified" size={16} color="#10B981" style={{ marginLeft: 4 }} />
              </View>
              <Text style={[styles.userEmail, { color: theme.colors.textTertiary }]}>
                {user?.email || 'sujalsharma3003@gmail.com'}
              </Text>
            </View>
          </View>

          {/* Edit Profile Action */}
          <TouchableOpacity 
            style={[styles.editProfileBtn, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]}
            activeOpacity={0.7}
            onPress={() => {/* Navigate to Edit Profile Form */}}
          >
            <Text style={[styles.editProfileText, { color: theme.colors.text }]}>Edit Personal Details</Text>
          </TouchableOpacity>
        </View>

        {/* Emergency Contacts Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textTertiary }]}>{t('profile.emergencyContacts') || 'EMERGENCY CONTACTS'}</Text>
        </View>
        <View style={[styles.section, { backgroundColor: theme.colors.surface, borderColor }]}>
          {(user?.emergencyContacts || [
            { id: '1', name: 'Papa', relation: 'Father', phone: '+91 98765 43210' }, 
          ]).map((contact, index, arr) => (
            <View 
              key={contact.id} 
              style={[
                styles.contactRow, 
                index !== arr.length && { borderBottomColor: isDarkMode ? '#1E293B' : '#E2E8F0', borderBottomWidth: StyleSheet.hairlineWidth }
              ]}
            >
              <View style={[styles.contactAvatar, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]}>
                <Text style={[styles.contactAvatarText, { color: theme.colors.textSecondary }]}>{contact.name.charAt(0)}</Text>
              </View>
              <View style={styles.contactInfo}>
                <Text style={[styles.contactName, { color: theme.colors.text }]}>{contact.name}</Text>
                <Text style={[styles.contactRelation, { color: theme.colors.textTertiary }]}>
                  {contact.relation} • {contact.phone}
                </Text>
              </View>
              <TouchableOpacity style={[styles.callBtn, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                <MaterialIcons name="phone" size={18} color="#10B981" />
              </TouchableOpacity>
            </View>
          ))}
          
          {/* Add Contact Button */}
          <TouchableOpacity 
            style={[styles.addContactBtn, { borderTopColor: isDarkMode ? '#1E293B' : '#E2E8F0' }]} 
            activeOpacity={0.7}
          >
            <MaterialIcons name="add" size={18} color={saffronColor} />
            <Text style={[styles.addContactText, { color: saffronColor }]}>
              {t('profile.addContact') || 'Add Trusted Contact'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Safety Preferences */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textTertiary }]}>{t('profile.preferences') || 'PREFERENCES'}</Text>
        </View>
        <View style={[styles.section, { backgroundColor: theme.colors.surface, borderColor }]}>
          <SettingsRow
            icon="my-location"
            title={t('profile.liveLocation') || 'Live Location Sharing'}
            subtitle={t('profile.liveLocationDesc') || 'Share with emergency contacts'}
            rightElement={
              <Switch
                value={locationSharing}
                onValueChange={setLocationSharing}
                trackColor={{ true: saffronColor, false: isDarkMode ? '#374151' : '#E2E8F0' }}
                thumbColor="#FFFFFF"
              />
            }
          />
          <SettingsRow
            icon="notifications-none"
            title={t('profile.safetyAlerts') || 'Area Safety Alerts'}
            subtitle={t('profile.safetyAlertsDesc') || 'Get notified about local incidents'}
            rightElement={
              <Switch
                value={safetyAlerts}
                onValueChange={setSafetyAlerts}
                trackColor={{ true: saffronColor, false: isDarkMode ? '#374151' : '#E2E8F0' }}
                thumbColor="#FFFFFF"
              />
            }
          />
          <SettingsRow
            icon="dark-mode"
            title={t('profile.darkMode') || 'Dark Mode'}
            rightElement={
              <Switch
                value={isDarkMode}
                onValueChange={handleThemeToggle}
                trackColor={{ true: saffronColor, false: isDarkMode ? '#374151' : '#E2E8F0' }}
                thumbColor="#FFFFFF"
              />
            }
          />
          <SettingsRow
            icon="language"
            title={t('profile.language') || 'Language'}
            subtitle={SUPPORTED_LANGUAGES.find(l => l.code === locale)?.nativeLabel || 'English'}
            isLast
            onPress={() => setShowLanguageModal(true)}
          />
        </View>

        {/* Security & Account */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textTertiary }]}>{t('profile.security') || 'SECURITY & ACCOUNT'}</Text>
        </View>
        <View style={[styles.section, { backgroundColor: theme.colors.surface, borderColor }]}>
          <SettingsRow icon="lock-outline" title={t('profile.changePin') || 'Change PIN / Password'} onPress={() => {}} />
          <SettingsRow 
            icon="fingerprint" 
            title={t('profile.biometric') || 'Biometric Login'} 
            subtitle={t('profile.biometricDesc') || 'Use FaceID or Fingerprint'}
            rightElement={
              <Switch
                value={biometricEnabled}
                onValueChange={handleBiometricToggle}
                trackColor={{ true: saffronColor, false: isDarkMode ? '#374151' : '#E2E8F0' }}
                thumbColor="#FFFFFF"
              />
            }
          />
          <SettingsRow icon="privacy-tip" title={t('profile.privacySettings') || 'Privacy Settings'} isLast onPress={() => {}} />
        </View>

        {/* Support & Logout */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface, borderColor, marginTop: 16 }]}>
          <SettingsRow icon="help-outline" title={t('profile.helpSupport') || 'Help & Support'} onPress={() => {}} />
          <SettingsRow icon="info-outline" title={t('profile.aboutRakshak') || 'About Rakshak'} subtitle="Version 1.0.0" onPress={() => {}} />
          <SettingsRow icon="logout" title={t('profile.secureLogout') || 'Log Out'} isLast onPress={handleLogout} danger />
        </View>

        {/* Footer */}
        <View style={styles.footerContainer}>
          <Text style={[styles.footerText, { color: theme.colors.textTertiary }]}>
            {t('common.madeInIndia') || 'Made with ♥ in India'}
          </Text>
        </View>
        
      </ScrollView>

      {/* Language Selector Modal */}
      <Modal
        visible={showLanguageModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowLanguageModal(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface, borderColor }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                {t('profile.language') || 'Select Language'}
              </Text>
            </View>
            <View style={styles.modalOptions}>
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isActive = locale === lang.code;
                return (
                  <TouchableOpacity
                    key={lang.code}
                    style={[
                      styles.langOption,
                      { backgroundColor: isActive ? (isDarkMode ? '#1E293B' : '#F1F5F9') : 'transparent' }
                    ]}
                    onPress={() => handleLanguageSelect(lang.code)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.langInfo}>
                      <Text style={[styles.langNative, { color: theme.colors.text }]}>
                        {lang.nativeLabel}
                      </Text>
                      <Text style={[styles.langEnglish, { color: theme.colors.textSecondary }]}>
                        {lang.label}
                      </Text>
                    </View>
                    {isActive && <MaterialIcons name="check" size={20} color={saffronColor} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  userCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  userCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '600',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  userEmail: {
    fontSize: 13,
    fontWeight: '400',
  },
  editProfileBtn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editProfileText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sectionHeader: {
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  section: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
    overflow: 'hidden',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  settingsIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  settingsContent: {
    flex: 1,
    justifyContent: 'center',
  },
  settingsTitle: {
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  settingsSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  contactAvatarText: {
    fontSize: 16,
    fontWeight: '600',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 15,
    fontWeight: '600',
  },
  contactRelation: {
    fontSize: 13,
    marginTop: 2,
  },
  callBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addContactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  addContactText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  footerContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHeader: {
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalOptions: {
    gap: 8,
  },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  langInfo: {
    flex: 1,
  },
  langNative: {
    fontSize: 15,
    fontWeight: '600',
  },
  langEnglish: {
    fontSize: 13,
    marginTop: 2,
  },
});

export default memo(ProfileScreen);