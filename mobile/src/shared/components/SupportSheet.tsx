import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Linking,
  Alert,
} from 'react-native';

import {Ionicons} from '@react-native-vector-icons/ionicons';

import Theme from '../../core/theme/theme';

import { getSettings } from '../services/settingsService';

interface SupportOption {
  icon: string;
  title: string;
  value: string;
  onPress: () => void;
}

interface SupportSheetProps {
  visible: boolean;
  onClose: () => void;
}

const openLink = async (
  url: string,
  appName: string,
  checkSupported = true,
) => {
  try {
    if (checkSupported) {
      const supported = await Linking.canOpenURL(url);

      if (!supported) {
        Alert.alert(
          `${appName} Not Available`,
          `Please install ${appName} to contact support.`,
        );
        return;
      }
    }

    await Linking.openURL(url);
  } catch (error) {
    Alert.alert('Error', 'Unable to open this option. Please try again.');
  }
};

const openMail = (email: string) => {
  Linking.openURL(`mailto:${email}`).catch(() => {
    Alert.alert('No Email App', 'No email app found on this device.');
  });
};

const SupportSheet = ({visible, onClose}: SupportSheetProps) => {
  const [options, setOptions] = useState<SupportOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      loadSettings();
    }
  }, [visible]);

  const loadSettings = async () => {
    try {
      const res = await getSettings();
      if (res.success && res.settings) {
        const s = res.settings;
        const supportOptions: SupportOption[] = [
          {
            icon: 'people',
            title: 'FX WALLET PUBLIC GROUP',
            value: s.supportPublicGroup || 'https://t.me/FXwallet0',
            onPress: () => openLink(s.supportPublicGroup || 'https://t.me/FXwallet0', 'Telegram'),
          },
          {
            icon: 'megaphone',
            title: 'FX WALLET Official Channel',
            value: s.supportOfficialChannel || 'https://t.me/+8tV1IrL6cdw3Zjc1',
            onPress: () => openLink(s.supportOfficialChannel || 'https://t.me/+8tV1IrL6cdw3Zjc1', 'Telegram'),
          },
          {
            icon: 'mail',
            title: 'FX WALLET Official Gmail ID',
            value: s.supportOfficialGmail || 'fxwallet@gmail.com',
            onPress: () => openMail(s.supportOfficialGmail || 'fxwallet@gmail.com'),
          },
          {
            icon: 'headset',
            title: 'Customer Support',
            value: s.supportCustomerSupport || '@FXwallet70',
            onPress: () => {
              const support = s.supportCustomerSupport || '@FXwallet70';
              const url = support.startsWith('http') ? support : 'https://t.me/FXwallet70';
              openLink(url, 'Telegram');
            },
          },
        ];
        setOptions(supportOptions);
      } else {
        setOptions(getDefaultOptions());
      }
    } catch (error) {
      console.log('Load support settings error:', error);
      setOptions(getDefaultOptions());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultOptions = (): SupportOption[] => [
    {
      icon: 'people',
      title: 'FX WALLET PUBLIC GROUP',
      value: 'https://t.me/FXwallet0',
      onPress: () => openLink('https://t.me/FXwallet0', 'Telegram'),
    },
    {
      icon: 'megaphone',
      title: 'FX WALLET Official Channel',
      value: 'https://t.me/+8tV1IrL6cdw3Zjc1',
      onPress: () => openLink('https://t.me/+8tV1IrL6cdw3Zjc1', 'Telegram'),
    },
    {
      icon: 'mail',
      title: 'FX WALLET Official Gmail ID',
      value: 'fxwallet@gmail.com',
      onPress: () => openMail('fxwallet@gmail.com'),
    },
    {
      icon: 'headset',
      title: 'Customer Support',
      value: '@FXwallet70',
      onPress: () => openLink('https://t.me/FXwallet70', 'Telegram'),
    },
  ];

  const handleOption = (action: () => void) => {
    onClose();
    action();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />

      <View style={styles.sheet}>
        <View style={styles.handle} />

        <Text style={styles.title}>Customer Support</Text>

        <Text style={styles.subtitle}>
          Choose a channel to reach us
        </Text>

        {loading ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : (
          options.map(option => (
            <Pressable
              key={option.title}
              style={({pressed}) => [
                styles.optionRow,
                pressed && styles.optionRowPressed,
              ]}
              onPress={() => handleOption(option.onPress)}>
              <View style={styles.optionIcon}>
                <Ionicons
                  name={option.icon as any}
                  size={20}
                  color={Theme.colors.primary}
                />
              </View>

              <View style={styles.optionTextGroup}>
                <Text style={styles.optionTitle}>
                  {option.title}
                </Text>

                <Text style={styles.optionValue}>
                  {option.value}
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={18}
                color={Theme.colors.grey}
              />
            </Pressable>
          ))
        )}

        <Pressable
          style={({pressed}) => [
            styles.closeButton,
            pressed && styles.optionRowPressed,
          ]}
          onPress={onClose}>
          <Text style={styles.closeText}>Close</Text>
        </Pressable>
      </View>
    </Modal>
  );
};

export default SupportSheet;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(120,80,40,0.35)',
  },

  sheet: {
    backgroundColor: Theme.colors.cardSolid,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Theme.colors.glassBorder,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 30,
    overflow: 'hidden',
  },

  handle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: Theme.colors.grey,
    alignSelf: 'center',
    opacity: 0.4,
    marginBottom: 16,
  },

  title: {
    color: Theme.colors.text,
    fontSize: 20,
    fontWeight: '800',
  },

  subtitle: {
    color: Theme.colors.grey,
    fontSize: 13,
    marginTop: 4,
    marginBottom: 18,
  },

  loadingText: {
    color: Theme.colors.grey,
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
  },

  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.inputBg,
    borderWidth: 1,
    borderColor: Theme.colors.glassBorder,
    borderRadius: 14,
    padding: 13,
    marginBottom: 12,
  },

  optionRowPressed: {
    opacity: 0.82,
  },

  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  optionTextGroup: {
    flex: 1,
    minWidth: 0,
  },

  optionTitle: {
    color: Theme.colors.onLightText,
    fontSize: 16,
    fontWeight: '800',
  },

  optionValue: {
    color: Theme.colors.primaryDeep,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 3,
  },

  closeButton: {
    backgroundColor: Theme.colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },

  closeText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
