import React, {
  useCallback,
  useState,
} from 'react';

import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  RefreshControl,
} from 'react-native';

import {
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';

import AsyncStorage from '@react-native-async-storage/async-storage';

import Theme from '../../../core/theme/theme';

import {
  getProfile,
  updateProfile,
  UserProfile,
} from '../services/profileService';
import PressableScale from '../../../shared/components/animations/PressableScale';
import HoverWiggle from '../../../shared/components/animations/HoverWiggle';
import GlassCard from '../../../shared/components/Card/GlassCard';
import SupportSheet from '../../../shared/components/SupportSheet';
import AppConstants from '../../../shared/constants/app';

const ProfileScreen = () => {
  const navigation = useNavigation<any>();
  const [user, setUser] =
    useState<UserProfile | null>(null);

  const [fullName, setFullName] =
    useState('');

  const [mobile, setMobile] =
    useState('');

  const [isEditing, setIsEditing] =
    useState(false);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  const [isRefreshing, setIsRefreshing] =
    useState(false);

  const [isSupportOpen, setIsSupportOpen] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState('');

  const loadProfile = async (
    showLoader = true,
  ) => {
    try {
      if (showLoader) {
        setIsLoading(true);
      }

      setErrorMessage('');

      const response = await getProfile();

      if (response.success && response.user) {
        setUser(response.user);

        setFullName(
          response.user.fullName || '',
        );

        setMobile(
          response.user.mobile || '',
        );
      } else {
        setErrorMessage(
          response.message ||
            'Unable to load profile.',
        );
      }
    } catch (error: any) {
      console.log(
        'Profile load error:',
        error.response?.data ||
          error.message,
      );

      setErrorMessage(
        error.response?.data?.message ||
          'Unable to load profile.',
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadProfile();

      return undefined;
    }, []),
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    loadProfile(false);
  };

  const handleEdit = () => {
    if (!user) {
      return;
    }

    setFullName(user.fullName || '');
    setMobile(user.mobile || '');
    setIsEditing(true);
  };

  const handleCancel = () => {
    setFullName(user?.fullName || '');
    setMobile(user?.mobile || '');
    setIsEditing(false);
  };

  const handleSave = async () => {
    const cleanName = fullName.trim();
    const cleanMobile = mobile.trim();

    if (!cleanName) {
      Alert.alert(
        'Validation',
        'Please enter your full name.',
      );
      return;
    }

    if (!cleanMobile) {
      Alert.alert(
        'Validation',
        'Please enter your mobile number.',
      );
      return;
    }

    if (!/^[0-9]{10}$/.test(cleanMobile)) {
      Alert.alert(
        'Invalid Mobile',
        'Please enter a valid 10-digit mobile number.',
      );
      return;
    }

    try {
      setIsSaving(true);

      const response =
        await updateProfile({
          fullName: cleanName,
          mobile: cleanMobile,
        });

      if (response.success) {
        const updatedUser =
          response.user || {
            ...user,
            fullName: cleanName,
            mobile: cleanMobile,
          };

        setUser(
          updatedUser as UserProfile,
        );

        setFullName(cleanName);
        setMobile(cleanMobile);
        setIsEditing(false);

        Alert.alert(
          'Success',
          response.message ||
            'Profile updated successfully.',
        );
      } else {
        Alert.alert(
          'Update Failed',
          response.message ||
            'Unable to update profile.',
        );
      }
    } catch (error: any) {
      console.log(
        'Profile update error:',
        error.response?.data ||
          error.message,
      );

      Alert.alert(
        'Update Failed',
        error.response?.data?.message ||
          'Unable to update profile.',
      );
    } finally {
      setIsSaving(false);
    }
  };

 const performLogout = async () => {
  try {
    await AsyncStorage.removeMany(['authToken', 'userData']);

    navigation.reset({
      index: 0,
      routes: [{name: 'Login'}],
    });
  } catch (error) {
    console.log('Logout error:', error);

    Alert.alert(
      'Logout Failed',
      'Unable to logout. Please try again.',
    );
  }
};

const handleLogout = () => {
  Alert.alert(
    'Logout',
    'Are you sure you want to logout?',
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: performLogout,
      },
    ],
  );
};


  const formatCurrency = (
    amount?: number,
  ) => {
    return `₹${Number(
      amount || 0,
    ).toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator
          size="large"
          color={Theme.colors.primary}
        />

        <Text style={styles.loadingText}>
          Loading profile...
        </Text>
      </View>
    );
  }

  if (errorMessage && !user) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorTitle}>
          Profile unavailable
        </Text>

        <Text style={styles.errorMessage}>
          {errorMessage}
        </Text>

        <PressableScale
          style={styles.retryButton}
          onPress={() => loadProfile()}>
          <Text style={styles.retryText}>
            Try Again
          </Text>
        </PressableScale>

        <PressableScale
          style={[styles.retryButton, {backgroundColor: 'rgba(220,38,38,0.08)', borderWidth: 1, borderColor: 'rgba(220,38,38,0.4)', marginTop: 12}]}
          onPress={performLogout}>
          <Text style={[styles.retryText, {color: '#DC2626'}]}>
            Logout
          </Text>
        </PressableScale>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.content
      }
      showsVerticalScrollIndicator={
        false
      }
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor={Theme.colors.primary}
          colors={[
            Theme.colors.primary,
          ]}
        />
      }>
      <Text style={styles.title}>
        Profile
      </Text>

      <Text style={styles.subtitle}>
        Manage your personal information.
      </Text>

      <HoverWiggle>
      <GlassCard style={styles.card}>
        <Text style={styles.label}>
          Full Name
        </Text>

        {isEditing ? (
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Enter full name"
            placeholderTextColor={
              Theme.colors.grey
            }
            autoCapitalize="words"
          />
        ) : (
          <Text style={styles.value}>
            {user?.fullName || '-'}
          </Text>
        )}

        <View style={styles.divider} />

        <Text style={styles.label}>
          Email Address
        </Text>

        <Text style={styles.value}>
          {user?.email || '-'}
        </Text>

        {isEditing ? (
          <Text style={styles.helperText}>
            Email address cannot be edited.
          </Text>
        ) : null}

        <View style={styles.divider} />

        <Text style={styles.label}>
          Mobile Number
        </Text>

        {isEditing ? (
          <TextInput
            style={styles.input}
            value={mobile}
            onChangeText={text =>
              setMobile(
                text.replace(
                  /[^0-9]/g,
                  '',
                ),
              )
            }
            placeholder="Enter mobile number"
            placeholderTextColor={
              Theme.colors.grey
            }
            keyboardType="number-pad"
            maxLength={10}
          />
        ) : (
          <Text style={styles.value}>
            {user?.mobile || '-'}
          </Text>
        )}

        <View style={styles.divider} />

        <Text style={styles.label}>
          Wallet Balance
        </Text>

        <Text style={styles.walletValue}>
          {formatCurrency(
            user?.walletBalance,
          )}
        </Text>
      </GlassCard>
      </HoverWiggle>

      {isEditing ? (
        <View style={styles.buttonRow}>
          <PressableScale
            style={styles.cancelButton}
            onPress={handleCancel}
            disabled={isSaving}>
            <Text
              style={
                styles.cancelButtonText
              }>
              Cancel
            </Text>
          </PressableScale>

          <PressableScale
            style={[
              styles.saveButton,
              isSaving &&
                styles.disabledButton,
            ]}
            onPress={handleSave}
            disabled={isSaving}>
            {isSaving ? (
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
              />
            ) : (
              <Text
                style={
                  styles.saveButtonText
                }>
                Save Changes
              </Text>
            )}
          </PressableScale>
        </View>
      ) : (
        <HoverWiggle>
        <PressableScale
          style={styles.editButton}
          onPress={handleEdit}>
          <Text
            style={
              styles.editButtonText
            }>
            Edit Profile
          </Text>
        </PressableScale>
        </HoverWiggle>
      )}
      {!isEditing ? (
        <>
         <HoverWiggle>
         <PressableScale
         style={styles.changePasswordButton}
         onPress={() =>
          navigation.navigate(
            'ChangePassword',
          )
          }>
            <Text
             style={
             styles.changePasswordText
              }>
                Change Password
                </Text>
                
         </PressableScale>
         </HoverWiggle>
         <HoverWiggle>
         <PressableScale
         style={styles.changePasswordButton}
         onPress={() =>
          navigation.navigate(
            'ReferAndEarn',
          )
          }>
            <Text
             style={
             styles.changePasswordText
              }>
                Refer & Earn
                </Text>
         </PressableScale>
         </HoverWiggle>
         
         <HoverWiggle>
         <PressableScale
         style={styles.supportButton}
         onPress={() =>
          setIsSupportOpen(true)
          }>
            <Text style={styles.supportText}>
                Customer Support
                </Text>
         </PressableScale>
         </HoverWiggle>
         
         <HoverWiggle>
         <PressableScale
         style={styles.logoutButton}
         onPress={handleLogout}>
          <Text style={styles.logoutText}>
            Logout
            </Text>
            </PressableScale>
            </HoverWiggle>
            </>
          ) : null}

      

      {errorMessage ? (
        <Text style={styles.smallError}>
          {errorMessage}
        </Text>
      ) : null}

      <SupportSheet
        visible={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
      />

      <Text style={styles.versionText}>
        {AppConstants.APP_NAME} v{AppConstants.APP_VERSION}
      </Text>

      <View style={styles.bottomSpace} />
    </ScrollView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  content: {
    padding: 20,
    paddingBottom: 120,
  },

  centerContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 25,
  },

  title: {
    color: Theme.colors.onLightText,
    fontSize: 29,
    fontWeight: '800',
  },

  subtitle: {
    color: Theme.colors.onLightGrey,
    fontSize: 14,
    marginTop: 7,
    marginBottom: 22,
  },

  card: {
    backgroundColor:
      Theme.colors.card,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1.5,
    borderColor: Theme.colors.glassBorder,
    ...Theme.shadows.card,
  },

  label: {
    color: Theme.colors.grey,
    fontSize: 13,
    marginBottom: 8,
  },

  value: {
    color: Theme.colors.text,
    fontSize: 17,
    fontWeight: '600',
  },

  walletValue: {
    color: '#16A34A',
    fontSize: 22,
    fontWeight: '800',
  },

  input: {
    backgroundColor:
      Theme.colors.inputBg,
    color: Theme.colors.text,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },

  helperText: {
    color: Theme.colors.grey,
    fontSize: 12,
    marginTop: 7,
  },

  divider: {
    height: 1,
    backgroundColor: Theme.colors.hairline,
    marginVertical: 18,
  },

  editButton: {
    backgroundColor:
      Theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
  },

  editButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  changePasswordButton: {
  backgroundColor: Theme.colors.card,
  borderWidth: 1,
  borderColor: Theme.colors.glassBorder,
  borderRadius: 12,
  paddingVertical: 15,
  alignItems: 'center',
  marginTop: 12,

  
},  supportButton: {
    backgroundColor: Theme.colors.card,
    borderWidth: 1,
    borderColor: Theme.colors.glassBorder,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 12,
  },

  supportText: {
    color: Theme.colors.text,
    fontSize: 16,
    fontWeight: '700',
  },

changePasswordText: {
  color: Theme.colors.text,
  fontSize: 16,
  fontWeight: '700',
},

logoutButton: {
  backgroundColor: 'rgba(220,38,38,0.08)',
  borderWidth: 1,
  borderColor: 'rgba(220,38,38,0.4)',
  borderRadius: 12,
  paddingVertical: 15,
  alignItems: 'center',
  marginTop: 12,
},  logoutText: {
  color: '#DC2626',
  fontSize: 16,
  fontWeight: '700',
},

  buttonRow: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },

  cancelButton: {
    flex: 1,
    backgroundColor:
      Theme.colors.card,
    borderWidth: 1,
    borderColor: Theme.colors.glassBorder,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },

  cancelButtonText: {
    color: Theme.colors.text,
    fontSize: 15,
    fontWeight: '700',
  },

  saveButton: {
    flex: 1,
    backgroundColor:
      Theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  disabledButton: {
    opacity: 0.6,
  },

  loadingText: {
    color: Theme.colors.onLightText,
    marginTop: 14,
  },

  errorTitle: {
    color: Theme.colors.onLightText,
    fontSize: 22,
    fontWeight: '700',
  },

  errorMessage: {
    color: Theme.colors.onLightGrey,
    textAlign: 'center',
    marginTop: 10,
  },

  retryButton: {
    backgroundColor:
      Theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
  },

  retryText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  smallError: {
    color: '#DC2626',
    textAlign: 'center',
    marginTop: 14,
  },

  versionText: {
    color: Theme.colors.onLightGrey,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 24,
  },

  bottomSpace: {
    height: 10,
  },
});